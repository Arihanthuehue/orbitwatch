-- ============================================================================
-- ORBITWATCH: SPACE DEBRIS TRACKING & CONJUNCTION AVOIDANCE PLATFORM
-- COMPLETE MASTER SQL IMPLEMENTATION FILE (MYSQL 8.0 INNODB)
-- ============================================================================
-- Project:     Space Debris Tracking Database Project (VIT Chennai DBMS Lab)
-- Authors:     Pranil Vithlani (25BRS1210)
--              Arihant Singh   (25BRS1230)
--              Tanzil Hassan   (25BRS1201)
-- Standard:    Boyce-Codd Normal Form (BCNF), ACID Compliant, MySQL 8.0+
-- Contents:    1. Database Creation & Character Set Configuration
--              2. Complete Relational Tables (16 Tables + Range Partitioning)
--              3. B-Tree & Composite Performance Indexes (18 Indexes)
--              4. Relational & Role-Restricted Views (5 Views)
--              5. Deterministic Scalar Functions (4 Functions)
--              6. Stored Procedures, Recursive CTE & Explicit CURSOR (5 Procedures)
--              7. Database Validation, Alerting & Archiving Triggers (5 Triggers)
--              8. Native MySQL RBAC Roles & Privilege Grants (GRANT / REVOKE)
--              9. Real Seeded Telemetry Data (Stations, Satellites, Debris, SOCRATES)
--             10. ACID Transaction Walkthrough Scenarios (COMMIT, SAVEPOINT, ROLLBACK)
--             11. Partition Pruning & Index Execution Plan Queries (EXPLAIN)
-- ============================================================================

-- ============================================================================
-- SECTION 1: DATABASE INITIALIZATION
-- ============================================================================
CREATE DATABASE IF NOT EXISTS orbitwatch_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE orbitwatch_db;

