-- ============================================================================
-- ORBITWATCH: SPACE DEBRIS TRACKING PLATFORM
-- File: 09_index_benchmark.sql
-- Description: Index Performance Benchmarking and Partition Pruning Analysis
-- Authors: Pranil Vithlani (25BRS1210), Arihant Singh (25BRS1230), Tanzil Hassan (25BRS1201)
-- ============================================================================

USE orbitwatch_db;

-- ----------------------------------------------------------------------------
-- 1. Benchmark Query A: Conjunction Assessment Risk Filtering
-- Compares execution plan and timing on COLLISION_EVENT
-- ----------------------------------------------------------------------------
-- Query statement:
-- SELECT c.Event_ID, s.Satellite_Name, d.Object_Name, c.Miss_Distance_KM, c.Collision_Risk_Prob
-- FROM COLLISION_EVENT c
-- JOIN SATELLITE s ON c.Satellite_ID = s.Satellite_ID
-- JOIN DEBRIS d ON c.Debris_ID = d.Debris_ID
-- WHERE c.Collision_Risk_Prob >= 0.0001 AND c.Miss_Distance_KM <= 5.0;

EXPLAIN ANALYZE
SELECT c.Event_ID, s.Satellite_Name, d.Object_Name, c.Miss_Distance_KM, c.Collision_Risk_Prob
FROM COLLISION_EVENT c
JOIN SATELLITE s ON c.Satellite_ID = s.Satellite_ID
JOIN DEBRIS d ON c.Debris_ID = d.Debris_ID
WHERE c.Collision_Risk_Prob >= 0.0001 AND c.Miss_Distance_KM <= 5.0;

-- ----------------------------------------------------------------------------
-- 2. Benchmark Query B: Orbit Class & Perigee Range Scan on Large Debris Table
-- Demonstrates composite index `idx_debris_orbit_perigee` (orbit_class, Perigee_KM)
-- ----------------------------------------------------------------------------
EXPLAIN ANALYZE
SELECT Debris_ID, NORAD_ID, Object_Name, Velocity_KMS, Apogee_KM, Perigee_KM
FROM DEBRIS
WHERE orbit_class = 'LEO' AND Perigee_KM BETWEEN 400.0 AND 800.0;

-- ----------------------------------------------------------------------------
-- 3. Partition Pruning Demonstration
-- Proves that MySQL scans ONLY partition p2026 instead of the entire table!
-- ----------------------------------------------------------------------------
EXPLAIN
SELECT Observation_ID, Station_ID, observed_at, range_km, doppler_kms
FROM OBSERVATION
WHERE observed_at >= '2026-01-01 00:00:00' AND observed_at < '2027-01-01 00:00:00';

-- Notice the "partitions" column in the EXPLAIN output displays strictly "p2026"!
