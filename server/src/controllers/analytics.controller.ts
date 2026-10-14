import { Request, Response } from 'express';
import pool from '../db.js';

export async function getDashboardKPIs(_req: Request, res: Response): Promise<void> {
  try {
    const [[satCount]] = await pool.query<any[]>('SELECT COUNT(*) AS total FROM SATELLITE');
    const [[debCount]] = await pool.query<any[]>('SELECT COUNT(*) AS total FROM DEBRIS');
    const [[critCount]] = await pool.query<any[]>('SELECT COUNT(*) AS total FROM COLLISION_EVENT WHERE risk_level = "CRITICAL"');
    const [[warnCount]] = await pool.query<any[]>('SELECT COUNT(*) AS total FROM COLLISION_EVENT WHERE risk_level = "WARNING"');
    const [[stationCount]] = await pool.query<any[]>('SELECT COUNT(*) AS total FROM TRACKING_STATION');
    const [[obsCount]] = await pool.query<any[]>('SELECT COUNT(*) AS total FROM OBSERVATION');
    const [[latestWeather]] = await pool.query<any[]>('SELECT kp_index, geomagnetic_storm_level FROM SPACE_WEATHER ORDER BY recorded_at DESC LIMIT 1');

    res.json({
      success: true,
      kpis: {
        totalTrackedObjects: (satCount.total || 0) + (debCount.total || 0),
        activeSatellites: satCount.total || 0,
        debrisFragments: debCount.total || 0,
        criticalConjunctions: critCount.total || 0,
        warningConjunctions: warnCount.total || 0,
        trackingStations: stationCount.total || 0,
        radarObservationsLogged: obsCount.total || 0,
        geomagneticStormStatus: latestWeather?.geomagnetic_storm_level || 'Nominal',
        kpIndex: latestWeather?.kp_index || 2.33
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getOrbitDistribution(_req: Request, res: Response): Promise<void> {
  try {
    const [satRows] = await pool.query<any[]>(
      'SELECT orbit_class, COUNT(*) AS count FROM SATELLITE GROUP BY orbit_class'
    );
    const [debRows] = await pool.query<any[]>(
      'SELECT orbit_class, COUNT(*) AS count FROM DEBRIS GROUP BY orbit_class'
    );

    const classes = ['LEO', 'MEO', 'GEO', 'HEO'];
    const distribution = classes.map((c) => {
      const satMatch = satRows.find((r) => r.orbit_class === c);
      const debMatch = debRows.find((r) => r.orbit_class === c);
      return {
        orbitClass: c,
        satellites: satMatch ? Number(satMatch.count) : 0,
        debris: debMatch ? Number(debMatch.count) : 0,
        total: (satMatch ? Number(satMatch.count) : 0) + (debMatch ? Number(debMatch.count) : 0)
      };
    });

    res.json({
      success: true,
      distribution
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getSizeDistribution(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query<any[]>(
      'SELECT rcs_size_class, COUNT(*) AS count FROM DEBRIS GROUP BY rcs_size_class'
    );

    res.json({
      success: true,
      distribution: rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAltitudeHistogram(_req: Request, res: Response): Promise<void> {
  try {
    // Generate 200km altitude bins up to 2000km, plus MEO and GEO
    const [rows] = await pool.query<any[]>(`
      SELECT 
        CASE 
          WHEN Orbital_Altitude_KM < 400 THEN '200-400 km'
          WHEN Orbital_Altitude_KM BETWEEN 400 AND 599.99 THEN '400-600 km'
          WHEN Orbital_Altitude_KM BETWEEN 600 AND 799.99 THEN '600-800 km'
          WHEN Orbital_Altitude_KM BETWEEN 800 AND 999.99 THEN '800-1000 km'
          WHEN Orbital_Altitude_KM BETWEEN 1000 AND 1499.99 THEN '1000-1500 km'
          WHEN Orbital_Altitude_KM BETWEEN 1500 AND 1999.99 THEN '1500-2000 km'
          WHEN Orbital_Altitude_KM BETWEEN 2000 AND 35000 THEN 'MEO (2000-35k)'
          ELSE 'GEO (>35k)'
        END AS altitude_bin,
        COUNT(*) AS sat_count
      FROM SATELLITE
      GROUP BY altitude_bin
    `);

    res.json({
      success: true,
      histogram: rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getBreakupEventBreakdown(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query<any[]>(`
      SELECT breakup_event_name, parent_name, breakup_date, event_type, COUNT(*) AS fragment_count
      FROM DEBRIS_LINEAGE
      GROUP BY breakup_event_name, parent_name, breakup_date, event_type
      ORDER BY fragment_count DESC
    `);

    res.json({
      success: true,
      breakupEvents: rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getCountryDistribution(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query<any[]>(`
      SELECT Owner_Agency, COUNT(*) AS count
      FROM SATELLITE
      GROUP BY Owner_Agency
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      countries: rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
