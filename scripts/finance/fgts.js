import { generateScheduledRows } from "./helpers.js";

export function createFgtsMap(config) {
  return generateScheduledRows({
    periodicity: 24,
    ...config,
  }).reduce((map, row) => {
    map.set(row.month, (map.get(row.month) || 0) + row.value);
    return map;
  }, new Map());
}
