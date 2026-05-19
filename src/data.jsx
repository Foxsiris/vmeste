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

const MONTHS_RU = [
  'январь','февраль','март','апрель','май','июнь',
  'июль','август','сентябрь','октябрь','ноябрь','декабрь',
];
const MONTHS_RU_LOC = [
  'января','февраля','марта','апреля','мая','июня',
  'июля','августа','сентября','октября','ноября','декабря',
];
const DOW_RU = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

function fmtDateLong(iso) {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS_RU_LOC[d.getUTCMonth()]}`;
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

Object.assign(window, {
  TODAY, iso, daysAgo,
  ACTIVITY_TYPES, COUPLE,
  MONTHS_RU, MONTHS_RU_LOC, DOW_RU,
  fmtDateLong, fmtRelative, groupByDay,
});
