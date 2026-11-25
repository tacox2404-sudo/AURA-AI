// DEMO backend: everything lives in this browser (localStorage), and open tabs on the
// same computer see each other live through BroadcastChannel.
// It has EXACTLY the same API as supabase.js, so every feature works in both.
// Open the game in two tabs, sign in as two different users, and you can play together.

import { uid } from '../store.js';

const mem = new Map(); // fallback when localStorage is blocked
const read = (k, fallback) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
  catch { return mem.has(k) ? mem.get(k) : fallback; }
};
const write = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { mem.set(k, v); }
};
const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return String(h); };
const code = () => Math.random().toString(36).slice(2, 8).toUpperCase();

// Finds the house, who is asking (`me` = the user signed in on THIS tab) and the person being changed.
function roleContext(houseId, userId, me) {
  const all = read('op:houses', {});
  const house = all[houseId];
  if (!me) throw new Error('Not signed in');
  if (!house) throw new Error('House not found');
  const mine = house.members?.[me]?.role;
  if (!mine) throw new Error('You are not in this house');
  return { all, house, me, mine, target: userId ? house.members[userId] : null };
}

export function createLocalBackend() {
  const users = () => read('op:users', {});
  const houses = () => read('op:houses', {});
  let current = null; // who is signed in on THIS tab (op:session is shared by all tabs in demo mode)
  const actingUser = () => { const id = current || read('op:session', null); if (!id) throw new Error('Not signed in'); return id; };

  return {
    mode: 'demo',

    // ---------- accounts ----------
    async getSession() {
      const id = current || read('op:session', null);
      if (id && users()[id]) { current = id; return strip(users()[id]); }
      return null;
    },
    async signUp(username, password) {
      username = username.trim();
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) throw new Error('Username: 3-20 letters, numbers or _');
      if (password.length < 6) throw new Error('Password needs at least 6 characters');
      const all = users();
      if (Object.values(all).some((u) => u.username.toLowerCase() === username.toLowerCase())) throw new Error('That username is taken');
      const user = { id: uid('u_'), username, pw: hash(password), avatar: null };
      all[user.id] = user; write('op:users', all); write('op:session', user.id); current = user.id;
      return strip(user);
    },
    async signIn(username, password) {
      const user = Object.values(users()).find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
      if (!user || user.pw !== hash(password)) throw new Error('Wrong username or password');
      write('op:session', user.id); current = user.id;
      return strip(user);
    },
    async signOut() { current = null; write('op:session', null); },
    async updateProfile(user) {
      const all = users();
      if (all[user.id]) { all[user.id] = { ...all[user.id], avatar: user.avatar }; write('op:users', all); }
      return user;
    },

    // ---------- houses ----------
    async listMyHouses(userId) {
      return Object.values(houses()).filter((h) => h.members?.[userId]);
    },
    async createHouse(draft, me) {
      const house = {
        ...draft,
        id: uid('h_'),
        ownerId: me.id,
        inviteCode: code(),
        guestCode: code(),
        members: { [me.id]: { role: 'owner', name: me.username } },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const all = houses(); all[house.id] = house; write('op:houses', all);
      return house;
    },
    async getHouse(id) { return houses()[id] || null; },
    async saveHouse(house) {
      const all = houses();
      // keep members from storage (they are managed by joinWithCode only)
      all[house.id] = { ...house, members: all[house.id]?.members || house.members, updatedAt: Date.now() };
      write('op:houses', all);
      return all[house.id];
    },
    async joinWithCode(rawCode, me) {
      const c = rawCode.trim().toUpperCase();
      const all = houses();
      const house = Object.values(all).find((h) => h.inviteCode === c || h.guestCode === c);
      if (!house) throw new Error('No house found with that code');
      const role = house.inviteCode === c ? 'housemate' : 'guest';
      const existing = house.members[me.id]?.role;
      if (!existing || (existing === 'guest' && role === 'housemate')) house.members[me.id] = { role, name: me.username };
      write('op:houses', all);
      return { house, role: house.members[me.id].role };
    },

    // ---------- member roles (same rules as the SQL functions in supabase/schema.sql) ----------
    // Housemates can promote/remove guests; only the owner can demote/remove housemates;
    // the owner can never be changed or removed, and cannot leave their own house.
    async setMemberRole(houseId, userId, role) {
      const { all, house, mine, target } = roleContext(houseId, userId, current);
      if (!['housemate', 'guest'].includes(role)) throw new Error('Role must be housemate or guest');
      if (mine === 'guest') throw new Error('Only housemates can change roles');
      if (!target) throw new Error('That person is not in this house');
      if (target.role === 'owner') throw new Error("The owner's role cannot be changed");
      if (target.role === 'housemate' && role === 'guest' && mine !== 'owner') throw new Error('Only the owner can make a housemate a guest');
      target.role = role;
      write('op:houses', all);
      return house;
    },
    async removeMember(houseId, userId) {
      const { all, house, me, mine, target } = roleContext(houseId, userId, current);
      if (userId === me) throw new Error('Use "Leave house" to leave yourself');
      if (mine === 'guest') throw new Error('Only housemates can remove people');
      if (!target) throw new Error('That person is not in this house');
      if (target.role === 'owner') throw new Error('The owner cannot be removed');
      if (target.role === 'housemate' && mine !== 'owner') throw new Error('Only the owner can remove a housemate');
      delete house.members[userId];
      write('op:houses', all);
      return house;
    },
    async leaveHouse(houseId) {
      const { all, house, me, mine } = roleContext(houseId, null, current);
      if (mine === 'owner') throw new Error('The owner cannot leave their own house');
      delete house.members[me];
      write('op:houses', all);
    },

    // ---------- friends (same rules as the SQL functions in supabase/schema.sql) ----------
    // A request goes from one user to another and stays 'pending' until accepted.
    // If both people ask each other, they become friends right away.
    async sendFriendRequest(username) {
      const me = actingUser();
      const other = Object.values(users()).find((u) => u.username.toLowerCase() === String(username).trim().toLowerCase());
      if (!other) throw new Error('No player with that username');
      if (other.id === me) throw new Error('That is you!');
      const list = read('op:friends', []);
      const mine = list.find((f) => f.from === me && f.to === other.id);
      const theirs = list.find((f) => f.from === other.id && f.to === me);
      if (mine?.status === 'accepted' || theirs?.status === 'accepted') throw new Error('You are already friends');
      if (mine) throw new Error('Request already sent');
      if (theirs) { theirs.status = 'accepted'; write('op:friends', list); return 'accepted'; }
      list.push({ from: me, to: other.id, status: 'pending' });
      write('op:friends', list);
      return 'sent';
    },
    async respondFriendRequest(userId, accept) {
      const me = actingUser();
      const list = read('op:friends', []);
      const req = list.find((f) => f.from === userId && f.to === me && f.status === 'pending');
      if (!req) throw new Error('No request from that person');
      if (accept) req.status = 'accepted';
      else list.splice(list.indexOf(req), 1);
      write('op:friends', list);
    },
    async removeFriend(userId) {
      const me = actingUser();
      write('op:friends', read('op:friends', []).filter((f) => !((f.from === me && f.to === userId) || (f.from === userId && f.to === me))));
    },
    // -> [{ id, username, avatar, status: 'friend' | 'incoming' | 'outgoing' }]
    async listFriends() {
      const me = actingUser();
      const all = users();
      return read('op:friends', []).filter((f) => f.from === me || f.to === me).map((f) => {
        const otherId = f.from === me ? f.to : f.from;
        const o = all[otherId] || { username: 'someone', avatar: null };
        return { id: otherId, username: o.username, avatar: o.avatar || null, status: f.status === 'accepted' ? 'friend' : f.from === me ? 'outgoing' : 'incoming' };
      });
    },

    // ---------- chat ----------
    async listMessages(houseId, limit = 60) { return read(`op:msgs:${houseId}`, []).slice(-limit); },
    async sendMessage(msg) {
      const list = read(`op:msgs:${msg.houseId}`, []);
      const full = { ...msg, id: uid('m_'), at: Date.now() };
      list.push(full); write(`op:msgs:${msg.houseId}`, list.slice(-300));
      return full;
    },

    // ---------- shared activity state (key/value per house) ----------
    async getState(houseId, key) { return read(`op:kv:${houseId}:${key}`, null); },
    async setState(houseId, key, value) { write(`op:kv:${houseId}:${key}`, value); return value; },

    // ---------- points ----------
    async addPoints(houseId, userId, amount, reason) {
      const list = read(`op:pts:${houseId}`, []);
      list.push({ userId, amount, reason, at: Date.now() });
      write(`op:pts:${houseId}`, list.slice(-2000));
    },
    async listPoints(houseId) { return read(`op:pts:${houseId}`, []); },

    // ---------- live (presence + events) ----------
    connect(houseId, me, { onPresence, onEvent }) {
      let ch = null;
      try { ch = new BroadcastChannel(`op-live-${houseId}`); } catch { /* not supported */ }
      const peers = new Map();
      let mine = null;
      const publishPresence = () => onPresence([...peers.values()]);
      const post = (m) => { try { ch?.postMessage(m); } catch {} };
      if (ch) ch.onmessage = ({ data }) => {
        if (!data || data.from === me.id) return;
        if (data.t === 'presence') { peers.set(data.from, { ...data.p, seen: Date.now() }); publishPresence(); }
        else if (data.t === 'leave') { peers.delete(data.from); publishPresence(); }
        else if (data.t === 'hello') { if (mine) post({ t: 'presence', from: me.id, p: mine }); }
        else if (data.t === 'event') onEvent(data.e);
      };
      const beat = setInterval(() => {
        if (mine) post({ t: 'presence', from: me.id, p: mine });
        let changed = false;
        for (const [id, p] of peers) if (Date.now() - p.seen > 7000) { peers.delete(id); changed = true; }
        if (changed) publishPresence();
      }, 2000);
      post({ t: 'hello', from: me.id });
      return {
        updatePresence(p) { mine = { ...p, userId: me.id }; post({ t: 'presence', from: me.id, p: mine }); },
        send(e) { post({ t: 'event', from: me.id, e: { ...e, from: me.id } }); },
        leave() { post({ t: 'leave', from: me.id }); clearInterval(beat); try { ch?.close(); } catch {} },
      };
    },

    // ---------- AI + link previews (need the Supabase functions) ----------
    async generateRoom() { return null; }, // null = use the built-in keyword generator
    async linkPreview() { return null; },
  };
}

function strip(u) { const { pw, ...rest } = u; return rest; }
