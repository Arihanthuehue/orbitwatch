-- ============================================================================
-- ORBITWATCH: SPACE DEBRIS TRACKING PLATFORM
-- File: 01_schema.sql
-- Description: Core Database Schema, Tables, Constraints, and Partitioning
-- Standard: MySQL 8.x, InnoDB Engine, BCNF Normalization
-- Authors: Pranil Vithlani (25BRS1210), Arihant Singh (25BRS1230), Tanzil Hassan (25BRS1201)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS orbitwatch_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE orbitwatch_db;

-- ----------------------------------------------------------------------------
-- 1. TRACKING_STATION Table
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
-- 2. SATELLITE Table
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
-- 3. DEBRIS Table
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
-- 4. COLLISION_EVENT Table
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
-- 5. OBSERVATION Table (Range-Partitioned by Year)
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
    -- Note: MySQL does not permit foreign keys on partitioned tables (Error 1506).
    -- Referential integrity is handled via application layer & indexed foreign keys.
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
-- 6. ORBIT_STATE_HISTORY Table (Range-Partitioned by Year)
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
-- 7. DEBRIS_LINEAGE Table
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
-- 8. User Management, RBAC & Security Tables
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
-- 9. External Feeds: Space Weather & Near-Earth Objects
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
-- 10. Automated Testing & Data Sync Log Tables
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
