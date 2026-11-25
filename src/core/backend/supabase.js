// ONLINE backend: Supabase. Same API as local.js.
// Needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see docs/SETUP.md),
// plus the tables from supabase/schema.sql.
//
// Accounts use username + password. Under the hood Supabase needs an email, so we
// turn "maria" into "maria@players.ourplace.game". No email is ever sent
// (turn OFF "Confirm email" in Supabase Auth settings).

import { createClient } from '@supabase/supabase-js';

const EMAIL_DOMAIN = 'players.ourplace.game';
const toEmail = (username) => `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`;

export function createSupabaseBackend(url, anonKey) {
  const sb = createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } });

  const must = ({ data, error }) => { if (error) throw new Error(error.message); return data; };

  async function profile(userId) {
    const { data } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
    return data ? { id: data.id, username: data.username, avatar: data.avatar } : null;
  }

  // Turn DB rows into the house shape the game uses (docs/CONTRACTS.md)
  function toHouse(row, memberRows = []) {
    const members = {};
    for (const m of memberRows) members[m.user_id] = { role: m.role, name: m.name };
    return {
      id: row.id, name: row.name, type: row.type, vibe: row.vibe, ownerId: row.owner_id,
      inviteCode: row.invite_code, guestCode: row.guest_code,
      ...(row.data || {}), members, createdAt: row.created_at, updatedAt: row.updated_at,
    };
  }
  function houseData(h) {
    // everything that isn't a column goes into the jsonb "data" column
    const { id, name, type, vibe, ownerId, inviteCode, guestCode, members, createdAt, updatedAt, ...data } = h;
    return data;
  }

  return {
    mode: 'online',

    // ---------- accounts ----------
    async getSession() {
      const { data } = await sb.auth.getSession();
      const u = data.session?.user;
      return u ? (await profile(u.id)) || { id: u.id, username: u.user_metadata?.username || 'player', avatar: null } : null;
    },
    async signUp(username, password) {
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) throw new Error('Username: 3-20 letters, numbers or _');
      const data = must(await sb.auth.signUp({ email: toEmail(username), password, options: { data: { username: username.trim() } } }));
      if (!data.session) throw new Error('Account made, but "Confirm email" is ON in Supabase. Turn it off (docs/SETUP.md).');
      must(await sb.from('profiles').upsert({ id: data.user.id, username: username.trim(), avatar: null }));
      return { id: data.user.id, username: username.trim(), avatar: null };
    },
    async signIn(username, password) {
      const data = must(await sb.auth.signInWithPassword({ email: toEmail(username), password }));
      return (await profile(data.user.id)) || { id: data.user.id, username: username.trim(), avatar: null };
    },
    async signOut() { await sb.auth.signOut(); },
    async updateProfile(user) {
      must(await sb.from('profiles').upsert({ id: user.id, username: user.username, avatar: user.avatar }));
      return user;
    },

    // ---------- houses ----------
    async listMyHouses(userId) {
      const mine = must(await sb.from('house_members').select('house_id').eq('user_id', userId));
      if (!mine.length) return [];
      const rows = must(await sb.from('houses').select('*').in('id', mine.map((m) => m.house_id)));
      return rows.map((r) => toHouse(r));
    },
    async createHouse(draft, me) {
      const row = must(await sb.rpc('create_house', {
        p_name: draft.name, p_type: draft.type, p_vibe: draft.vibe, p_data: houseData(draft), p_member_name: me.username,
      }));
      return this.getHouse(row);
    },
    async getHouse(id) {
      const row = must(await sb.from('houses').select('*').eq('id', id).maybeSingle());
      if (!row) return null;
      const members = must(await sb.from('house_members').select('*').eq('house_id', id));
      return toHouse(row, members);
    },
    async saveHouse(house) {
      must(await sb.from('houses').update({ name: house.name, vibe: house.vibe, data: houseData(house), updated_at: new Date().toISOString() }).eq('id', house.id));
      return house;
    },
    async joinWithCode(code, me) {
      const res = must(await sb.rpc('join_house', { p_code: code.trim().toUpperCase(), p_member_name: me.username }));
      const house = await this.getHouse(res.house_id);
      return { house, role: res.role };
    },

    // ---------- member roles (the rules live in the SQL functions in supabase/schema.sql) ----------
    async setMemberRole(houseId, userId, role) {
      must(await sb.rpc('set_member_role', { p_house: houseId, p_user: userId, p_role: role }));
      return this.getHouse(houseId);
    },
    async removeMember(houseId, userId) {
      must(await sb.rpc('remove_member', { p_house: houseId, p_user: userId }));
      return this.getHouse(houseId);
    },
    async leaveHouse(houseId) {
      must(await sb.rpc('leave_house', { p_house: houseId }));
    },

    // ---------- visiting friends' houses (the rules live in the SQL functions) ----------
    async listFriendHouses() {
      const rows = must(await sb.rpc('list_friend_houses')) || [];
      return rows.map((r) => ({ id: r.house_id, name: r.name, type: r.type, vibe: r.vibe, ownerId: r.owner_id, ownerName: r.owner_name }));
    },
    async visitHouse(houseId) {
      const res = must(await sb.rpc('visit_house', { p_house: houseId }));
      return { house: await this.getHouse(res.house_id), role: res.role };
    },

    // ---------- friends (the rules live in the SQL functions in supabase/schema.sql) ----------
    async sendFriendRequest(username) { return must(await sb.rpc('send_friend_request', { p_username: username })); }, // 'sent' | 'accepted'
    async respondFriendRequest(userId, accept) { must(await sb.rpc('respond_friend_request', { p_user: userId, p_accept: !!accept })); },
    async removeFriend(userId) { must(await sb.rpc('remove_friend', { p_user: userId })); },
    async listFriends() {
      const rows = must(await sb.rpc('list_friends')) || [];
      return rows.map((r) => ({ id: r.user_id, username: r.username, avatar: r.avatar || null, status: r.status }));
    },

    // ---------- chat ----------
    async listMessages(houseId, limit = 60) {
      const rows = must(await sb.from('messages').select('*').eq('house_id', houseId).order('id', { ascending: false }).limit(limit));
      return rows.reverse().map((r) => ({ id: r.id, houseId: r.house_id, userId: r.user_id, name: r.name, text: r.text, kind: r.kind, at: Date.parse(r.created_at) }));
    },
    async sendMessage(msg) {
      const r = must(await sb.from('messages').insert({ house_id: msg.houseId, user_id: msg.userId, name: msg.name, text: msg.text, kind: msg.kind || 'text' }).select().single());
      return { ...msg, id: r.id, at: Date.parse(r.created_at) };
    },

    // ---------- shared activity state ----------
    async getState(houseId, key) {
      const row = must(await sb.from('house_state').select('value').eq('house_id', houseId).eq('key', key).maybeSingle());
      return row ? row.value : null;
    },
    async setState(houseId, key, value) {
      must(await sb.from('house_state').upsert({ house_id: houseId, key, value, updated_at: new Date().toISOString() }));
      return value;
    },

    // ---------- points ----------
    async addPoints(houseId, userId, amount, reason) {
      must(await sb.from('points').insert({ house_id: houseId, user_id: userId, amount, reason }));
    },
    async listPoints(houseId) {
      const rows = must(await sb.from('points').select('user_id, amount, reason, created_at').eq('house_id', houseId).order('id', { ascending: false }).limit(2000));
      return rows.map((r) => ({ userId: r.user_id, amount: r.amount, reason: r.reason, at: Date.parse(r.created_at) }));
    },

    // ---------- live (Supabase Realtime: presence + broadcast) ----------
    connect(houseId, me, { onPresence, onEvent }) {
      const ch = sb.channel(`house:${houseId}`, { config: { presence: { key: me.id }, broadcast: { self: false } } });
      ch.on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState();
        const list = Object.entries(state).filter(([k]) => k !== me.id).map(([, metas]) => metas[metas.length - 1]);
        onPresence(list);
      });
      ch.on('broadcast', { event: 'e' }, ({ payload }) => onEvent(payload));
      let ready = false; let pending = null;
      ch.subscribe((status) => { if (status === 'SUBSCRIBED') { ready = true; if (pending) ch.track(pending); } });
      let last = 0; let timer = null;
      return {
        updatePresence(p) {
          pending = { ...p, userId: me.id };
          // throttle presence updates to ~4 per second
          const now = Date.now();
          clearTimeout(timer);
          if (ready && now - last > 250) { last = now; ch.track(pending); }
          else timer = setTimeout(() => { if (ready) { last = Date.now(); ch.track(pending); } }, 260);
        },
        send(e) { if (ready) ch.send({ type: 'broadcast', event: 'e', payload: { ...e, from: me.id } }); },
        leave() { sb.removeChannel(ch); },
      };
    },

    // ---------- AI + link previews (Supabase Edge Functions) ----------
    async generateRoom(prompt, catalogIds, activityIds) {
      const { data, error } = await sb.functions.invoke('ai-room', { body: { prompt, catalog: catalogIds, activities: activityIds } });
      if (error) { console.warn('[ai-room]', error.message); return null; }
      return data?.room || null;
    },
    async linkPreview(url) {
      const { data, error } = await sb.functions.invoke('link-preview', { body: { url } });
      if (error) return null;
      return data || null;
    },
  };
}
