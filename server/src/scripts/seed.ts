import bcrypt from 'bcryptjs';
import pool from '../db.js';

export async function seedStaticData() {
  console.log('--- Starting Static Data Seeding ---');
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Seed Roles
    const roles = [
      {
        role_name: 'Administrator',
        description: 'Full administrative access across all tables, users, procedures, and schema controls',
        permissions: ['*']
      },
      {
        role_name: 'Space Agency',
        description: 'Manages satellite and ground station registries, views full conjunction assessments',
        permissions: ['satellites:write', 'stations:write', 'conjunctions:read', 'observations:write']
      },
      {
        role_name: 'Satellite Operator',
        description: 'Monitors asset conjunctions, updates operational status and performs maneuver escalations',
        permissions: ['satellites:update_status', 'conjunctions:read', 'alerts:update']
      },
      {
        role_name: 'Research Scientist',
        description: 'Educational read-only access to public catalogs, space weather, and lineage graphs',
        permissions: ['catalog:read', 'weather:read', 'lineage:read', 'console:readonly']
      }
    ];

    for (const r of roles) {
      await conn.query(
        `INSERT INTO ROLE (role_name, description, permissions_json)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description), permissions_json = VALUES(permissions_json)`,
        [r.role_name, r.description, JSON.stringify(r.permissions)]
      );
    }
    console.log('✓ Roles seeded.');

    // 2. Seed Demo Users with bcrypt hashes (salt rounds = 10)
    const users = [
      {
        username: 'admin',
        email: 'admin@orbitwatch.org',
        password: 'Admin@Orbit2026',
        role_name: 'Administrator',
        full_name: 'System Administrator (OrbitWatch)',
        organization: 'VIT Chennai DBMS Lab'
      },
      {
        username: 'isro_admin',
        email: 'agency@isro.gov.in',
        password: 'Agency@Orbit2026',
        role_name: 'Space Agency',
        full_name: 'Dr. K. Sivan SSA Directorate',
        organization: 'ISRO NETRA SSA'
      },
      {
        username: 'operator_starlink',
        email: 'operator@starlink.com',
        password: 'Operator@Orbit2026',
        role_name: 'Satellite Operator',
        full_name: 'Flight Dynamics Operator #4',
        organization: 'SpaceX Constellation Ops'
      },
      {
        username: 'dr_scientist',
        email: 'scientist@vit.ac.in',
        password: 'Research@Orbit2026',
        role_name: 'Research Scientist',
        full_name: 'Prof. Orbital Mechanics',
        organization: 'VIT Chennai Space Sciences'
      }
    ];

    for (const u of users) {
      const hash = await bcrypt.hash(u.password, 10);
      await conn.query(
        `INSERT INTO APP_USER (username, email, password_hash, role_name, full_name, organization)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role_name = VALUES(role_name)`,
        [u.username, u.email, hash, u.role_name, u.full_name, u.organization]
      );
    }
    console.log('✓ Demo users seeded.');

    // 3. Seed Real Ground Tracking Stations
    const stations = [
      {
        name: 'US Space Fence',
        country: 'Marshall Islands (Kwajalein)',
        lat: 8.7167,
        lon: 167.7333,
        sensor: 'Advanced S-band Digital Phased Array Radar',
        url: 'https://www.spaceforce.mil/'
      },
      {
        name: 'Millstone Hill Radar',
        country: 'United States',
        lat: 42.6194,
        lon: -71.4914,
        sensor: 'High-power UHF Tracking Radar (MIT Lincoln Lab)',
        url: 'https://www.haystack.mit.edu/'
      },
      {
        name: 'Haystack Radar (HUSIR)',
        country: 'United States',
        lat: 42.6233,
        lon: -71.4886,
        sensor: 'X-band / W-band High Resolution Radar',
        url: 'https://www.ll.mit.edu/'
      },
      {
        name: 'Goldstone Deep Space Complex',
        country: 'United States',
        lat: 35.4267,
        lon: -116.8900,
        sensor: 'Radar & 70m/34m Deep Space Parabolic Dish',
        url: 'https://www.jpl.nasa.gov/'
      },
      {
        name: 'Cobra Dane (AN/FPS-108)',
        country: 'United States (Shemya, AK)',
        lat: 52.7375,
        lon: 174.0931,
        sensor: 'L-band Single-face Phased Array Radar',
        url: 'https://www.spaceforce.mil/'
      },
      {
        name: 'RAF Fylingdales',
        country: 'United Kingdom',
        lat: 54.3606,
        lon: -0.6697,
        sensor: '3-face Solid State Phased Array Radar (SSPAR)',
        url: 'https://www.raf.mod.uk/our-organisation/stations/raf-fylingdales/'
      },
      {
        name: 'ESA Optical Ground Station',
        country: 'Spain (Tenerife)',
        lat: 28.3005,
        lon: -16.5100,
        sensor: '1-meter Zeiss Telescope (Optical & SLR)',
        url: 'https://www.esa.int/'
      },
      {
        name: 'ISRO NETRA SSA Control Centre',
        country: 'India (Bengaluru)',
        lat: 13.0333,
        lon: 77.5167,
        sensor: 'Dedicated SSA Control Centre & Radar Network',
        url: 'https://www.isro.gov.in/NETRA.html'
      },
      {
        name: 'ISTRAC Ground Station',
        country: 'India (Bengaluru)',
        lat: 13.0358,
        lon: 77.5147,
        sensor: 'Multi-mission TTC Station (S/X Band)',
        url: 'https://www.isro.gov.in/ISTRAC.html'
      },
      {
        name: 'ISRO Multi-Object Tracking Radar (MOTR)',
        country: 'India (Sriharikota)',
        lat: 13.7200,
        lon: 80.2300,
        sensor: 'L-Band Active Electronically Steered Radar (AESA)',
        url: 'https://www.shar.gov.in/'
      },
      {
        name: 'GEODSS Diego Garcia',
        country: 'British Indian Ocean Territory',
        lat: -7.3133,
        lon: 72.4222,
        sensor: 'Electro-Optical Deep Space Surveillance',
        url: 'https://www.spaceforce.mil/'
      },
      {
        name: 'Zimmerwald Observatory',
        country: 'Switzerland',
        lat: 46.8770,
        lon: 7.4650,
        sensor: '1m ZIMLAT Optical Telescope & Laser Ranging',
        url: 'https://www.aiub.unibe.ch/'
      }
    ];

    for (const s of stations) {
      await conn.query(
        `INSERT INTO TRACKING_STATION (Station_Name, Location_Country, Latitude, Longitude, Sensor_Type, source_url)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE Location_Country = VALUES(Location_Country), Sensor_Type = VALUES(Sensor_Type)`,
        [s.name, s.country, s.lat, s.lon, s.sensor, s.url]
      );
    }
    console.log(`✓ ${stations.length} tracking stations seeded.`);

    // 4. Seed Test Cases for Automated Verification Suite
    const testCases = [
      {
        id: 'TC-01',
        category: 'Constraints',
        desc: 'Reject satellite insertion with negative altitude (Altitude <= 0)',
        input: 'INSERT INTO SATELLITE (..., Orbital_Altitude_KM = -150)',
        expected: 'Signal 45000: Altitude must be strictly greater than 0'
      },
      {
        id: 'TC-02',
        category: 'Constraints',
        desc: 'Reject perigee exceeding apogee (Perigee > Apogee)',
        input: 'INSERT INTO SATELLITE (..., Apogee_KM = 400, Perigee_KM = 600)',
        expected: 'Signal 45000: Perigee altitude cannot exceed Apogee altitude'
      },
      {
        id: 'TC-03',
        category: 'Constraints',
        desc: 'Reject debris velocity out of physical bound (Velocity > 15 km/s)',
        input: 'INSERT INTO DEBRIS (..., Velocity_KMS = 28.5)',
        expected: 'Signal 45000: Debris orbital velocity must be realistic'
      },
      {
        id: 'TC-04',
        category: 'Triggers',
        desc: 'Auto-create Critical Alert on high risk conjunction (Prob >= 1e-4)',
        input: 'INSERT INTO COLLISION_EVENT with Collision_Risk_Prob = 0.0025',
        expected: 'ALERT row created with alert_level = CRITICAL, AUDIT_LOG entry created'
      },
      {
        id: 'TC-05',
        category: 'Triggers',
        desc: 'Archive previous orbital elements on satellite update',
        input: 'UPDATE SATELLITE SET Apogee_KM = Apogee_KM + 10',
        expected: 'Row archived into ORBIT_STATE_HISTORY with timestamp'
      },
      {
        id: 'TC-06',
        category: 'Stored Procedures',
        desc: 'Execute Get_Top10_Risky_Debris ranking top collision threats',
        input: 'CALL Get_Top10_Risky_Debris()',
        expected: 'Returns up to 10 rows ordered by Max_Collision_Risk DESC'
      },
      {
        id: 'TC-07',
        category: 'Stored Procedures',
        desc: 'Recursive CTE lineage graph query on fragment catalog ID',
        input: 'CALL Fetch_Object_Lineage(25730)',
        expected: 'Returns fragment tree with Generation_Level hierarchy'
      },
      {
        id: 'TC-08',
        category: 'Stored Procedures',
        desc: 'Cursor iteration for emergency conjunction escalation',
        input: 'CALL Escalate_High_Risk_Events()',
        expected: 'Iterates cursor and returns Total_Events_Escalated count'
      },
      {
        id: 'TC-09',
        category: 'Scalar Functions',
        desc: 'Validate orbit classification logic across altitude thresholds',
        input: 'SELECT Classify_Orbit(500, 480), Classify_Orbit(35786, 35780)',
        expected: 'Returns LEO and GEO respectively'
      },
      {
        id: 'TC-10',
        category: 'Partitioning',
        desc: 'Partition pruning EXPLAIN plan on OBSERVATION by year',
        input: 'EXPLAIN SELECT ... WHERE observed_at BETWEEN 2026-01-01 AND 2026-12-31',
        expected: 'Partitions scanned shows strictly p2026'
      },
      {
        id: 'TC-11',
        category: 'Security & RBAC',
        desc: 'Enforce read-only restriction for Researcher role',
        input: 'Researcher role executing DELETE FROM SATELLITE',
        expected: 'Access denied / 403 Forbidden'
      },
      {
        id: 'TC-12',
        category: 'Transactions',
        desc: 'Demonstrate Savepoint rollback on partial batch failure',
        input: 'START TRANSACTION; SAVEPOINT sp1; ROLLBACK TO sp1; COMMIT;',
        expected: 'State preserved at savepoint without rolling back entire transaction'
      }
    ];

    for (const tc of testCases) {
      await conn.query(
        `INSERT INTO TEST_CASE (Test_ID, Category, Description, Input_Data, Expected_Result)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE Description = VALUES(Description), Expected_Result = VALUES(Expected_Result)`,
        [tc.id, tc.category, tc.desc, tc.input, tc.expected]
      );
    }
    console.log(`✓ ${testCases.length} test cases seeded.`);

    await conn.commit();
    console.log('--- Static Seeding Successfully Completed ---');
  } catch (err) {
    await conn.rollback();
    console.error('Static Seeding Failed:', err);
    throw err;
  } finally {
    conn.release();
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedStaticData().then(() => process.exit(0)).catch(() => process.exit(1));
}
