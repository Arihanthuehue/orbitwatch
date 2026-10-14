import { Request, Response } from 'express';
import pool from '../db.js';

export async function getSpaceWeather(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM SPACE_WEATHER ORDER BY recorded_at DESC LIMIT 20'
    );

    const latest = rows[0] || {
      kp_index: 2.33,
      f10_7_flux: 125.0,
      solar_wind_speed: 480.0,
      xray_flux: 1.2e-6,
      geomagnetic_storm_level: 'Nominal'
    };

    res.json({
      success: true,
      latest,
      history: rows,
      dragExplanation: {
        title: 'Thermospheric Density & Atmospheric Drag on Orbital Debris',
        summary: 'Elevated solar ultraviolet / X-ray flux and coronal mass ejections heat and expand the upper thermosphere (200-800 km). Higher atmospheric density dramatically amplifies aerodynamic drag on Low Earth Orbit (LEO) debris according to F_drag = 0.5 * rho * v^2 * Cd * A. During solar maxima (high F10.7 flux and Kp storms), orbital decay rates increase up to 10-fold, accelerating natural self-cleansing and de-orbiting of small debris fragments, but also unpredictably perturbing active satellite operational trajectories.'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAsteroids(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM NEAR_EARTH_OBJECT ORDER BY close_approach_date ASC LIMIT 25'
    );

    res.json({
      success: true,
      count: rows.length,
      asteroids: rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
