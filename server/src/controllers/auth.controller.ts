import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import pool from '../db.js';
import { config } from '../config/env.js';
import { UserTokenPayload } from '../middleware/auth.middleware.js';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

export async function login(req: Request, res: Response): Promise<void> {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, message: parseResult.error.errors[0].message });
    return;
  }

  const { username, password } = parseResult.data;

  try {
    const [rows] = await pool.query<any[]>(
      'SELECT User_ID, username, email, password_hash, role_name, full_name, organization FROM APP_USER WHERE username = ? OR email = ?',
      [username, username]
    );

    if (rows.length === 0) {
      res.status(401).json({ success: false, message: 'Invalid username or password.' });
      return;
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid username or password.' });
      return;
    }

    const payload: UserTokenPayload = {
      userId: user.User_ID,
      username: user.username,
      role: user.role_name,
      email: user.email
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });

    // Audit log
    await pool.query(
      'INSERT INTO AUDIT_LOG (user_id, action_type, entity_name, entity_id, query_text, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [user.User_ID, 'LOGIN', 'APP_USER', user.User_ID, `User ${user.username} logged in`, req.ip || '127.0.0.1']
    );

    res.json({
      success: true,
      token,
      user: {
        userId: user.User_ID,
        username: user.username,
        email: user.email,
        role: user.role_name,
        fullName: user.full_name,
        organization: user.organization
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Login failed' });
  }
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }

  try {
    const [rows] = await pool.query<any[]>(
      'SELECT User_ID, username, email, role_name, full_name, organization, created_at FROM APP_USER WHERE User_ID = ?',
      [req.user.userId]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.json({
      success: true,
      user: rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getDemoAccounts(_req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    accounts: [
      {
        role: 'Administrator',
        username: 'admin',
        password: 'Admin@Orbit2026',
        description: 'Unrestricted control over database schema, users, and all operations'
      },
      {
        role: 'Space Agency',
        username: 'isro_admin',
        password: 'Agency@Orbit2026',
        description: 'ISRO NETRA SSA directorate; manages satellites & stations, views conjunctions'
      },
      {
        role: 'Satellite Operator',
        username: 'operator_starlink',
        password: 'Operator@Orbit2026',
        description: 'Flight dynamics operator; monitors close approaches and can trigger evasions'
      },
      {
        role: 'Research Scientist',
        username: 'dr_scientist',
        password: 'Research@Orbit2026',
        description: 'Academic researcher; sanitized read-only access to catalogs, weather, and SQL console'
      }
    ]
  });
}
