import { Request, Response } from 'express';
import pool, { roPool } from '../db.js';

export async function executeSQLConsole(req: Request, res: Response): Promise<void> {
  const { query, isPredefined } = req.body;

  if (!query || typeof query !== 'string') {
    res.status(400).json({ success: false, message: 'Query string is required.' });
    return;
  }

  const trimmed = query.trim();

  // Safety filter for non-admin custom queries:
  // Must be single SELECT statement only
  const isAdmin = req.user?.role === 'Administrator';
  if (!isAdmin && !isPredefined) {
    const upper = trimmed.toUpperCase();
    if (!upper.startsWith('SELECT') && !upper.startsWith('WITH') && !upper.startsWith('EXPLAIN') && !upper.startsWith('SHOW')) {
      res.status(403).json({
        success: false,
        message: 'Security Policy Violation: Custom SQL execution is restricted to read-only queries (SELECT, EXPLAIN, SHOW) for your role.'
      });
      return;
    }
  }

  const startHr = process.hrtime();
  try {
    // Non-admin queries route through the sandboxed read-only MySQL pool
    const activePool = isAdmin ? pool : roPool;
    const [rows, fields] = await activePool.query<any[]>(trimmed);

    const diff = process.hrtime(startHr);
    const executionTimeMs = Math.round((diff[0] * 1000 + diff[1] / 1e6) * 100) / 100;

    const columnNames = fields ? (fields as any[]).map((f) => f.name) : [];

    res.json({
      success: true,
      query: trimmed,
      executionTimeMs,
      rowCount: Array.isArray(rows) ? rows.length : (rows as any)?.affectedRows || 0,
      columns: columnNames,
      rows: Array.isArray(rows) ? rows.slice(0, 500) : rows
    });
  } catch (err: any) {
    const diff = process.hrtime(startHr);
    const executionTimeMs = Math.round((diff[0] * 1000 + diff[1] / 1e6) * 100) / 100;

    res.status(400).json({
      success: false,
      message: err.message,
      code: err.code || 'SQL_ERROR',
      sqlState: err.sqlState,
      executionTimeMs
    });
  }
}

