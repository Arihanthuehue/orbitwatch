/**
 * Orbital Mechanics Math Utilities
 * Formulas aligned with standard astrodynamics & SGP4 reference
 */

export const MU_EARTH = 398600.4418; // km^3 / s^2 (Standard gravitational parameter)
export const RADIUS_EARTH_KM = 6378.137; // WGS-84 Earth equatorial radius

export interface OrbitalElements {
  meanMotion: number; // revs / day
  eccentricity: number; // 0 <= e < 1
  inclination: number; // degrees
  raan?: number; // degrees
  argPericenter?: number; // degrees
  meanAnomaly?: number; // degrees
}

export interface DerivedOrbitalState {
  semiMajorAxisKm: number;
  apogeeKm: number;
  perigeeKm: number;
  meanAltitudeKm: number;
  velocityKms: number;
  orbitClass: 'LEO' | 'MEO' | 'GEO' | 'HEO';
  periodMinutes: number;
}

/**
 * Derives Keplerian state parameters from mean motion and eccentricity
 */
export function deriveOrbitalParameters(elements: OrbitalElements): DerivedOrbitalState {
  const n = elements.meanMotion;
  const e = Math.max(0.000001, elements.eccentricity);

  // Mean motion in radians per second
  const nRadSec = (n * 2.0 * Math.PI) / 86400.0;
  
  // Semi-major axis a = (mu / n^2)^(1/3) in km
  const a = Math.cbrt(MU_EARTH / (nRadSec * nRadSec));

  // Apogee and Perigee altitudes above Earth's surface
  const rp = a * (1.0 - e) - RADIUS_EARTH_KM;
  const ra = a * (1.0 + e) - RADIUS_EARTH_KM;

  const perigeeKm = Math.max(0.1, Math.round(rp * 100) / 100);
  const apogeeKm = Math.max(perigeeKm, Math.round(ra * 100) / 100);
  const meanAltitudeKm = Math.round((a - RADIUS_EARTH_KM) * 100) / 100;

  // Instantaneous circular velocity at mean altitude v = sqrt(mu / a)
  const velocityKms = Math.round(Math.sqrt(MU_EARTH / a) * 1000) / 1000;

  // Period in minutes
  const periodMinutes = Math.round((1440.0 / n) * 100) / 100;

  // Classification
  let orbitClass: 'LEO' | 'MEO' | 'GEO' | 'HEO' = 'LEO';
  if (perigeeKm >= 35000 && apogeeKm <= 36500 && Math.abs(apogeeKm - perigeeKm) < 1000) {
    orbitClass = 'GEO';
  } else if (apogeeKm >= 36000 || (apogeeKm - perigeeKm >= 10000 && apogeeKm > 5000)) {
    orbitClass = 'HEO';
  } else if (apogeeKm < 2000 && perigeeKm < 2000) {
    orbitClass = 'LEO';
  } else if (perigeeKm >= 2000 && apogeeKm < 36000) {
    orbitClass = 'MEO';
  }

  return {
    semiMajorAxisKm: Math.round(a * 100) / 100,
    apogeeKm,
    perigeeKm,
    meanAltitudeKm,
    velocityKms,
    orbitClass,
    periodMinutes
  };
}

/**
 * Infers Owner Agency from satellite name or standard prefix
 */
export function inferOwnerAgency(name: string): string {
  const upper = name.toUpperCase();
  if (upper.includes('STARLINK')) return 'SpaceX (USA)';
  if (upper.includes('ONEWEB')) return 'Eutelsat OneWeb (UK/FR)';
  if (upper.includes('ISS') || upper.includes('ZARYA')) return 'NASA / Roscosmos';
  if (upper.includes('TIANGONG') || upper.includes('CSS') || upper.includes('TIANHE')) return 'CNSA (China)';
  if (upper.includes('CHANDRAYAAN') || upper.includes('MANGALYAAN') || upper.includes('ADITYA') ||
      upper.includes('CARTOSAT') || upper.includes('INSAT') || upper.includes('EOS-') ||
      upper.includes('GSAT') || upper.includes('RISAT') || upper.includes('OCEANSAT')) {
    return 'ISRO (India)';
  }
  if (upper.includes('GALILEO') || upper.includes('SENTINEL') || upper.includes('METOP')) return 'ESA (Europe)';
  if (upper.includes('COSMOS') || upper.includes('SOYUZ') || upper.includes('PROGRESS')) return 'Roscosmos (Russia)';
  if (upper.includes('NAVSTAR') || upper.includes('GPS') || upper.includes('USA-') || upper.includes('DMSP')) return 'US Space Force';
  if (upper.includes('IRIDIUM')) return 'Iridium Communications';
  if (upper.includes('GLOBALSTAR')) return 'Globalstar';
  if (upper.includes('FLOCK') || upper.includes('SKYSAT') || upper.includes('PLANET')) return 'Planet Labs';
  if (upper.includes('FENGYUN') || upper.includes('YAOGAN') || upper.includes('BEIDOU') || upper.includes('CZ-')) return 'CNSA (China)';
  
  return 'International Commercial/Civil';
}
