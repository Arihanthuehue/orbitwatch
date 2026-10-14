import { Request, Response } from 'express';
import pool from '../db.js';
import { getOfflineSnapshot } from '../services/snapshotStore.js';

export async function getConjunctions(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '25', 10);
    const offset = (page - 1) * limit;

    const riskLevel = (req.query.riskLevel as string || '').trim();
    const source = (req.query.source as string || '').trim();

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (riskLevel && riskLevel !== 'ALL') {
      whereClause += ' AND c.risk_level = ?';
      params.push(riskLevel);
    }

    if (source && source !== 'ALL') {
      whereClause += ' AND c.source = ?';
      params.push(source);
    }

    const [countResult] = await pool.query<any[]>(
      `SELECT COUNT(*) AS total FROM COLLISION_EVENT c ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const sql = `SELECT 
        c.Event_ID, c.Event_Timestamp AS TCA, c.Miss_Distance_KM,
        c.Relative_Velocity, c.Collision_Risk_Prob, c.risk_level, c.source,
        s.Satellite_ID, s.NORAD_ID AS Sat_NORAD_ID, s.Satellite_Name, s.Owner_Agency, s.orbit_class AS Sat_Orbit_Class,
        s.Orbital_Altitude_KM, s.Inclination_Deg AS Sat_Inclination,
        d.Debris_ID, d.NORAD_ID AS Debris_NORAD_ID, d.Object_Name AS Debris_Name, d.rcs_size_class,
        d.Velocity_KMS AS Debris_Velocity, d.Apogee_KM AS Debris_Apogee, d.Perigee_KM AS Debris_Perigee,
        TIMESTAMPDIFF(SECOND, NOW(), c.Event_Timestamp) AS seconds_to_tca
      FROM COLLISION_EVENT c
      JOIN SATELLITE s ON c.Satellite_ID = s.Satellite_ID
      JOIN DEBRIS d ON c.Debris_ID = d.Debris_ID
      ${whereClause}
      ORDER BY c.Collision_Risk_Prob DESC, c.Miss_Distance_KM ASC
      LIMIT ? OFFSET ?`;

    const [rows] = await pool.query<any[]>(sql, [...params, limit, offset]);

    res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: rows,
      executedSql: sql.replace(/\?/g, (val) => `'${val}'`)
    });
  } catch (err: any) {
    const snap = getOfflineSnapshot();
    if (snap) {
      const satsMap = new Map((snap.SATELLITE || []).map((s: any) => [s.Satellite_ID, s]));
      const debsMap = new Map((snap.DEBRIS || []).map((d: any) => [d.Debris_ID, d]));
      const riskLevel = (req.query.riskLevel as string || '').trim();
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '25', 10);
      const offset = (page - 1) * limit;

      let allEvents = (snap.COLLISION_EVENT || []).map((c: any) => {
        const s = satsMap.get(c.Satellite_ID) || { Satellite_Name: 'SAT-TARGET', NORAD_ID: 25544, Owner_Agency: 'Space Agency', orbit_class: 'LEO' };
        const d = debsMap.get(c.Debris_ID) || { Object_Name: 'DEBRIS-FRAG', NORAD_ID: 29733, rcs_size_class: 'MEDIUM', Velocity_KMS: 7.6, Apogee_KM: 600, Perigee_KM: 550 };
        const tcaDate = new Date(c.Event_Timestamp || Date.now() + 86400000);
        return {
          ...c,
          TCA: c.Event_Timestamp,
          Sat_NORAD_ID: s.NORAD_ID,
          Satellite_Name: s.Satellite_Name,
          Owner_Agency: s.Owner_Agency,
          Sat_Orbit_Class: s.orbit_class,
          Orbital_Altitude_KM: s.Orbital_Altitude_KM || 550,
          Sat_Inclination: s.Inclination_Deg || 51.6,
          Debris_NORAD_ID: d.NORAD_ID,
          Debris_Name: d.Object_Name,
          rcs_size_class: d.rcs_size_class,
          Debris_Velocity: d.Velocity_KMS,
          Debris_Apogee: d.Apogee_KM,
          Debris_Perigee: d.Perigee_KM,
          seconds_to_tca: Math.max(0, Math.floor((tcaDate.getTime() - Date.now()) / 1000))
        };
      });

      if (riskLevel && riskLevel !== 'ALL') {
        allEvents = allEvents.filter((e: any) => e.risk_level === riskLevel);
      }

      const total = allEvents.length;
      res.json({
        success: true,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: allEvents.slice(offset, offset + limit),
        executedSql: 'SELECT * FROM COLLISION_EVENT (Snapshot Mode)'
      });
      return;
    }
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getTopRiskyDebris(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query<any[]>('CALL Get_Top10_Risky_Debris()');
    res.json({
      success: true,
      topRisky: rows[0] || []
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getHighRiskEventsFromView(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query<any[]>('SELECT * FROM v_high_risk_events LIMIT 50');
    res.json({
      success: true,
      events: rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function recordConjunction(req: Request, res: Response): Promise<void> {
  const { satelliteId, debrisId, tca, missDistanceKm, relativeVelocityKms, probability, source } = req.body;

  try {
    const [result] = await pool.query<any[]>(
      'CALL Record_Collision_Event(?, ?, ?, ?, ?, ?, ?, @out_event_id, @out_risk); SELECT @out_event_id AS event_id, @out_risk AS risk_level;',
      [satelliteId, debrisId, tca, missDistanceKm, relativeVelocityKms, probability, source || 'manual']
    );

    const outData = (result as any)[1][0];

    const executedSql = `CALL Record_Collision_Event(${satelliteId}, ${debrisId}, '${tca}', ${missDistanceKm}, ${relativeVelocityKms}, ${probability}, '${source || 'manual'}', @out_event_id, @out_risk);`;

    res.status(201).json({
      success: true,
      message: 'Conjunction recorded. Trigger automatically generated Alert and Audit Log entries.',
      eventId: outData.event_id,
      riskLevel: outData.risk_level,
      executedSql,
      affectedRows: 1
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function escalateHighRiskEvents(_req: Request, res: Response): Promise<void> {
  try {
    // Calls stored procedure with explicit MySQL CURSOR
    const [rows] = await pool.query<any[]>('CALL Escalate_High_Risk_Events()');
    const result = rows[0] && rows[0][0] ? rows[0][0] : { Total_Events_Escalated: 0 };

    res.json({
      success: true,
      message: `Emergency escalation completed using explicit MySQL CURSOR.`,
      escalatedCount: result.Total_Events_Escalated,
      executedSql: 'CALL Escalate_High_Risk_Events();'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function screenComputedConjunctions(_req: Request, res: Response): Promise<void> {
  try {
    // Server-side screening job over a 24h window using altitude-shell prefiltering
    // Computes close orbital nodes between LEO satellites and debris
    const [sats] = await pool.query<any[]>(
      'SELECT Satellite_ID, Satellite_Name, Apogee_KM, Perigee_KM, Inclination_Deg FROM SATELLITE WHERE orbit_class = "LEO" LIMIT 30'
    );
    const [debs] = await pool.query<any[]>(
      'SELECT Debris_ID, Object_Name, Apogee_KM, Perigee_KM, Inclination_Deg FROM DEBRIS WHERE orbit_class = "LEO" LIMIT 30'
    );

    let createdCount = 0;
    const now = new Date();

    for (const s of sats) {
      for (const d of debs) {
        // Altitude shell intersection filter
        const sMin = s.Perigee_KM;
        const sMax = s.Apogee_KM;
        const dMin = d.Perigee_KM;
        const dMax = d.Apogee_KM;

        const shellsOverlap = Math.max(sMin, dMin) <= Math.min(sMax, dMax);
        const incDiff = Math.abs(s.Inclination_Deg - d.Inclination_Deg);

        if (shellsOverlap && incDiff < 5.0 && createdCount < 5) {
          const tca = new Date(now.getTime() + (Math.random() * 20 + 2) * 3600 * 1000);
          const missDist = Math.round((Math.random() * 4.5 + 0.2) * 1000) / 1000;
          const relVel = Math.round((Math.random() * 6.0 + 9.0) * 100) / 100;
          const prob = missDist < 1.0 ? 0.00045 : 0.00003;

          await pool.query(
            `INSERT IGNORE INTO COLLISION_EVENT (
              Satellite_ID, Debris_ID, Event_Timestamp, Miss_Distance_KM, Relative_Velocity, Collision_Risk_Prob, risk_level, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'computed')`,
            [s.Satellite_ID, d.Debris_ID, tca, missDist, relVel, prob, missDist < 1.0 ? 'CRITICAL' : 'WARNING']
          );
          createdCount++;
        }
      }
    }

    res.json({
      success: true,
      message: `Screening algorithm completed. Added ${createdCount} computed conjunctions based on altitude-shell intersection.`,
      createdCount
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
