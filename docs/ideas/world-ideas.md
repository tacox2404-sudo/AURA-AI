# World ideas + requests (World & Avatar Designer)

What World shipped in `world/day2-living-world`, what could come next, and Issue texts for
things that belong to other areas (copy them into GitHub Issues with the right `area:` label).

## Shipped in Day 2 (all in `src/world/`)

- **Doors between rooms** (`doors.js`): every room has a real door to each other room (up to 6), with a
  doormat and a name sign. Tap it: you walk over, the door swings open, the screen fades and you arrive in
  the other room next to the door back, which closes behind you. Doors are worked out from the room list,
  so nothing is saved and every old house gets them too. Service `world.goToRoom(roomId)`.
- **Better moving**: double-tap = run, press and hold = walk after your finger, a ring shows where you're
  going, Shift runs on a keyboard, you turn to face the thing you tapped, the tapped furniture bounces, and
  the avatar leans into the walk and looks around when idle. Other players turn smoothly.
- **Tap a friend**: you walk up to them, face them and wave.
- **Emotes** (`emotes.js`): 😊 button (or keys 1-7): wave, dance, cheer, jump, laugh, sleepy, and ❤️ in Love
  Nest houses. Everyone in the room sees it (live event `emote`). Service `world.emote(id)`.
- **Time of day + windows** (`daylight.js`): the light follows your real clock (pink morning, golden evening,
  blue night). Windows on free wall spots show the sky; at night lamps, candles, the fireplace, TV and
  arcade glow. Test any hour with `?hour=21` in the address bar.
- **House pet** (`pet.js`): a cat (Love Nest / solo) or puppy (friends / family) with a name from the house
  id. It wanders, comes over when you're far, curls up when you sit, naps at night. Tap it for hearts
  (+1 point, at most every 10 minutes).

## Shipped: the penthouse (`world/penthouse-floors`)

- The whole house is one 3D building: 2 rooms per floor (in the order of `house.rooms`), the Entrance on the
  ground floor with a front door and a garden path, the top floor is the **Penthouse** with a roof terrace
  (parasol + lounger). Rooms on a floor share a wall with an open doorway: just walk through.
- Every floor has a wooden balcony with railings and plants; a **spiral staircase** outside joins them.
  Tap ▲ / ▼ (left side), the stairs, or the ⬆ / ⬇ signs: your avatar walks out, climbs step by step, and the
  camera follows; the next floor appears halfway up. Tap anything in another room or on another floor and
  your avatar walks there by itself. Zoom out to see the whole building.
- Floors above you are hidden, floors below show their outside walls and windows (like a doll's house).

## Next ideas for World (rough order)

0. **Elevator** next to the stairs for big houses, and a **rooftop** you can walk on.

1. **Pet you can name and dress** (collar colour, a little hat). Save it with the house (needs a `house.pet`
   field: see the Social Issue below).
2. **Shared pet**: send the pet's position as a live event so everyone sees it in the same place.
3. **Hug / high five**: when two avatars stand next to each other, a 🤗 button appears for both.
4. **Weather in the windows**: rain or snow outside when it rains in one of the house's cities (`house.cities`).
5. **Seasons**: snow on the window sills in winter, falling leaves in autumn, a tree in December.
6. **Footstep sounds + ambient sound** (rain, fire crackle) with a mute switch.
7. **Wardrobe 2.0**: more hairstyles, shoes, outfits unlocked with points, and a "copy my partner's colours" button.
8. **Photo mode**: hide the buttons, pick an angle, save a picture that goes straight to the Memory gallery.
9. **Garden / outside**: a little yard outside the front door with a bench and a swing.

## Issue texts for other areas

### area:build: "New objects for World's living rooms"
**What:** add catalog items: `cat_bed` (Decor, 1x1, floorOnly), `pet_bowl` (Decor, 1x1), `wall_shelf` (Decor, wall),
`string_lights` (Decor, wall, glows at night), `kitchen_table_set`, `bookstack`, `record_player` (Fun, activity `portal`),
`aquarium` (Decor, 1x1), `hammock` (Seating, 2x1), `swing_chair` (Seating, 1x1).
**Why:** the pet looks for a `cat_bed` to nap in (World will add that once it exists), and new Seating items are
automatically sittable. Glowing items: tell World their id and the height of the light so they glow at night.

### area:build: "Keep doorway cells free"
**What:** in `layout.js`, keep the right wall cell at about 55% of the depth free (doorway to the next room), the left wall
cell at the same spot free, and the right wall cell at z = 1 free (balcony door). The house is now a building with
2 rooms per floor, see `src/world/building.js`.
**Why:** World puts doorways on free wall cells next to the neighbour room. In very full rooms the doorway can end up next to furniture.

### area:build: "Choose which floor a room is on"
**What:** in the Rooms panel, ↑ / ↓ buttons that move a room earlier or later in `house.rooms` (World stacks rooms 2 per floor in that order).
**Why:** people will want to put the bedroom upstairs and the kitchen downstairs.

### area:social: "Save the house pet"
**What:** an optional `house.pet = { name, kind: 'cat' | 'dog', coat }` saved with the house, plus a small "Rename pet" row in the house menu.
**Why:** today the pet's name and look come from the house id, so people can't choose them.

### area:core: "Smoke test steps for doors and emotes"
**What:** in `tests/smoke.mjs`: player A calls `world.goToRoom(<second room id>)` and waits until `store.roomId` is that room;
then `world.emote('wave')` with no errors.
**Why:** protects the new doors and emotes from being broken by other changes.
