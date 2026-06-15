/**
 * Shared helpers for composing parkour stages.
 *
 * Hand-listing ~40 ledges per stage made levels look "basic" and identical, and
 * tuning spacing meant editing every row by hand. These builders generate a
 * weaving climb from a few parameters so spacing (how close / how easy) is a
 * one-line change per stage.
 */

// 0,1,…,n-1,n-2,…,1 — a ping-pong over column indices so the path snakes
// smoothly across the columns instead of teleporting side to side.
function pingPong(n) {
  if (n <= 1) return [0]
  const seq = []
  for (let i = 0; i < n; i++) seq.push(i)
  for (let i = n - 2; i >= 1; i--) seq.push(i)
  return seq
}

/**
 * Build a contiguous, upward zig-zag of pass-through ledges.
 *
 * Ledges are emitted highest-y first (lowest on screen first) so consecutive
 * array entries are always exactly one row apart — keeping vertical gaps
 * uniform and reachable.
 *
 * @param {object}   o
 * @param {number}   o.startY      y of the lowest ledge (nearest the ground)
 * @param {number}   o.endY        stop once the next row would pass above this y
 * @param {number}   o.rowGap      vertical distance between rows (px)
 * @param {number[]} o.columns     center-x positions the path weaves between
 * @param {number}   o.ledgeWidth  ledge width (px)
 * @param {string}   [o.idPrefix]  id prefix for generated ledges
 * @returns {Array} ledge platform objects
 */
export function buildLedgeClimb({
  startY,
  endY,
  rowGap,
  columns,
  ledgeWidth,
  idPrefix = 'ledge',
}) {
  const order = pingPong(columns.length)
  const ledges = []
  let row = 0
  for (let y = startY; y >= endY; y -= rowGap, row++) {
    const cx = columns[order[row % order.length]]
    ledges.push({
      id: `${idPrefix}-${row + 1}`,
      type: 'solid',
      passThrough: true,
      x: Math.round(cx - ledgeWidth / 2),
      y,
      width: ledgeWidth,
      height: 24,
    })
  }
  return ledges
}

/**
 * Return a new ledge list with selected rows turned into crumbling platforms.
 * `pickEvery` controls cadence; the first and last `keepEnds` rows are left
 * solid so a stage always opens and finishes on safe ground.
 */
export function crumbleEvery(ledges, { pickEvery = 4, keepEnds = 3, crumbleAfterMs = 600, respawnAfterMs = 2400 } = {}) {
  return ledges.map((ledge, i) => {
    const inBody = i >= keepEnds && i < ledges.length - keepEnds
    if (!inBody || i % pickEvery !== 0) return ledge
    return {
      ...ledge,
      id: ledge.id.replace('ledge', 'crumble'),
      type: 'crumbling',
      crumbleAfterMs,
      respawnAfterMs,
    }
  })
}

/** Standard left/right boundary walls for a 1600-wide stage. */
export function makeWalls(height) {
  return [
    { id: 'left-wall', type: 'solid', x: 0, y: 0, width: 40, height },
    { id: 'right-wall', type: 'solid', x: 1560, y: 0, width: 40, height },
  ]
}

/** Full-width ground slab the players spawn on. */
export function makeGround(width, y, height = 120) {
  return { id: 'ground', type: 'solid', x: 0, y, width, height }
}
