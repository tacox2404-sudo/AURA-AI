# Build 2.0 plan: "Build Studio" (inspired by The Sims)

Goal: building and decorating the house is **fun, customizable and easy**: a full-screen studio, a real
catalogue you browse like a shop, a live preview before you place anything, and objects that **change as
your life together grows** (photos on the frame, trips on the globe, notes on the board).

Owner: Game Director + Building (nobody else has touched Build yet). World/Activities teammates: see "Hand-offs".

## What exists today (and what's missing)
Tap Build, pick a category chip, pick a plain text button, tap the floor. Select an item to rotate/move/delete.
Missing: pictures, descriptions, search, a preview before placing, undo, room tools (paint, floor, size),
house parts (windows, bathrooms, lighting), a full-screen view, and any link between objects and what people do.

## The experience we want
1. **Full-screen Studio.** Tap 🛠️ Build: the top bar and dock slide away, the room fills the screen. One slim tool strip
   (Catalogue · Room · Undo/Redo · Done) and a catalogue that opens like a drawer (bottom on phones, side on desktop).
2. **A catalogue like a shop.** Clusters: 🛋️ Living · 🛏️ Bedroom · 🍳 Kitchen · 🛁 Bathroom · 🎮 Games & fun · 🖼️ Memories & boards ·
   💡 Lighting · 🌿 Plants & decor · 🪟 Walls & windows. Each card has a **picture** (rendered from the real 3D model in the room's colours),
   a name, a one-line description, **style tags** (cozy, modern, retro, cute, nature, night) and, if it does something, **what it does**
   ("Opens Connect Four, live or turn by turn"). Search + style filter.
3. **Place with a preview.** A see-through ghost follows your finger/mouse, green when it fits and red when not; rotate before placing;
   keep placing several; tap Done. Snap to the grid, never block a doorway.
4. **Edit what you placed.** Tap an object: Rotate · Move · Duplicate · Recolour (a palette per item) · Pick up · Delete · Info. Undo / Redo (30 steps).
5. **Room tools.** Paint the walls, change the floor (wood, tiles, carpet, checker), set the mood lighting, **expand or shrink** the room
   (the building adapts by itself), rename, ✨ arrange nicely. Add rooms and choose their floor.
6. **Objects that evolve** (the part that makes it feel alive):
   - the **photo frame** shows the latest photo; the **globe** grows a pin for every planned trip; the **calendar** shows the days left;
   - the **wish-list gift box** gets more boxes and ribbons; the **notes board** fills with sticky notes; the **trophy** gets more cups;
   - plants grow with the shared streak. Everything is read from data the activities already save.
7. **Light popups.** When someone adds something ("📸 Nina added a photo", "✈️ A trip to Lisbon was planned", "🖼️ Leo placed a new lamp")
   a small toast appears for people who are there, and a "While you were away" card lists what changed since your last visit.

## Phases (each one is shippable on its own)
| Phase | What ships | Done when |
| --- | --- | --- |
| 0 | This plan, recent profiles on the login page | plan merged; chips on the login screen |
| 1 | **Catalogue v1**: clusters, descriptions, style tags, picture for every item, search; ~60 new objects (lamps, bathroom, bedroom, kitchen, wall pieces, kids, pets, balcony); trip board | every item has a picture and text; build mode shows the catalogue |
| 2 | **Build Studio UI**: full-screen layout, ghost preview with green/red, multi-place, selection tools, duplicate, recolour, undo/redo | robot places, rotates, undoes an item through the new UI |
| 3 | **Room tools**: wall paint, floors, mood lighting, expand/shrink, floor choice for rooms | resizing a room keeps all furniture inside and the building intact |
| 4 | **Evolving objects** + **activity popups** + "While you were away" | saving a photo/trip/note changes the 3D object for everyone, and a toast appears |
| 5 | Polish: drag to move, real light from lamps at night, sounds, templates ("make my room look like...") | playtest with two phones |

## How it plugs in (contracts, also in docs/CONTRACTS.md as each phase lands)
- Catalog items get: `cluster`, `desc`, `style: []`, `tags`, `colors` (recolour palette), `light` (lamps), `evolves` (which state it reads).
- Services: `build.thumb(kind, theme)` (picture of an item), `build.catalog()` (clusters), `world.ghost(...)` (preview in the 3D room).
- Item data: `item.color` (recolour), room data: `room.theme` (paint), `room.size` (expand), `room.floorStyle`.
- Events: `activity:saved { activity, itemId, roomId, key, value }` (local) and the existing `live:state` (other players) drive both the evolving
  objects and the popups; `feed:add { icon, text, roomId?, itemId? }` is the one place a popup comes from.
- Backend: the "While you were away" feed is saved with the existing `setState(houseId, 'feed', ...)`: no new tables.

## Hand-offs (teammates' Claude: read this)
- **Activities:** keep each activity's saved state shape stable and add it to CONTRACTS ("photos: [{ url, caption, at }]", "trips: [...]").
  One added line in `src/activities/index.js` (`bus.emit('activity:saved', ...)` after a save). Nothing else: the visuals and popups are generic.
- **World:** accept `item.color` and re-draw one object when it changes (`world.refreshItem(itemId)`); lamps with `light` glow at night;
  show the ghost preview (`world.ghost`). Build will keep doorway cells free through the existing walk grid.
- **Social:** the feed popups and "While you were away" live in `src/social/` (the Director does this).

## Risks and how we handle them
- *Weight:* ~100 item thumbnails. Rendered lazily, one tiny offscreen renderer, cached per item+theme.
- *Old houses:* new catalog fields are optional; layouts of existing rooms never change on their own.
- *Phones:* every Studio control works with taps at 390px; the catalogue drawer never covers more than 45% of the screen.
- *Resizing:* shrinking is refused if furniture would fall outside (or offers "arrange nicely" first).
