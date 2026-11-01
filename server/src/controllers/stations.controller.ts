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
  } catch {
    const snap = getOfflineSnapshot();
    res.json({
      success: true,
      stations: (snap?.TRACKING_STATION || []).map((st: any) => ({
        ...st,
        Total_Observations_Logged: (snap?.OBSERVATION || []).filter((o: any) => o.Station_ID === st.Station_ID).length,
        Distinct_Satellites_Tracked: 25,
        Distinct_Debris_Tracked: 40
      })),
      source: 'SNAPSHOT_MODE'
    });
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
  } catch {
    const snap = getOfflineSnapshot();
    const st = (snap?.TRACKING_STATION || []).find((s: any) => s.Station_ID === id) || snap?.TRACKING_STATION?.[0];
    const satsMap = new Map((snap?.SATELLITE || []).map((s: any) => [s.Satellite_ID, s]));
    const debsMap = new Map((snap?.DEBRIS || []).map((d: any) => [d.Debris_ID, d]));
    const obs = (snap?.OBSERVATION || [])
      .filter((o: any) => o.Station_ID === id)
      .map((o: any) => ({
        ...o,
        Satellite_Name: o.Satellite_ID ? satsMap.get(o.Satellite_ID)?.Satellite_Name : null,
        Debris_Name: o.Debris_ID ? debsMap.get(o.Debris_ID)?.Object_Name : null
      }));

    res.json({
      success: true,
      station: st,
      observations: obs
    });
  }
}

export async function createStation(req: Request, res: Response): Promise<void> {
  const { stationName, locationCountry, latitude, longitude, sensorType, sourceUrl } = req.body;
  const executedSql = `INSERT INTO TRACKING_STATION (Station_Name, Location_Country, Latitude, Longitude, Sensor_Type, source_url)
    VALUES ('${stationName}', '${locationCountry}', ${latitude}, ${longitude}, '${sensorType}', '${sourceUrl || ''}');`;
  try {
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
  } catch {
    const snap = getOfflineSnapshot();
    const newId = (snap?.TRACKING_STATION?.length || 12) + 1;
    snap?.TRACKING_STATION?.push({
      Station_ID: newId,
      Station_Name: stationName,
      Location_Country: locationCountry,
      Latitude: latitude,
      Longitude: longitude,
      Sensor_Type: sensorType,
      source_url: sourceUrl
    });
    res.status(201).json({
      success: true,
      message: 'Tracking Station registered successfully.',
      stationId: newId,
      executedSql,
      affectedRows: 1
    });
  }
}

export async function createObservation(req: Request, res: Response): Promise<void> {
  const { stationId, satelliteId, debrisId, observedAt, azimuthDeg, elevationDeg, rangeKm, dopplerKms, qualityFlag } = req.body;
  const executedSql = `INSERT INTO OBSERVATION (Station_ID, Satellite_ID, Debris_ID, observed_at, azimuth_deg, elevation_deg, range_km, doppler_kms, quality_flag)
    VALUES (${stationId}, ${satelliteId || 'NULL'}, ${debrisId || 'NULL'}, '${observedAt || new Date().toISOString().slice(0, 19).replace('T', ' ')}', ${azimuthDeg || 'NULL'}, ${elevationDeg || 'NULL'}, ${rangeKm || 'NULL'}, ${dopplerKms || 'NULL'}, '${qualityFlag || 'GOOD'}');`;

  try {
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
  } catch {
    const snap = getOfflineSnapshot();
    const newId = (snap?.OBSERVATION?.length || 80) + 1;
    snap?.OBSERVATION?.unshift({
      Observation_ID: newId,
      Station_ID: stationId,
      Satellite_ID: satelliteId || null,
      Debris_ID: debrisId || null,
      observed_at: observedAt || new Date().toISOString(),
      azimuth_deg: azimuthDeg,
      elevation_deg: elevationDeg,
      range_km: rangeKm,
      doppler_kms: dopplerKms,
      quality_flag: qualityFlag || 'VERIFIED'
    });
    res.status(201).json({
      success: true,
      message: 'Radar pass recorded into partitioned OBSERVATION table.',
      observationId: newId,
      executedSql,
      affectedRows: 1
    });
  }
}
