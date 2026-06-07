import type { SensorReading, AuditorAlert } from "./thingsboard";

const now = Date.now();
const mAgo = (m: number) => now - m * 60_000;

export const DUMMY_SENSORS: SensorReading[] = [
  // --- Kitchen ---
  { sensorId: "PIR-KIT-01",       name: "Κίνηση",         sensor_type: "motion",     location: "kitchen",     value: 1,    unit: "boolean", ts: mAgo(2),  battery_pct: 87 },
  { sensorId: "PWR-STOVE-01",     name: "Κουζίνα (ρεύμα)", sensor_type: "power",     location: "kitchen",     value: 1840, unit: "W",       ts: mAgo(1),  battery_pct: null },
  { sensorId: "CON-FRIDGE-01",    name: "Ψυγείο",         sensor_type: "contact",    location: "kitchen",     value: 0,    unit: "boolean", ts: mAgo(11), battery_pct: 92 },
  { sensorId: "WAT-KIT-01",       name: "Νερό νεροχύτη",  sensor_type: "water_flow", location: "kitchen",     value: 2.1,  unit: "L/min",   ts: mAgo(3),  battery_pct: 75 },
  { sensorId: "PRES-KIT-CHAIR-01",name: "Καρέκλα",        sensor_type: "pressure",   location: "kitchen",     value: 1,    unit: "boolean", ts: mAgo(5),  battery_pct: 88 },

  // --- Living Room ---
  { sensorId: "PIR-LIV-01",      name: "Κίνηση",          sensor_type: "motion",     location: "living_room", value: 0,    unit: "boolean", ts: mAgo(8),  battery_pct: 91 },
  { sensorId: "PWR-TV-01",       name: "Τηλεόραση",       sensor_type: "power",      location: "living_room", value: 0,    unit: "W",       ts: mAgo(1),  battery_pct: null },
  { sensorId: "PRES-SOFA-01",    name: "Καναπές",         sensor_type: "pressure",   location: "living_room", value: 0,    unit: "boolean", ts: mAgo(65), battery_pct: 93 },
  { sensorId: "CON-BALC-LIV-01", name: "Μπαλκόνι (αρ.)", sensor_type: "contact",    location: "living_room", value: 0,    unit: "boolean", ts: mAgo(120),battery_pct: 88 },
  { sensorId: "CON-BALC-LIV-02", name: "Μπαλκόνι (δε.)", sensor_type: "contact",    location: "living_room", value: 0,    unit: "boolean", ts: mAgo(120),battery_pct: 85 },

  // --- Bedroom ---
  { sensorId: "PIR-BED-01",      name: "Κίνηση",          sensor_type: "motion",     location: "bedroom",     value: 0,    unit: "boolean", ts: mAgo(34), battery_pct: 79 },
  { sensorId: "PRES-BED-01",     name: "Στρώμα",          sensor_type: "pressure",   location: "bedroom",     value: 0,    unit: "boolean", ts: mAgo(38), battery_pct: 95 },
  { sensorId: "CON-BALC-BED-01", name: "Παράθυρο (αρ.)",  sensor_type: "contact",    location: "bedroom",     value: 0,    unit: "boolean", ts: mAgo(120),battery_pct: 90 },
  { sensorId: "CON-BALC-BED-02", name: "Παράθυρο (δε.)",  sensor_type: "contact",    location: "bedroom",     value: 0,    unit: "boolean", ts: mAgo(120),battery_pct: 89 },

  // --- Bathroom ---
  { sensorId: "PIR-BATH-01",     name: "Κίνηση",          sensor_type: "motion",     location: "bathroom",    value: 0,    unit: "boolean", ts: mAgo(22), battery_pct: 83 },
  { sensorId: "WAT-BATH-01",     name: "Νερό μπάνιου",    sensor_type: "water_flow", location: "bathroom",    value: 0.0,  unit: "L/min",   ts: mAgo(20), battery_pct: 78 },
  { sensorId: "VIB-MED-01",      name: "Χαπιοθήκη",       sensor_type: "vibration",  location: "bathroom",    value: 1,    unit: "boolean", ts: mAgo(28), battery_pct: 81 },

  // --- Entrance ---
  { sensorId: "CON-DOOR-01",     name: "Εξώπορτα",        sensor_type: "contact",    location: "entrance",    value: 0,    unit: "boolean", ts: mAgo(47), battery_pct: 96 },
];

export const DUMMY_ALERTS: AuditorAlert[] = [
  {
    alertId: "alert-stove",
    type: "ACUTE_HAZARD",
    message: "Η κουζίνα είναι αναμμένη (1840W) ενώ δεν ανιχνεύεται κίνηση στον χώρο εδώ και >10 λεπτά.",
    severity: "HIGH",
    ts: mAgo(3),
    active: true,
  },
  {
    alertId: "alert-fridge",
    type: "SUBTLE_DECLINE",
    message: "Το ψυγείο δεν ανοίχτηκε για 2+ ώρες. Πιθανή παράλειψη γεύματος.",
    severity: "MEDIUM",
    ts: mAgo(120),
    active: false,
  },
];
