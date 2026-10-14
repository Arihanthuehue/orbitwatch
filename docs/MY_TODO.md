# ORBITWATCH: What You Must Do After The Build (Student Handoff Guide)

**Prepared for:** Pranil Vithlani (25BRS1210), Arihant Singh (25BRS1230), Tanzil Hassan (25BRS1201)  
**Project:** Space Debris Tracking Database Project (VIT Chennai DBMS Project)  
**Status:** **Fully Built & Verified Live Against Local MySQL 8.x**  

---

## 1. Setup on Your Machine

### Prerequisites Verified on System
- **Node.js**: v20.19.6 (`node -v`) &bull; Installed &amp; Verified
- **npm**: 10.8.2 (`npm -v`) &bull; Installed &amp; Verified
- **MySQL Server**: 8.0.46 running locally as Windows Service `MySQL80` on port 3306

### Environment Variables (`.env`)
The file `.env` is already created and configured with your working local credentials:
```ini
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Arihant@006
DB_NAME=orbitwatch_db
DB_RO_USER=orbit_researcher
DB_RO_PASSWORD=Research@Orbit2026
PORT=5000
JWT_SECRET=orbitwatch_super_secure_jwt_secret_key_2026_vit_chennai
NASA_API_KEY=DEMO_KEY
```

### Exact Commands to Start the App
To start both backend API (port 5000) and frontend client (port 3000) concurrently:
```powershell
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in Chrome/Edge.

---

## 2. Verify The Data (Status: Verified by Opencode)

### Row Counts Currently in Your Local MySQL Database
You can re-verify row counts at any time by running:
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p"Arihant@006" -e "USE orbitwatch_db; SELECT 'SATELLITE' AS tbl, COUNT(*) AS cnt FROM SATELLITE UNION ALL SELECT 'DEBRIS', COUNT(*) FROM DEBRIS UNION ALL SELECT 'COLLISION_EVENT', COUNT(*) FROM COLLISION_EVENT UNION ALL SELECT 'DEBRIS_LINEAGE', COUNT(*) FROM DEBRIS_LINEAGE UNION ALL SELECT 'TRACKING_STATION', COUNT(*) FROM TRACKING_STATION UNION ALL SELECT 'OBSERVATION', COUNT(*) FROM OBSERVATION;"
```
- **SATELLITE:** 1,576 real satellites (ISS, Tiangong, Starlink, OneWeb, ISRO, GPS, etc.)
- **DEBRIS:** 2,757 real fragments (1,979 Fengyun-1C fragments, 588 Cosmos 2251 fragments, 109 Iridium 33 fragments, Cosmos 1408)
- **COLLISION_EVENT:** 100 real predicted conjunctions from CelesTrak SOCRATES
- **DEBRIS_LINEAGE:** 2,679 lineage graph associations
- **TRACKING_STATION:** 12 verified facilities (ISRO NETRA, Space Fence, Millstone Hill, etc.)
- **OBSERVATION:** 80 partitioned passes (in partitions `p2025` and `p2026`)

### Spot-Check 3 Objects Against Public Catalogs
1. **ISS (ZARYA)** &bull; NORAD `25544` &bull; International Space Station
2. **FENGYUN 1C DEB** &bull; NORAD `29733` &bull; 2007 Chinese ASAT Test Fragment
3. **COSMOS 2251 DEB** &bull; NORAD `34000` &bull; 2009 Collision Fragment

---

## 3. Offline Backup for Demo Day

The day before your evaluation, run:
```powershell
npm run snapshot:export
```
This exports `scripts/snapshots/latest_snapshot.json` (4.05 MB).  
Save this file onto a USB thumb drive. If the evaluation lab has no internet connection or slow WiFi, simply run:
```powershell
npm run snapshot:import
```
The entire application will operate 100% offline with zero external network requests!

---

## 4. Test Every Role and Every Demo Path (Checklist for You)

Run through these clicks before the professor sits down:
- [ ] **Role 1: Administrator (`admin` / `Admin@Orbit2026`)**
  - Navigate to **Catalog**, click **Register Satellite**, fill in test values, click **Commit**. Verify the new satellite appears and the **MySQL Transaction Inspector** shows the executed SQL.
  - Delete the test satellite and verify cascading deletion notice.
- [ ] **Role 2: Space Agency (`isro_admin` / `Agency@Orbit2026`)**
  - Switch role via top navbar dropdown.
  - Navigate to **Stations**, click **Record Radar Pass**, and submit an observation.
