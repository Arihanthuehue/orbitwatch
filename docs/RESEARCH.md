# ORBITWATCH: Space Debris Tracking Platform - Phase 0 Research Report

**Project:** Space Debris Tracking Database Project (DBMS Course Project, VIT Chennai)  
**Authors:** Pranil Vithlani (25BRS1210), Arihant Singh (25BRS1230), Tanzil Hassan (25BRS1201)  
**Date:** October 14, 2026  
**Status:** Verified live against real endpoints  

---

## 1. Verified Data Sources

### 1.1 CelesTrak (celestrak.org)
- **Primary Role:** Live General Perturbations (GP) orbital data, SATCAT satellite catalog, and SOCRATES conjunction assessment.
- **Authentication:** None required (Open Access).
- **Rate Limits:** Polite usage (max 1-2 requests per second; client-side caching enforced).
- **Licensing:** Public Domain / Open Educational Access (Dr. T.S. Kelso / CelesTrak).
- **Verified Endpoints:**
  1. `https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json`
     - Response: JSON array of 16,000+ active satellites with full OMM elements: `OBJECT_NAME`, `OBJECT_ID`, `NORAD_CAT_ID`, `EPOCH`, `MEAN_MOTION`, `ECCENTRICITY`, `INCLINATION`, `RA_OF_ASC_NODE`, `ARG_OF_PERICENTER`, `MEAN_ANOMALY`, `BSTAR`.
  2. `https://celestrak.org/NORAD/elements/gp.php?GROUP={group}&FORMAT=json`
     - Tested Groups:
       - `iridium-33-debris` (109 fragments)
       - `cosmos-2251-debris` (588 fragments)
       - `fengyun-1c-debris` (1,979 fragments)
       - `cosmos-1408-debris` (3 fragments)
  3. `https://celestrak.org/pub/satcat.csv`
     - Response: 6.7 MB comprehensive SATCAT database with 60,000+ objects containing: `OBJECT_NAME`, `OBJECT_ID`, `NORAD_CAT_ID`, `OBJECT_TYPE` (`PAY`, `R/B`, `DEB`), `OPS_STATUS_CODE`, `OWNER`, `LAUNCH_DATE`, `DECAY_DATE`, `PERIOD`, `INCLINATION`, `APOGEE`, `PERIGEE`, `RCS` (radar cross section in m²).
  4. `https://celestrak.org/SOCRATES/sort-minRange.csv`
     - Response: Real predicted satellite-debris conjunctions sorted by minimum range.
     - Fields: `NORAD_CAT_ID_1`, `OBJECT_NAME_1`, `DSE_1`, `NORAD_CAT_ID_2`, `OBJECT_NAME_2`, `DSE_2`, `TCA` (Time of Closest Approach), `TCA_RANGE` (miss distance in km), `TCA_RELATIVE_SPEED` (km/s), `MAX_PROB`, `DILUTION`.

### 1.2 NOAA Space Weather Prediction Center (SWPC)
- **Primary Role:** Real space weather data driving thermospheric density changes and orbital drag decay.
- **Authentication:** None required.
- **Rate Limits:** 60 requests/minute.
- **Licensing:** Public Domain (US Federal Government, NOAA SWPC).
- **Verified Endpoints:**
  1. `https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json` (3-hourly planetary Kp index)
  2. `https://services.swpc.noaa.gov/products/summary/10cm-flux.json` (Solar radio flux F10.7 in sfu)
  3. `https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json` (Proton speed in km/s)
  4. `https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json` (GOES-18 Primary X-ray flux 0.1-0.8 nm)

### 1.3 NASA Near-Earth Object Web Service (NeoWs / JPL SBDB)
- **Primary Role:** Real Near-Earth Asteroid flybys and close encounters.
- **Authentication:** `DEMO_KEY` (or personal `NASA_API_KEY` from `.env`).
- **Rate Limits:** 30 requests/hour with `DEMO_KEY` (cached heavily in DB/memory); 1,000/hour with registered key.
- **Licensing:** Public Domain (NASA open API terms).
- **Verified Endpoint:**
  - `https://api.nasa.gov/neo/rest/v1/feed?start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}&api_key={KEY}`
  - Response: Near-Earth asteroids with miss distance in astronomical units / lunar distances / km, relative velocity in km/s and km/h, and estimated diameter min/max.

### 1.4 Space-Track.org (Optional Enrichment)
- **Primary Role:** High-precision two-line elements, decay messages, TIP messages.
- **Authentication:** Cookie-based session via POST to `https://www.space-track.org/ajaxauth/login` with `SPACETRACK_USER` and `SPACETRACK_PASSWORD`.
- **Policy & Limits:** Max 20 requests/minute, max 300 requests/hour. Strictly avoid scraping during busy hours.
- **Implementation Strategy:** Fully coded in `server/src/services/spacetrack.service.ts`. If `.env` lacks credentials, gracefully bypassed with zero UI degradation.