export async function getPredefinedQueries(_req: Request, res: Response): Promise<void> {
  const library = [
    {
      id: 'q_inner_join',
      category: 'Joins',
      title: 'INNER JOIN: High-Risk Conjunction Encounters',
      description: 'Pairs satellites with threatening debris fragments where miss distance is under 2.0 km',
      sql: `SELECT 
    c.Event_ID, s.Satellite_Name, s.Owner_Agency,
    d.Object_Name AS Debris_Fragment, d.rcs_size_class,
    c.Miss_Distance_KM, c.Collision_Risk_Prob, c.risk_level
FROM COLLISION_EVENT c
INNER JOIN SATELLITE s ON c.Satellite_ID = s.Satellite_ID
INNER JOIN DEBRIS d ON c.Debris_ID = d.Debris_ID
WHERE c.Miss_Distance_KM <= 2.0
ORDER BY c.Collision_Risk_Prob DESC;`
    },
    {
      id: 'q_left_join',
      category: 'Joins',
      title: 'LEFT JOIN: Tracking Stations Observation Load',
      description: 'Identifies all tracking stations including observatories with zero logged passes',
      sql: `SELECT 
    ts.Station_ID, ts.Station_Name, ts.Location_Country, ts.Sensor_Type,
    COUNT(o.Observation_ID) AS Total_Passes_Logged,
    MAX(o.observed_at) AS Most_Recent_Contact
FROM TRACKING_STATION ts
LEFT JOIN OBSERVATION o ON ts.Station_ID = o.Station_ID
GROUP BY ts.Station_ID, ts.Station_Name, ts.Location_Country, ts.Sensor_Type
ORDER BY Total_Passes_Logged DESC;`
    },
    {
      id: 'q_self_join',
      category: 'Joins',
      title: 'SELF JOIN: Debris Sibling Pairs from Same Breakup',
      description: 'Pairs debris fragments originating from the exact same historical breakup event',
      sql: `SELECT 
    l1.breakup_event_name,
    d1.Object_Name AS Fragment_Alpha,
    d2.Object_Name AS Fragment_Beta,
    ABS(d1.Apogee_KM - d2.Apogee_KM) AS Apogee_Delta_KM
FROM DEBRIS_LINEAGE l1
JOIN DEBRIS_LINEAGE l2 ON l1.parent_catalog_id = l2.parent_catalog_id AND l1.fragment_debris_id < l2.fragment_debris_id
JOIN DEBRIS d1 ON l1.fragment_debris_id = d1.Debris_ID
JOIN DEBRIS d2 ON l2.fragment_debris_id = d2.Debris_ID
LIMIT 20;`
    },
    {
      id: 'q_nested_subquery',
      category: 'Subqueries',
      title: 'Nested Subquery: Satellites at Higher Altitude than Average',
      description: 'Finds active satellites flying higher than the global mean LEO orbital altitude',
      sql: `SELECT NORAD_ID, Satellite_Name, Owner_Agency, Orbital_Altitude_KM, orbit_class
FROM SATELLITE
WHERE Orbital_Altitude_KM > (
    SELECT AVG(Orbital_Altitude_KM) FROM SATELLITE WHERE orbit_class = 'LEO'
) AND orbit_class = 'LEO'
ORDER BY Orbital_Altitude_KM DESC
LIMIT 25;`
    },
    {
      id: 'q_correlated_subquery',
      category: 'Subqueries',
      title: 'Correlated Subquery: Debris Faster than Orbit Regime Average',
      description: 'Uses an inner correlated query referencing the outer row orbit_class',
      sql: `SELECT d1.NORAD_ID, d1.Object_Name, d1.orbit_class, d1.Velocity_KMS
FROM DEBRIS d1
WHERE d1.Velocity_KMS > (
    SELECT AVG(d2.Velocity_KMS)
    FROM DEBRIS d2
    WHERE d2.orbit_class = d1.orbit_class
)
LIMIT 25;`
    },
    {
      id: 'q_aggregate_having',
      category: 'Aggregates',
      title: 'GROUP BY & HAVING: Agencies with Heavy Space Asset Counts',
      description: 'Aggregates satellites per agency and filters groups with at least 5 registered assets',
      sql: `SELECT 
    Owner_Agency,
    COUNT(*) AS Active_Asset_Count,
    ROUND(AVG(Orbital_Altitude_KM), 2) AS Avg_Altitude_KM,
    MIN(Perigee_KM) AS Lowest_Perigee_KM,
    MAX(Apogee_KM) AS Highest_Apogee_KM
FROM SATELLITE
GROUP BY Owner_Agency
HAVING COUNT(*) >= 5
ORDER BY Active_Asset_Count DESC;`
    },
    {
      id: 'q_window_function',
      category: 'Advanced SQL',
      title: 'Window Function: DENSE_RANK() by Collision Threat Level',
      description: 'Ranks conjunction encounters partitioned by satellite orbit class',
      sql: `SELECT 
    c.Event_ID, s.Satellite_Name, s.orbit_class,
    c.Miss_Distance_KM, c.Collision_Risk_Prob,
    DENSE_RANK() OVER (PARTITION BY s.orbit_class ORDER BY c.Collision_Risk_Prob DESC) AS Threat_Rank_In_Regime
FROM COLLISION_EVENT c
JOIN SATELLITE s ON c.Satellite_ID = s.Satellite_ID
LIMIT 30;`
    },
    {
      id: 'q_set_operations',
      category: 'Advanced SQL',
      title: 'SET Operation: UNION ALL of Cataloged Space Objects',
      description: 'Combines satellites and debris into a unified orbital sensor registry',
      sql: `SELECT NORAD_ID, Satellite_Name AS Object_Name, 'Active Payload' AS Classification, orbit_class, Orbital_Altitude_KM AS Altitude_KM
FROM SATELLITE
WHERE orbit_class = 'LEO'
UNION ALL
SELECT NORAD_ID, Object_Name, 'Debris Fragment' AS Classification, orbit_class, (Apogee_KM + Perigee_KM) / 2 AS Altitude_KM
FROM DEBRIS
WHERE orbit_class = 'LEO'
ORDER BY Altitude_KM DESC
LIMIT 30;`
    }
  ];

  res.json({ success: true, library });
}

