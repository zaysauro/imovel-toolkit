import { generateScheduledRows } from "./helpers.js";

export function createContributionMap(config) {
  return generateScheduledRows(config).reduce((map, row) => {
    map.set(row.month, (map.get(row.month) || 0) + row.value);
    return map;
  }, new Map());
}
