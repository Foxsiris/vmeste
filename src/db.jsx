// Supabase data layer for «Вместе».
// Maps between DB rows (snake_case, reserved-word-safe) and the app's object
// shapes used by the screens/modals, so the UI components stay untouched.

const _cfg = window.VMESTE_CONFIG;
const sb = window.supabase.createClient(_cfg.url, _cfg.anonKey);

// ---------- row <-> app-object mappers ----------
const fromActivity = (r) => ({
  id: r.id, type: r.type, by: r.actor, date: r.date,
  title: r.title, icon: r.icon || undefined,
  note: r.note || undefined, likedBy: r.liked_by || [],
});
const fromTask = (r) => ({
  id: r.id, title: r.title, assignee: r.assignee,
  recur: r.recur, done: r.done, lastBy: r.last_by,
  doneMaria: r.done_maria, doneDaniil: r.done_daniil,
});
const fromDate = (r) => ({
  id: r.id, title: r.title, desc: r.descr, by: r.actor,
  status: r.status, when: r.when_text, tag: r.tag,
  eventDate: r.event_date, eventTime: r.event_time || undefined,
});
const fromNote = (r) => ({ id: r.id, from: r.from_who, text: r.text, date: r.date });
const fromMedia = (r) => ({
  id: r.id, type: r.type, title: r.title, author: r.author,
  desc: r.descr || undefined,
  ratingMaria: r.rating_maria || 0, ratingDaniil: r.rating_daniil || 0,
  rating: r.rating, date: r.date, status: r.status, cover: r.cover,
});

// average of the partners' ratings, counting only those who actually rated
const avgRating = (rm, rd) => {
  const rs = [rm, rd].filter(x => x > 0);
  return rs.length ? Math.round(rs.reduce((a, b) => a + b, 0) / rs.length) : 0;
};
const fromAch = (r) => ({ id: r.id, name: r.name, desc: r.descr, icon: r.icon, unlocked: r.unlocked });
const fromImportantDate = (r) => ({ id: r.id, label: r.label, when: r.when_text, icon: r.icon || '🎂' });

const _check = (res) => { if (res.error) throw res.error; return res.data; };

const DB = {
  // ---------- bulk load ----------
  async loadAll() {
    const [a, t, d, n, m, ac, id] = await Promise.all([
      sb.from('activities').select('*').order('date', { ascending: false }).order('id', { ascending: false }),
      sb.from('tasks').select('*').order('id', { ascending: false }),
      sb.from('date_ideas').select('*').order('id', { ascending: false }),
      sb.from('notes').select('*').order('date', { ascending: false }).order('id', { ascending: false }),
      sb.from('media').select('*').order('id', { ascending: true }),
      sb.from('achievements').select('*').order('sort_order', { ascending: true }),
      sb.from('important_dates').select('*').order('id', { ascending: true }),
    ]);
    return {
      activities:     _check(a).map(fromActivity),
      tasks:          _check(t).map(fromTask),
      dates:          _check(d).map(fromDate),
      notes:          _check(n).map(fromNote),
      media:          _check(m).map(fromMedia),
      achievements:   _check(ac).map(fromAch),
      importantDates: _check(id).map(fromImportantDate),
    };
  },

  // ---------- activities ----------
  async addActivity(e) {
    const data = _check(await sb.from('activities').insert({
      type: e.type, actor: e.by, date: e.date, title: e.title,
      icon: e.icon || null, note: e.note || null, liked_by: [],
    }).select().single());
    return fromActivity(data);
  },
  async setActivityLikes(id, likedBy) {
    _check(await sb.from('activities').update({ liked_by: likedBy }).eq('id', id));
  },
  async deleteActivity(id) { _check(await sb.from('activities').delete().eq('id', id)); },

  // ---------- tasks ----------
  async addTask(e) {
    const data = _check(await sb.from('tasks').insert({
      title: e.title, assignee: e.assignee, recur: e.recur,
      done: false, last_by: e.lastBy || null,
      done_maria: false, done_daniil: false,
    }).select().single());
    return fromTask(data);
  },
  async setTaskDone(id, done) { _check(await sb.from('tasks').update({ done }).eq('id', id)); },
  // For "both" tasks: each partner checks in independently; done = both checked
  async setTaskParts(id, { doneMaria, doneDaniil, done }) {
    _check(await sb.from('tasks').update({ done_maria: doneMaria, done_daniil: doneDaniil, done }).eq('id', id));
  },
  async deleteTask(id) { _check(await sb.from('tasks').delete().eq('id', id)); },

  // ---------- date ideas ----------
  async addDate(e) {
    const data = _check(await sb.from('date_ideas').insert({
      title: e.title, descr: e.desc, actor: e.by,
      status: 'pending', when_text: e.when, tag: e.tag,
      event_date: e.eventDate || null, event_time: e.eventTime || null,
    }).select().single());
    return fromDate(data);
  },
  async setDateStatus(id, status) { _check(await sb.from('date_ideas').update({ status }).eq('id', id)); },
  async deleteDate(id) { _check(await sb.from('date_ideas').delete().eq('id', id)); },

  // ---------- notes ----------
  async addNote(e) {
    const data = _check(await sb.from('notes').insert({
      from_who: e.from, text: e.text, date: e.date,
    }).select().single());
    return fromNote(data);
  },
  async deleteNote(id) { _check(await sb.from('notes').delete().eq('id', id)); },

  // ---------- media ----------
  async addMedia(e) {
    const rm = e.ratingMaria || 0, rd = e.ratingDaniil || 0;
    const data = _check(await sb.from('media').insert({
      type: e.type, title: e.title, author: e.author, descr: e.desc || null,
      rating_maria: rm, rating_daniil: rd, rating: avgRating(rm, rd),
      date: e.date, status: e.status, cover: e.cover,
    }).select().single());
    return fromMedia(data);
  },
  // Update one partner's rating; keep the aggregate `rating` in sync
  async setMediaRating(id, who, value, other) {
    const rm = who === 'maria'  ? value : other;
    const rd = who === 'daniil' ? value : other;
    const patch = who === 'maria' ? { rating_maria: value } : { rating_daniil: value };
    patch.rating = avgRating(rm, rd);
    _check(await sb.from('media').update(patch).eq('id', id));
  },
  async deleteMedia(id) { _check(await sb.from('media').delete().eq('id', id)); },

  // ---------- important dates ----------
  async addImportantDate(e) {
    const data = _check(await sb.from('important_dates').insert({
      label: e.label, when_text: e.when, icon: e.icon || '🎂',
    }).select().single());
    return fromImportantDate(data);
  },
  async deleteImportantDate(id) { _check(await sb.from('important_dates').delete().eq('id', id)); },
};

window.DB = DB;
