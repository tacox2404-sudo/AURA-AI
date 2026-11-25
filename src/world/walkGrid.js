// WALK GRID (owned by World): which floor squares are taken by furniture, and a
// simple path finder so avatars walk AROUND furniture instead of through it.
//
// The room floor is a grid of 1x1 cells (same grid the Building area places items on).
// A cell is "blocked" if a piece of furniture stands on it. Flat things like rugs
// (catalog entries with floorOnly: true) don't block: you can walk on a rug.
//
// Positions in the 3D world are centred on the room: x goes from -w/2 to +w/2.

const R = 0.22; // half the width of an avatar's "feet box", in cells

export function makeWalkGrid(room, footprint, itemDef) {
  const [w, d] = room.size;
  const blocked = new Uint8Array(w * d); // 1 = furniture here

  for (const item of room.items) {
    const def = itemDef(item.kind);
    if (def?.floorOnly) continue; // rugs etc. are walkable
    const [sw, sd] = footprint(item) || [1, 1];
    for (let i = 0; i < sw; i++) for (let j = 0; j < sd; j++) {
      const x = item.x + i, z = item.z + j;
      if (x >= 0 && x < w && z >= 0 && z < d) blocked[z * w + x] = 1;
    }
  }

  const inside = (x, z) => x >= 0 && z >= 0 && x < w && z < d;
  const isBlockedCell = (x, z) => !inside(x, z) || blocked[z * w + x] === 1;
  const toCell = (px, pz) => ({ x: Math.floor(px + w / 2), z: Math.floor(pz + d / 2) });
  const cellCenter = (x, z) => ({ x: x + 0.5 - w / 2, z: z + 0.5 - d / 2 });

  /** Can an avatar stand at this world position? (checks the 4 corners of its feet box) */
  function isFreeAt(px, pz) {
    for (const [ox, oz] of [[-R, -R], [R, -R], [-R, R], [R, R]]) {
      const c = toCell(px + ox, pz + oz);
      if (isBlockedCell(c.x, c.z)) return false;
    }
    return true;
  }

  /** Is the straight line from a to b free of furniture? (samples every 10 cm) */
  function lineClear(a, b) {
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const steps = Math.max(1, Math.ceil(len / 0.1));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      if (!isFreeAt(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
    }
    return true;
  }

  // 8 directions. Diagonal steps are only allowed if both side cells are free,
  // so avatars never squeeze between two pieces of furniture touching at a corner.
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  function neighbours(x, z) {
    const out = [];
    for (const [dx, dz] of DIRS) {
      const nx = x + dx, nz = z + dz;
      if (isBlockedCell(nx, nz)) continue;
      if (dx && dz && (isBlockedCell(x + dx, z) || isBlockedCell(x, z + dz))) continue;
      out.push([nx, nz]);
    }
    return out;
  }

  /**
   * Find a walking path from a world position to the nearest of the goal cells.
   * goalCells: array of {x, z} cells (free ones). finalPoint: exact spot to end on (optional).
   * Returns a list of world points {x, z} to walk through, or null if there is no way.
   */
  function findPath(from, goalCells, finalPoint = null) {
    const goals = new Set(goalCells.filter((c) => !isBlockedCell(c.x, c.z)).map((c) => c.z * w + c.x));
    if (!goals.size) return null;
    const start = toCell(from.x, from.z);
    if (!inside(start.x, start.z)) return null;
    // Breadth-first search: spreads out from the start one cell at a time.
    const cameFrom = new Int32Array(w * d).fill(-2);
    const startI = start.z * w + start.x;
    cameFrom[startI] = -1;
    const queue = [startI];
    let found = -1;
    for (let qi = 0; qi < queue.length; qi++) {
      const i = queue[qi];
      if (goals.has(i)) { found = i; break; }
      for (const [nx, nz] of neighbours(i % w, Math.floor(i / w))) {
        const ni = nz * w + nx;
        if (cameFrom[ni] !== -2) continue;
        cameFrom[ni] = i; queue.push(ni);
      }
    }
    if (found < 0) return null;
    // Walk back from the goal to the start to get the list of cells.
    const cells = [];
    for (let i = found; i !== -1; i = cameFrom[i]) cells.unshift(i);
    const points = cells.slice(1).map((i) => cellCenter(i % w, Math.floor(i / w)));
    if (finalPoint && isFreeAt(finalPoint.x, finalPoint.z) && goals.has(startOrEnd(finalPoint))) {
      if (points.length) points[points.length - 1] = finalPoint; else points.push(finalPoint);
    }
    return smooth(from, points);
  }
  const startOrEnd = (p) => { const c = toCell(p.x, p.z); return c.z * w + c.x; };

  /** Skip corners when a straight line is free, so walking looks natural, not zig-zag. */
  function smooth(from, points) {
    const out = []; let cur = from; let i = 0;
    while (i < points.length) {
      let j = points.length - 1;
      while (j > i && !lineClear(cur, points[j])) j--;
      out.push(points[j]); cur = points[j]; i = j + 1;
    }
    return out;
  }

  /** Path to a floor spot. If the spot is under furniture, go to the nearest free cell. */
  function pathToPoint(from, p) {
    const c = toCell(p.x, p.z);
    if (!isBlockedCell(c.x, c.z)) return findPath(from, [c], p);
    return findPath(from, freeCellsAround([c]));
  }

  /** Path to stand next to a piece of furniture (the closest free cell around it). */
  function pathToItem(from, item) {
    const [sw, sd] = footprint(item) || [1, 1];
    const cells = [];
    for (let i = 0; i < sw; i++) for (let j = 0; j < sd; j++) cells.push({ x: item.x + i, z: item.z + j });
    return findPath(from, freeCellsAround(cells));
  }

  /** Free cells touching the given cells. Grows outward if everything nearby is blocked. */
  function freeCellsAround(cells) {
    for (let ring = 1; ring <= Math.max(w, d); ring++) {
      const out = [];
      for (const c of cells) for (let dx = -ring; dx <= ring; dx++) for (let dz = -ring; dz <= ring; dz++) {
        if (!isBlockedCell(c.x + dx, c.z + dz)) out.push({ x: c.x + dx, z: c.z + dz });
      }
      if (out.length) return out;
    }
    return [];
  }

  /** Nearest free standing spot to a world position (used when spawning). */
  function nearestFree(px, pz) {
    if (isFreeAt(px, pz)) return { x: px, z: pz };
    const c = toCell(px, pz);
    const free = freeCellsAround([{ x: Math.min(w - 1, Math.max(0, c.x)), z: Math.min(d - 1, Math.max(0, c.z)) }]);
    if (!free.length) return { x: px, z: pz };
    free.sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z));
    return cellCenter(free[0].x, free[0].z);
  }

  /** Path to stand exactly on one floor cell (used for doors). */
  function pathToCell(from, cell) {
    if (isBlockedCell(cell.x, cell.z)) return findPath(from, freeCellsAround([cell]));
    return findPath(from, [cell], cellCenter(cell.x, cell.z));
  }

  return { isFreeAt, pathToPoint, pathToItem, pathToCell, nearestFree, isBlockedCell, cellCenter, size: [w, d] };
}
