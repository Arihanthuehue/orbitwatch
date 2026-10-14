# ORBITWATCH: Database Design Decisions & Relational Schema Rationale

**Project:** Space Debris Tracking Database Project (VIT Chennai DBMS Project)  
**Authors:** Pranil Vithlani (25BRS1210), Arihant Singh (25BRS1230), Tanzil Hassan (25BRS1201)  
**Standard:** Boyce-Codd Normal Form (BCNF), Strict Referential Integrity, MySQL 8.x

---

## 1. Schema Modifications from Initial Course PDF & Real Data Realities

The original project specification had a few structural gaps and assumptions that don't match real orbital mechanics or relational rigor:

1. **Gap in Station-to-Object Monitoring (The `OBSERVATION` table):**
   - *Problem:* The original ER diagram linked `TRACKING_STATION` directly with foreign keys in `DEBRIS`, implying a 1-to-many relationship where a debris piece belongs to only one station. In reality, multiple ground stations track the same satellite or debris fragment over time.
   - *Solution:* Added the `OBSERVATION` associative entity. An observation records `Station_ID`, exactly one of `Satellite_ID` or `Debris_ID` (enforced via CHECK constraint), `observed_at`, elevation angle, azimuth angle, range, and Doppler velocity. This table is partitioned by year/quarter for massive historical scale.

2. **Historical Trajectory Versioning (`ORBIT_STATE_HISTORY`):**
   - *Problem:* Satellites and debris drift due to atmospheric drag, solar radiation pressure, and gravitational perturbations (J2). Simply overwriting orbital elements loses trajectory history.
   - *Solution:* Added `ORBIT_STATE_HISTORY`. A `BEFORE UPDATE` trigger on `SATELLITE` and `DEBRIS` automatically archives the previous orbital elements (epoch, inclination, RAAN, eccentricity, arg_of_pericenter, mean_anomaly, mean_motion, bstar) before updating.

3. **Fragment Lineage Hierarchy (`DEBRIS_LINEAGE`):**
   - *Problem:* Major breakup events (e.g. 2007 Fengyun-1C ASAT test, 2009 Cosmos 2251 / Iridium 33 collision, 2021 Cosmos 1408 ASAT test) create thousands of fragments derived from a single parent object.
   - *Solution:* Added `DEBRIS_LINEAGE` mapping `fragment_id` to `parent_id` (either another satellite or parent debris), recording `breakup_event_name`, `breakup_date`, and fragment energy category. Populated via real historical breakup catalog data and queried via recursive CTE stored procedure `Fetch_Object_Lineage`.

4. **Nullable Measured Size & RCS Size Class:**
   - *Problem:* Radar stations measure Radar Cross Section (RCS in m²), not exact physical diameter in meters. Most debris fragments do not have a laser-measured physical size in meters.
   - *Solution:* In `DEBRIS`, `Size_Meters` is `DECIMAL(8,4) NULL`, accompanied by `rcs_size_class ENUM('SMALL', 'MEDIUM', 'LARGE', 'UNKNOWN')` and `is_estimated BOOLEAN DEFAULT TRUE`. If physical size is calculated from RCS, it is flagged as estimated.

5. **Role-Based Access Control (RBAC) in MySQL & App:**
   - *Problem:* Course evaluation requires demonstrable database security.
   - *Solution:* Defined MySQL native database roles: `role_admin`, `role_agency`, `role_operator`, `role_researcher` with explicit `GRANT` and `REVOKE` permissions on tables, views, and procedures, mirrored by JWT claims and API middleware in Express.

---

## 2. Boyce-Codd Normal Form (BCNF) Verification

A relation $R$ is in BCNF if for every non-trivial functional dependency $X \to Y$, $X$ is a superkey of $R$.

### Table: `TRACKING_STATION`
- **Candidate Key:** `Station_ID`
- **FDs:** `Station_ID -> Station_Name, Location_Country, Latitude, Longitude, Sensor_Type, source_url`
- **Proof:** `Station_ID` is the primary key and superkey. No transitive or partial dependencies. In BCNF.

### Table: `SATELLITE`
- **Candidate Keys:** `Satellite_ID`, `NORAD_ID`, `intl_designator`
- **FDs:**
  - `Satellite_ID -> NORAD_ID, intl_designator, Satellite_Name, Owner_Agency, Launch_Date, Operational_Status, Orbital_Altitude_KM, Inclination_Deg, Apogee_KM, Perigee_KM, Eccentricity, Mean_Motion, RAAN, Arg_Pericenter, Mean_Anomaly, BSTAR, Epoch, orbit_class, updated_at`
  - `NORAD_ID -> Satellite_ID, ...`
  - `intl_designator -> Satellite_ID, ...`
- **Proof:** Every determinant is a candidate key. In BCNF.

### Table: `DEBRIS`
- **Candidate Keys:** `Debris_ID`, `NORAD_ID`
- **FDs:**
  - `Debris_ID -> NORAD_ID, Object_Name, Size_Meters, rcs_size_class, Mass_KG, Velocity_KMS, Apogee_KM, Perigee_KM, Inclination_Deg, orbit_class, Station_ID, parent_satellite_id, is_estimated, ...`
  - `NORAD_ID -> Debris_ID, ...`
- **Proof:** Every determinant is a candidate key. In BCNF.

### Table: `COLLISION_EVENT`
- **Candidate Key:** `Event_ID`, `(Satellite_ID, Debris_ID, Event_Timestamp)`
- **FDs:**
  - `Event_ID -> Satellite_ID, Debris_ID, Event_Timestamp, Miss_Distance_KM, Relative_Velocity, Collision_Risk_Prob, risk_level, source, created_at`
  - `(Satellite_ID, Debris_ID, Event_Timestamp) -> Event_ID, ...`
- **Proof:** Every determinant is a candidate key. In BCNF.

### Table: `OBSERVATION`
- **Candidate Key:** `Observation_ID`, `(Station_ID, observed_at, COALESCE(Satellite_ID, 0), COALESCE(Debris_ID, 0))`
- **FDs:** `Observation_ID -> Station_ID, Satellite_ID, Debris_ID, observed_at, azimuth_deg, elevation_deg, range_km, doppler_kms, quality_flag`
- **Proof:** Every determinant is a candidate key. In BCNF.

---

## 3. Storage Engine & Partitioning Strategy

- **Storage Engine:** InnoDB across all tables for full ACID compliance, foreign key constraints with `CASCADE` / `SET NULL` actions, row-level locking, and crash recovery.
- **Partitioning:** The massive table `OBSERVATION` is partitioned by range on `YEAR(observed_at)` to enable instant partition pruning during historical range queries (`EXPLAIN SELECT ... WHERE observed_at BETWEEN '2026-01-01' AND '2026-12-31'`).