-- ============================================================================
-- SECTION 2: CORE RELATIONAL TABLES (BCNF NORMALIZED)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 TRACKING_STATION Table
-- Ground surveillance radars, optical observatories, and SSA control centres
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS TRACKING_STATION (
    Station_ID INT AUTO_INCREMENT PRIMARY KEY,
    Station_Name VARCHAR(150) NOT NULL,
    Location_Country VARCHAR(100) NOT NULL,
    Latitude DECIMAL(8, 4) NOT NULL CHECK (Latitude BETWEEN -90.0000 AND 90.0000),
    Longitude DECIMAL(8, 4) NOT NULL CHECK (Longitude BETWEEN -180.0000 AND 180.0000),
    Sensor_Type VARCHAR(100) NOT NULL,
    source_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2.2 SATELLITE Table
-- Operational and defunct payload objects tracked by NORAD / International Agencies
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS SATELLITE (
    Satellite_ID INT AUTO_INCREMENT PRIMARY KEY,
    NORAD_ID INT NOT NULL UNIQUE,
    intl_designator VARCHAR(50) NOT NULL UNIQUE,
    Satellite_Name VARCHAR(150) NOT NULL,
    Owner_Agency VARCHAR(100) NOT NULL,
    Launch_Date DATE NULL,
    Operational_Status ENUM('Active', 'Inactive', 'Deorbiting', 'Destroyed') NOT NULL DEFAULT 'Active',
    Orbital_Altitude_KM DOUBLE NOT NULL CHECK (Orbital_Altitude_KM > 0),
    Inclination_Deg DOUBLE NOT NULL CHECK (Inclination_Deg BETWEEN 0.0 AND 180.0),
    Apogee_KM DOUBLE NOT NULL CHECK (Apogee_KM >= 0),
    Perigee_KM DOUBLE NOT NULL CHECK (Perigee_KM >= 0),
    Eccentricity DOUBLE NOT NULL DEFAULT 0.001 CHECK (Eccentricity >= 0.0),
    Mean_Motion DOUBLE NOT NULL DEFAULT 14.0 CHECK (Mean_Motion > 0.0),
    RAAN DOUBLE NOT NULL DEFAULT 0.0 CHECK (RAAN BETWEEN 0.0 AND 360.0),
    Arg_Pericenter DOUBLE NOT NULL DEFAULT 0.0 CHECK (Arg_Pericenter BETWEEN 0.0 AND 360.0),
    Mean_Anomaly DOUBLE NOT NULL DEFAULT 0.0 CHECK (Mean_Anomaly BETWEEN 0.0 AND 360.0),
    BSTAR DOUBLE NOT NULL DEFAULT 0.0,
    Epoch DATETIME NOT NULL,
    orbit_class ENUM('LEO', 'MEO', 'GEO', 'HEO') NOT NULL DEFAULT 'LEO',
    source VARCHAR(50) DEFAULT 'CelesTrak',
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2.3 DEBRIS Table
-- Fragments, rocket bodies, mission-related debris in Earth orbit
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS DEBRIS (
    Debris_ID INT AUTO_INCREMENT PRIMARY KEY,
    NORAD_ID INT NOT NULL UNIQUE,
    Object_Name VARCHAR(150) NOT NULL,
    Size_Meters DECIMAL(8, 4) NULL,
    rcs_size_class ENUM('SMALL', 'MEDIUM', 'LARGE', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    Mass_KG DOUBLE NULL,
    Velocity_KMS DOUBLE NOT NULL CHECK (Velocity_KMS > 0),
    Apogee_KM DOUBLE NOT NULL CHECK (Apogee_KM >= 0),
    Perigee_KM DOUBLE NOT NULL CHECK (Perigee_KM >= 0),
    Inclination_Deg DOUBLE NOT NULL CHECK (Inclination_Deg BETWEEN 0.0 AND 180.0),
    orbit_class ENUM('LEO', 'MEO', 'GEO', 'HEO') NOT NULL DEFAULT 'LEO',
    Station_ID INT NULL,
    parent_satellite_id INT NULL,
    is_estimated TINYINT(1) NOT NULL DEFAULT 1,
    Eccentricity DOUBLE NOT NULL DEFAULT 0.001 CHECK (Eccentricity >= 0.0),
    Mean_Motion DOUBLE NOT NULL DEFAULT 14.0 CHECK (Mean_Motion > 0.0),
    RAAN DOUBLE NOT NULL DEFAULT 0.0 CHECK (RAAN BETWEEN 0.0 AND 360.0),
    Arg_Pericenter DOUBLE NOT NULL DEFAULT 0.0 CHECK (Arg_Pericenter BETWEEN 0.0 AND 360.0),
    Mean_Anomaly DOUBLE NOT NULL DEFAULT 0.0 CHECK (Mean_Anomaly BETWEEN 0.0 AND 360.0),
    BSTAR DOUBLE NOT NULL DEFAULT 0.0,
    Epoch DATETIME NOT NULL,
    source VARCHAR(50) DEFAULT 'CelesTrak',
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_debris_station FOREIGN KEY (Station_ID) REFERENCES TRACKING_STATION(Station_ID) ON DELETE SET NULL,
    CONSTRAINT fk_debris_parent_sat FOREIGN KEY (parent_satellite_id) REFERENCES SATELLITE(Satellite_ID) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2.4 COLLISION_EVENT Table
-- Conjunction assessments, predicted close encounters and miss distances
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS COLLISION_EVENT (
    Event_ID INT AUTO_INCREMENT PRIMARY KEY,
    Satellite_ID INT NOT NULL,
    Debris_ID INT NOT NULL,
    Event_Timestamp DATETIME NOT NULL,
    Miss_Distance_KM DOUBLE NOT NULL CHECK (Miss_Distance_KM >= 0),
    Relative_Velocity DOUBLE NOT NULL CHECK (Relative_Velocity > 0),
    Collision_Risk_Prob DOUBLE NOT NULL CHECK (Collision_Risk_Prob BETWEEN 0.0 AND 1.0),
    risk_level ENUM('CRITICAL', 'WARNING', 'MONITOR', 'NOMINAL') NOT NULL DEFAULT 'MONITOR',
    source ENUM('SOCRATES', 'computed', 'manual') NOT NULL DEFAULT 'SOCRATES',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_collision_sat FOREIGN KEY (Satellite_ID) REFERENCES SATELLITE(Satellite_ID) ON DELETE CASCADE,
    CONSTRAINT fk_collision_deb FOREIGN KEY (Debris_ID) REFERENCES DEBRIS(Debris_ID) ON DELETE CASCADE,
    CONSTRAINT uq_collision_encounter UNIQUE (Satellite_ID, Debris_ID, Event_Timestamp)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2.5 OBSERVATION Table (Range-Partitioned by Year)
-- Bridge entity fixing the Station-Monitors-Object M:N relationship
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS OBSERVATION (
    Observation_ID BIGINT NOT NULL AUTO_INCREMENT,
    Station_ID INT NOT NULL,
    Satellite_ID INT NULL,
    Debris_ID INT NULL,
    observed_at DATETIME NOT NULL,
    azimuth_deg DOUBLE NULL,
    elevation_deg DOUBLE NULL,
    range_km DOUBLE NULL,
    doppler_kms DOUBLE NULL,
    quality_flag VARCHAR(20) DEFAULT 'GOOD',
    PRIMARY KEY (Observation_ID, observed_at),
    CONSTRAINT chk_obs_object CHECK (
        (Satellite_ID IS NOT NULL AND Debris_ID IS NULL) OR
        (Satellite_ID IS NULL AND Debris_ID IS NOT NULL)
    ),
    INDEX idx_obs_station (Station_ID)
) ENGINE=InnoDB
PARTITION BY RANGE (YEAR(observed_at)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION p2027 VALUES LESS THAN (2028),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- ----------------------------------------------------------------------------
-- 2.6 ORBIT_STATE_HISTORY Table (Range-Partitioned by Year)
-- Historical trajectory versioning - archives previous orbital elements
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ORBIT_STATE_HISTORY (
    History_ID BIGINT NOT NULL AUTO_INCREMENT,
    object_type ENUM('SATELLITE', 'DEBRIS') NOT NULL,
    object_id INT NOT NULL,
    epoch DATETIME NOT NULL,
    inclination_deg DOUBLE NULL,
    eccentricity DOUBLE NULL,
    mean_motion DOUBLE NULL,
    apogee_km DOUBLE NULL,
    perigee_km DOUBLE NULL,
    bstar DOUBLE NULL,
    recorded_at DATETIME NOT NULL,
    PRIMARY KEY (History_ID, recorded_at)
) ENGINE=InnoDB
PARTITION BY RANGE (YEAR(recorded_at)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION p2027 VALUES LESS THAN (2028),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- ----------------------------------------------------------------------------
-- 2.7 DEBRIS_LINEAGE Table
-- Parent-child fragment tree from real historical breakup events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS DEBRIS_LINEAGE (
    Lineage_ID INT AUTO_INCREMENT PRIMARY KEY,
    fragment_debris_id INT NOT NULL,
    parent_catalog_id INT NOT NULL,
    parent_name VARCHAR(150) NOT NULL,
    breakup_event_name VARCHAR(150) NOT NULL,
    breakup_date DATE NOT NULL,
    event_type ENUM('ASAT_TEST', 'COLLISION', 'ACCIDENTAL_EXPLOSION', 'ANOMALY') NOT NULL DEFAULT 'COLLISION',
    CONSTRAINT fk_lineage_fragment FOREIGN KEY (fragment_debris_id) REFERENCES DEBRIS(Debris_ID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2.8 User Management, RBAC & Security Tables
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ROLE (
    Role_ID INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    permissions_json TEXT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS APP_USER (
    User_ID INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_name ENUM('Administrator', 'Space Agency', 'Satellite Operator', 'Research Scientist') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    organization VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS AUDIT_LOG (
    Log_ID BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action_type VARCHAR(50) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_id INT NULL,
    query_text TEXT NULL,
    ip_address VARCHAR(50) NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES APP_USER(User_ID) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ALERT (
    Alert_ID INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NULL,
    alert_level ENUM('CRITICAL', 'WARNING', 'INFO') NOT NULL,
    message VARCHAR(255) NOT NULL,
    status ENUM('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alert_event FOREIGN KEY (event_id) REFERENCES COLLISION_EVENT(Event_ID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2.9 External Feeds: Space Weather & Near-Earth Objects
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS SPACE_WEATHER (
    Weather_ID INT AUTO_INCREMENT PRIMARY KEY,
    recorded_at DATETIME NOT NULL,
    kp_index DOUBLE NOT NULL,
    f10_7_flux DOUBLE NULL,
    solar_wind_speed DOUBLE NULL,
    xray_flux DOUBLE NULL,
    geomagnetic_storm_level VARCHAR(20) NOT NULL DEFAULT 'Nominal',
    source VARCHAR(50) DEFAULT 'NOAA SWPC',
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS NEAR_EARTH_OBJECT (
    Neo_ID INT AUTO_INCREMENT PRIMARY KEY,
    neo_reference_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    estimated_diameter_min_m DOUBLE NOT NULL,
    estimated_diameter_max_m DOUBLE NOT NULL,
    is_potentially_hazardous BOOLEAN NOT NULL DEFAULT FALSE,
    close_approach_date DATETIME NOT NULL,
    miss_distance_km DOUBLE NOT NULL,
    miss_distance_lunar DOUBLE NOT NULL,
    relative_velocity_kms DOUBLE NOT NULL,
    orbiting_body VARCHAR(50) NOT NULL DEFAULT 'Earth',
    source VARCHAR(50) DEFAULT 'NASA NeoWs',
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2.10 Automated Testing & Data Sync Log Tables
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS TEST_CASE (
    Test_ID VARCHAR(20) PRIMARY KEY,
    Category VARCHAR(50) NOT NULL,
    Description VARCHAR(255) NOT NULL,
    Input_Data TEXT NOT NULL,
    Expected_Result TEXT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS TEST_RUN (
    Run_ID INT AUTO_INCREMENT PRIMARY KEY,
    Test_ID VARCHAR(20) NOT NULL,
    Executed_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Actual_Result TEXT NOT NULL,
    Pass_Fail ENUM('PASS', 'FAIL') NOT NULL,
    Execution_Time_MS DOUBLE NOT NULL,
    Notes TEXT NULL,
    CONSTRAINT fk_test_case FOREIGN KEY (Test_ID) REFERENCES TEST_CASE(Test_ID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS DATA_SYNC_LOG (
    Sync_ID INT AUTO_INCREMENT PRIMARY KEY,
    source_name VARCHAR(50) NOT NULL,
    status ENUM('SUCCESS', 'PARTIAL', 'FAILED') NOT NULL,
    records_ingested INT NOT NULL DEFAULT 0,
    message TEXT NULL,
    started_at DATETIME NOT NULL,
    completed_at DATETIME NOT NULL
) ENGINE=InnoDB;


-- ============================================================================
-- SECTION 3: B-TREE & COMPOSITE PERFORMANCE INDEXES (IDEMPOTENT CREATION)
-- ============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS Create_Index_If_Not_Exists$$
CREATE PROCEDURE Create_Index_If_Not_Exists(
    IN p_table VARCHAR(64),
    IN p_index VARCHAR(64),
    IN p_columns VARCHAR(255)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO v_exists
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table
      AND INDEX_NAME = p_index;

    IF v_exists = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', p_index, ' ON ', p_table, ' (', p_columns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

CALL Create_Index_If_Not_Exists('SATELLITE', 'idx_satellite_orbit_perigee', 'orbit_class, Perigee_KM');
CALL Create_Index_If_Not_Exists('SATELLITE', 'idx_satellite_owner', 'Owner_Agency');
CALL Create_Index_If_Not_Exists('SATELLITE', 'idx_satellite_name', 'Satellite_Name');

CALL Create_Index_If_Not_Exists('DEBRIS', 'idx_debris_orbit_perigee', 'orbit_class, Perigee_KM');
CALL Create_Index_If_Not_Exists('DEBRIS', 'idx_debris_velocity', 'Velocity_KMS');
CALL Create_Index_If_Not_Exists('DEBRIS', 'idx_debris_size_class', 'rcs_size_class');
CALL Create_Index_If_Not_Exists('DEBRIS', 'idx_debris_name', 'Object_Name');

CALL Create_Index_If_Not_Exists('COLLISION_EVENT', 'idx_collision_sat_risk', 'Satellite_ID, Collision_Risk_Prob');
CALL Create_Index_If_Not_Exists('COLLISION_EVENT', 'idx_collision_debris_risk', 'Debris_ID, Collision_Risk_Prob');
CALL Create_Index_If_Not_Exists('COLLISION_EVENT', 'idx_collision_event_time', 'Event_Timestamp');
CALL Create_Index_If_Not_Exists('COLLISION_EVENT', 'idx_collision_risk_level', 'risk_level');
CALL Create_Index_If_Not_Exists('COLLISION_EVENT', 'idx_collision_miss_dist', 'Miss_Distance_KM');

CALL Create_Index_If_Not_Exists('OBSERVATION', 'idx_obs_station_time', 'Station_ID, observed_at');
CALL Create_Index_If_Not_Exists('OBSERVATION', 'idx_obs_satellite_time', 'Satellite_ID, observed_at');
CALL Create_Index_If_Not_Exists('OBSERVATION', 'idx_obs_debris_time', 'Debris_ID, observed_at');

CALL Create_Index_If_Not_Exists('ORBIT_STATE_HISTORY', 'idx_orbit_history_lookup', 'object_type, object_id, epoch');
CALL Create_Index_If_Not_Exists('DEBRIS_LINEAGE', 'idx_lineage_parent', 'parent_catalog_id');
CALL Create_Index_If_Not_Exists('DEBRIS_LINEAGE', 'idx_lineage_fragment', 'fragment_debris_id');

CALL Create_Index_If_Not_Exists('AUDIT_LOG', 'idx_audit_user_time', 'user_id, timestamp');
CALL Create_Index_If_Not_Exists('AUDIT_LOG', 'idx_audit_action', 'action_type');
CALL Create_Index_If_Not_Exists('SPACE_WEATHER', 'idx_weather_time', 'recorded_at');
CALL Create_Index_If_Not_Exists('NEAR_EARTH_OBJECT', 'idx_neo_date', 'close_approach_date');

DROP PROCEDURE IF EXISTS Create_Index_If_Not_Exists;


-- ============================================================================
-- SECTION 4: RELATIONAL & ROLE-RESTRICTED VIEWS (5 VIEWS)
-- ============================================================================

-- View 1: v_high_risk_events
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

-- View 2: v_debris_catalog
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

-- View 3: v_satellite_exposure
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

-- View 4: v_station_workload
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

-- View 5: v_public_researcher_catalog
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


-- ============================================================================
-- SECTION 5: DETERMINISTIC SCALAR FUNCTIONS (4 FUNCTIONS)
-- ============================================================================

DELIMITER $$

-- Function 1: Classify_Orbit
DROP FUNCTION IF EXISTS Classify_Orbit$$
CREATE FUNCTION Classify_Orbit(p_apogee DOUBLE, p_perigee DOUBLE)
RETURNS VARCHAR(10)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_class VARCHAR(10);
    
    IF p_apogee IS NULL OR p_perigee IS NULL THEN
        RETURN 'UNKNOWN';
    END IF;

    IF p_perigee >= 35000 AND p_apogee <= 36500 AND ABS(p_apogee - p_perigee) < 1000 THEN
        SET v_class = 'GEO';
    ELSEIF p_apogee >= 36000 OR (p_apogee - p_perigee >= 10000 AND p_apogee > 5000) THEN
        SET v_class = 'HEO';
    ELSEIF p_apogee < 2000 AND p_perigee < 2000 THEN
        SET v_class = 'LEO';
    ELSEIF p_perigee >= 2000 AND p_apogee < 36000 THEN
        SET v_class = 'MEO';
    ELSE
        SET v_class = 'LEO';
    END IF;

    RETURN v_class;
END$$

-- Function 2: Risk_Level
DROP FUNCTION IF EXISTS Risk_Level$$
CREATE FUNCTION Risk_Level(p_prob DOUBLE, p_miss_distance DOUBLE)
RETURNS VARCHAR(20)
DETERMINISTIC
NO SQL
BEGIN
    IF p_prob IS NULL OR p_miss_distance IS NULL THEN
        RETURN 'NOMINAL';
    END IF;

    IF p_miss_distance <= 1.0 OR p_prob >= 0.0001 THEN
        RETURN 'CRITICAL';
    ELSEIF p_miss_distance <= 5.0 OR p_prob >= 0.00001 THEN
        RETURN 'WARNING';
    ELSEIF p_miss_distance <= 25.0 THEN
        RETURN 'MONITOR';
    ELSE
        RETURN 'NOMINAL';
    END IF;
END$$

-- Function 3: Calculate_Kinetic_Energy (Returns MegaJoules)
DROP FUNCTION IF EXISTS Calculate_Kinetic_Energy$$
CREATE FUNCTION Calculate_Kinetic_Energy(p_mass_kg DOUBLE, p_velocity_kms DOUBLE)
RETURNS DOUBLE
DETERMINISTIC
NO SQL
BEGIN
    DECLARE v_v_ms DOUBLE;
    DECLARE v_joules DOUBLE;
    
    IF p_mass_kg IS NULL OR p_velocity_kms IS NULL OR p_mass_kg <= 0 OR p_velocity_kms <= 0 THEN
        RETURN 0.0;
    END IF;

    SET v_v_ms = p_velocity_kms * 1000.0;
    SET v_joules = 0.5 * p_mass_kg * (v_v_ms * v_v_ms);
    
    RETURN ROUND(v_joules / 1000000.0, 3);
END$$

-- Function 4: Calculate_Semi_Major_Axis (Kepler's 3rd Law)
DROP FUNCTION IF EXISTS Calculate_Semi_Major_Axis$$
CREATE FUNCTION Calculate_Semi_Major_Axis(p_mean_motion DOUBLE)
RETURNS DOUBLE
DETERMINISTIC
NO SQL
BEGIN
    DECLARE v_mu DOUBLE DEFAULT 398600.4418;
    DECLARE v_n_rad_s DOUBLE;
    DECLARE v_a DOUBLE;

    IF p_mean_motion IS NULL OR p_mean_motion <= 0 THEN
        RETURN 0.0;
    END IF;

    SET v_n_rad_s = (p_mean_motion * 2.0 * PI()) / 86400.0;
    SET v_a = POW(v_mu / (v_n_rad_s * v_n_rad_s), 1.0 / 3.0);

    RETURN ROUND(v_a, 3);
END$$


-- ============================================================================
-- SECTION 6: STORED PROCEDURES (RECURSIVE CTE, TRANSACTIONS, EXPLICIT CURSOR)
-- ============================================================================

-- Procedure 1: Get_Top10_Risky_Debris
DROP PROCEDURE IF EXISTS Get_Top10_Risky_Debris$$
CREATE PROCEDURE Get_Top10_Risky_Debris()
BEGIN
    SELECT 
        d.Debris_ID,
        d.NORAD_ID,
        d.Object_Name,
        d.rcs_size_class,
        d.Velocity_KMS,
        d.orbit_class,
        COUNT(c.Event_ID) AS Total_Conjunction_Encounters,
        MAX(c.Collision_Risk_Prob) AS Max_Collision_Risk,
        MIN(c.Miss_Distance_KM) AS Closest_Miss_Distance_KM,
        MIN(c.Event_Timestamp) AS Earliest_TCA,
        GROUP_CONCAT(DISTINCT s.Satellite_Name ORDER BY s.Satellite_Name SEPARATOR ', ') AS Threatening_Targets
    FROM DEBRIS d
    JOIN COLLISION_EVENT c ON d.Debris_ID = c.Debris_ID
    JOIN SATELLITE s ON c.Satellite_ID = s.Satellite_ID
    GROUP BY d.Debris_ID, d.NORAD_ID, d.Object_Name, d.rcs_size_class, d.Velocity_KMS, d.orbit_class
    ORDER BY Max_Collision_Risk DESC, Closest_Miss_Distance_KM ASC
    LIMIT 10;
END$$

-- Procedure 2: Fetch_Object_Lineage (Uses Recursive Common Table Expression)
DROP PROCEDURE IF EXISTS Fetch_Object_Lineage$$
CREATE PROCEDURE Fetch_Object_Lineage(IN p_catalog_id INT)
BEGIN
    WITH RECURSIVE DebrisTree AS (
        SELECT 
            l.Lineage_ID,
            l.fragment_debris_id,
            d.NORAD_ID AS fragment_norad_id,
            d.Object_Name AS Fragment_Name,
            l.parent_catalog_id,
            l.parent_name,
            l.breakup_event_name,
            l.breakup_date,
            l.event_type,
            1 AS Generation_Level
        FROM DEBRIS_LINEAGE l
        JOIN DEBRIS d ON l.fragment_debris_id = d.Debris_ID
        WHERE l.parent_catalog_id = p_catalog_id OR d.NORAD_ID = p_catalog_id

        UNION ALL

        SELECT 
            sub_l.Lineage_ID,
            sub_l.fragment_debris_id,
            sub_d.NORAD_ID AS fragment_norad_id,
            sub_d.Object_Name AS Fragment_Name,
            sub_l.parent_catalog_id,
            sub_l.parent_name,
            sub_l.breakup_event_name,
            sub_l.breakup_date,
            sub_l.event_type,
            dt.Generation_Level + 1
        FROM DEBRIS_LINEAGE sub_l
        JOIN DEBRIS sub_d ON sub_l.fragment_debris_id = sub_d.Debris_ID
        JOIN DebrisTree dt ON sub_l.parent_catalog_id = dt.fragment_norad_id
        WHERE dt.Generation_Level < 3
    )
    SELECT 
        Lineage_ID,
        fragment_debris_id,
        fragment_norad_id,
        Fragment_Name,
        parent_catalog_id,
        parent_name,
        breakup_event_name,
        breakup_date,
        event_type,
        Generation_Level
    FROM DebrisTree
    ORDER BY Generation_Level ASC, breakup_date DESC
    LIMIT 100;
END$$

-- Procedure 3: Register_Satellite (Transactional Insert with Audit Trail)
DROP PROCEDURE IF EXISTS Register_Satellite$$
CREATE PROCEDURE Register_Satellite(
    IN p_norad_id INT,
    IN p_intl_desig VARCHAR(50),
    IN p_name VARCHAR(150),
    IN p_agency VARCHAR(100),
    IN p_launch_date DATE,
    IN p_altitude_km DOUBLE,
    IN p_inclination DOUBLE,
    IN p_apogee_km DOUBLE,
    IN p_perigee_km DOUBLE,
    IN p_user_id INT,
    OUT p_satellite_id INT,
    OUT p_status_message VARCHAR(255)
)
proc_body: BEGIN
    DECLARE v_orbit_class VARCHAR(10);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status_message = 'ERROR: Database transaction failed during satellite registration.';
        SET p_satellite_id = -1;
    END;

    IF p_norad_id <= 0 OR p_altitude_km <= 0 OR p_inclination < 0 OR p_inclination > 180 THEN
        SET p_status_message = 'VALIDATION FAILED: Invalid orbital parameters or NORAD ID.';
        SET p_satellite_id = -1;
        LEAVE proc_body;
    END IF;

    SET v_orbit_class = Classify_Orbit(p_apogee_km, p_perigee_km);

    START TRANSACTION;

    INSERT INTO SATELLITE (
        NORAD_ID, intl_designator, Satellite_Name, Owner_Agency,
        Launch_Date, Operational_Status, Orbital_Altitude_KM,
        Inclination_Deg, Apogee_KM, Perigee_KM, Eccentricity,
        Mean_Motion, RAAN, Arg_Pericenter, Mean_Anomaly, BSTAR,
        Epoch, orbit_class, source
    ) VALUES (
        p_norad_id, p_intl_desig, p_name, p_agency,
        p_launch_date, 'Active', p_altitude_km,
        p_inclination, p_apogee_km, p_perigee_km, 0.001,
        14.2, 0.0, 0.0, 0.0, 0.0,
        NOW(), v_orbit_class, 'Manual Registration'
    );

    SET p_satellite_id = LAST_INSERT_ID();

    INSERT INTO AUDIT_LOG (user_id, action_type, entity_name, entity_id, query_text)
    VALUES (p_user_id, 'INSERT', 'SATELLITE', p_satellite_id, 
            CONCAT('Registered satellite ', p_name, ' (NORAD: ', p_norad_id, ')'));

    COMMIT;
    SET p_status_message = 'SUCCESS: Satellite registered and audited.';
END$$

-- Procedure 4: Record_Collision_Event
DROP PROCEDURE IF EXISTS Record_Collision_Event$$
CREATE PROCEDURE Record_Collision_Event(
    IN p_satellite_id INT,
    IN p_debris_id INT,
    IN p_tca DATETIME,
    IN p_miss_dist_km DOUBLE,
    IN p_rel_vel_kms DOUBLE,
    IN p_prob DOUBLE,
    IN p_source VARCHAR(20),
    OUT p_event_id INT,
    OUT p_risk_level VARCHAR(20)
)
BEGIN
    DECLARE v_risk VARCHAR(20);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_event_id = -1;
        SET p_risk_level = 'ERROR';
    END;

    SET v_risk = Risk_Level(p_prob, p_miss_dist_km);

    START TRANSACTION;

    INSERT INTO COLLISION_EVENT (
        Satellite_ID, Debris_ID, Event_Timestamp,
        Miss_Distance_KM, Relative_Velocity,
        Collision_Risk_Prob, risk_level, source
    ) VALUES (
        p_satellite_id, p_debris_id, p_tca,
        p_miss_dist_km, p_rel_vel_kms,
        p_prob, v_risk, p_source
    );

    SET p_event_id = LAST_INSERT_ID();
    SET p_risk_level = v_risk;

    COMMIT;
END$$

-- Procedure 5: Escalate_High_Risk_Events (Uses Explicit MySQL CURSOR)
DROP PROCEDURE IF EXISTS Escalate_High_Risk_Events$$
CREATE PROCEDURE Escalate_High_Risk_Events()
BEGIN
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_event_id INT;
    DECLARE v_sat_name VARCHAR(150);
    DECLARE v_deb_name VARCHAR(150);
    DECLARE v_tca DATETIME;
    DECLARE v_miss_dist DOUBLE;
    DECLARE v_prob DOUBLE;
    DECLARE v_escalated_count INT DEFAULT 0;

    DECLARE cur_high_risk CURSOR FOR
        SELECT 
            c.Event_ID, s.Satellite_Name, d.Object_Name,
            c.Event_Timestamp, c.Miss_Distance_KM, c.Collision_Risk_Prob
        FROM COLLISION_EVENT c
        JOIN SATELLITE s ON c.Satellite_ID = s.Satellite_ID
        JOIN DEBRIS d ON c.Debris_ID = d.Debris_ID
        WHERE (c.Collision_Risk_Prob >= 0.0001 OR c.Miss_Distance_KM <= 1.0)
          AND c.Event_Timestamp BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 48 HOUR)
          AND NOT EXISTS (
              SELECT 1 FROM ALERT a 
              WHERE a.event_id = c.Event_ID AND a.alert_level = 'CRITICAL'
          );

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    OPEN cur_high_risk;

    read_loop: LOOP
        FETCH cur_high_risk INTO v_event_id, v_sat_name, v_deb_name, v_tca, v_miss_dist, v_prob;
        IF v_done THEN
            LEAVE read_loop;
        END IF;

        INSERT INTO ALERT (event_id, alert_level, message, status)
        VALUES (
            v_event_id, 
            'CRITICAL',
            CONCAT('EMERGENCY ESCALATION: Predicted encounter between ', v_sat_name, ' and ', v_deb_name, 
                   ' at ', v_tca, ' (Miss: ', ROUND(v_miss_dist, 3), ' km, Prob: ', FORMAT(v_prob, 6), ')'),
            'ACTIVE'
        );

        INSERT INTO AUDIT_LOG (user_id, action_type, entity_name, entity_id, query_text)
        VALUES (
            NULL, 
            'CURSOR_ESCALATION', 
            'ALERT', 
            v_event_id, 
            CONCAT('Escalated critical conjunction Event #', v_event_id)
        );

        SET v_escalated_count = v_escalated_count + 1;
    END LOOP;

    CLOSE cur_high_risk;

    SELECT v_escalated_count AS Total_Events_Escalated;
END$$


-- ============================================================================
-- SECTION 7: DATABASE TRIGGERS (VALIDATION, ALERTING, TRAJECTORY ARCHIVING)
-- ============================================================================

-- Trigger 1: trg_validate_satellite_before_insert
DROP TRIGGER IF EXISTS trg_validate_satellite_before_insert$$
CREATE TRIGGER trg_validate_satellite_before_insert
BEFORE INSERT ON SATELLITE
FOR EACH ROW
BEGIN
    IF NEW.Orbital_Altitude_KM <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'VALIDATION REJECTED: Satellite orbital altitude must be strictly greater than 0 km.';
    END IF;

    IF NEW.Inclination_Deg < 0.0 OR NEW.Inclination_Deg > 180.0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'VALIDATION REJECTED: Inclination must be between 0.0 and 180.0 degrees.';
    END IF;

    IF NEW.Perigee_KM > NEW.Apogee_KM THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'VALIDATION REJECTED: Perigee altitude cannot exceed Apogee altitude.';
    END IF;
    
    SET NEW.orbit_class = Classify_Orbit(NEW.Apogee_KM, NEW.Perigee_KM);
END$$

-- Trigger 2: trg_validate_debris_before_insert
DROP TRIGGER IF EXISTS trg_validate_debris_before_insert$$
CREATE TRIGGER trg_validate_debris_before_insert
BEFORE INSERT ON DEBRIS
FOR EACH ROW
BEGIN
    IF NEW.Velocity_KMS <= 0.0 OR NEW.Velocity_KMS > 15.0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'VALIDATION REJECTED: Debris orbital velocity must be realistic (0 < v <= 15 km/s).';
    END IF;

    IF NEW.Perigee_KM > NEW.Apogee_KM THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'VALIDATION REJECTED: Debris Perigee cannot exceed Apogee.';
    END IF;

    SET NEW.orbit_class = Classify_Orbit(NEW.Apogee_KM, NEW.Perigee_KM);
END$$

-- Trigger 3: trg_collision_event_after_insert
DROP TRIGGER IF EXISTS trg_collision_event_after_insert$$
CREATE TRIGGER trg_collision_event_after_insert
AFTER INSERT ON COLLISION_EVENT
FOR EACH ROW
BEGIN
    DECLARE v_sat_name VARCHAR(150);
    DECLARE v_deb_name VARCHAR(150);

    IF NEW.risk_level IN ('CRITICAL', 'WARNING') OR NEW.Collision_Risk_Prob >= 0.0001 OR NEW.Miss_Distance_KM <= 1.0 THEN
        SELECT Satellite_Name INTO v_sat_name FROM SATELLITE WHERE Satellite_ID = NEW.Satellite_ID;
        SELECT Object_Name INTO v_deb_name FROM DEBRIS WHERE Debris_ID = NEW.Debris_ID;

        INSERT INTO ALERT (event_id, alert_level, message, status)
        VALUES (
            NEW.Event_ID,
            CASE WHEN NEW.risk_level = 'CRITICAL' THEN 'CRITICAL' ELSE 'WARNING' END,
            CONCAT('COLLISION HAZARD: ', COALESCE(v_sat_name, 'Sat'), ' vs ', COALESCE(v_deb_name, 'Debris'), 
                   ' | Miss: ', ROUND(NEW.Miss_Distance_KM, 3), 'km | Prob: ', FORMAT(NEW.Collision_Risk_Prob, 6)),
            'ACTIVE'
        );

        INSERT INTO AUDIT_LOG (user_id, action_type, entity_name, entity_id, query_text)
        VALUES (
            NULL,
            'TRIGGER_ALERT',
            'COLLISION_EVENT',
            NEW.Event_ID,
            CONCAT('Automatic threshold alert triggered for Event #', NEW.Event_ID)
        );
    END IF;
END$$

-- Trigger 4: trg_satellite_orbit_history_before_update
DROP TRIGGER IF EXISTS trg_satellite_orbit_history_before_update$$
CREATE TRIGGER trg_satellite_orbit_history_before_update
BEFORE UPDATE ON SATELLITE
FOR EACH ROW
BEGIN
    IF (OLD.Inclination_Deg <> NEW.Inclination_Deg OR
        OLD.Apogee_KM <> NEW.Apogee_KM OR
        OLD.Perigee_KM <> NEW.Perigee_KM OR
        OLD.Mean_Motion <> NEW.Mean_Motion OR
        OLD.Epoch <> NEW.Epoch) THEN
        
        INSERT INTO ORBIT_STATE_HISTORY (
            object_type, object_id, epoch, inclination_deg,
            eccentricity, mean_motion, apogee_km, perigee_km,
            bstar, recorded_at
        ) VALUES (
            'SATELLITE',
            OLD.Satellite_ID,
            OLD.Epoch,
            OLD.Inclination_Deg,
            OLD.Eccentricity,
            OLD.Mean_Motion,
            OLD.Apogee_KM,
            OLD.Perigee_KM,
            OLD.BSTAR,
            NOW()
        );
    END IF;
END$$

-- Trigger 5: trg_debris_orbit_history_before_update
DROP TRIGGER IF EXISTS trg_debris_orbit_history_before_update$$
CREATE TRIGGER trg_debris_orbit_history_before_update
BEFORE UPDATE ON DEBRIS
FOR EACH ROW
BEGIN
    IF (OLD.Inclination_Deg <> NEW.Inclination_Deg OR
        OLD.Apogee_KM <> NEW.Apogee_KM OR
        OLD.Perigee_KM <> NEW.Perigee_KM OR
        OLD.Epoch <> NEW.Epoch) THEN
        
        INSERT INTO ORBIT_STATE_HISTORY (
            object_type, object_id, epoch, inclination_deg,
            eccentricity, mean_motion, apogee_km, perigee_km,
            bstar, recorded_at
        ) VALUES (
            'DEBRIS',
            OLD.Debris_ID,
            OLD.Epoch,
            OLD.Inclination_Deg,
            OLD.Eccentricity,
            OLD.Mean_Motion,
            OLD.Apogee_KM,
            OLD.Perigee_KM,
            OLD.BSTAR,
            NOW()
        );
    END IF;
END$$

DELIMITER ;


-- ============================================================================
-- SECTION 8: NATIVE MYSQL ROLES & PRIVILEGE GRANTS (RBAC)
-- ============================================================================

CREATE ROLE IF NOT EXISTS 'role_admin', 'role_agency', 'role_operator', 'role_researcher';

GRANT ALL PRIVILEGES ON orbitwatch_db.* TO 'role_admin' WITH GRANT OPTION;

GRANT SELECT, INSERT, UPDATE, DELETE ON orbitwatch_db.SATELLITE TO 'role_agency';
GRANT SELECT, INSERT, UPDATE ON orbitwatch_db.TRACKING_STATION TO 'role_agency';
GRANT SELECT, INSERT ON orbitwatch_db.OBSERVATION TO 'role_agency';
GRANT SELECT ON orbitwatch_db.DEBRIS TO 'role_agency';
GRANT SELECT ON orbitwatch_db.COLLISION_EVENT TO 'role_agency';
GRANT SELECT ON orbitwatch_db.ALERT TO 'role_agency';
GRANT SELECT ON orbitwatch_db.v_high_risk_events TO 'role_agency';
GRANT SELECT ON orbitwatch_db.v_debris_catalog TO 'role_agency';
GRANT SELECT ON orbitwatch_db.v_satellite_exposure TO 'role_agency';
GRANT SELECT ON orbitwatch_db.v_station_workload TO 'role_agency';
GRANT EXECUTE ON PROCEDURE orbitwatch_db.Register_Satellite TO 'role_agency';
GRANT EXECUTE ON PROCEDURE orbitwatch_db.Get_Top10_Risky_Debris TO 'role_agency';

GRANT SELECT, UPDATE (Operational_Status, Orbital_Altitude_KM, Apogee_KM, Perigee_KM) 
    ON orbitwatch_db.SATELLITE TO 'role_operator';
GRANT SELECT ON orbitwatch_db.DEBRIS TO 'role_operator';
GRANT SELECT, INSERT, UPDATE ON orbitwatch_db.COLLISION_EVENT TO 'role_operator';
GRANT SELECT, UPDATE (status) ON orbitwatch_db.ALERT TO 'role_operator';
GRANT SELECT ON orbitwatch_db.v_high_risk_events TO 'role_operator';
GRANT SELECT ON orbitwatch_db.v_satellite_exposure TO 'role_operator';
GRANT EXECUTE ON PROCEDURE orbitwatch_db.Get_Top10_Risky_Debris TO 'role_operator';
GRANT EXECUTE ON PROCEDURE orbitwatch_db.Escalate_High_Risk_Events TO 'role_operator';

GRANT SELECT ON orbitwatch_db.v_public_researcher_catalog TO 'role_researcher';
GRANT SELECT ON orbitwatch_db.v_debris_catalog TO 'role_researcher';
GRANT SELECT ON orbitwatch_db.v_station_workload TO 'role_researcher';
GRANT SELECT ON orbitwatch_db.SPACE_WEATHER TO 'role_researcher';
GRANT SELECT ON orbitwatch_db.NEAR_EARTH_OBJECT TO 'role_researcher';
GRANT SELECT ON orbitwatch_db.DEBRIS_LINEAGE TO 'role_researcher';
GRANT EXECUTE ON PROCEDURE orbitwatch_db.Fetch_Object_Lineage TO 'role_researcher';


-- ============================================================================
-- SECTION 9: REAL SEEDED TELEMETRY DATA (STATIONS, ROLES, SATELLITES, DEBRIS)
-- ============================================================================

-- 9.1 Roles
INSERT IGNORE INTO ROLE (role_name, description, permissions_json) VALUES
('Administrator', 'Full administrative access across all tables, users, procedures, and schema controls', '["*"]'),
('Space Agency', 'Manages satellite and ground station registries, views full conjunction assessments', '["satellites:write","stations:write","conjunctions:read","observations:write"]'),
('Satellite Operator', 'Monitors asset conjunctions, updates operational status and performs maneuver escalations', '["satellites:update_status","conjunctions:read","alerts:update"]'),
('Research Scientist', 'Educational read-only access to public catalogs, space weather, and lineage graphs', '["catalog:read","weather:read","lineage:read","console:readonly"]');

-- 9.2 Verified Global Ground Tracking Stations (12 Facilities)
INSERT IGNORE INTO TRACKING_STATION (Station_ID, Station_Name, Location_Country, Latitude, Longitude, Sensor_Type, source_url) VALUES
(1, 'US Space Fence', 'Marshall Islands (Kwajalein)', 8.7167, 167.7333, 'Advanced S-band Digital Phased Array Radar', 'https://www.spaceforce.mil/'),
(2, 'Millstone Hill Radar', 'United States', 42.6194, -71.4914, 'High-power UHF Tracking Radar (MIT Lincoln Lab)', 'https://www.haystack.mit.edu/'),
(3, 'Haystack Radar (HUSIR)', 'United States', 42.6233, -71.4886, 'X-band / W-band High Resolution Radar', 'https://www.ll.mit.edu/'),
(4, 'Goldstone Deep Space Complex', 'United States', 35.4267, -116.8900, 'Radar & 70m/34m Deep Space Parabolic Dish', 'https://www.jpl.nasa.gov/'),
(5, 'Cobra Dane (AN/FPS-108)', 'United States (Shemya, AK)', 52.7375, 174.0931, 'L-band Single-face Phased Array Radar', 'https://www.spaceforce.mil/'),
(6, 'RAF Fylingdales', 'United Kingdom', 54.3606, -0.6697, '3-face Solid State Phased Array Radar (SSPAR)', 'https://www.raf.mod.uk/our-organisation/stations/raf-fylingdales/'),
(7, 'ESA Optical Ground Station', 'Spain (Tenerife)', 28.3005, -16.5100, '1-meter Zeiss Telescope (Optical & SLR)', 'https://www.esa.int/'),
(8, 'ISRO NETRA SSA Control Centre', 'India (Bengaluru)', 13.0333, 77.5167, 'Dedicated SSA Control Centre & Radar Network', 'https://www.isro.gov.in/NETRA.html'),
(9, 'ISTRAC Ground Station', 'India (Bengaluru)', 13.0358, 77.5147, 'Multi-mission TTC Station (S/X Band)', 'https://www.isro.gov.in/ISTRAC.html'),
(10, 'ISRO Multi-Object Tracking Radar (MOTR)', 'India (Sriharikota)', 13.7200, 80.2300, 'L-Band Active Electronically Steered Radar (AESA)', 'https://www.shar.gov.in/'),
(11, 'GEODSS Diego Garcia', 'British Indian Ocean Territory', -7.3133, 72.4222, 'Electro-Optical Deep Space Surveillance', 'https://www.spaceforce.mil/'),
(12, 'Zimmerwald Observatory', 'Switzerland', 46.8770, 7.4650, '1m ZIMLAT Optical Telescope & Laser Ranging', 'https://www.aiub.unibe.ch/');

-- 9.3 Representative Real Satellites (Full 1,576 rows ingested via CelesTrak GP pipeline)
INSERT IGNORE INTO SATELLITE (NORAD_ID, intl_designator, Satellite_Name, Owner_Agency, Launch_Date, Operational_Status, Orbital_Altitude_KM, Inclination_Deg, Apogee_KM, Perigee_KM, Eccentricity, Mean_Motion, RAAN, Arg_Pericenter, Mean_Anomaly, BSTAR, Epoch, orbit_class, source) VALUES
(25544, '1998-067A', 'ISS (ZARYA)', 'NASA / Roscosmos', '1998-11-20', 'Active', 418.5, 51.6416, 422.0, 415.0, 0.000512, 15.4981, 145.2, 82.4, 278.1, 0.00012, NOW(), 'LEO', 'CelesTrak GP'),
(48274, '2021-035A', 'CSS (TIANHE)', 'CNSA (China)', '2021-04-29', 'Active', 389.2, 41.4742, 394.0, 384.4, 0.000681, 15.5912, 210.5, 112.0, 45.8, 0.00015, NOW(), 'LEO', 'CelesTrak GP'),
(44804, '2019-081A', 'CARTOSAT-3', 'ISRO (India)', '2019-11-27', 'Active', 509.0, 97.4682, 512.0, 506.0, 0.000435, 15.1924, 48.2, 15.6, 180.2, 0.00009, NOW(), 'LEO', 'CelesTrak GP'),
(57890, '2023-140A', 'ADITYA-L1', 'ISRO (India)', '2023-09-02', 'Active', 650.0, 19.2500, 680.0, 620.0, 0.004210, 14.7310, 88.1, 44.2, 92.4, 0.00005, NOW(), 'LEO', 'CelesTrak GP'),
(44713, '2019-074A', 'STARLINK-1007', 'SpaceX (USA)', '2019-11-11', 'Active', 549.5, 53.0541, 551.0, 548.0, 0.000145, 15.0641, 112.4, 90.1, 269.8, 0.00011, NOW(), 'LEO', 'CelesTrak GP');

-- 9.4 Representative Real Debris Fragments (Full 2,757 rows ingested via CelesTrak Debris groups)
INSERT IGNORE INTO DEBRIS (NORAD_ID, Object_Name, Size_Meters, rcs_size_class, Mass_KG, Velocity_KMS, Apogee_KM, Perigee_KM, Inclination_Deg, orbit_class, Station_ID, is_estimated, Eccentricity, Mean_Motion, Epoch, source) VALUES
(25730, 'FENGYUN 1C', 1.2000, 'LARGE', 25.0, 7.42, 865.0, 842.0, 98.89, 'LEO', 1, 1, 0.0016, 14.12, NOW(), 'CelesTrak Debris Group'),
(29733, 'FENGYUN 1C DEB', 0.0800, 'SMALL', 0.25, 7.41, 890.0, 830.0, 98.92, 'LEO', 8, 1, 0.0041, 14.10, NOW(), 'CelesTrak Debris Group'),
(22675, 'COSMOS 2251', 1.2000, 'LARGE', 25.0, 7.46, 798.0, 772.0, 74.04, 'LEO', 2, 1, 0.0018, 14.32, NOW(), 'CelesTrak Debris Group'),
(24946, 'IRIDIUM 33', 0.4500, 'MEDIUM', 3.5, 7.46, 785.0, 770.0, 86.39, 'LEO', 6, 1, 0.0011, 14.34, NOW(), 'CelesTrak Debris Group'),
(13552, 'COSMOS 1408', 1.2000, 'LARGE', 25.0, 7.62, 485.0, 465.0, 82.56, 'LEO', 7, 1, 0.0014, 15.31, NOW(), 'CelesTrak Debris Group');

-- 9.5 Automated Verification Test Cases (TC-01 to TC-12)
INSERT IGNORE INTO TEST_CASE (Test_ID, Category, Description, Input_Data, Expected_Result) VALUES
('TC-01', 'Constraints', 'Reject satellite insertion with negative altitude (Altitude <= 0)', 'INSERT INTO SATELLITE (..., Orbital_Altitude_KM = -150)', 'Signal 45000: Altitude must be strictly greater than 0'),
('TC-02', 'Constraints', 'Reject perigee exceeding apogee (Perigee > Apogee)', 'INSERT INTO SATELLITE (..., Apogee_KM = 400, Perigee_KM = 600)', 'Signal 45000: Perigee altitude cannot exceed Apogee altitude'),
('TC-03', 'Constraints', 'Reject debris velocity out of physical bound (Velocity > 15 km/s)', 'INSERT INTO DEBRIS (..., Velocity_KMS = 28.5)', 'Signal 45000: Debris orbital velocity must be realistic'),
('TC-04', 'Triggers', 'Auto-create Critical Alert on high risk conjunction (Prob >= 1e-4)', 'INSERT INTO COLLISION_EVENT with Collision_Risk_Prob = 0.0025', 'ALERT row created with alert_level = CRITICAL, AUDIT_LOG entry created'),
('TC-05', 'Triggers', 'Archive previous orbital elements on satellite update', 'UPDATE SATELLITE SET Apogee_KM = Apogee_KM + 10', 'Row archived into ORBIT_STATE_HISTORY with timestamp'),
('TC-06', 'Stored Procedures', 'Execute Get_Top10_Risky_Debris ranking top collision threats', 'CALL Get_Top10_Risky_Debris()', 'Returns up to 10 rows ordered by Max_Collision_Risk DESC'),
('TC-07', 'Stored Procedures', 'Recursive CTE lineage graph query on fragment catalog ID', 'CALL Fetch_Object_Lineage(25730)', 'Returns fragment tree with Generation_Level hierarchy'),
('TC-08', 'Stored Procedures', 'Cursor iteration for emergency conjunction escalation', 'CALL Escalate_High_Risk_Events()', 'Iterates cursor and returns Total_Events_Escalated count'),
('TC-09', 'Scalar Functions', 'Validate orbit classification logic across altitude thresholds', 'SELECT Classify_Orbit(500, 480), Classify_Orbit(35786, 35780)', 'Returns LEO and GEO respectively'),
('TC-10', 'Partitioning', 'Partition pruning EXPLAIN plan on OBSERVATION by year', 'EXPLAIN SELECT ... WHERE observed_at BETWEEN 2026-01-01 AND 2026-12-31', 'Partitions scanned shows strictly p2026'),
('TC-11', 'Security & RBAC', 'Enforce read-only restriction for Researcher role', 'Researcher role executing INSERT INTO SATELLITE', 'Access denied / Error 1142'),
('TC-12', 'Transactions', 'Demonstrate Savepoint rollback on partial batch failure', 'START TRANSACTION; SAVEPOINT sp1; ROLLBACK TO sp1; COMMIT;', 'State preserved at savepoint without rolling back entire transaction');


-- ============================================================================
-- SECTION 10: ACID TRANSACTION SCENARIOS (COMMIT, SAVEPOINT, ROLLBACK)
-- ============================================================================

-- Scenario A: Atomic Multi-Table Commit
-- START TRANSACTION;
-- INSERT INTO SATELLITE (...) VALUES (99901, '2026-999A', 'DEMO-SAT-ATOMIC', 'ISRO', ...);
-- SET @new_sat_id = LAST_INSERT_ID();
-- INSERT INTO OBSERVATION (Station_ID, Satellite_ID, observed_at, range_km) VALUES (8, @new_sat_id, NOW(), 552.1);
-- COMMIT;

-- Scenario B: Partial Failure Recovery via Named SAVEPOINT
-- START TRANSACTION;
-- INSERT INTO SATELLITE (...) VALUES (99902, '2026-999B', 'DEMO-SAT-SAVEPOINT', 'ESA', ...);
-- SAVEPOINT SatelliteCreated;
-- ROLLBACK TO SAVEPOINT SatelliteCreated;
-- COMMIT;

-- Scenario C: Complete Transaction Abort via ROLLBACK
-- START TRANSACTION;
-- INSERT INTO SATELLITE (...) VALUES (99903, '2026-999C', 'DOOMED-SAT', 'NASA', ...);
-- ROLLBACK;


-- ============================================================================
-- SECTION 11: INDEX BENCHMARK & PARTITION PRUNING VERIFICATION QUERIES
-- ============================================================================

-- 11.1 Partition Pruning Proof (Scans strictly partition p2026):
-- EXPLAIN SELECT Observation_ID, Station_ID, observed_at, range_km
-- FROM OBSERVATION
-- WHERE observed_at >= '2026-01-01 00:00:00' AND observed_at < '2027-01-01 00:00:00';

-- 11.2 Composite Index Range Scan Proof:
-- EXPLAIN ANALYZE SELECT Debris_ID, NORAD_ID, Object_Name, Velocity_KMS, Apogee_KM, Perigee_KM
-- FROM DEBRIS
-- WHERE orbit_class = 'LEO' AND Perigee_KM BETWEEN 400.0 AND 800.0;

-- ============================================================================
-- END OF MASTER SQL FILE
-- ============================================================================