- [ ] **Role 3: Satellite Operator (`operator_starlink` / `Operator@Orbit2026`)**
  - Navigate to **Monitor**, select a critical encounter, and click **Escalate Alerts (Cursor Demo)**. Verify the toast notification appears showing escalated count.
- [ ] **Role 4: Research Scientist (`dr_scientist` / `Research@Orbit2026`)**
  - Navigate to **DBMS Lab &rarr; SQL Console**. Run any SELECT query (allowed).
  - Try to execute an INSERT or DELETE query: verify that MySQL native role policy rejects it with **Error 1142 / Access Denied**.
- [ ] **DBMS Lab Demos:**
  - In **SQL Console**, click each of the pre-built queries (Inner Join, Left Join, Self Join, Subqueries, Window Functions).
  - In **Views & Routines**, execute `Fetch_Object_Lineage` to show the Recursive CTE tree.
  - In **ACID Transactions**, click **Execute COMMIT**, **Execute SAVEPOINT**, and **Execute ROLLBACK**.
  - In **Indexing & Pruning**, click **Run Partition-Pruning EXPLAIN** to show MySQL scanning strictly partition `p2026`.
- [ ] **Testing Page:**
  - Click **Run All 12 Test Cases Live**. Verify that all 12 test assertions pass with **100% Pass Rate**.

---

## 5. Things You Must Do Manually (I Cannot Do These For You)

1. **Take Screenshots:**  
   Open `http://localhost:3000` in fullscreen (press F11) and capture clean screenshots of:
   - `LandingPage` (for PPT Slide 1)
   - `Live Orbit Explorer` with detail panel open (for PPT Slide 11)
   - `Conjunction Monitor` with emergency banner (for PPT Slide 12)
   - `Catalog` with DB Inspector expanded (for PPT Slide 5)
   - `Ground Stations` 2D Map (for PPT Slide 13)
   - `DBMS Lab SQL Console` and `Indexing EXPLAIN plan` (for PPT Slides 7 & 9)
   - `Testing Page` with 12 PASS badges (for PPT Slide 14)
2. **Build Final PPT:**  
   Use the slide-by-slide outline in `docs/PPT_OUTLINE.md` to format your PowerPoint slides.
3. **Update Your Written PDF Report:**  
   Copy the sections from `docs/REPORT_UPDATES.md` into your final report document.

---

## 6. Viva Preparation: Presentation Plan (Who Explains What)

### Team Member 1: Pranil Vithlani (25BRS1210) &bull; Frontend & Astrodynamics
- **Focus Pages:** Landing Page, Live Orbit Explorer, Ground Stations, Asteroids & Weather.
- **Key Concepts to Defend:**
  - Three.js GPU-instanced buffer rendering for 60fps performance across thousands of objects.
  - SGP4 Keplerian propagation ($a = (\mu / n^2)^{1/3}$, apogee, perigee, inclination, RAAN).
  - Kinetic energy formula ($E_k = \frac{1}{2}mv^2$) and why 1 cm debris is lethal at 7.6 km/s.
  - Kessler Syndrome cascade dynamics.

### Team Member 2: Arihant Singh (25BRS1230) &bull; Database Architecture & Optimization
- **Focus Pages:** DBMS Lab (Transactions, Indexing, Partitioning, SQL Console).
- **Key Concepts to Defend:**
  - BCNF normalization proof for all relations (no non-superkey determinants).
  - Range table partitioning on `OBSERVATION` by year and EXPLAIN partition pruning proof (`p2026`).
  - Composite indexes `(orbit_class, Perigee_KM)` and `(Satellite_ID, Collision_Risk_Prob)`.
  - ACID transactions: why SAVEPOINT is essential for partial recovery during batch ingestion.

### Team Member 3: Tanzil Hassan (25BRS1201) &bull; Backend APIs, Security & Testing
- **Focus Pages:** Conjunction Monitor, Catalog CRUD & DB Inspector, Testing Suite, Exports.
- **Key Concepts to Defend:**
  - Dual-layer security: Express JWT claims + MySQL native database roles (`role_admin`, `role_agency`, `role_operator`, `role_researcher`).
  - Stored procedures: `Fetch_Object_Lineage` (Recursive CTE) and `Escalate_High_Risk_Events` (explicit CURSOR).
  - Database triggers: `trg_validate_satellite_before_insert` (SIGNAL 45000) and `trg_collision_event_after_insert`.
  - Automated testing suite: how 12 unit tests execute live against MySQL constraints and record in `TEST_RUN`.

---

## 7. The 15 Most Likely Viva Questions & Instant Answers