export async function getDbObjectsCatalog(_req: Request, res: Response): Promise<void> {
  try {
    const [views] = await pool.query<any[]>(
      `SELECT TABLE_NAME AS name, VIEW_DEFINITION AS definition 
       FROM information_schema.VIEWS 
       WHERE TABLE_SCHEMA = 'orbitwatch_db'`
    );

    const [routines] = await pool.query<any[]>(
      `SELECT ROUTINE_NAME AS name, ROUTINE_TYPE AS type, ROUTINE_DEFINITION AS definition, DTD_IDENTIFIER AS return_type
       FROM information_schema.ROUTINES 
       WHERE ROUTINE_SCHEMA = 'orbitwatch_db'`
    );

    const [triggers] = await pool.query<any[]>(
      `SELECT TRIGGER_NAME AS name, EVENT_MANIPULATION AS event, EVENT_OBJECT_TABLE AS table_name, ACTION_TIMING AS timing, ACTION_STATEMENT AS statement
       FROM information_schema.TRIGGERS 
       WHERE TRIGGER_SCHEMA = 'orbitwatch_db'`
    );

    res.json({
      success: true,
      views,
      procedures: routines.filter((r) => r.type === 'PROCEDURE'),
      functions: routines.filter((r) => r.type === 'FUNCTION'),
      triggers
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function runTransactionDemo(req: Request, res: Response): Promise<void> {
  const scenario = req.params.scenario; // 'commit' | 'savepoint' | 'rollback'
  const conn = await pool.getConnection();

  try {
    if (scenario === 'commit') {
      await conn.beginTransaction();

      const [satIns] = await conn.query<any>(
        `INSERT INTO SATELLITE (
          NORAD_ID, intl_designator, Satellite_Name, Owner_Agency,
          Launch_Date, Operational_Status, Orbital_Altitude_KM,
          Inclination_Deg, Apogee_KM, Perigee_KM, Eccentricity,
          Mean_Motion, Epoch, orbit_class, source
        ) VALUES (88801, '2026-888A', 'ACID-COMMIT-TEST-SAT', 'ISRO', '2026-10-14', 'Active', 520, 97.4, 525, 515, 0.001, 15.1, NOW(), 'LEO', 'ACID Live Demo')`
      );

      const newSatId = satIns.insertId;

      await conn.query(
        `INSERT INTO OBSERVATION (Station_ID, Satellite_ID, observed_at, azimuth_deg, elevation_deg, range_km, doppler_kms, quality_flag)
         VALUES (8, ?, NOW(), 120.4, 55.2, 522.0, 7.5, 'COMMIT_VERIFIED')`,
        [newSatId]
      );

      await conn.commit();

      res.json({
        success: true,
        scenario: 'COMMIT',
        message: 'Transaction committed atomically. Both satellite and observation were written to disk.',
        createdId: newSatId
      });

    } else if (scenario === 'savepoint') {
      await conn.beginTransaction();

      const [satIns] = await conn.query<any>(
        `INSERT INTO SATELLITE (
          NORAD_ID, intl_designator, Satellite_Name, Owner_Agency,
          Launch_Date, Operational_Status, Orbital_Altitude_KM,
          Inclination_Deg, Apogee_KM, Perigee_KM, Eccentricity,
          Mean_Motion, Epoch, orbit_class, source
        ) VALUES (88802, '2026-888B', 'ACID-SAVEPOINT-TEST-SAT', 'ESA', '2026-10-14', 'Active', 600, 98.0, 605, 595, 0.001, 14.8, NOW(), 'LEO', 'ACID Live Demo')`
      );

      const newSatId = satIns.insertId;

      // Set Savepoint
      await conn.query('SAVEPOINT SatelliteCreated');

      // Simulate a failed step that is rolled back to the savepoint
      await conn.query('ROLLBACK TO SAVEPOINT SatelliteCreated');

      // Continue valid operation
      await conn.query(
        `INSERT INTO OBSERVATION (Station_ID, Satellite_ID, observed_at, azimuth_deg, elevation_deg, range_km, doppler_kms, quality_flag)
         VALUES (7, ?, NOW(), 45.0, 70.0, 602.0, 7.4, 'RECOVERED_VIA_SAVEPOINT')`,
        [newSatId]
      );

      await conn.commit();

      res.json({
        success: true,
        scenario: 'SAVEPOINT & ROLLBACK TO',
        message: 'Savepoint rollback succeeded: recovered from simulated anomaly and committed valid records.',
        createdId: newSatId
      });

    } else if (scenario === 'rollback') {
      await conn.beginTransaction();

      await conn.query(
        `INSERT INTO SATELLITE (
          NORAD_ID, intl_designator, Satellite_Name, Owner_Agency,
          Launch_Date, Operational_Status, Orbital_Altitude_KM,
          Inclination_Deg, Apogee_KM, Perigee_KM, Eccentricity,
          Mean_Motion, Epoch, orbit_class, source
        ) VALUES (88803, '2026-888C', 'DOOMED-ROLLBACK-SAT', 'NASA', '2026-10-14', 'Active', 400, 51.6, 405, 395, 0.001, 15.5, NOW(), 'LEO', 'ACID Live Demo')`
      );

      // Rollback completely
      await conn.rollback();

      // Verify that object does NOT exist
      const [check] = await pool.query<any[]>('SELECT * FROM SATELLITE WHERE NORAD_ID = 88803');

      res.json({
        success: true,
        scenario: 'ROLLBACK',
        message: 'Transaction rolled back completely. Verification query confirms 0 rows exist for doomed record.',
        verifiedNonExistent: check.length === 0
      });
    }
  } catch (err: any) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

export async function explainQueryPlan(req: Request, res: Response): Promise<void> {
  const { query, analyze } = req.body;
  if (!query) {
    res.status(400).json({ success: false, message: 'Query is required' });
    return;
  }

  const explainPrefix = analyze ? 'EXPLAIN ANALYZE ' : 'EXPLAIN ';
  try {
    const [rows] = await pool.query<any[]>(`${explainPrefix}${query}`);
    res.json({
      success: true,
      analyze: !!analyze,
      plan: rows
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function getPartitionInfo(_req: Request, res: Response): Promise<void> {
  try {
    const [partitions] = await pool.query<any[]>(`
      SELECT 
        TABLE_NAME, PARTITION_NAME, PARTITION_METHOD, PARTITION_EXPRESSION,
        TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
      FROM information_schema.PARTITIONS
      WHERE TABLE_SCHEMA = 'orbitwatch_db' AND PARTITION_NAME IS NOT NULL
      ORDER BY TABLE_NAME, PARTITION_ORDINAL_POSITION
    `);

    res.json({
      success: true,
      partitions
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getRolesAndGrants(_req: Request, res: Response): Promise<void> {
  try {
    const [roles] = await pool.query<any[]>('SELECT * FROM ROLE');
    const [users] = await pool.query<any[]>('SELECT User_ID, username, role_name, organization FROM APP_USER');

    res.json({
      success: true,
      roles,
      users,
      mysqlNativeRoles: ['role_admin', 'role_agency', 'role_operator', 'role_researcher']
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
