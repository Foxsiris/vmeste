// Static config + date helpers for «Вместе».
// All real data now lives in Supabase (see src/db.jsx); this file only holds
// the type catalogue, couple metadata and formatting utilities.

// "Today" at UTC midnight, matching the YYYY-MM-DD dates stored in the DB.
const _now = new Date();
const TODAY = new Date(Date.UTC(_now.getFullYear(), _now.getMonth(), _now.getDate()));
const iso = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => { const d = new Date(TODAY); d.setUTCDate(d.getUTCDate() - n); return iso(d); };

const ACTIVITY_TYPES = {
  chore:   { label: 'Бытовые дела',   icon: '🧹', short: 'Дом' },
  date:    { label: 'Свидание',       icon: '💞', short: 'Свидание' },
  gift:    { label: 'Подарок',        icon: '🎁', short: 'Подарок' },
  movie:   { label: 'Фильм/сериал',   icon: '🎬', short: 'Фильм' },
  trip:    { label: 'Путешествие',    icon: '✈️', short: 'Поездка' },
  money:   { label: 'Финансы',        icon: '💰', short: 'Деньги' },
  mood:    { label: 'Настроение дня', icon: '☀️', short: 'Настроение' },
  thanks:  { label: 'Благодарность',  icon: '💌', short: 'Спасибо' },
};

const COUPLE = {
  maria:  { name: 'Мария',  initial: 'М', role: 'maria',  color: 'var(--maria)' },
  daniil: { name: 'Даниил', initial: 'Д', role: 'daniil', color: 'var(--daniil)' },
  start:  '2023-09-14',
};

// Apply persisted couple settings (names + anniversary) to the shared catalogue.
// Components read COUPLE at render time, so a state change in App re-renders
// everything with the fresh names.
function applyCoupleSettings(s) {
  if (!s) return;
  if (s.mariaName)  { COUPLE.maria.name  = s.mariaName;  COUPLE.maria.initial  = s.mariaName.charAt(0).toUpperCase(); }
  if (s.daniilName) { COUPLE.daniil.name = s.daniilName; COUPLE.daniil.initial = s.daniilName.charAt(0).toUpperCase(); }
  if (s.anniversary) COUPLE.start = s.anniversary;
}

const MONTHS_RU = [
  'январь','февраль','март','апрель','май','июнь',
  'июль','август','сентябрь','октябрь','ноябрь','декабрь',
];
const MONTHS_RU_LOC = [
  'января','февраля','марта','апреля','мая','июня',
  'июля','августа','сентября','октября','ноября','декабря',
];
const DOW_RU = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

// Russian plural: plural(3, 'день', 'дня', 'дней')
function plural(n, one, few, many) {
  const abs = Math.abs(n) % 100;
  const d = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (d === 1) return one;
  if (d >= 2 && d <= 4) return few;
  return many;
}

function fmtDateLong(iso) {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS_RU_LOC[d.getUTCMonth()]}`;
}
function fmtDateFull(isoStr) {
  const d = new Date(isoStr);
  return `${d.getUTCDate()} ${MONTHS_RU_LOC[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
function fmtRelative(iso) {
  const d = new Date(iso);
  const diff = Math.round((TODAY - d) / 86400000);
  if (diff === 0) return 'сегодня';
  if (diff === 1) return 'вчера';
  if (diff > 1 && diff < 7) return `${diff} дн. назад`;
  return fmtDateLong(iso);
}
function groupByDay(items) {
  const groups = {};
  items.forEach(it => { (groups[it.date] = groups[it.date] || []).push(it); });
  return Object.entries(groups).sort((a,b) => b[0].localeCompare(a[0]));
}
// Human "when" label from a picked date (+ optional time): "Сб, 24 мая, 19:00"
function fmtWhen(iso, time) {
  if (!iso) return time || 'Дата уточняется';
  const d = new Date(iso);
  const dow = DOW_RU[(d.getUTCDay() + 6) % 7];
  const base = `${dow}, ${d.getUTCDate()} ${MONTHS_RU_LOC[d.getUTCMonth()]}`;
  return time ? `${base}, ${time}` : base;
}

// "2 года 8 месяцев" from the anniversary date
function togetherLabel(startIso) {
  const start = new Date(startIso);
  let years  = TODAY.getUTCFullYear() - start.getUTCFullYear();
  let months = TODAY.getUTCMonth() - start.getUTCMonth();
  if (TODAY.getUTCDate() < start.getUTCDate()) months--;
  if (months < 0) { years--; months += 12; }
  const parts = [];
  if (years > 0)  parts.push(`${years} ${plural(years, 'год', 'года', 'лет')}`);
  if (months > 0) parts.push(`${months} ${plural(months, 'месяц', 'месяца', 'месяцев')}`);
  return parts.length ? parts.join(' ') : 'меньше месяца';
}

// Days until the next anniversary of `startIso`
function daysToAnniversary(startIso) {
  const start = new Date(startIso);
  let next = new Date(Date.UTC(TODAY.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  if (next < TODAY) next = new Date(Date.UTC(TODAY.getUTCFullYear() + 1, start.getUTCMonth(), start.getUTCDate()));
  return Math.round((next - TODAY) / 86400000);
}

// ---------- couple level — computed from real data ----------
// Points: every record counts, joint activity and gratitude count extra.
const LEVELS = [
  { name: 'Первые искры',  at: 0 },
  { name: 'Тёплый чай',    at: 30 },
  { name: 'Ровное пламя',  at: 70 },
  { name: 'Тёплый плед',   at: 130 },
  { name: 'Уютный дом',    at: 220 },
  { name: 'Маяк для двоих', at: 350 },
  { name: 'Легенда района', at: 520 },
];
function coupleLevel({ activities = [], notes = [], media = [], achievements = [] }) {
  const likes = activities.reduce((s, a) => s + (a.likedBy?.length || 0), 0);
  const joint = activities.filter(a => a.by === 'both').length;
  const unlocked = achievements.filter(a => a.unlocked).length;
  const points = activities.length + joint + likes * 2 + notes.length * 2 + media.length + unlocked * 5;
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (points >= LEVELS[i].at) idx = i;
  const cur = LEVELS[idx];
  const next = LEVELS[idx + 1] || null;
  const span = next ? next.at - cur.at : 1;
  const progress = next ? Math.min(100, Math.round(((points - cur.at) / span) * 100)) : 100;
  return { level: idx + 1, name: cur.name, points, next: next ? next.name : null, toNext: next ? next.at - points : 0, progress };
}

Object.assign(window, {
  TODAY, iso, daysAgo,
  ACTIVITY_TYPES, COUPLE, applyCoupleSettings,
  MONTHS_RU, MONTHS_RU_LOC, DOW_RU,
  plural, fmtDateLong, fmtDateFull, fmtRelative, groupByDay, fmtWhen,
  togetherLabel, daysToAnniversary, coupleLevel, LEVELS,
});
