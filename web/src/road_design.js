// A junction gets a small level landing and bounded approaches, not a height copied independently
// from each arm. Fixed outer cells keep the result attached to all existing roads. Interval
// propagation proves a one-block-per-cell surface is possible before touching the terrain.
function openRoadJunctionRails(T, roadSet) {
  let opened = 0;
  for (const [key, y] of roadSet) {
    const [x, , z] = unkey(key), above = T.S.get(x, y + 1, z) || '';
    if (!/:(stone_brick_wall|[a-z_]+_fence)(\[|$)/.test(above)) continue;
    // A new arm can join an existing bridge. Remove the old parapet across its mouth, while
    // leaving every exposed edge guarded. Lower roads passing below a bridge never qualify.
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].every(([a, b]) => roadSet.get(key3(x + a, 0, z + b)) === y)) {
      T.S.del(x, y + 1, z); opened++;
    }
  }
  return opened;
}

function junctionPlatform(T, roads, roadSet, group, order) {
  const lead = (order || roads.map((_, k) => k)).find(k => group.roads.has(k));
  const rd = roads[lead], K = ROAD_KINDS[rd.kind || 'main'];
  const cx = Math.round((group.x0 + group.x1) / 2), cz = Math.round((group.z0 + group.z1) / 2);
  const radius = Math.max(1, Math.min(3, Math.floor((rd.width || K.width) / 2))), reach = radius + 8;
  const nodes = new Map(), dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let target = null, bd = Infinity;
  for (const [key, y] of roadSet) {
    const [x, , z] = unkey(key), d = Math.hypot(x - cx, z - cz);
    if (d > reach || !T.inside(x, z) || T.water[T.idx(x, z)] || T.H(x, z) !== y) continue;
    nodes.set(x + ',' + z, { x, z, old: y, d, adjacent: [], constraints: [] });
    if (d < bd) { bd = d; target = y; }
  }
  if (target == null || !nodes.size) return { ok: false, reason: '桥面或边界处保留原有高度' };
  const queueLo = [], queueHi = [];
  for (const [key, p] of nodes) {
    let boundary = false;
    for (const [a, b] of dirs) {
      const q = (p.x + a) + ',' + (p.z + b);
      if (nodes.has(q)) p.adjacent.push(nodes.get(q));
      else if (roadSet.has(key3(p.x + a, 0, p.z + b))) boundary = true;
      if (nodes.has(q)) {
        p.constraints.push(nodes.get(q));
        const q2 = (p.x + a * 2) + ',' + (p.z + b * 2);
        if (nodes.has(q2)) p.constraints.push(nodes.get(q2));
        else if (roadSet.has(key3(p.x + a * 2, 0, p.z + b * 2))) boundary = true;
      }
    }
    p.fixed = boundary ? p.old : p.d <= radius ? target : null;
    p.lo = p.fixed ?? -Infinity; p.hi = p.fixed ?? Infinity;
    if (p.fixed != null) { queueLo.push(p); queueHi.push(p); }
  }
  for (let i = 0; i < queueLo.length; i++) { const p = queueLo[i]; for (const q of p.constraints) if (q.lo < p.lo - 1) { q.lo = p.lo - 1; queueLo.push(q); } }
  for (let i = 0; i < queueHi.length; i++) { const p = queueHi[i]; for (const q of p.constraints) if (q.hi > p.hi + 1) { q.hi = p.hi + 1; queueHi.push(q); } }
  if ([...nodes.values()].some(p => p.lo > p.hi || (p.fixed != null && (p.lo !== p.fixed || p.hi !== p.fixed))))
    return { ok: false, reason: '引道长度不足，保留原有坡道' };
  const queue = [];
  for (const p of nodes.values()) {
    const t = Math.max(0, Math.min(1, (p.d - radius) / 7)), s = t * t * (3 - 2 * t);
    p.y = Math.max(p.lo, Math.min(p.hi, Math.round(target + (p.old - target) * s))); queue.push(p);
  }
  // The lower envelope of the desired profile is 1-Lipschitz; the lower bounds are too, so
  // this preserves all pinned levels and cannot introduce a two-block lip between road cells.
  for (let i = 0; i < queue.length; i++) { const p = queue[i]; for (const q of p.constraints) if (q.y > p.y + 1) { q.y = p.y + 1; queue.push(q); } }
  let changed = 0, core = 0;
  for (const p of nodes.values()) {
    if (p.d <= radius && p.y === target) core++;
    const surface = T.S.get(p.x, p.old, p.z);
    if (p.y !== p.old) { T.setGround(p.x, p.z, p.y, surface); roadSet.set(key3(p.x, 0, p.z), p.y); changed++; }
    const above = T.S.get(p.x, p.y + 1, p.z);
    if (above && /_slab\[.*type=bottom/.test(above)) T.S.del(p.x, p.y + 1, p.z);
  }
  const slabs = K.slabs || ROAD_KINDS.cobble.slabs;
  let steps = 0;
  for (const p of nodes.values()) {
    const up = dirs.some(([a, b]) => roadSet.get(key3(p.x + a, 0, p.z + b)) === p.y + 1);
    if (!up || T.S.get(p.x, p.y + 1, p.z)) continue;
    const id = (T.S.get(p.x, p.y, p.z) || '').split('[')[0].replace('minecraft:', '');
    T.S.set(p.x, p.y + 1, p.z, B(slabs[id] || 'stone_brick_slab', { type: 'bottom', waterlogged: false })); steps++;
  }
  return { ok: true, changed, core, steps, centre: [cx, target, cz], radius };
}
