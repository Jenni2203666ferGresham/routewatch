/**
 * Generates simple ASCII sparklines for latency trends.
 */

const BLOCKS = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

/**
 * Renders a sparkline string from an array of numeric values.
 * Values are normalized to fit within the block character range.
 */
export function renderSparkline(values: number[], width = 10): string {
  if (values.length === 0) return ' '.repeat(width);

  // Take the last `width` values
  const slice = values.slice(-width);
  const padded =
    slice.length < width
      ? [...Array(width - slice.length).fill(0), ...slice]
      : slice;

  const min = Math.min(...padded);
  const max = Math.max(...padded);
  const range = max - min || 1;

  return padded
    .map((v) => {
      const normalized = (v - min) / range;
      const index = Math.round(normalized * (BLOCKS.length - 1));
      return BLOCKS[index];
    })
    .join('');
}

/**
 * Builds a latency history map from an array of raw latency samples
 * keyed by route label.
 */
export function buildSparklineMap(
  history: Map<string, number[]>,
  width = 10
): Map<string, string> {
  const result = new Map<string, string>();
  for (const [route, values] of history.entries()) {
    result.set(route, renderSparkline(values, width));
  }
  return result;
}
