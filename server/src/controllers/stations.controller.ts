import { Request, Response } from 'express';
import pool from '../db.js';
import { getOfflineSnapshot } from '../services/snapshotStore.js';

export async function getStations(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query<any[]>('SELECT * FROM v_station_workload ORDER BY Total_Observations_Logged DESC');
    res.json({
      success: true,
      stations: rows
    });
  } catch (err: any) {
    const snap = getOfflineSnapshot();
    if (snap) {
      res.json({
        success: true,
        stations: snap.TRACKING_STATION || [],
        source: 'SNAPSHOT_MODE'
      });
      return;
    }
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getStationById(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  try {
    const [rows] = await pool.query<any[]>('SELECT * FROM TRACKING_STATION WHERE Station_ID = ?', [id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Station not found' });
      return;
    }

    const [observations] = await pool.query<any[]>(
      `SELECT o.*, s.Satellite_Name, d.Object_Name AS Debris_Name
       FROM OBSERVATION o
       LEFT JOIN SATELLITE s ON o.Satellite_ID = s.Satellite_ID
       LEFT JOIN DEBRIS d ON o.Debris_ID = d.Debris_ID
       WHERE o.Station_ID = ?
       ORDER BY o.observed_at DESC LIMIT 50`,
      [id]
    );

    res.json({
      success: true,
      station: rows[0],
      observations
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createStation(req: Request, res: Response): Promise<void> {
  const { stationName, locationCountry, latitude, longitude, sensorType, sourceUrl } = req.body;
  try {
    const executedSql = `INSERT INTO TRACKING_STATION (Station_Name, Location_Country, Latitude, Longitude, Sensor_Type, source_url)
      VALUES ('${stationName}', '${locationCountry}', ${latitude}, ${longitude}, '${sensorType}', '${sourceUrl || ''}');`;

    const [result] = await pool.query<any>(
      `INSERT INTO TRACKING_STATION (Station_Name, Location_Country, Latitude, Longitude, Sensor_Type, source_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [stationName, locationCountry, latitude, longitude, sensorType, sourceUrl || null]
    );

    await pool.query(
      'INSERT INTO AUDIT_LOG (user_id, action_type, entity_name, entity_id, query_text) VALUES (?, "INSERT", "TRACKING_STATION", ?, ?)',
      [req.user?.userId || null, result.insertId, executedSql]
    );

    res.status(201).json({
      success: true,
      message: 'Tracking Station registered successfully.',
      stationId: result.insertId,
      executedSql,
      affectedRows: 1
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function createObservation(req: Request, res: Response): Promise<void> {
  const { stationId, satelliteId, debrisId, observedAt, azimuthDeg, elevationDeg, rangeKm, dopplerKms, qualityFlag } = req.body;

  try {
    const executedSql = `INSERT INTO OBSERVATION (Station_ID, Satellite_ID, Debris_ID, observed_at, azimuth_deg, elevation_deg, range_km, doppler_kms, quality_flag)
      VALUES (${stationId}, ${satelliteId || 'NULL'}, ${debrisId || 'NULL'}, '${observedAt || new Date().toISOString().slice(0, 19).replace('T', ' ')}', ${azimuthDeg || 'NULL'}, ${elevationDeg || 'NULL'}, ${rangeKm || 'NULL'}, ${dopplerKms || 'NULL'}, '${qualityFlag || 'GOOD'}');`;

    const [result] = await pool.query<any>(
      `INSERT INTO OBSERVATION (Station_ID, Satellite_ID, Debris_ID, observed_at, azimuth_deg, elevation_deg, range_km, doppler_kms, quality_flag)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        stationId,
        satelliteId || null,
        debrisId || null,
        observedAt || new Date(),
        azimuthDeg || null,
        elevationDeg || null,
        rangeKm || null,
        dopplerKms || null,
        qualityFlag || 'GOOD'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Radar pass recorded into partitioned OBSERVATION table.',
      observationId: result.insertId,
      executedSql,
      affectedRows: 1
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}
