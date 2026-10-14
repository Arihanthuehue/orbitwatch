export type RoleName = 'Administrator' | 'Space Agency' | 'Satellite Operator' | 'Research Scientist';

export interface User {
  userId: number;
  username: string;
  email: string;
  role: RoleName;
  role_name?: RoleName;
  fullName: string;
  organization: string;
}

export interface OrbitObject {
  id: number;
  NORAD_ID: number;
  name: string;
  type: 'SATELLITE' | 'DEBRIS';
  owner: string;
  orbit_class: 'LEO' | 'MEO' | 'GEO' | 'HEO';
  altitude: number;
  inclination: number;
  eccentricity: number;
  mean_motion: number;
  raan: number;
  arg_pericenter: number;
  mean_anomaly: number;
  bstar: number;
  epoch: string;
  rcs_size_class?: 'SMALL' | 'MEDIUM' | 'LARGE' | 'UNKNOWN';
  size_meters?: number;
}

export interface Satellite {
  Satellite_ID: number;
  NORAD_ID: number;
  intl_designator: string;
  Satellite_Name: string;
  Owner_Agency: string;
  Launch_Date: string;
  Operational_Status: 'Active' | 'Inactive' | 'Deorbiting' | 'Destroyed';
  Orbital_Altitude_KM: number;
  Inclination_Deg: number;
  Apogee_KM: number;
  Perigee_KM: number;
  Eccentricity: number;
  Mean_Motion: number;
  RAAN: number;
  Arg_Pericenter: number;
  Mean_Anomaly: number;
  BSTAR: number;
  Epoch: string;
  orbit_class: 'LEO' | 'MEO' | 'GEO' | 'HEO';
  source: string;
  updated_at: string;
}

export interface Debris {
  Debris_ID: number;
  NORAD_ID: number;
  Object_Name: string;
  Size_Meters: number | null;
  rcs_size_class: 'SMALL' | 'MEDIUM' | 'LARGE' | 'UNKNOWN';
  Mass_KG: number | null;
  Velocity_KMS: number;
  Apogee_KM: number;
  Perigee_KM: number;
  Inclination_Deg: number;
  orbit_class: 'LEO' | 'MEO' | 'GEO' | 'HEO';
  Station_ID: number | null;
  Station_Name?: string;
  Parent_Satellite_Name?: string;
  breakup_event_name?: string;
  is_estimated: number;
  Epoch: string;
  source: string;
}

export interface ConjunctionEvent {
  Event_ID: number;
  TCA: string;
  Miss_Distance_KM: number;
  Relative_Velocity: number;
  Collision_Risk_Prob: number;
  risk_level: 'CRITICAL' | 'WARNING' | 'MONITOR' | 'NOMINAL';
  source: 'SOCRATES' | 'computed' | 'manual';
  Satellite_ID: number;
  Sat_NORAD_ID: number;
  Satellite_Name: string;
  Owner_Agency: string;
  Sat_Orbit_Class: string;
  Orbital_Altitude_KM: number;
  Sat_Inclination: number;
  Debris_ID: number;
  Debris_NORAD_ID: number;
  Debris_Name: string;
  rcs_size_class: string;
  Debris_Velocity: number;
  Debris_Apogee: number;
  Debris_Perigee: number;
  seconds_to_tca: number;
}

export interface TrackingStation {
  Station_ID: number;
  Station_Name: string;
  Location_Country: string;
  Sensor_Type: string;
  Latitude: number;
  Longitude: number;
  source_url?: string;
  Total_Observations_Logged?: number;
  Distinct_Satellites_Tracked?: number;
  Distinct_Debris_Tracked?: number;
  Last_Contact_Timestamp?: string;
}

export interface SpaceWeather {
  Weather_ID: number;
  recorded_at: string;
  kp_index: number;
  f10_7_flux: number;
  solar_wind_speed: number;
  xray_flux: number;
  geomagnetic_storm_level: string;
}

export interface NearEarthObject {
  Neo_ID: number;
  neo_reference_id: string;
  name: string;
  estimated_diameter_min_m: number;
  estimated_diameter_max_m: number;
  is_potentially_hazardous: boolean;
  close_approach_date: string;
  miss_distance_km: number;
  miss_distance_lunar: number;
  relative_velocity_kms: number;
  orbiting_body: string;
}

export interface DashboardKPIs {
  totalTrackedObjects: number;
  activeSatellites: number;
  debrisFragments: number;
  criticalConjunctions: number;
  warningConjunctions: number;
  trackingStations: number;
  radarObservationsLogged: number;
  geomagneticStormStatus: string;
  kpIndex: number;
}

export interface TestCase {
  Test_ID: string;
  Category: string;
  Description: string;
  Input_Data: string;
  Expected_Result: string;
}

export interface TestRun {
  Run_ID: number;
  Test_ID: string;
  Executed_At: string;
  Actual_Result: string;
  Pass_Fail: 'PASS' | 'FAIL';
  Execution_Time_MS: number;
  Notes?: string;
}