1. **Q: Why MySQL instead of MongoDB?**  
   *A:* Relational integrity, strict ACID guarantees for flight safety, native B-tree indexing, recursive CTEs for fragment lineage, and partition pruning.
2. **Q: Why is your schema in BCNF?**  
   *A:* In every table, all functional dependency determinants are candidate keys or superkeys. There are zero partial or transitive dependencies.
3. **Q: How does partition pruning work in your OBSERVATION table?**  
   *A:* The table is partitioned by `RANGE (YEAR(observed_at))`. When querying for 2026 records, the MySQL execution optimizer reads only partition `p2026` and prunes all other partitions from disk I/O.
4. **Q: Why are there no foreign keys on the partitioned OBSERVATION table?**  
   *A:* MySQL 8.x Error 1506 disallows foreign keys on partitioned tables. Referential integrity is maintained via high-performance B-tree indexes and application logic.
5. **Q: What does the cursor in Escalate_High_Risk_Events do?**  
   *A:* It iterates row-by-row over open high-risk conjunctions occurring within 48 hours and raises escalated alert records in `ALERT`.
6. **Q: How does the recursive CTE in Fetch_Object_Lineage work?**  
   *A:* An anchor query selects root fragments, and a recursive query joins subsequent child fragments where parent catalog ID matches the previous generation fragment NORAD ID.
7. **Q: What happens if someone tries to insert a satellite with negative altitude?**  
   *A:* Both a table CHECK constraint and trigger `trg_validate_satellite_before_insert` reject the row with `SIGNAL SQLSTATE '45000'`.
8. **Q: How do you handle debris size since radars don't measure physical meters?**  
   *A:* Radar measures Radar Cross Section ($RCS$ in $\text{m}^2$). `Size_Meters` is nullable with an `rcs_size_class` ENUM ('SMALL', 'MEDIUM', 'LARGE') and `is_estimated = 1`.
9. **Q: What is a SAVEPOINT and why is it useful?**  
   *A:* It marks an intermediate state within a transaction, allowing rolling back partial steps without canceling the entire transaction.
10. **Q: How does space weather affect orbital debris?**  
    *A:* Solar flux (F10.7) and geomagnetic storms (Kp index) heat and expand the thermosphere, increasing aerodynamic drag ($F = \frac{1}{2}\rho v^2 C_d A$) and accelerating orbital decay.
11. **Q: What is the difference between SGP4 and standard Keplerian propagation?**  
    *A:* SGP4 accounts for Earth oblateness perturbations ($J_2, J_3, J_4$), gravitational harmonics, and atmospheric drag (BSTAR).
12. **Q: What is the purpose of the AUDIT_LOG table?**  
    *A:* It tracks which user executed which DML statement, recording timestamps, action types, and IP addresses for non-repudiation.
13. **Q: How do you verify non-blocking concurrent reads?**  
    *A:* InnoDB uses Multi-Version Concurrency Control (MVCC) and undo logs so reads are never blocked by concurrent writes.
14. **Q: What happens if an API is down during the evaluation?**  
    *A:* The application serves cached snapshots stored in MySQL and allows loading `latest_snapshot.json` via `npm run snapshot:import`.
15. **Q: What is the threshold for a critical conjunction in your system?**  
    *A:* Miss distance &le; 1.0 km OR Collision probability &ge; $10^{-4}$ ($1 \text{ in } 10,000$).

---

## 8. Venue Checklist for Evaluation Day

- [ ] Laptop charger and mouse packed.
- [ ] MySQL80 service verified running (`Get-Service MySQL80`).
- [ ] Run `npm test` 30 minutes before demo to confirm all 12 tests pass.
- [ ] Run `npm run dev` and open Chrome at `http://localhost:3000`.
- [ ] Press **F11** for clean fullscreen presentation.
- [ ] Keep `scripts/snapshots/latest_snapshot.json` on a USB drive as offline backup.
- [ ] Set browser zoom to 100% or 90% so all HUD glass panels fit comfortably.

---

## 9. Known Limitations & Honest Caveats (Explain Confidently)

1. **Debris Physical Size:** 90%+ of orbital debris has no laser-measured diameter. Sizes in the app are estimated from Radar Cross Section (RCS) and clearly flagged as `is_estimated = 1` in the database.
2. **Space-Track API Integration:** Fully coded in `server/src/services/spacetrack.service.ts`. If no user credentials are provided in `.env`, the app gracefully bypasses it and uses open CelesTrak without error.
3. **Partitioning and Foreign Keys:** MySQL 8.x explicitly forbids foreign keys on partitioned tables (Error 1506). We solved this by creating composite indexes on `Station_ID` and managing integrity in application code.
