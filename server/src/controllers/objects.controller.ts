import { Request, Response } from 'express';
import pool from '../db.js';
import { deriveOrbitalParameters, inferOwnerAgency } from '../services/orbitalMath.js';
import { getOfflineSnapshot } from '../services/snapshotStore.js';

export async function getAllObjectsForGlobe(_req: Request, res: Response): Promise<void> {
  try {
    // Streamlined query for 3D Globe WebWorker / instanced buffer
    const [satellites] = await pool.query<any[]>(
      `SELECT 
        Satellite_ID AS id, NORAD_ID, Satellite_Name AS name, 'SATELLITE' AS type,
        Owner_Agency AS owner, orbit_class, Orbital_Altitude_KM AS altitude,
        Inclination_Deg AS inclination, Eccentricity AS eccentricity,
        Mean_Motion AS mean_motion, RAAN AS raan, Arg_Pericenter AS arg_pericenter,
        Mean_Anomaly AS mean_anomaly, BSTAR AS bstar, Epoch AS epoch
      FROM SATELLITE LIMIT 1500`
    );

    const [debris] = await pool.query<any[]>(
      `SELECT 
        Debris_ID AS id, NORAD_ID, Object_Name AS name, 'DEBRIS' AS type,
        'Debris Fragment' AS owner, orbit_class, (Apogee_KM + Perigee_KM) / 2 AS altitude,
        Inclination_Deg AS inclination, Eccentricity AS eccentricity,
        Mean_Motion AS mean_motion, RAAN AS raan, Arg_Pericenter AS arg_pericenter,
        Mean_Anomaly AS mean_anomaly, BSTAR AS bstar, Epoch AS epoch,
        rcs_size_class, Size_Meters AS size_meters
      FROM DEBRIS LIMIT 2500`
    );

    res.json({
      success: true,
      count: satellites.length + debris.length,
      satellites,
      debris
    });
  } catch (err: any) {
    const snap = getOfflineSnapshot();
    if (snap) {
      const satellites = (snap.SATELLITE || []).slice(0, 1500).map((s) => ({
        id: s.Satellite_ID,
        NORAD_ID: s.NORAD_ID,
        name: s.Satellite_Name,
        type: 'SATELLITE',
        owner: s.Owner_Agency,
        orbit_class: s.orbit_class,
        altitude: s.Orbital_Altitude_KM,
        inclination: s.Inclination_Deg,
        eccentricity: s.Eccentricity,
        mean_motion: s.Mean_Motion,
        raan: s.RAAN,
        arg_pericenter: s.Arg_Pericenter,
        mean_anomaly: s.Mean_Anomaly,
        bstar: s.BSTAR,
        epoch: s.Epoch
      }));
      const debris = (snap.DEBRIS || []).slice(0, 2500).map((d) => ({
        id: d.Debris_ID,
        NORAD_ID: d.NORAD_ID,
        name: d.Object_Name,
        type: 'DEBRIS',
        owner: 'Debris Fragment',
        orbit_class: d.orbit_class,
        altitude: (d.Apogee_KM + d.Perigee_KM) / 2,
        inclination: d.Inclination_Deg,
        eccentricity: d.Eccentricity,
        mean_motion: d.Mean_Motion,
        raan: d.RAAN,
        arg_pericenter: d.Arg_Pericenter,
        mean_anomaly: d.Mean_Anomaly,
        bstar: d.BSTAR,
        epoch: d.Epoch,
        rcs_size_class: d.rcs_size_class,
        size_meters: d.Size_Meters
      }));
      res.json({
        success: true,
        count: satellites.length + debris.length,
        satellites,
        debris,
        source: 'SNAPSHOT_FALLBACK'
      });
      return;
    }
    res.status(500).json({ success: false, message: err.message });
  }
}

