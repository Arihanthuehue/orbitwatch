-- ============================================================================
-- ORBITWATCH: SPACE DEBRIS TRACKING PLATFORM
-- File: 05_procedures.sql
-- Description: Stored Procedures (Recursive CTE, Transactions, and Explicit CURSOR)
-- Authors: Pranil Vithlani (25BRS1210), Arihant Singh (25BRS1230), Tanzil Hassan (25BRS1201)
-- ============================================================================

USE orbitwatch_db;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- Procedure 1: Get_Top10_Risky_Debris
-- Returns the top 10 debris objects presenting the highest risk of collision
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Procedure 2: Fetch_Object_Lineage
-- Recursive Common Table Expression (CTE) tracing the parent-child fragmentation tree
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS Fetch_Object_Lineage$$
CREATE PROCEDURE Fetch_Object_Lineage(IN p_catalog_id INT)
BEGIN
    WITH RECURSIVE DebrisTree AS (
        -- Anchor member: direct fragments of this parent NORAD ID or matches fragment itself
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

        -- Recursive member: trace sub-fragments where parent is a previous generation fragment
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

-- ----------------------------------------------------------------------------
-- Procedure 3: Register_Satellite
-- Transactional insert of a newly launched or acquired satellite with audit logging
-- ----------------------------------------------------------------------------
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

    -- Validation
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

    -- Audit trail log
    INSERT INTO AUDIT_LOG (user_id, action_type, entity_name, entity_id, query_text)
    VALUES (p_user_id, 'INSERT', 'SATELLITE', p_satellite_id, 
            CONCAT('Registered satellite ', p_name, ' (NORAD: ', p_norad_id, ')'));

    COMMIT;
    SET p_status_message = 'SUCCESS: Satellite registered and audited.';
END$$

-- ----------------------------------------------------------------------------
-- Procedure 4: Record_Collision_Event
-- Transactional insert of a conjunction event with risk evaluation
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Procedure 5: Escalate_High_Risk_Events (Uses explicit MySQL CURSOR)
-- Iterates over open high-risk conjunction events occurring within 48h and raises alerts
-- ----------------------------------------------------------------------------
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

    -- Cursor declaration
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

    -- Cursor handler
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    OPEN cur_high_risk;

    read_loop: LOOP
        FETCH cur_high_risk INTO v_event_id, v_sat_name, v_deb_name, v_tca, v_miss_dist, v_prob;
        IF v_done THEN
            LEAVE read_loop;
        END IF;

        -- Create Emergency Escalation Alert
        INSERT INTO ALERT (event_id, alert_level, message, status)
        VALUES (
            v_event_id, 
            'CRITICAL',
            CONCAT('EMERGENCY ESCALATION: Predicted encounter between ', v_sat_name, ' and ', v_deb_name, 
                   ' at ', v_tca, ' (Miss: ', ROUND(v_miss_dist, 3), ' km, Prob: ', FORMAT(v_prob, 6), ')'),
            'ACTIVE'
        );

        -- Audit log entry
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

DELIMITER ;
