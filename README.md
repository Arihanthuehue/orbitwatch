# ORBITWATCH: Space Debris Tracking Platform
**Full-Stack Space Situational Awareness (SSA) Platform &bull; MySQL 8.x InnoDB &bull; Real SGP4 Telemetry**

Built for the **VIT Chennai Fall 2026 DBMS Lab Course Project** by:
- **Pranil Vithlani** (25BRS1210) &bull; Frontend Architecture &bull; 3D Orbit Visualization &bull; Astrodynamics
- **Arihant Singh** (25BRS1230) &bull; Database Architecture &bull; BCNF Normalization &bull; Indexing & Partitioning
- **Tanzil Hassan** (25BRS1201) &bull; Backend REST APIs &bull; RBAC Security &bull; Data Ingestion Pipeline &bull; Automated Tests

---

## 1. Quick Start (One-Command Setup & Run)

### Prerequisites
- **Node.js**: v20.x or higher (`node -v`)
- **MySQL Server**: 8.0.x running locally on port `3306` with user `root` (Password: `Arihant@006`)

### Installation & Launch
```bash
# 1. Install dependencies for root, server, and client
npm run setup

# 2. Run automated test suite (verifies all 12 database test cases against MySQL)
npm test

# 3. Start both backend server (port 5000) and frontend client (port 3000) concurrently
npm run dev
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

---

## 2. Seeded Demo Accounts (One-Click Login Available in UI)

| Role | Username | Password | Access Rights & Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `Admin@Orbit2026` | Full administrative control over schema, users, and all operations. |
| **Space Agency** | `isro_admin` | `Agency@Orbit2026` | ISRO NETRA Directorate; manages satellites & stations, views conjunctions. |
| **Satellite Operator**| `operator_starlink`| `Operator@Orbit2026`| SpaceX Constellation Ops; monitors close approaches & triggers evasions. |
| **Research Scientist**| `dr_scientist` | `Research@Orbit2026`| VIT Space Sciences; sanitized read-only access to public views & SQL console. |

---

## 3. Real Data Sources (Zero Placeholder / Dummy Data)

1. **CelesTrak (celestrak.org)**: 1,500+ active satellites and 2,670+ real debris fragments (Fengyun-1C, Cosmos 2251, Iridium 33, Cosmos 1408) with full Keplerian/SGP4 orbital elements.
2. **CelesTrak SOCRATES**: Real predicted satellite-debris conjunction close approaches with miss distance down to 16 meters, relative velocity, and maximum collision probability.
3. **NOAA Space Weather (SWPC)**: Planetary Kp index, F10.7 solar radio flux, and solar wind speed driving thermospheric density and debris aerodynamic drag ($F_{\text{drag}} = \frac{1}{2}\rho v^2 C_d A$).
4. **NASA NeoWs (api.nasa.gov)**: Near-Earth Asteroid close encounters with velocity vectors and diameter estimates.
5. **12 Ground Tracking Stations**: Kwajalein Space Fence, Millstone Hill, Goldstone, Cobra Dane, RAF Fylingdales, ESA OGS Tenerife, ISRO NETRA SSA Bengaluru, ISTRAC, and MOTR Sriharikota.

---

## 4. Offline Resilience for Evaluation Day

Before entering an isolated or offline evaluation venue, export the current database snapshot:
```bash
npm run snapshot:export
```
This writes a complete JSON dump of all 14 tables to `scripts/snapshots/latest_snapshot.json` (~4.0 MB).  
On a clean machine with no internet access:
```bash
npm run snapshot:import
```
The application will start immediately with 100% real data and display a **"Real Data Active"** status badge.

---

## 5. 10-Minute Live Viva Demonstration Script

1. **0:00 - 2:00 (Landing Page & Architecture - Pranil Vithlani):**  
   Open `http://localhost:3000`. Show the cinematic landing page with glowing 3D Earth, live day/night terminator, and real-time counters (4,333 objects). Navigate to **Explore** and demonstrate 60fps GPU-instanced orbital propagation, camera fly-to, and the slide-in detail panel showing SGP4 elements and kinetic energy ($E_k = \frac{1}{2}mv^2 = 2.81\text{ MJ}$).

2. **2:00 - 4:30 (Conjunctions & Catalog CRUD - Tanzil Hassan):**  
   Click **Monitor** to show real SOCRATES close approaches. Point out the emergency evasive maneuver banner for encounters &le; 1.0 km. Click **Escalate Alerts** to execute the explicit MySQL CURSOR stored procedure live. Jump to **Catalog**, register a new satellite, and show the **MySQL Transaction Inspector** displaying the exact parameterized SQL and affected rows.

3. **4:30 - 7:30 (DBMS Lab & Relational Rigor - Arihant Singh):**  
   Navigate to **DBMS Lab**:
   - **SQL Console:** Execute pre-built Inner, Left, and Self Joins, Correlated Subqueries, and DENSE_RANK() window functions.
   - **Views & Routines:** Execute `Fetch_Object_Lineage(25730)` to show the Recursive CTE breakup tree for the 2007 Chinese ASAT test.
   - **ACID Transactions:** Run the interactive walkthrough for COMMIT, SAVEPOINT error recovery, and ROLLBACK.
   - **Indexing & Pruning:** Run the partition-pruning `EXPLAIN` query proving MySQL scans strictly partition `p2026`.
   - **Security:** Show MySQL native role Error 1142 write rejection for researcher.

4. **7:30 - 9:00 (Testing & Compliance - Tanzil Hassan):**  
   Open **Testing Page** and click **Run All 12 Test Cases Live**. Show all 12 test assertions passing with 100% pass rate in real-time. Jump to **DA3 Checklist** to cross-reference every item in the course rubric.

5. **9:00 - 10:00 (Viva Defense Q&A - Team):**  
   Open **Viva Prep** and demonstrate the flashcards and "Why did we choose X?" design justifications.