// ----------------------------------------------------------------------------
// SATELLITES CRUD
// ----------------------------------------------------------------------------
export async function getSatellites(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '25', 10);
    const offset = (page - 1) * limit;

    const search = (req.query.search as string || '').trim();
    const orbitClass = (req.query.orbitClass as string || '').trim();
    const agency = (req.query.agency as string || '').trim();
    const status = (req.query.status as string || '').trim();

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (Satellite_Name LIKE ? OR NORAD_ID LIKE ? OR intl_designator LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (orbitClass && orbitClass !== 'ALL') {
      whereClause += ' AND orbit_class = ?';
      params.push(orbitClass);
    }

    if (agency && agency !== 'ALL') {
      whereClause += ' AND Owner_Agency LIKE ?';
      params.push(`%${agency}%`);
    }

    if (status && status !== 'ALL') {
      whereClause += ' AND Operational_Status = ?';
      params.push(status);
    }

    const [countResult] = await pool.query<any[]>(
      `SELECT COUNT(*) AS total FROM SATELLITE ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const sql = `SELECT * FROM SATELLITE ${whereClause} ORDER BY Satellite_ID DESC LIMIT ? OFFSET ?`;
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
      let filtered = snap.SATELLITE || [];
      const search = (req.query.search as string || '').trim().toLowerCase();
      const orbitClass = (req.query.orbitClass as string || '').trim();
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '25', 10);
      const offset = (page - 1) * limit;

      if (search) {
        filtered = filtered.filter((s: any) => s.Satellite_Name?.toLowerCase().includes(search) || String(s.NORAD_ID).includes(search));
      }
      if (orbitClass && orbitClass !== 'ALL') {
        filtered = filtered.filter((s: any) => s.orbit_class === orbitClass);
      }
      const total = filtered.length;
      res.json({
        success: true,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: filtered.slice(offset, offset + limit),
        executedSql: 'SELECT * FROM SATELLITE (Snapshot Mode)'
      });
      return;
    }
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getSatelliteById(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  try {
    const [rows] = await pool.query<any[]>('SELECT * FROM SATELLITE WHERE Satellite_ID = ?', [id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Satellite not found' });
      return;
    }

    // Related history
    const [history] = await pool.query<any[]>(
      'SELECT * FROM ORBIT_STATE_HISTORY WHERE object_type = "SATELLITE" AND object_id = ? ORDER BY epoch DESC LIMIT 10',
      [id]
    );

    // Related conjunctions
    const [conjunctions] = await pool.query<any[]>(
      `SELECT c.*, d.Object_Name AS Debris_Name, d.rcs_size_class
       FROM COLLISION_EVENT c
       JOIN DEBRIS d ON c.Debris_ID = d.Debris_ID
       WHERE c.Satellite_ID = ?
       ORDER BY c.Collision_Risk_Prob DESC LIMIT 10`,
      [id]
    );

    // Related observations
    const [observations] = await pool.query<any[]>(
      `SELECT o.*, ts.Station_Name, ts.Location_Country
       FROM OBSERVATION o
       JOIN TRACKING_STATION ts ON o.Station_ID = ts.Station_ID
       WHERE o.Satellite_ID = ?
       ORDER BY o.observed_at DESC LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      satellite: rows[0],
      history,
      conjunctions,
      observations
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createSatellite(req: Request, res: Response): Promise<void> {
  const {
    noradId, intlDesignator, satelliteName, ownerAgency,
    launchDate, altitudeKm, inclinationDeg, apogeeKm, perigeeKm
  } = req.body;

  const userId = req.user?.userId || 1;

  try {
    // Calling stored procedure Register_Satellite
    const [result] = await pool.query<any[]>(
      'CALL Register_Satellite(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @out_sat_id, @out_msg); SELECT @out_sat_id AS sat_id, @out_msg AS message;',
      [
        noradId, intlDesignator, satelliteName, ownerAgency || inferOwnerAgency(satelliteName),
        launchDate || new Date().toISOString().slice(0, 10),
        altitudeKm, inclinationDeg, apogeeKm, perigeeKm, userId
      ]
    );

    const outData = (result as any)[1][0];
    if (outData.sat_id === -1) {
      res.status(400).json({ success: false, message: outData.message });
      return;
    }

    const executedSql = `CALL Register_Satellite(${noradId}, '${intlDesignator}', '${satelliteName}', '${ownerAgency}', '${launchDate}', ${altitudeKm}, ${inclinationDeg}, ${apogeeKm}, ${perigeeKm}, ${userId}, @out_sat_id, @out_msg);`;

    res.status(201).json({
      success: true,
      message: outData.message,
      satelliteId: outData.sat_id,
      executedSql,
      affectedRows: 1
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateSatellite(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  const {
    satelliteName, ownerAgency, operationalStatus, altitudeKm,
    inclinationDeg, apogeeKm, perigeeKm
  } = req.body;

  try {
    const executedSql = `UPDATE SATELLITE SET 
      Satellite_Name = '${satelliteName}', 
      Owner_Agency = '${ownerAgency}', 
      Operational_Status = '${operationalStatus}', 
      Orbital_Altitude_KM = ${altitudeKm}, 
      Inclination_Deg = ${inclinationDeg}, 
      Apogee_KM = ${apogeeKm}, 
      Perigee_KM = ${perigeeKm}
    WHERE Satellite_ID = ${id};`;

    const [result] = await pool.query<any>(
      `UPDATE SATELLITE SET 
        Satellite_Name = COALESCE(?, Satellite_Name), 
        Owner_Agency = COALESCE(?, Owner_Agency), 
        Operational_Status = COALESCE(?, Operational_Status), 
        Orbital_Altitude_KM = COALESCE(?, Orbital_Altitude_KM), 
        Inclination_Deg = COALESCE(?, Inclination_Deg), 
        Apogee_KM = COALESCE(?, Apogee_KM), 
        Perigee_KM = COALESCE(?, Perigee_KM)
      WHERE Satellite_ID = ?`,
      [satelliteName, ownerAgency, operationalStatus, altitudeKm, inclinationDeg, apogeeKm, perigeeKm, id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: 'Satellite not found' });
      return;
    }

    // Audit log
    await pool.query(
      'INSERT INTO AUDIT_LOG (user_id, action_type, entity_name, entity_id, query_text) VALUES (?, "UPDATE", "SATELLITE", ?, ?)',
      [req.user?.userId || null, id, executedSql]
    );

    res.json({
      success: true,
      message: 'Satellite updated successfully. Trajectory trigger archived previous orbit state if modified.',
      executedSql,
      affectedRows: result.affectedRows
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function deleteSatellite(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  try {
    const executedSql = `DELETE FROM SATELLITE WHERE Satellite_ID = ${id};`;
    const [result] = await pool.query<any>('DELETE FROM SATELLITE WHERE Satellite_ID = ?', [id]);

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: 'Satellite not found' });
      return;
    }

    // Audit log
    await pool.query(
      'INSERT INTO AUDIT_LOG (user_id, action_type, entity_name, entity_id, query_text) VALUES (?, "DELETE", "SATELLITE", ?, ?)',
      [req.user?.userId || null, id, executedSql]
    );

    res.json({
      success: true,
      message: 'Satellite deleted successfully (CASCADE removed linked collision events).',
      executedSql,
      affectedRows: result.affectedRows
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// ----------------------------------------------------------------------------
// DEBRIS CRUD
// ----------------------------------------------------------------------------
export async function getDebris(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '25', 10);
    const offset = (page - 1) * limit;

    const search = (req.query.search as string || '').trim();
    const orbitClass = (req.query.orbitClass as string || '').trim();
    const sizeClass = (req.query.sizeClass as string || '').trim();

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (d.Object_Name LIKE ? OR d.NORAD_ID LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (orbitClass && orbitClass !== 'ALL') {
      whereClause += ' AND d.orbit_class = ?';
      params.push(orbitClass);
    }

    if (sizeClass && sizeClass !== 'ALL') {
      whereClause += ' AND d.rcs_size_class = ?';
      params.push(sizeClass);
    }

    const [countResult] = await pool.query<any[]>(
      `SELECT COUNT(*) AS total FROM DEBRIS d ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const sql = `SELECT d.*, ts.Station_Name, s.Satellite_Name AS Parent_Satellite_Name, l.breakup_event_name
      FROM DEBRIS d
      LEFT JOIN TRACKING_STATION ts ON d.Station_ID = ts.Station_ID
      LEFT JOIN SATELLITE s ON d.parent_satellite_id = s.Satellite_ID
      LEFT JOIN DEBRIS_LINEAGE l ON d.Debris_ID = l.fragment_debris_id
      ${whereClause}
      ORDER BY d.Debris_ID DESC
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
      let filtered = snap.DEBRIS || [];
      const search = (req.query.search as string || '').trim().toLowerCase();
      const orbitClass = (req.query.orbitClass as string || '').trim();
      const sizeClass = (req.query.sizeClass as string || '').trim();
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '25', 10);
      const offset = (page - 1) * limit;

      if (search) {
        filtered = filtered.filter((d: any) => d.Object_Name?.toLowerCase().includes(search) || String(d.NORAD_ID).includes(search));
      }
      if (orbitClass && orbitClass !== 'ALL') {
        filtered = filtered.filter((d: any) => d.orbit_class === orbitClass);
      }
      if (sizeClass && sizeClass !== 'ALL') {
        filtered = filtered.filter((d: any) => d.rcs_size_class === sizeClass);
      }
      const total = filtered.length;
      res.json({
        success: true,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: filtered.slice(offset, offset + limit),
        executedSql: 'SELECT * FROM DEBRIS (Snapshot Mode)'
      });
      return;
    }
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getDebrisById(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  try {
    const [rows] = await pool.query<any[]>(
      `SELECT d.*, ts.Station_Name, ts.Location_Country, s.Satellite_Name AS Parent_Satellite_Name
       FROM DEBRIS d
       LEFT JOIN TRACKING_STATION ts ON d.Station_ID = ts.Station_ID
       LEFT JOIN SATELLITE s ON d.parent_satellite_id = s.Satellite_ID
       WHERE d.Debris_ID = ?`,
      [id]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Debris object not found' });
      return;
    }

    // Fetch Lineage
    const [lineage] = await pool.query<any[]>(
      'SELECT * FROM DEBRIS_LINEAGE WHERE fragment_debris_id = ?',
      [id]
    );

    // Conjunctions
    const [conjunctions] = await pool.query<any[]>(
      `SELECT c.*, s.Satellite_Name
       FROM COLLISION_EVENT c
       JOIN SATELLITE s ON c.Satellite_ID = s.Satellite_ID
       WHERE c.Debris_ID = ?
       ORDER BY c.Collision_Risk_Prob DESC LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      debris: rows[0],
      lineage: lineage[0] || null,
      conjunctions
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getDebrisLineage(req: Request, res: Response): Promise<void> {
  const noradId = parseInt(req.params.noradId, 10);
  try {
    const [rows] = await pool.query<any[]>('CALL Fetch_Object_Lineage(?)', [noradId]);
    res.json({
      success: true,
      noradId,
      lineageTree: rows[0] || []
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createDebris(req: Request, res: Response): Promise<void> {
  const {
    noradId, objectName, sizeMeters, rcsSizeClass, massKg,
    velocityKms, apogeeKm, perigeeKm, inclinationDeg, stationId
  } = req.body;

  try {
    const executedSql = `INSERT INTO DEBRIS (
      NORAD_ID, Object_Name, Size_Meters, rcs_size_class, Mass_KG,
      Velocity_KMS, Apogee_KM, Perigee_KM, Inclination_Deg, Station_ID,
      is_estimated, Epoch, source
    ) VALUES (${noradId}, '${objectName}', ${sizeMeters || 'NULL'}, '${rcsSizeClass || 'UNKNOWN'}', ${massKg || 'NULL'}, ${velocityKms}, ${apogeeKm}, ${perigeeKm}, ${inclinationDeg}, ${stationId || 'NULL'}, 1, NOW(), 'Manual Insert');`;

    const [result] = await pool.query<any>(
      `INSERT INTO DEBRIS (
        NORAD_ID, Object_Name, Size_Meters, rcs_size_class, Mass_KG,
        Velocity_KMS, Apogee_KM, Perigee_KM, Inclination_Deg, Station_ID,
        is_estimated, Epoch, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), 'Manual Insert')`,
      [
        noradId, objectName, sizeMeters || null, rcsSizeClass || 'UNKNOWN',
        massKg || null, velocityKms, apogeeKm, perigeeKm, inclinationDeg, stationId || null
      ]
    );

    // Audit log
    await pool.query(
      'INSERT INTO AUDIT_LOG (user_id, action_type, entity_name, entity_id, query_text) VALUES (?, "INSERT", "DEBRIS", ?, ?)',
      [req.user?.userId || null, result.insertId, executedSql]
    );

    res.status(201).json({
      success: true,
      message: 'Debris fragment registered and validated by trigger.',
      debrisId: result.insertId,
      executedSql,
      affectedRows: 1
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateDebris(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  const {
    objectName, sizeMeters, rcsSizeClass, massKg,
    velocityKms, apogeeKm, perigeeKm, inclinationDeg, stationId
  } = req.body;

  try {
    const executedSql = `UPDATE DEBRIS SET 
      Object_Name = '${objectName}', 
      Size_Meters = ${sizeMeters || 'NULL'}, 
      rcs_size_class = '${rcsSizeClass}', 
      Mass_KG = ${massKg || 'NULL'}, 
      Velocity_KMS = ${velocityKms}, 
      Apogee_KM = ${apogeeKm}, 
      Perigee_KM = ${perigeeKm}, 
      Inclination_Deg = ${inclinationDeg}, 
      Station_ID = ${stationId || 'NULL'}
    WHERE Debris_ID = ${id};`;

    const [result] = await pool.query<any>(
      `UPDATE DEBRIS SET 
        Object_Name = COALESCE(?, Object_Name), 
        Size_Meters = COALESCE(?, Size_Meters), 
        rcs_size_class = COALESCE(?, rcs_size_class), 
        Mass_KG = COALESCE(?, Mass_KG), 
        Velocity_KMS = COALESCE(?, Velocity_KMS), 
        Apogee_KM = COALESCE(?, Apogee_KM), 
        Perigee_KM = COALESCE(?, Perigee_KM), 
        Inclination_Deg = COALESCE(?, Inclination_Deg), 
        Station_ID = COALESCE(?, Station_ID)
      WHERE Debris_ID = ?`,
      [objectName, sizeMeters, rcsSizeClass, massKg, velocityKms, apogeeKm, perigeeKm, inclinationDeg, stationId, id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: 'Debris not found' });
      return;
    }

    // Audit log
    await pool.query(
      'INSERT INTO AUDIT_LOG (user_id, action_type, entity_name, entity_id, query_text) VALUES (?, "UPDATE", "DEBRIS", ?, ?)',
      [req.user?.userId || null, id, executedSql]
    );

    res.json({
      success: true,
      message: 'Debris updated successfully. Trajectory trigger archived previous orbit state if modified.',
      executedSql,
      affectedRows: result.affectedRows
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function deleteDebris(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  try {
    const executedSql = `DELETE FROM DEBRIS WHERE Debris_ID = ${id};`;
    const [result] = await pool.query<any>('DELETE FROM DEBRIS WHERE Debris_ID = ?', [id]);

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: 'Debris not found' });
      return;
    }

    // Audit log
    await pool.query(
      'INSERT INTO AUDIT_LOG (user_id, action_type, entity_name, entity_id, query_text) VALUES (?, "DELETE", "DEBRIS", ?, ?)',
      [req.user?.userId || null, id, executedSql]
    );

    res.json({
      success: true,
      message: 'Debris deleted successfully.',
      executedSql,
      affectedRows: result.affectedRows
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}
