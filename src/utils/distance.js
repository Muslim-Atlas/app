export const UNIT_SYSTEMS = {
  IMPERIAL: 'imperial',
  METRIC: 'metric',
};

export const UNIT_OPTIONS = [
  { value: UNIT_SYSTEMS.IMPERIAL, label: 'Miles (UK / US)', shortLabel: 'Miles (mi)' },
  { value: UNIT_SYSTEMS.METRIC, label: 'Kilometers (Metric)', shortLabel: 'Kilometers (km)' },
];

/**
 * Formats distance in meters to a localized string according to the selected unit system.
 * @param {number|null} meters 
 * @param {'imperial'|'metric'} unitSystem 
 * @returns {string}
 */
export function formatDistance(meters, unitSystem = UNIT_SYSTEMS.IMPERIAL) {
  if (meters == null || isNaN(meters) || meters < 0) return '—';
  
  if (unitSystem === UNIT_SYSTEMS.METRIC) {
    const km = meters / 1000;
    if (km >= 1) {
      return `${km.toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  }
  
  // Imperial (Miles / Feet) - Default for UK development
  const miles = meters * 0.000621371;
  if (miles >= 0.1) {
    return `${miles.toFixed(1)} mi`;
  }
  return `${Math.round(meters * 3.28084)} ft`;
}
