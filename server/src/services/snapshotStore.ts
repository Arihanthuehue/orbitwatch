import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SnapshotData {
  _meta?: any[];
  TRACKING_STATION: any[];
  ROLE: any[];
  APP_USER: any[];
  SATELLITE: any[];
  DEBRIS: any[];
  COLLISION_EVENT: any[];
  DEBRIS_LINEAGE: any[];
  OBSERVATION: any[];
  SPACE_WEATHER: any[];
  NEAR_EARTH_OBJECT: any[];
  ALERT: any[];
  TEST_CASE: any[];
}

let cachedSnapshot: SnapshotData | null = null;

export function getOfflineSnapshot(): SnapshotData | null {
  if (cachedSnapshot) return cachedSnapshot;

  const possiblePaths = [
    path.resolve(process.cwd(), '../scripts/snapshots/latest_snapshot.json'),
    path.resolve(process.cwd(), 'scripts/snapshots/latest_snapshot.json'),
    path.resolve(__dirname, '../../../scripts/snapshots/latest_snapshot.json'),
    path.resolve(__dirname, '../../scripts/snapshots/latest_snapshot.json')
  ];

  const snapPath = possiblePaths.find((p) => fs.existsSync(p));
  if (snapPath) {
    try {
      const raw = fs.readFileSync(snapPath, 'utf-8');
      cachedSnapshot = JSON.parse(raw);
      console.log(`✓ Loaded real snapshot fallback from: ${snapPath}`);
      return cachedSnapshot;
    } catch (e: any) {
      console.warn('Error reading snapshot:', e.message);
    }
  }

  return null;
}
