-- ============================================================================
-- ORBITWATCH: SPACE DEBRIS TRACKING PLATFORM
-- File: 08_demo_transactions.sql
-- Description: Interactive ACID Transaction Scenarios (COMMIT, ROLLBACK, SAVEPOINT)
-- Authors: Pranil Vithlani (25BRS1210), Arihant Singh (25BRS1230), Tanzil Hassan (25BRS1201)
-- ============================================================================

USE orbitwatch_db;

-- ============================================================================
-- SCENARIO 1: ATOMIC MULTI-TABLE INSERTION (COMMIT)
-- Action: Registering a newly deployed spacecraft and its immediate radar observation
-- ============================================================================
START TRANSACTION;

-- Step 1.1: Insert new satellite
INSERT INTO SATELLITE (
    NORAD_ID, intl_designator, Satellite_Name, Owner_Agency,
    Launch_Date, Operational_Status, Orbital_Altitude_KM,
    Inclination_Deg, Apogee_KM, Perigee_KM, Eccentricity,
    Mean_Motion, RAAN, Arg_Pericenter, Mean_Anomaly, BSTAR,
    Epoch, orbit_class, source
) VALUES (
    99901, '2026-999A', 'DEMO-SAT-ATOMIC-1', 'ISRO / IN-SPACe',
    '2026-10-14', 'Active', 550.0,
    97.5, 555.0, 545.0, 0.0007,
    15.08, 120.5, 45.0, 180.0, 0.0001,
    NOW(), 'LEO', 'ACID Demonstration'
);

SET @new_sat_id = LAST_INSERT_ID();

-- Step 1.2: Register immediate telemetry observation from ISRO NETRA station
INSERT INTO OBSERVATION (
    Station_ID, Satellite_ID, observed_at,
    azimuth_deg, elevation_deg, range_km, doppler_kms, quality_flag
) VALUES (
    8, -- ISRO NETRA Bengaluru
    @new_sat_id,
    NOW(),
    135.2, 45.8, 552.1, 7.55, 'VERIFIED'
);

-- Step 1.3: Audit trail logging
INSERT INTO AUDIT_LOG (user_id, action_type, entity_name, entity_id, query_text)
VALUES (1, 'INSERT', 'SATELLITE', @new_sat_id, 'Demonstrating ACID Atomic Commit');

COMMIT;


-- ============================================================================
-- SCENARIO 2: PARTIAL FAILURE RECOVERY USING SAVEPOINT (SAVEPOINT & ROLLBACK TO)
-- Action: Register a satellite, set savepoint, attempt invalid debris link, recover to savepoint
-- ============================================================================
START TRANSACTION;

-- Step 2.1: Register satellite
INSERT INTO SATELLITE (
    NORAD_ID, intl_designator, Satellite_Name, Owner_Agency,
    Launch_Date, Operational_Status, Orbital_Altitude_KM,
    Inclination_Deg, Apogee_KM, Perigee_KM, Eccentricity,
    Mean_Motion, RAAN, Arg_Pericenter, Mean_Anomaly, BSTAR,
    Epoch, orbit_class, source
) VALUES (
    99902, '2026-999B', 'DEMO-SAT-SAVEPOINT-2', 'ESA',
    '2026-10-14', 'Active', 680.0,
    98.2, 685.0, 675.0, 0.0005,
    14.65, 210.0, 30.0, 90.0, 0.0001,
    NOW(), 'LEO', 'ACID Demonstration'
);

SET @sat_id_2 = LAST_INSERT_ID();

-- Step 2.2: Establish Named Savepoint
SAVEPOINT SatelliteCreated;

-- Step 2.3: Attempt to log observation with illegal null values (simulated partial failure)
-- If an error occurs or conditional fails in application logic:
ROLLBACK TO SAVEPOINT SatelliteCreated;

-- Step 2.4: Resume valid transaction flow
INSERT INTO OBSERVATION (
    Station_ID, Satellite_ID, observed_at,
    azimuth_deg, elevation_deg, range_km, doppler_kms, quality_flag
) VALUES (
    7, -- ESA Optical Ground Station Tenerife
    @sat_id_2,
    NOW(),
    88.4, 62.1, 681.4, 7.42, 'RECOVERED_AFTER_SAVEPOINT'
);

COMMIT;


-- ============================================================================
-- SCENARIO 3: TRANSACTION ABORT & ROLLBACK (ROLLBACK)
-- Action: An operation encounters a fatal constraint or business logic abort
-- ============================================================================
START TRANSACTION;

INSERT INTO SATELLITE (
    NORAD_ID, intl_designator, Satellite_Name, Owner_Agency,
    Launch_Date, Operational_Status, Orbital_Altitude_KM,
    Inclination_Deg, Apogee_KM, Perigee_KM, Eccentricity,
    Mean_Motion, RAAN, Arg_Pericenter, Mean_Anomaly, BSTAR,
    Epoch, orbit_class, source
) VALUES (
    99903, '2026-999C', 'DOOMED-SAT-ROLLBACK-3', 'NASA',
    '2026-10-14', 'Active', 420.0,
    51.6, 425.0, 415.0, 0.0006,
    15.54, 45.0, 15.0, 0.0, 0.0001,
    NOW(), 'LEO', 'ACID Demonstration'
);

-- An anomaly is detected before commit:
ROLLBACK;

-- Verified: DOOMED-SAT-ROLLBACK-3 does NOT exist in the database!
