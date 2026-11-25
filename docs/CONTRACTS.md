# Contracts: how the four areas talk to each other

Areas never import each other's files. They use **events** (bus), **services**
(provide/use) and **shared data shapes** below. If you add or change one, update this
file in the same pull request and tell the team.

## Data shapes

```js
User       = { id, username, avatar: Appearance | null }
Appearance = { skin, hair, hairColor, top, topColor, bottom, bottomColor, hat, hatColor, glasses }  // see src/world/avatar.js OPTIONS

House = {
  id, name,
  type: 'love' | 'friends' | 'family' | 'solo',
  vibe: 'cozy' | 'pastel' | 'modern' | 'retro' | 'nature' | 'night',
  ownerId, inviteCode /* housemates */, guestCode /* guests */,
  members: { [userId]: { role: 'owner' | 'housemate' | 'guest', name } },
  rooms: Room[],
  streak: { count, lastDay: 'YYYY-MM-DD' },
  cities: string[],          // for weather + clocks
}
Room = { id, name, vibe, theme: { floor, wall, accent, wood }, size: [w, d], items: Item[] }
Item = { id, kind /* catalog id */, x, z /* grid cell */, rot /* 0-3 */, activity?, data?: { url?, label?, key? } }

Presence = { userId, name, avatar, roomId, x, z }
Message  = { id, houseId, userId, name, text, kind: 'text' | 'nudge' | 'system', at }
```

Activity state is stored with `backend.getState(houseId, key)` / `setState(...)`.
The default key is `<roomId>:<itemId>:<activityId>`, so every table, board and frame
has its own saved state. Win records are under the key `records`.

## Store (`ctx.store`)

`{ me, house, role, roomId, mode: 'play' | 'build', players: Presence[] }`

## Events (`ctx.bus`)

| Event | Payload | Emitted by | Used by |
| --- | --- | --- | --- |
| `house:entered` | `{ house, role }` | Social | everyone |
| `house:left` | none | Social | everyone |
| `room:goto` | `{ roomId }` | anyone | World (switches room) |
| `world:tap` | `{ target: 'floor' \| 'item', cell: {x,z}, item?, room }` | World | Building (build mode) |
| `item:activate` | `{ item, room }` | World (play mode) | Activities |
| `chat:message` | `Message` | Social | World (speech bubbles) |
| `points:award` | `{ amount, reason }` | anyone | Social |
| `points:changed` | `{ members, mine, streak }` | Social | top bar |
| `game:result` | `{ game, winnerId, players, draw, roomId }` | Activities | Social (points + records) |
| `live:<type>` | live event from another player | Social | the area that sent it |

Live events between players are sent with `ctx.use('live.send')({ type, ...payload })`
and arrive on every other device as `live:<type>`. Types in use: `house-updated`,
`chat`, `state`, `points`, `draw`.

## Services (`ctx.use(name)(...)`)

| Service | Provided by | What it does |
| --- | --- | --- |
| `build.itemMesh(item, theme)` | Building | THREE.Group for a furniture item |
| `build.footprint(item)` | Building | `[w, d]` cells, after rotation |
| `build.itemDef(kind)` | Building | catalog entry |
| `build.makeHouse(answers)` | Building | starter house from onboarding answers |
| `build.houseTypes()`, `build.vibes()` | Building | lists for onboarding |
| `world.openWardrobe(firstTime)` | World | opens the wardrobe |
| `house.save(house)` | Social | saves + tells everyone to reload |
| `live.presence(p)`, `live.send(e)` | Social | live connection |
| `chat.open()`, `chat.send(text, kind)`, `chat.nudge()` | Social | chat |
| `social.openPeople()`, `social.openMenu()`, `social.switchHouse()`, `social.signOut()` | Social | panels |
| `points.open()`, `points.standings()` | Social | scores |
| `activities.open(id, { item, room, key })`, `activities.list()` | Activities | open any activity |

## Backend API (`ctx.backend`, same in demo and Supabase)

`mode`, `getSession`, `signUp`, `signIn`, `signOut`, `updateProfile`,
`listMyHouses`, `createHouse`, `getHouse`, `saveHouse`, `joinWithCode`,
`setMemberRole(houseId, userId, 'housemate' | 'guest') -> House`, `removeMember(houseId, userId) -> House`, `leaveHouse(houseId)`,
`listMessages`, `sendMessage`, `getState`, `setState`, `addPoints`, `listPoints`,
`connect(houseId, me, { onPresence, onEvent }) -> { updatePresence, send, leave }`,
`generateRoom(prompt, catalogIds, activityIds)`, `linkPreview(url)`.

Member rules (demo and Supabase behave the same): housemates can promote/remove guests; only the owner
can demote/remove housemates; the owner can't be changed, removed or leave. After changing members,
send the existing `house-updated` live event so everyone reloads.

Changing this API means changing BOTH `local.js` and `supabase.js` (lead only).
