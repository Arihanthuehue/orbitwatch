# ORBITWATCH: Slide-by-Slide PPT Presentation Outline

**Project Title:** ORBITWATCH: Space Debris Tracking Platform (Full-Stack, MySQL 8.x, Real SGP4 Data)  
**Course:** Database Management Systems Lab (Fall 2026, VIT Chennai)  
**Team Members:**  
- Pranil Vithlani (25BRS1210) &bull; Frontend Architecture, 3D Orbit Visualization, Client-Side Astrodynamics  
- Arihant Singh (25BRS1230) &bull; Database Architecture, BCNF Normalization, Indexing & Partitioning  
- Tanzil Hassan (25BRS1201) &bull; Backend REST APIs, RBAC Security, Data Ingestion & Testing Suite  

---

## Slide 1: Title Slide & Project Identification
- **Title:** ORBITWATCH: Space Debris Tracking & Conjunction Avoidance Platform
- **Subtitle:** High-Performance Relational SSA Database System with Real Orbital Telemetry
- **Institution:** School of Computer Science & Engineering, VIT Chennai
- **App Page to Screenshot:** `LandingPage.tsx` (Cinematic Hero with glowing 3D Earth and live counters)
- **Speaker Notes (Arihant Singh):**  
  "Good morning, respected evaluators. Today, our team—Pranil, Tanzil, and myself—presents ORBITWATCH, a production-grade Space Situational Awareness platform engineered entirely on a rigorous MySQL 8.0 relational database architecture."

---

## Slide 2: The Core Problem & Significance (Kessler Syndrome)
- **Bullet Points:**
  - 40,000+ objects > 10 cm, over 100 million fragments orbiting Earth at 7.5 to 8.0 km/s.
  - Hypervelocity closing speeds up to 15.0 km/s: Kinetic energy $E_k = \frac{1}{2}mv^2$.
  - A 100g bolt delivers 2.81 MegaJoules (equivalent to 0.67 kg TNT).
  - Kessler Syndrome: Exponential cascade multiplication threatening space infrastructure.
- **App Page to Screenshot:** `LearnPage.tsx` (Kessler Syndrome & Kinetic Impact Explainer)
- **Speaker Notes (Pranil Vithlani):**  
  "In Low Earth Orbit, even marble-sized debris possesses catastrophic kinetic energy. The Kessler Syndrome threatens commercial space flight and global telecommunications. Accurate, ACID-compliant database tracking is paramount."

---

## Slide 3: Existing Systems vs Proposed Solution
- **Bullet Points:**
  - Space-Track.org: Authoritative SSN catalog, but lacks fragment lineage hierarchy and API rate limits restrict interactive queries.
  - ESA DISCOS: Detailed physical shapes, but requires strict institutional authorization tokens.
  - ISRO NETRA: Closed internal sensor network unavailable to academia.
  - Proposed Solution: Fully relational, open-data ingestion (CelesTrak, NOAA SWPC, NASA NeoWs), sub-millisecond conjunction assessments, recursive fragment lineage graphs.
- **App Page to Screenshot:** `LearnPage.tsx` (Existing Systems Comparison Table)
- **Speaker Notes (Tanzil Hassan):**  
  "Existing platforms operate in silos. ORBITWATCH unifies open radar tracking, space weather drag indices, and predicted close encounters into a normalized relational schema with zero placeholder data."

---

## Slide 4: System Architecture & Data Pipeline
- **Bullet Points:**
  - 3-Tier Decoupled Architecture: React 18 SPA &rarr; Node.js/Express API &rarr; MySQL 8.0 InnoDB.
  - Ingestion Engine: Automated periodic pulls from CelesTrak GP/OMM, SOCRATES, NOAA SWPC, NASA NeoWs.
  - Offline Resilience: Snapshot export/import for isolated evaluation environments.
- **App Page to Screenshot:** `LearnPage.tsx` (SVG Architecture Flow Diagram)
- **Speaker Notes (Tanzil Hassan):**  
  "Our backend uses mysql2 connection pooling with prepared statements on every query. The ingestion pipeline transforms live Keplerian elements into relational tuples while logging runs in DATA_SYNC_LOG."

---

