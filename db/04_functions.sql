-- ============================================================================
-- ORBITWATCH: SPACE DEBRIS TRACKING PLATFORM
-- File: 04_functions.sql
-- Description: Stored Deterministic Scalar Functions for Orbital Physics & Risk Classification
-- Authors: Pranil Vithlani (25BRS1210), Arihant Singh (25BRS1230), Tanzil Hassan (25BRS1201)
-- ============================================================================

USE orbitwatch_db;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- Function 1: Classify_Orbit
-- Classifies orbital regime based on apogee and perigee altitudes (KM)
-- ----------------------------------------------------------------------------
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

    -- GEO: Equatorial circular orbit around 35,786 km
    IF p_perigee >= 35000 AND p_apogee <= 36500 AND ABS(p_apogee - p_perigee) < 1000 THEN
        SET v_class = 'GEO';
    -- HEO: Highly Elliptical Orbit (Molniya/Tundra or extreme apogee)
    ELSEIF p_apogee >= 36000 OR (p_apogee - p_perigee >= 10000 AND p_apogee > 5000) THEN
        SET v_class = 'HEO';
    -- LEO: Low Earth Orbit (under 2,000 km)
    ELSEIF p_apogee < 2000 AND p_perigee < 2000 THEN
        SET v_class = 'LEO';
    -- MEO: Medium Earth Orbit (between 2,000 km and 35,786 km, e.g. GPS / Galileo)
    ELSEIF p_perigee >= 2000 AND p_apogee < 36000 THEN
        SET v_class = 'MEO';
    ELSE
        SET v_class = 'LEO';
    END IF;

    RETURN v_class;
END$$

-- ----------------------------------------------------------------------------
-- Function 2: Risk_Level
-- Evaluates conjunction severity based on collision probability and miss distance
-- Aligned with NASA CARA and ESA Space Debris Office operational guidelines
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS Risk_Level$$
CREATE FUNCTION Risk_Level(p_prob DOUBLE, p_miss_distance DOUBLE)
RETURNS VARCHAR(20)
DETERMINISTIC
NO SQL
BEGIN
    IF p_prob IS NULL OR p_miss_distance IS NULL THEN
        RETURN 'NOMINAL';
    END IF;

    -- CRITICAL: Miss distance <= 1.0 km OR Collision probability >= 1e-4 (0.0001)
    -- Requires immediate evasive thruster firing calculation
    IF p_miss_distance <= 1.0 OR p_prob >= 0.0001 THEN
        RETURN 'CRITICAL';
    -- WARNING: Miss distance <= 5.0 km OR Collision probability >= 1e-5 (0.00001)
    ELSEIF p_miss_distance <= 5.0 OR p_prob >= 0.00001 THEN
        RETURN 'WARNING';
    -- MONITOR: Miss distance <= 25.0 km
    ELSEIF p_miss_distance <= 25.0 THEN
        RETURN 'MONITOR';
    ELSE
        RETURN 'NOMINAL';
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- Function 3: Calculate_Kinetic_Energy
-- Computes kinetic energy in MegaJoules (MJ) given mass (kg) and velocity (km/s)
-- Ek = 0.5 * m * v^2
-- ----------------------------------------------------------------------------
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
    
    -- Return in MegaJoules (MJ)
    RETURN ROUND(v_joules / 1000000.0, 3);
END$$

-- ----------------------------------------------------------------------------
-- Function 4: Calculate_Semi_Major_Axis
-- Derives semi-major axis (KM) from mean motion (revs/day) using Kepler's 3rd law
-- a = (mu / n^2)^(1/3)
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS Calculate_Semi_Major_Axis$$
CREATE FUNCTION Calculate_Semi_Major_Axis(p_mean_motion DOUBLE)
RETURNS DOUBLE
DETERMINISTIC
NO SQL
BEGIN
    DECLARE v_mu DOUBLE DEFAULT 398600.4418; -- Earth gravitational parameter km^3/s^2
    DECLARE v_n_rad_s DOUBLE;
    DECLARE v_a DOUBLE;

    IF p_mean_motion IS NULL OR p_mean_motion <= 0 THEN
        RETURN 0.0;
    END IF;

    SET v_n_rad_s = (p_mean_motion * 2.0 * PI()) / 86400.0;
    SET v_a = POW(v_mu / (v_n_rad_s * v_n_rad_s), 1.0 / 3.0);

    RETURN ROUND(v_a, 3);
END$$

DELIMITER ;
