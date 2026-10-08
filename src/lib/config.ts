/** The only place the map tile provider is referenced. */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** Generous bounding box around New England (used for the initial map view and data validation). */
export const NEW_ENGLAND_BOUNDS = { south: 40.9, west: -73.8, north: 47.5, east: -66.9 } as const;

/** Size class by vertical drop: small < medium ≤ … < large ≤ … */
export const SIZE_THRESHOLDS_FT = { medium: 1000, large: 2000 } as const;

export const CURRENT_SEASON = '2026-27';

export const BEGINNER_TERRAIN_MIN_PCT = 20;
export const EXPERT_TERRAIN_MIN_PCT = 15;

/** Dataset inclusion rule (see spec §6). */
export const MIN_VERTICAL_FT = 500;