## Slide 5: Database Design & Relational Schema
- **Bullet Points:**
  - 14 Normalized Relational Tables: `TRACKING_STATION`, `SATELLITE`, `DEBRIS`, `COLLISION_EVENT`, `OBSERVATION`, `ORBIT_STATE_HISTORY`, `DEBRIS_LINEAGE`, `APP_USER`, `ROLE`, `AUDIT_LOG`, `ALERT`, `SPACE_WEATHER`, `NEAR_EARTH_OBJECT`, `TEST_RUN`.
  - Referential Integrity: Cascade deletion on collision encounters, set null on station assignments.
  - CHECK Constraints: Enforces physically valid latitudes (-90..90), longitudes (-180..180), positive altitudes, and realistic velocities (0 < v &le; 15 km/s).
- **App Page to Screenshot:** `Da3ChecklistPage.tsx` (Requirements Checklist)
- **Speaker Notes (Arihant Singh):**  
  "We addressed the common course schema gap by adding the OBSERVATION associative entity to accurately model the M:N station-to-object tracking relationship, and ORBIT_STATE_HISTORY for trajectory versioning."

---

## Slide 6: BCNF Normalization Proof
- **Bullet Points:**
  - Definition: For every functional dependency $X \to Y$, $X$ must be a superkey.
  - SATELLITE: Candidate keys `{Satellite_ID, NORAD_ID, intl_designator}` determine all orbital attributes.
  - DEBRIS: Candidate keys `{Debris_ID, NORAD_ID}` determine physical and orbital fields.
  - COLLISION_EVENT: Key `{Event_ID}` and composite `{Satellite_ID, Debris_ID, Event_Timestamp}` satisfy BCNF.
  - Zero insertion, update, or deletion anomalies.
- **App Page to Screenshot:** `LearnPage.tsx` (BCNF Normalization Proof Section)
- **Speaker Notes (Arihant Singh):**  
  "Every table determinant is a candidate key. We have eliminated transitive and partial dependencies across all 14 entities."

---

## Slide 7: Advanced SQL Implementation (Procedures, Views, Triggers)
- **Bullet Points:**
  - Stored Procedures: `Fetch_Object_Lineage` (Recursive CTE for breakup hierarchy), `Get_Top10_Risky_Debris`.
  - Cursor Routine: `Escalate_High_Risk_Events` uses an explicit MySQL cursor to iterate open 48h encounters.
  - Triggers: `trg_validate_satellite_before_insert` (SIGNAL 45000), `trg_collision_event_after_insert` (auto-alert generation), `trg_satellite_orbit_history` (auto-archiving).
  - Deterministic Functions: `Classify_Orbit` (LEO/MEO/GEO/HEO), `Risk_Level`, `Calculate_Kinetic_Energy`.
- **App Page to Screenshot:** `DbmsLabPage.tsx` (Views & Routines Tab)
- **Speaker Notes (Tanzil Hassan):**  
  "Our triggers prevent corrupt data at the database engine level, while our recursive CTE enables instant tree traversal of the 2007 Fengyun-1C and 2009 Cosmos/Iridium breakups."

---

## Slide 8: ACID Transactions & Concurrency Control
- **Bullet Points:**
  - Atomicity: Multi-table insertion committing satellite registration and immediate radar pass.
  - Savepoints: Partial failure recovery using `SAVEPOINT` and `ROLLBACK TO SAVEPOINT`.
  - Durability: Full InnoDB write-ahead logging (WAL) and doublewrite buffering.
- **App Page to Screenshot:** `DbmsLabPage.tsx` (ACID Transactions Walkthrough Tab)
- **Speaker Notes (Arihant Singh):**  
  "In the DBMS Lab, we provide interactive triggers for COMMIT, SAVEPOINT recovery, and complete ROLLBACK, displaying before and after states."

---

## Slide 9: Performance Optimization: Indexing & Partitioning
- **Bullet Points:**
  - Composite B-Tree Indexes: `(orbit_class, Perigee_KM)` and `(Satellite_ID, Collision_Risk_Prob)`.
  - Table Partitioning: Range partitioning on `OBSERVATION` by `YEAR(observed_at)`.
  - Partition Pruning: `EXPLAIN` demonstrates that queries for 2026 scan strictly partition `p2026`, pruning all older partitions.
  - Query latency reduced from full-table scans to under 15 milliseconds.
- **App Page to Screenshot:** `DbmsLabPage.tsx` (Indexing & Pruning Tab showing EXPLAIN)
- **Speaker Notes (Arihant Singh):**  
  "Here is our EXPLAIN output proving partition pruning. The execution plan verifies that only partition p2026 is accessed when querying 2026 passes."

