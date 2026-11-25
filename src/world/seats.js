// SEATS (owned by World): which furniture you can sit on, exactly where you sit, and which way you face.
// A seat is any catalog item in the "Seating" category. Sofas and benches are 2 cells wide, so they have
// two spots (one per cell); armchairs, chairs and beanbags have one.

// height of the cushion (world units) for each seat, matching the 3D models in src/build/catalog.js
const SEAT_TOP = { sofa: 0.57, armchair: 0.45, chair: 0.53, bench: 0.5, beanbag: 0.55 };
// how far the avatar's hips are above its feet when sitting (see setSitting in avatar.js)
const HIP_BELOW_SEAT = 0.348;

export const isSeat = (def) => !!def && def.cat === 'Seating';

/** The sitting spots of one piece of furniture, in world coordinates.
 *  item: { kind, x, z, rot }, footprint: [w, d] after rotation, bounds: { w, d } of the room. */
export function seatSlots(item, footprint, bounds) {
  const turn = -item.rot * Math.PI / 2;            // the piece is rotated by this around the up axis
  const fx = Math.sin(turn), fz = Math.cos(turn);  // the way the piece faces
  const slots = [];
  for (let i = 0; i < footprint[0]; i++) for (let j = 0; j < footprint[1]; j++) {
    const cx = item.x + i + 0.5 - bounds.w / 2, cz = item.z + j + 0.5 - bounds.d / 2;
    const x = cx - fx * 0.06, z = cz - fz * 0.06;  // a touch towards the backrest
    // a beanbag has no front: face the middle of the room
    const ry = item.kind === 'beanbag' ? Math.atan2(-x, -z) : turn;
    slots.push({ x, z, ry, y: (SEAT_TOP[item.kind] ?? 0.5) - HIP_BELOW_SEAT });
  }
  return slots;
}
