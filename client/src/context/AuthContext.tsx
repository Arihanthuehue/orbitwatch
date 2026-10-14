import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RoleName } from '../types/index.js';
import api from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRoleQuick: (role: RoleName) => Promise<void>;
  hasRole: (roles: RoleName[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('orbitwatch_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('orbitwatch_token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyUser() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            const u = res.data.user;
            const updatedUser: User = {
              userId: u.User_ID,
              username: u.username,
              email: u.email,
              role: u.role_name,
              fullName: u.full_name,
              organization: u.organization
            };
            setUser(updatedUser);
            localStorage.setItem('orbitwatch_user', JSON.stringify(updatedUser));
          }
        } catch {
          logout();
        }
      } else {
        // Auto-login with default demo Administrator account on first launch
        login('admin', 'Admin@Orbit2026');
      }
      setLoading(false);
    }

    verifyUser();

    const handleExpired = () => logout();
    window.addEventListener('auth-expired', handleExpired);
    return () => window.removeEventListener('auth-expired', handleExpired);
  }, [token]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await api.post('/auth/login', { username, password });
      if (res.data.success) {
        const t = res.data.token;
        const u = res.data.user;
        setToken(t);
        setUser(u);
        localStorage.setItem('orbitwatch_token', t);
        localStorage.setItem('orbitwatch_user', JSON.stringify(u));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('orbitwatch_token');
    localStorage.removeItem('orbitwatch_user');
  };

  const switchRoleQuick = async (role: RoleName) => {
    const roleCredentials: Record<RoleName, { u: string; p: string }> = {
      Administrator: { u: 'admin', p: 'Admin@Orbit2026' },
      'Space Agency': { u: 'isro_admin', p: 'Agency@Orbit2026' },
      'Satellite Operator': { u: 'operator_starlink', p: 'Operator@Orbit2026' },
      'Research Scientist': { u: 'dr_scientist', p: 'Research@Orbit2026' }
    };
    const creds = roleCredentials[role];
    if (creds) {
      await login(creds.u, creds.p);
    }
  };

  const hasRole = (roles: RoleName[]): boolean => {
    if (!user) return false;
    if (user.role === 'Administrator') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, switchRoleQuick, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