---

## Slide 10: Database Security & Role-Based Access Control (RBAC)
- **Bullet Points:**
  - Dual-Layer Security: JWT authentication in frontend + MySQL native roles (`role_admin`, `role_agency`, `role_operator`, `role_researcher`).
  - Strict Privilege Grants: Researchers have SELECT-only access to sanitized views (`v_public_researcher_catalog`).
  - Error 1142 Proven: Direct write attempts by researcher accounts are rejected by the MySQL server engine.
- **App Page to Screenshot:** `DbmsLabPage.tsx` (Security & Roles Tab)
- **Speaker Notes (Tanzil Hassan):**  
  "Even if a user bypasses our API, native MySQL engine privileges reject unauthorized writes with SQL State 42000."

---

## Slide 11: Flagship Live Orbit Explorer & 3D Visualization
- **Bullet Points:**
  - 60fps GPU-instanced rendering of 4,000+ real space objects.
  - Color-coded: Cyan for Satellites, Amber for Debris, Red for Critical Risk.
  - Real Keplerian propagation with time scrubbing and speed multipliers (1x to 100x).
  - Ground station radar coverage cones and real-time conjunction threat link lines.
- **App Page to Screenshot:** `OrbitExplorerPage.tsx` (Full 3D Globe with selected orbit line and detail panel)
- **Speaker Notes (Pranil Vithlani):**  
  "Our Live Orbit Explorer computes Cartesian coordinates in real time from Keplerian elements. Selecting any object renders its complete glowing orbital ellipse and slides in its physical attributes."

---

## Slide 12: Conjunction Collision Monitor & Real SOCRATES Data
- **Bullet Points:**
  - Ingests real CelesTrak SOCRATES conjunctions with miss distances down to 16 meters!
  - Real-time countdown to Time of Closest Approach (TCA).
  - Automated threshold alerts when Miss Distance &le; 1.0 km or Probability &ge; 10&minus;4.
- **App Page to Screenshot:** `ConjunctionMonitorPage.tsx` (Split Table and Evasive Maneuver Card)
- **Speaker Notes (Pranil Vithlani):**  
  "When an encounter crosses the safety threshold, the system displays an emergency evasive maneuver recommendation banner, allowing operators to trigger thruster burns."

---

## Slide 13: Ground Stations & Space Weather Telemetry
- **Bullet Points:**
  - 12 Verified Global Facilities (ISRO NETRA Bengaluru, Kwajalein Space Fence, RAF Fylingdales, ESA OGS).
  - Interactive 2D World Sensor Map and partitioned pass logging.
  - NOAA Space Weather (F10.7 solar flux, Kp index) explaining atmospheric drag decay on orbital debris.
  - NASA NeoWs Near-Earth Asteroid flyby monitoring.
- **App Page to Screenshot:** `GroundStationsPage.tsx` and `AsteroidsWeatherPage.tsx`
- **Speaker Notes (Pranil Vithlani):**  
  "We track ground stations across both 3D globe coordinates and an interactive 2D map, correlating solar storms with orbital drag changes."

---

## Slide 14: Automated Testing & Verification Suite
- **Bullet Points:**
  - 12 Automated Unit & Integration Tests running directly against MySQL constraints, triggers, and routines.
  - Results stored permanently in `TEST_RUN` table.
  - 100% Pass Rate with real execution latencies recorded in milliseconds.
- **App Page to Screenshot:** `TestingPage.tsx` (Pass/Fail table with green badges)
- **Speaker Notes (Tanzil Hassan):**  
  "Evaluators can click 'Run All 12 Test Cases Live' in the app to watch MySQL reject negative altitudes, enforce perigee bounds, fire triggers, and execute stored procedures."

---

## Slide 15: Conclusion & Future Scope
- **Bullet Points:**
  - Successfully delivered an end-to-end, BCNF-compliant, production-grade SSA platform with 4,300+ real objects.
  - Full DA3 evaluation rubric satisfied: Joins, Subqueries, Aggregates, Views, Procedures, Cursors, Triggers, Partitioning, ACID, RBAC.
  - Future Scope: Machine Learning atmospheric re-entry prediction, spatial R-tree indexing in MySQL, and active debris removal mission coordination.
- **Speaker Notes (All Team Members):**  
  "Thank you for your time and guidance throughout the semester. We invite your questions and welcome live evaluation of our database."
