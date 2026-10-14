-- ============================================================================
-- ORBITWATCH: SPACE DEBRIS TRACKING PLATFORM
-- File: 03_views.sql
-- Description: Analytical and Role-Restricted Relational Views
-- Authors: Pranil Vithlani (25BRS1210), Arihant Singh (25BRS1230), Tanzil Hassan (25BRS1201)
-- ============================================================================

USE orbitwatch_db;

-- ----------------------------------------------------------------------------
-- View 1: v_high_risk_events
-- Conjunction events crossing emergency safety thresholds
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_high_risk_events AS
SELECT 
    c.Event_ID,
    c.Event_Timestamp AS TCA,
    c.Miss_Distance_KM,
    c.Relative_Velocity AS Relative_Velocity_KMS,
    c.Collision_Risk_Prob,
    c.risk_level,
    c.source AS detection_source,
    s.Satellite_ID,
    s.NORAD_ID AS Sat_NORAD_ID,
    s.Satellite_Name,
    s.Owner_Agency,
    s.orbit_class AS Sat_Orbit_Class,
    d.Debris_ID,
    d.NORAD_ID AS Debris_NORAD_ID,
    d.Object_Name AS Debris_Name,
    d.rcs_size_class,
    d.Velocity_KMS AS Debris_Velocity_KMS,
    TIMESTAMPDIFF(HOUR, NOW(), c.Event_Timestamp) AS hours_to_tca
FROM COLLISION_EVENT c
JOIN SATELLITE s ON c.Satellite_ID = s.Satellite_ID
JOIN DEBRIS d ON c.Debris_ID = d.Debris_ID
WHERE c.Collision_Risk_Prob >= 0.0001 OR c.Miss_Distance_KM <= 5.0
ORDER BY c.Collision_Risk_Prob DESC, c.Miss_Distance_KM ASC;

-- ----------------------------------------------------------------------------
-- View 2: v_debris_catalog
-- Comprehensive debris view joining parent origin and lineage
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_debris_catalog AS
SELECT 
    d.Debris_ID,
    d.NORAD_ID,
    d.Object_Name,
    d.Size_Meters,
    d.rcs_size_class,
    d.Mass_KG,
    d.Velocity_KMS,
    d.Apogee_KM,
    d.Perigee_KM,
    d.Inclination_Deg,
    d.orbit_class,
    d.is_estimated,
    d.Epoch,
    d.source,
    ts.Station_Name AS Last_Tracking_Station,
    ts.Location_Country AS Station_Country,
    s.Satellite_Name AS Parent_Satellite_Name,
    s.Owner_Agency AS Parent_Owner,
    l.breakup_event_name,
    l.breakup_date,
    l.event_type AS breakup_type
FROM DEBRIS d
LEFT JOIN TRACKING_STATION ts ON d.Station_ID = ts.Station_ID
LEFT JOIN SATELLITE s ON d.parent_satellite_id = s.Satellite_ID
LEFT JOIN DEBRIS_LINEAGE l ON d.Debris_ID = l.fragment_debris_id;

-- ----------------------------------------------------------------------------
-- View 3: v_satellite_exposure
-- Conjunction threat exposure aggregated by satellite
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_satellite_exposure AS
SELECT 
    s.Satellite_ID,
    s.NORAD_ID,
    s.Satellite_Name,
    s.Owner_Agency,
    s.Operational_Status,
    s.orbit_class,
    COUNT(c.Event_ID) AS Total_Conjunction_Encounters,
    MAX(c.Collision_Risk_Prob) AS Max_Collision_Probability,
    MIN(c.Miss_Distance_KM) AS Closest_Miss_Distance_KM,
    SUM(CASE WHEN c.risk_level = 'CRITICAL' THEN 1 ELSE 0 END) AS Critical_Encounter_Count
FROM SATELLITE s
LEFT JOIN COLLISION_EVENT c ON s.Satellite_ID = c.Satellite_ID
GROUP BY s.Satellite_ID, s.NORAD_ID, s.Satellite_Name, s.Owner_Agency, s.Operational_Status, s.orbit_class;

-- ----------------------------------------------------------------------------
-- View 4: v_station_workload
-- Sensor surveillance load and telemetry statistics per tracking station
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_station_workload AS
SELECT 
    ts.Station_ID,
    ts.Station_Name,
    ts.Location_Country,
    ts.Sensor_Type,
    ts.Latitude,
    ts.Longitude,
    COUNT(o.Observation_ID) AS Total_Observations_Logged,
    COUNT(DISTINCT o.Satellite_ID) AS Distinct_Satellites_Tracked,
    COUNT(DISTINCT o.Debris_ID) AS Distinct_Debris_Tracked,
    MAX(o.observed_at) AS Last_Contact_Timestamp
FROM TRACKING_STATION ts
LEFT JOIN OBSERVATION o ON ts.Station_ID = o.Station_ID
GROUP BY ts.Station_ID, ts.Station_Name, ts.Location_Country, ts.Sensor_Type, ts.Latitude, ts.Longitude;

-- ----------------------------------------------------------------------------
-- View 5: v_public_researcher_catalog
-- Sanitized catalog for educational and research public access
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_public_researcher_catalog AS
SELECT 
    s.NORAD_ID,
    s.Satellite_Name,
    s.Owner_Agency,
    s.Operational_Status,
    s.orbit_class,
    s.Orbital_Altitude_KM,
    s.Inclination_Deg,
    s.Epoch,
    'Declassified Public Record' AS Security_Classification
FROM SATELLITE s
UNION ALL
SELECT 
    d.NORAD_ID,
    d.Object_Name,
    'Unassigned / Debris' AS Owner_Agency,
    'Defunct Fragment' AS Operational_Status,
    d.orbit_class,
    (d.Apogee_KM + d.Perigee_KM) / 2.0 AS Orbital_Altitude_KM,
    d.Inclination_Deg,
    d.Epoch,
    'Public Debris Catalog' AS Security_Classification
FROM DEBRIS d;
