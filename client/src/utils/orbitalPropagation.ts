/**
 * Orbital Coordinate Calculations for 3D Globe Visualization
 * Earth Radius in 3D scene units = 1.0 (Earth Sphere Radius)
 * 1 scene unit = 6378.137 km
 */

export const EARTH_RADIUS_SCENE = 1.0;
export const EARTH_RADIUS_KM = 6378.137;

export interface CartesianPosition {
  x: number;
  y: number;
  z: number;
  altitudeKm: number;
}

/**
 * Propagates simplified Keplerian orbit to get 3D Cartesian coordinates
 * at a given simulation epoch (timestamp in ms)
 */
export function getCartesianPosition(
  orbit: {
    altitude: number;
    inclination: number;
    mean_motion: number;
    raan?: number;
    arg_pericenter?: number;
    mean_anomaly?: number;
    eccentricity?: number;
  },
  timeMs: number
): CartesianPosition {
  const incRad = ((orbit.inclination || 0) * Math.PI) / 180.0;
  const raanRad = ((orbit.raan || 0) * Math.PI) / 180.0;
  const argPericenterRad = ((orbit.arg_pericenter || 0) * Math.PI) / 180.0;
  const meanMotionRevsPerDay = orbit.mean_motion || 14.5;

  // Mean angular speed in radians per second
  const meanSpeedRadPerSec = (meanMotionRevsPerDay * 2 * Math.PI) / 86400.0;

  // Current true anomaly approximation
  const timeSec = timeMs / 1000.0;
  const meanAnomalyNow = (((orbit.mean_anomaly || 0) * Math.PI) / 180.0) + (meanSpeedRadPerSec * timeSec);

  // Scaled orbital radius in scene coordinates
  const altKm = Math.max(150, orbit.altitude || 500);
  const rScene = (EARTH_RADIUS_KM + altKm) / EARTH_RADIUS_KM;

  // Orbital plane coordinates (x_orb, y_orb)
  const u = argPericenterRad + meanAnomalyNow;
  const xOrb = rScene * Math.cos(u);
  const yOrb = rScene * Math.sin(u);

  // Rotate by inclination and RAAN into Earth-Centered Inertial (ECI) coordinates
  const cosRaan = Math.cos(raanRad);
  const sinRaan = Math.sin(raanRad);
  const cosInc = Math.cos(incRad);
  const sinInc = Math.sin(incRad);

  const x = xOrb * cosRaan - yOrb * cosInc * sinRaan;
  const z = xOrb * sinRaan + yOrb * cosInc * cosRaan;
  const y = yOrb * sinInc;

  return { x, y, z, altitudeKm: altKm };
}

/**
 * Generates an array of 3D points forming the full orbit ellipse path
 */
export function generateOrbitPathPoints(
  orbit: {
    altitude: number;
    inclination: number;
    raan?: number;
    arg_pericenter?: number;
  },
  segments = 96
): [number, number, number][] {
  const points: [number, number, number][] = [];
  const incRad = ((orbit.inclination || 0) * Math.PI) / 180.0;
  const raanRad = ((orbit.raan || 0) * Math.PI) / 180.0;
  const argPericenterRad = ((orbit.arg_pericenter || 0) * Math.PI) / 180.0;

  const altKm = Math.max(150, orbit.altitude || 500);
  const rScene = (EARTH_RADIUS_KM + altKm) / EARTH_RADIUS_KM;

  const cosRaan = Math.cos(raanRad);
  const sinRaan = Math.sin(raanRad);
  const cosInc = Math.cos(incRad);
  const sinInc = Math.sin(incRad);

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * 2 * Math.PI;
    const u = argPericenterRad + theta;

    const xOrb = rScene * Math.cos(u);
    const yOrb = rScene * Math.sin(u);

    const x = xOrb * cosRaan - yOrb * cosInc * sinRaan;
    const z = xOrb * sinRaan + yOrb * cosInc * cosRaan;
    const y = yOrb * sinInc;

    points.push([x, y, z]);
  }

  return points;
}

/**
 * Converts Geographic (Lat, Lon, Alt) to 3D Cartesian Scene coordinates
 */
export function latLonToVector3(lat: number, lon: number, radius = 1.0): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return [x, y, z];
}
