-- ============================================================================
-- ORBITWATCH: SPACE DEBRIS TRACKING PLATFORM
-- File: 07_roles.sql
-- Description: MySQL Native Roles, Privilege Grants, and Actor Access Matrix
-- Authors: Pranil Vithlani (25BRS1210), Arihant Singh (25BRS1230), Tanzil Hassan (25BRS1201)
-- ============================================================================

USE orbitwatch_db;

-- ----------------------------------------------------------------------------
-- 1. Create MySQL Native Roles
-- ----------------------------------------------------------------------------
CREATE ROLE IF NOT EXISTS 'role_admin', 'role_agency', 'role_operator', 'role_researcher';

-- ----------------------------------------------------------------------------
-- 2. Grant Privileges according to Actor Matrix
-- ----------------------------------------------------------------------------

-- Administrator: Full Administrative Rights across Schema
GRANT ALL PRIVILEGES ON orbitwatch_db.* TO 'role_admin' WITH GRANT OPTION;

-- Space Agency: Catalog Management (CRUD on Satellites & Stations), Read Conjunctions
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

-- Satellite Operator: Telemetry and Conjunction Monitoring, Maneuver Execution
GRANT SELECT, UPDATE (Operational_Status, Orbital_Altitude_KM, Apogee_KM, Perigee_KM) 
    ON orbitwatch_db.SATELLITE TO 'role_operator';
GRANT SELECT ON orbitwatch_db.DEBRIS TO 'role_operator';
GRANT SELECT, INSERT, UPDATE ON orbitwatch_db.COLLISION_EVENT TO 'role_operator';
GRANT SELECT, UPDATE (status) ON orbitwatch_db.ALERT TO 'role_operator';
GRANT SELECT ON orbitwatch_db.v_high_risk_events TO 'role_operator';
GRANT SELECT ON orbitwatch_db.v_satellite_exposure TO 'role_operator';
GRANT EXECUTE ON PROCEDURE orbitwatch_db.Get_Top10_Risky_Debris TO 'role_operator';
GRANT EXECUTE ON PROCEDURE orbitwatch_db.Escalate_High_Risk_Events TO 'role_operator';

-- Research Scientist: Read-Only Scientific & Educational Analytics
GRANT SELECT ON orbitwatch_db.v_public_researcher_catalog TO 'role_researcher';
GRANT SELECT ON orbitwatch_db.v_debris_catalog TO 'role_researcher';
GRANT SELECT ON orbitwatch_db.v_station_workload TO 'role_researcher';
GRANT SELECT ON orbitwatch_db.SPACE_WEATHER TO 'role_researcher';
GRANT SELECT ON orbitwatch_db.NEAR_EARTH_OBJECT TO 'role_researcher';
GRANT SELECT ON orbitwatch_db.DEBRIS_LINEAGE TO 'role_researcher';
GRANT EXECUTE ON PROCEDURE orbitwatch_db.Fetch_Object_Lineage TO 'role_researcher';

-- ----------------------------------------------------------------------------
-- 3. Create Sample Database Accounts for Live Demonstration
-- ----------------------------------------------------------------------------
CREATE USER IF NOT EXISTS 'orbit_admin'@'localhost' IDENTIFIED BY 'Admin@Orbit2026';
CREATE USER IF NOT EXISTS 'orbit_agency'@'localhost' IDENTIFIED BY 'Agency@Orbit2026';
CREATE USER IF NOT EXISTS 'orbit_operator'@'localhost' IDENTIFIED BY 'Operator@Orbit2026';
CREATE USER IF NOT EXISTS 'orbit_researcher'@'localhost' IDENTIFIED BY 'Research@Orbit2026';

GRANT 'role_admin' TO 'orbit_admin'@'localhost';
GRANT 'role_agency' TO 'orbit_agency'@'localhost';
GRANT 'role_operator' TO 'orbit_operator'@'localhost';
GRANT 'role_researcher' TO 'orbit_researcher'@'localhost';

SET DEFAULT ROLE ALL TO 
    'orbit_admin'@'localhost',
    'orbit_agency'@'localhost',
    'orbit_operator'@'localhost',
    'orbit_researcher'@'localhost';

FLUSH PRIVILEGES;
