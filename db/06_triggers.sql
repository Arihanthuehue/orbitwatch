-- ============================================================================
-- ORBITWATCH: SPACE DEBRIS TRACKING PLATFORM
-- File: 06_triggers.sql
-- Description: Database Triggers for Validation, Alert Generation, and Trajectory Archiving
-- Authors: Pranil Vithlani (25BRS1210), Arihant Singh (25BRS1230), Tanzil Hassan (25BRS1201)
-- ============================================================================

USE orbitwatch_db;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- Trigger 1: trg_validate_satellite_before_insert
-- Rejects physically impossible orbital parameters
-- ----------------------------------------------------------------------------
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
    
    -- Auto-assign orbit class if default
    SET NEW.orbit_class = Classify_Orbit(NEW.Apogee_KM, NEW.Perigee_KM);
END$$

-- ----------------------------------------------------------------------------
-- Trigger 2: trg_validate_debris_before_insert
-- Rejects negative altitudes or impossible velocity
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Trigger 3: trg_collision_event_after_insert
-- Automated Alert & Audit Log Generation upon High-Risk Conjunction Insertion
-- ----------------------------------------------------------------------------
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

        -- Create automated Alert row
        INSERT INTO ALERT (event_id, alert_level, message, status)
        VALUES (
            NEW.Event_ID,
            CASE WHEN NEW.risk_level = 'CRITICAL' THEN 'CRITICAL' ELSE 'WARNING' END,
            CONCAT('COLLISION HAZARD: ', COALESCE(v_sat_name, 'Sat'), ' vs ', COALESCE(v_deb_name, 'Debris'), 
                   ' | Miss: ', ROUND(NEW.Miss_Distance_KM, 3), 'km | Prob: ', FORMAT(NEW.Collision_Risk_Prob, 6)),
            'ACTIVE'
        );

        -- Record automated security audit
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

-- ----------------------------------------------------------------------------
-- Trigger 4: trg_satellite_orbit_history_before_update
-- Archives previous orbital elements to ORBIT_STATE_HISTORY
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_satellite_orbit_history_before_update$$
CREATE TRIGGER trg_satellite_orbit_history_before_update
BEFORE UPDATE ON SATELLITE
FOR EACH ROW
BEGIN
    -- Check if orbital parameters changed
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

-- ----------------------------------------------------------------------------
-- Trigger 5: trg_debris_orbit_history_before_update
-- Archives previous debris orbital elements to ORBIT_STATE_HISTORY
-- ----------------------------------------------------------------------------
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