### 1.5 ESA DISCOS (Database and Information System Characterising Objects in Space)
- **Role:** Precise physical dimensions, cross-sectional areas, mass.
- **Strategy:** If token is absent, cross-reference SATCAT `RCS` radar cross-section value and derive size class (`RCS_SIZE_CLASS`: SMALL <0.1m², MEDIUM 0.1-1.0m², LARGE >1.0m²) with `is_estimated = 1`.

---

## 2. Ground Tracking Stations Network (Verified Real Facilities)

Accurate coordinates, sensor types, and verified operators:

1. **US Space Fence**
   - Location: Kwajalein Atoll, Republic of the Marshall Islands
   - Coordinates: `8.7167° N, 167.7333° E`
   - Sensor Type: Advanced S-band Digital Phased Array Radar (US Space Force)
   - Capabilities: LEO objects down to marble size (~1 cm)
   - Source: `https://www.spaceforce.mil/`

2. **Millstone Hill Radar**
   - Location: Westford, Massachusetts, United States
   - Coordinates: `42.6194° N, 71.4914° W`
   - Sensor Type: High-power UHF Tracking Radar (MIT Lincoln Laboratory / Haystack Observatory)
   - Source: `https://www.haystack.mit.edu/`

3. **Haystack Ultrawideband Satellite Imaging Radar (HUSIR)**
   - Location: Westford, Massachusetts, United States
   - Coordinates: `42.6233° N, 71.4886° W`
   - Sensor Type: X-band / W-band Radar
   - Source: `https://www.ll.mit.edu/`

4. **Goldstone Deep Space Communications Complex (GDSCC)**
   - Location: Mojave Desert, Barstow, California, United States
   - Coordinates: `35.4267° N, 116.8900° W`
   - Sensor Type: Radar & 70m/34m Parabolic Antennas (NASA JPL / DSN)
   - Source: `https://www.jpl.nasa.gov/`

5. **Cobra Dane (AN/FPS-108)**
   - Location: Eareckson Air Station, Shemya, Alaska, United States
   - Coordinates: `52.7375° N, 174.0931° E`
   - Sensor Type: L-band Single-face Phased Array Radar (US Space Force)
   - Source: `https://www.spaceforce.mil/`

6. **RAF Fylingdales**
   - Location: Snod Hill, North Yorkshire, United Kingdom
   - Coordinates: `54.3606° N, 0.6697° W`
   - Sensor Type: 3-face Solid State Phased Array Radar (SSPAR) (UK Space Command / US SSN)
   - Source: `https://www.raf.mod.uk/our-organisation/stations/raf-fylingdales/`

7. **ESA Optical Ground Station (OGS)**
   - Location: Teide Observatory, Tenerife, Canary Islands, Spain
   - Coordinates: `28.3005° N, 16.5100° W`
   - Sensor Type: 1-meter Zeiss Telescope (Optical & Satellite Laser Ranging)
   - Source: `https://www.esa.int/Enabling_Support/Operations/Optical_Ground_Station`

8. **ISRO NETRA SSA Control Centre**
   - Location: Peenya, Bengaluru, Karnataka, India
   - Coordinates: `13.0333° N, 77.5167° E`
   - Sensor Type: Dedicated SSA Control Centre, High-Precision Tracking Radar & Multi-Sensor Fusion
   - Source: `https://www.isro.gov.in/NETRA.html`

9. **ISTRAC Ground Station**
   - Location: Bengaluru, Karnataka, India
   - Coordinates: `13.0358° N, 77.5147° E`
   - Sensor Type: Multi-mission TTC Station (S-Band / X-Band)
   - Source: `https://www.isro.gov.in/ISTRAC.html`

10. **ISRO Multi-Object Tracking Radar (MOTR)**
    - Location: Satish Dhawan Space Centre (SDSC SHAR), Sriharikota, India
    - Coordinates: `13.7200° N, 80.2300° E`
    - Sensor Type: L-Band Active Electronically Steered Phased Array (AESA) Radar
    - Source: `https://www.shar.gov.in/`

11. **GEODSS Diego Garcia**
    - Location: Diego Garcia, British Indian Ocean Territory
    - Coordinates: `-7.3133° S, 72.4222° E`
    - Sensor Type: Ground-based Electro-Optical Deep Space Surveillance (GEODSS)
    - Source: `https://www.spaceforce.mil/`

12. **Zimmerwald Observatory**
    - Location: Zimmerwald, Bern, Switzerland
    - Coordinates: `46.8770° N, 7.4650° E`
    - Sensor Type: 1m ZIMLAT Optical Telescope & Satellite Laser Ranging (SLR)
    - Source: `https://www.aiub.unibe.ch/`

---

