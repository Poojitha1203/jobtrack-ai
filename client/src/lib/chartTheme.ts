// Chart colours, validated for colour-blind separation and contrast against the white card surface.
// (The app's status badge colours are NOT used for chart fills — as a set they fail those checks.)

export const SERIES = {
  primary: '#2a78d6',
  secondary: '#eb6834',
} as const;

/** Ordinal light→dark blue for ordered stages (funnel). */
export const ORDINAL_BLUE = ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab'] as const;

export const CHART_INK = {
  grid: '#e1e0d9',
  axis: '#898781',
  baseline: '#c3c2b7',
  secondary: '#52514e',
} as const;

export const AXIS_TICK = { fill: CHART_INK.axis, fontSize: 12 } as const;
