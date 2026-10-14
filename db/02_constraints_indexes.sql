-- ============================================================================
-- ORBITWATCH: SPACE DEBRIS TRACKING PLATFORM
-- File: 02_constraints_indexes.sql
-- Description: B-Tree and Composite Performance Indexes for High-Frequency SSA Queries
-- Authors: Pranil Vithlani (25BRS1210), Arihant Singh (25BRS1230), Tanzil Hassan (25BRS1201)
-- ============================================================================

USE orbitwatch_db;

-- Composite index for altitude-shell and orbit class filtering (Live Orbit Explorer & Catalog)
CREATE INDEX idx_satellite_orbit_perigee ON SATELLITE (orbit_class, Perigee_KM);
CREATE INDEX idx_satellite_owner ON SATELLITE (Owner_Agency);
CREATE INDEX idx_satellite_name ON SATELLITE (Satellite_Name);

-- Composite index for debris velocity and orbit class querying
CREATE INDEX idx_debris_orbit_perigee ON DEBRIS (orbit_class, Perigee_KM);
CREATE INDEX idx_debris_velocity ON DEBRIS (Velocity_KMS);
CREATE INDEX idx_debris_size_class ON DEBRIS (rcs_size_class);
CREATE INDEX idx_debris_name ON DEBRIS (Object_Name);

-- High-frequency Conjunction queries (Top 10 risky, risk levels, timeline)
CREATE INDEX idx_collision_sat_risk ON COLLISION_EVENT (Satellite_ID, Collision_Risk_Prob);
CREATE INDEX idx_collision_debris_risk ON COLLISION_EVENT (Debris_ID, Collision_Risk_Prob);
CREATE INDEX idx_collision_event_time ON COLLISION_EVENT (Event_Timestamp);
CREATE INDEX idx_collision_risk_level ON COLLISION_EVENT (risk_level);
CREATE INDEX idx_collision_miss_dist ON COLLISION_EVENT (Miss_Distance_KM);

-- Tracking Station Observation lookups and time-series joins
CREATE INDEX idx_obs_station_time ON OBSERVATION (Station_ID, observed_at);
CREATE INDEX idx_obs_satellite_time ON OBSERVATION (Satellite_ID, observed_at);
CREATE INDEX idx_obs_debris_time ON OBSERVATION (Debris_ID, observed_at);

-- Orbit State History chronological trajectory lookups
CREATE INDEX idx_orbit_history_lookup ON ORBIT_STATE_HISTORY (object_type, object_id, epoch);

-- Lineage graph traversal
CREATE INDEX idx_lineage_parent ON DEBRIS_LINEAGE (parent_catalog_id);
CREATE INDEX idx_lineage_fragment ON DEBRIS_LINEAGE (fragment_debris_id);

-- System telemetry and auditing
CREATE INDEX idx_audit_user_time ON AUDIT_LOG (user_id, timestamp);
CREATE INDEX idx_audit_action ON AUDIT_LOG (action_type);
CREATE INDEX idx_weather_time ON SPACE_WEATHER (recorded_at);
CREATE INDEX idx_neo_date ON NEAR_EARTH_OBJECT (close_approach_date);