## 3. Physics & Orbital Mechanics Formulas

All derived quantities in the database and frontend propagation are governed by verified orbital physics:

1. **Semi-Major Axis ($a$):**
   Derived from mean motion $n$ (revs/day):
   $$n_{\text{rad/s}} = n \times \frac{2\pi}{86400}$$
   $$a = \left( \frac{\mu}{n_{\text{rad/s}}^2} \right)^{1/3}$$
   Where $\mu = 3.986004418 \times 10^{14} \, \text{m}^3/\text{s}^2$ (Earth gravitational parameter).

2. **Apogee ($r_a$) and Perigee ($r_p$) Altitudes:**
   With Earth equatorial radius $R_E = 6378.137 \, \text{km}$:
   $$r_p = a(1 - e) - R_E \, (\text{km})$$
   $$r_a = a(1 + e) - R_E \, (\text{km})$$
   $$\text{Orbital Altitude (mean)} = a - R_E \, (\text{km})$$

3. **Instantaneous Velocity ($v$) via Vis-Viva Equation:**
   $$v = \sqrt{ \mu \left( \frac{2}{r} - \frac{1}{a} \right) }$$
   At circular LEO approximation ($r \approx a \approx 6800 \, \text{km}$):
   $$v \approx \sqrt{\frac{398600}{6800}} \approx 7.65 \, \text{km/s}$$

4. **Debris Kinetic Energy ($E_k$):**
   $$E_k = \frac{1}{2} m v^2$$
   A 100 g ($0.1 \, \text{kg}$) aluminum bolt travelling at $7.5 \, \text{km/s}$ relative velocity possesses:
   $$E_k = \frac{1}{2} (0.1) (7500)^2 = 2.8125 \times 10^6 \, \text{J} = 2.81 \, \text{MJ}$$
   *(Equivalent to the detonation of ~0.67 kg of TNT, capable of catastrophic structural fragmentation).*

5. **Orbit Classification Function:**
   - **LEO (Low Earth Orbit):** $r_p < 2000 \, \text{km}$ and $r_a < 2000 \, \text{km}$
   - **MEO (Medium Earth Orbit):** $2000 \, \text{km} \le r_p < 35786 \, \text{km}$ and $r_a < 35786 \, \text{km}$
   - **GEO (Geostationary Orbit):** $35500 \, \text{km} \le r_p \le 36000 \, \text{km}$ and $e < 0.05$
   - **HEO (High Earth Orbit / Highly Elliptical):** $r_a > 36000 \, \text{km}$ or ($e \ge 0.25$ and $r_a > 10000 \, \text{km}$)

6. **Conjunction Risk Categorization Function:**
   - **CRITICAL / RED:** Miss Distance $\le 1.0 \, \text{km}$ OR Collision Probability $> 10^{-4}$ (Immediate Maneuver Protocol)
   - **WARNING / AMBER:** Miss Distance $\le 5.0 \, \text{km}$ OR Collision Probability between $10^{-5}$ and $10^{-4}$
   - **MONITOR / YELLOW:** Miss Distance $\le 25.0 \, \text{km}$
   - **NOMINAL / GREEN:** Miss Distance $> 25.0 \, \text{km}$

---

## 4. Earth/Space Textures & Public Domain Licensing

To ensure zero broken textures or external asset dependency during the offline evaluation:
1. **NASA Visible Earth Blue Marble** (Equirectangular 2048x1024 / 4096x2048)
   - Source: NASA Earth Observatory (Public Domain)
2. **NASA Night Lights (Black Marble)**
   - Source: NASA Earth Observatory (Public Domain)
3. **NASA Cloud Map**
   - Source: NASA Visible Earth (Public Domain)
4. **Procedural Shader Fallback:**
   - Built directly into `client/src/components/globe/EarthShader.ts`
   - Implements multi-octave Perlin noise for procedural continents, atmosphere Rayleigh glow, Fresnel rim lighting, dynamic sun terminator, and specular ocean reflection. Zero network requests required.

---

## 5. Technology Stack Specifications

- **Database:** MySQL 8.0.46 (Verified running locally on port 3306). Strict SQL mode, InnoDB engine, prepared statements with connection pool.
- **Backend API:** Node.js v20.19.6, Express 4.x, TypeScript 5.x, `mysql2/promise`, `zod`, `helmet`, `cors`, `express-rate-limit`, `jsonwebtoken`, `bcryptjs`, `dotenv`.
- **Frontend SPA:** React 18 / Vite 6, TypeScript, Tailwind CSS 3, Framer Motion, `@react-three/fiber` / `@react-three/drei`, Three.js, `satellite.js` (SGP4), Lucide React, Recharts.
- **Offline Snapshots:** JSON dumps stored in `scripts/snapshots/latest_snapshot.json` with CLI commands `npm run snapshot:export` and `npm run snapshot:import`.
