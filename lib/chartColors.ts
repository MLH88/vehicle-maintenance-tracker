// Categorical palette (validated for color-vision deficiency in this order).
// Colors are assigned to vehicles by a stable order and never cycled; past
// eight vehicles the rest fold into "Other".
export const SERIES_COLORS = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];

export const OTHER_COLOR = "#898781";

export const CHART_INK = {
  axis: "#64748b", // slate-500
  grid: "#e2e8f0", // slate-200
  surface: "#ffffff",
};
