// All 8 screens of the relationship tracker
const { useState: useScState, useMemo: useScMemo } = React;

/* =========================================================
   FEED — activity timeline grouped by day
   ========================================================= */
function FeedScreen({ activities, onLike, onDelete, onSelect }) {
  const [filter, setFilter] = useScState('all');
  const [actor, setActor] = useScState('all');

  const filtered = useScMemo(() => {
    return activities.filter(a => {
      if (filter !== 'all' && a.type !== filter) return false;
      if (actor !== 'all' && a.by !== actor && !(actor === 'both' && a.by === 'both')) return false;
      return true;
    });
  }, [activities, filter, actor]);

  const groups = groupByDay(filtered);

  return (
    <div className="stack lg">
      <div className="row between wrap" style={{ gap: 16 }}>
        <div className="row wrap filter-chips" style={{ gap: 6 }}>
          <button className={'chip ' + (filter === 'all' ? 'active' : '')} onClick={() => setFilter('all')}>Все</button>
          {Object.entries(ACTIVITY_TYPES).map(([k, v]) => (
            <button key={k} className={'chip ' + (filter === k ? 'active' : '')} onClick={() => setFilter(k)}>
              <span>{v.icon}</span>{v.short}
            </button>
          ))}
        </div>
        <div className="seg">
          <button className={actor === 'all'    ? 'active' : ''} onClick={() => setActor('all')}>Все</button>
          <button className={actor === 'maria'  ? 'active' : ''} onClick={() => setActor('maria')}>{COUPLE.maria.name}</button>
          <button className={actor === 'daniil' ? 'active' : ''} onClick={() => setActor('daniil')}>{COUPLE.daniil.name}</button>
          <button className={actor === 'both'   ? 'active' : ''} onClick={() => setActor('both')}>Вместе</button>
        </div>
      </div>

      {groups.length === 0 && (
        <div className="card empty-state">
          <span className="serif">Пока пусто</span>
          Под этот фильтр ничего не подходит. Попробуйте сбросить.
        </div>
      )}

      <div className="feed">
        {groups.map(([day, items]) => (
          <React.Fragment key={day}>
            <div className="feed-day">
              <span className="feed-day-label">{fmtRelative(day)}</span>
              <span className="feed-day-line"></span>
              <span className="muted" style={{ fontSize: 12 }}>{items.length} {items.length === 1 ? 'запись' : 'записей'}</span>
            </div>
            {items.map(a => (
              <ActivityCard key={a.id} activity={a} onLike={onLike} onDelete={onDelete} onSelect={onSelect} />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function ActivityCard({ activity: a, onLike, onDelete, onSelect }) {
  const [popping, setPopping] = useScState(false);
  const type = ACTIVITY_TYPES[a.type];
  const handleLike = () => {
    setPopping(true);
    setTimeout(() => setPopping(false), 400);
    onLike(a.id);
  };
  // viewer is "the other partner" — like is only from the partner whose action it isn't
  const otherPartner = a.by === 'maria' ? 'daniil' : (a.by === 'daniil' ? 'maria' : 'both');
  const liked = a.likedBy && a.likedBy.length > 0;
  return (
    <div className="activity" style={{ cursor: 'pointer' }} onClick={() => onSelect && onSelect(a)}>
      <div className={'activity-icon ' + a.by}>{a.icon || type.icon}</div>
      <div className="activity-body">
        <div className="activity-title">{a.title}</div>
        <div className="activity-meta">
          <ByPill by={a.by} />
          <span>·</span>
          <span>{type.label}</span>
        </div>
        {a.note && <div className="activity-note">{a.note}</div>}
      </div>
      <div className="activity-actions" onClick={e => e.stopPropagation()}>
        <button
          className={'icon-btn like-btn ' + (liked ? 'liked ' : '') + (popping ? 'heart-pop' : '')}
          onClick={handleLike}
          title={liked ? 'Спасибо отправлено' : 'Поблагодарить'}
        >
          <Icon name="heart" size={14} />
          {a.likedBy && a.likedBy.length > 0 && <span>{a.likedBy.length}</span>}
        </button>
        <button className="icon-btn" onClick={() => onDelete(a.id)} title="Удалить">
          <Icon name="x" size={14} />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   CALENDAR — month grid, navigable
   ========================================================= */
function CalendarScreen({ activities, dates = [], onSelectDay }) {
  const [cursor, setCursor] = useScState(() => {
    const d = new Date(TODAY); d.setDate(1); return d;
  });

  // Proposed/accepted dates with a picked day appear on the calendar
  const dateEvents = useScMemo(() => (dates || [])
    .filter(d => d.eventDate)
    .map(d => ({
      id: 'date-' + d.id, type: 'date', by: d.by, date: d.eventDate,
      title: d.title, icon: '💞', note: d.when, isDate: true, status: d.status,
    })), [dates]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const startDow = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7; // monday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayIso = iso(TODAY);

  const eventsByDay = useScMemo(() => {
    const map = {};
    [...activities, ...dateEvents].forEach(a => { (map[a.date] = map[a.date] || []).push(a); });
    return map;
  }, [activities, dateEvents]);

  const monthActs = activities.filter(a => {
    const d = new Date(a.date); return d.getFullYear() === year && d.getMonth() === month;
  });
  const byMaria  = monthActs.filter(a => a.by === 'maria').length;
  const byDaniil = monthActs.filter(a => a.by === 'daniil').length;
  const byBoth   = monthActs.filter(a => a.by === 'both').length;

  const move = (delta) => {
    const d = new Date(cursor); d.setMonth(d.getMonth() + delta); setCursor(d);
  };

  return (
    <div className="stack lg">
      <div className="card cal-card">
        <div className="cal-head">
          <div className="cal-month">
            <span style={{ textTransform: 'capitalize' }}>{MONTHS_RU[month]}</span>
            <span className="year">{year}</span>
          </div>
          <div className="cal-nav">
            <button className="btn ghost sm" onClick={() => move(-1)}><Icon name="arrow-left" size={14} /></button>
            <button className="btn sm" onClick={() => setCursor(() => { const d = new Date(TODAY); d.setDate(1); return d; })}>Сегодня</button>
            <button className="btn ghost sm" onClick={() => move(1)}><Icon name="arrow-right" size={14} /></button>
          </div>
        </div>
        <div className="cal-grid" style={{ marginBottom: 8 }}>
          {DOW_RU.map(d => <div key={d} className="cal-dow">{d}</div>)}
        </div>
        <div className="cal-grid">
          {cells.map((d, i) => {
            if (d === null) return <div key={'e'+i} className="cal-cell empty"></div>;
            const dayIso = iso(new Date(Date.UTC(year, month, d)));
            const evts = eventsByDay[dayIso] || [];
            const isToday = dayIso === todayIso;
            return (
              <div
                key={d}
                className={'cal-cell ' + (isToday ? 'today ' : '') + (evts.length ? 'has-events' : '')}
                onClick={() => onSelectDay(dayIso, evts)}
              >
                <div className="day-num">{d}</div>
                {evts.slice(0, 2).map((e, j) => (
                  <div key={j} className="cal-evt">
                    <span className="ico">{e.icon || ACTIVITY_TYPES[e.type].icon}</span>
                    {e.title}
                  </div>
                ))}
                {evts.length > 2 && <div className="cal-more">+{evts.length - 2}</div>}
                <div className="cal-dots">
                  {evts.some(e => e.by === 'maria')  && <span className="cal-dot maria"></span>}
                  {evts.some(e => e.by === 'daniil') && <span className="cal-dot daniil"></span>}
                  {evts.some(e => e.by === 'both')   && <span className="cal-dot both"></span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-title">События за {MONTHS_RU[month]}</div>
          <div className="stat-value">{monthActs.length}<span className="unit">записей</span></div>
          <div style={{ marginTop: 14 }}>
            <ProgressBar maria={byMaria} daniil={byDaniil} />
            <div className="row between wrap" style={{ marginTop: 8, fontSize: 12.5, rowGap: 4 }}>
              <span><span className="cal-dot maria" style={{ display: 'inline-block', marginRight: 6 }}></span>{COUPLE.maria.name} — {byMaria}</span>
              <span><span className="cal-dot daniil" style={{ display: 'inline-block', marginRight: 6 }}></span>{COUPLE.daniil.name} — {byDaniil}</span>
              <span><span className="cal-dot both" style={{ display: 'inline-block', marginRight: 6 }}></span>Вместе — {byBoth}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Главное за месяц</div>
          <div className="stack sm">
            {monthActs.filter(a => a.likedBy && a.likedBy.length > 0).slice(0, 3).map(a => (
              <div key={a.id} className="row" style={{ gap: 10 }}>
                <div className={'activity-icon ' + a.by} style={{ width: 32, height: 32, fontSize: 14, borderRadius: 8 }}>{a.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{fmtDateLong(a.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TASKS — household chores list
   ========================================================= */
function TasksScreen({ tasks, onToggle, onPartToggle, onAdd, onSelect }) {
  const [view, setView] = useScState('open');
  const isDone = (t) => t.assignee === 'both' ? (t.doneMaria && t.doneDaniil) : t.done;
  const open = tasks.filter(t => !isDone(t));
  const done = tasks.filter(t => isDone(t));
  const list = view === 'open' ? open : done;
  return (
    <div className="stack lg">
      <div className="row between wrap">
        <div className="seg">
          <button className={view === 'open' ? 'active' : ''} onClick={() => setView('open')}>Активные ({open.length})</button>
          <button className={view === 'done' ? 'active' : ''} onClick={() => setView('done')}>Сделано ({done.length})</button>
        </div>
        <button className="btn primary sm" onClick={onAdd}>
          <Icon name="plus" size={14} /> Новая задача
        </button>
      </div>
      <div className="task-list">
        {list.length === 0 && (
          <div className="card empty-state">
            <span className="serif">{view === 'open' ? 'Всё сделано!' : 'Пока ничего не закрыто'}</span>
            {view === 'open' && 'Можно отдохнуть.'}
          </div>
        )}
        {list.map(t => (
          <div key={t.id} className={'task ' + (isDone(t) ? 'done' : '')}>
            {t.assignee === 'both' ? (
              <div className="row" style={{ gap: 8 }}>
                {['maria', 'daniil'].map(who => {
                  const on = who === 'maria' ? t.doneMaria : t.doneDaniil;
                  return (
                    <button
                      key={who}
                      className={'checkin ' + who + (on ? ' on' : '')}
                      title={COUPLE[who].name + (on ? ': отметил(а) — нажмите, чтобы снять' : ': ещё не отметил(а)')}
                      onClick={() => onPartToggle(t.id, who)}
                    >
                      {on ? <Icon name="check" size={18} /> : COUPLE[who].initial}
                    </button>
                  );
                })}
              </div>
            ) : (
              <button className={'check ' + (t.done ? 'done' : '')} onClick={() => onToggle(t.id)}>
                <Icon name="check" size={14} />
              </button>
            )}
            <div>
              <div className="task-title">{t.title}</div>
              <div className="task-meta">
                {t.recur}
                {t.assignee === 'both'
                  ? ' · оба отмечают'
                  : (t.lastBy ? <> · последний раз {COUPLE[t.lastBy].name}</> : null)}
              </div>
            </div>
            <div>
              {t.assignee === 'rotate' ? (
                <span className="pill">по очереди</span>
              ) : t.assignee === 'both' ? (
                <Avatar who="both" size="sm" />
              ) : (
                <Avatar who={t.assignee} size="sm" />
              )}
            </div>
            <div className="row" style={{ gap: 4 }}>
              <button className="icon-btn" title="Подробнее" onClick={() => onSelect && onSelect(t)}><Icon name="sparkle" size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   DATES — proposed / accepted dates
   ========================================================= */
function DatesScreen({ dates, onAccept, onDecline, onAdd, onEdit, onDelete }) {
  const pending  = dates.filter(d => d.status === 'pending');
  const accepted = dates.filter(d => d.status === 'accepted');
  return (
    <div className="stack lg">
      <div className="row between">
        <div className="card-title" style={{ margin: 0 }}>Ожидают ответа · {pending.length}</div>
        <button className="btn primary sm" onClick={onAdd}><Icon name="plus" size={14} /> Предложить</button>
      </div>
      {pending.length === 0 && (
        <div className="card empty-state" style={{ padding: 28 }}>
          <span className="serif">Нет открытых предложений</span>
          Самое время предложить что-нибудь!
        </div>
      )}
      <div className="grid-2">
        {pending.map(d => (
          <div key={d.id} className="date-card pending">
            <div className="date-head">
              <div>
                <div className="date-title">{d.title}</div>
                <div className="row" style={{ gap: 6, marginTop: 6 }}>
                  <ByPill by={d.by} />
                  <span className="pill"><span className="dot"></span>{d.tag}</span>
                </div>
              </div>
              <span className="pill maria">Ожидает</span>
            </div>
            <div className="date-desc">{d.desc}</div>
            <div className="date-meta">📅 {d.when}</div>
            <div className="row between" style={{ marginTop: 4 }}>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn primary sm" onClick={() => onAccept(d.id)}>Принять</button>
                <button className="btn sm" onClick={() => onDecline(d.id)}>Отклонить</button>
              </div>
              <button className="icon-btn" title="Редактировать" onClick={() => onEdit(d)}><Icon name="edit" size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="card-title" style={{ marginTop: 8 }}>Принятые · {accepted.length}</div>
      {accepted.length === 0 && (
        <div className="muted" style={{ fontSize: 13 }}>Принятых свиданий пока нет.</div>
      )}
      <div className="grid-2">
        {accepted.map(d => (
          <div key={d.id} className="date-card accepted">
            <div className="date-head">
              <div>
                <div className="date-title">{d.title}</div>
                <div className="row" style={{ gap: 6, marginTop: 6 }}>
                  <ByPill by={d.by} />
                  <span className="pill"><span className="dot"></span>{d.tag}</span>
                </div>
              </div>
              <span className="pill daniil">✓ Принято</span>
            </div>
            <div className="date-desc">{d.desc}</div>
            <div className="date-meta">📅 {d.when}</div>
            <div className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
              <button className="icon-btn" title="Редактировать" onClick={() => onEdit(d)}><Icon name="edit" size={14} /></button>
              <button className="icon-btn" title="Удалить" onClick={() => onDelete(d.id)}><Icon name="x" size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   STATS — totals, balance, sparklines
   ========================================================= */
function StatsScreen({ activities }) {
  const [period, setPeriod] = useScState('month');
  const cutoff = period === 'month' ? 30 : period === 'year' ? 365 : 9999;
  const data = activities.filter(a => {
    const diff = Math.round((TODAY - new Date(a.date)) / 86400000);
    return diff <= cutoff;
  });
  // the same-length period right before the current one, for a real delta
  const prevData = period === 'all' ? [] : activities.filter(a => {
    const diff = Math.round((TODAY - new Date(a.date)) / 86400000);
    return diff > cutoff && diff <= cutoff * 2;
  });
  const delta = data.length - prevData.length;
  const byType = {};
  Object.keys(ACTIVITY_TYPES).forEach(k => byType[k] = 0);
  data.forEach(a => byType[a.type]++);

  const byMaria  = data.filter(a => a.by === 'maria').length;
  const byDaniil = data.filter(a => a.by === 'daniil').length;
  const byBoth   = data.filter(a => a.by === 'both').length;
  const likes    = data.reduce((s, a) => s + (a.likedBy?.length || 0), 0);

  const startDate = new Date(COUPLE.start);
  const togetherDays = Math.floor((TODAY - startDate) / 86400000);
  const togetherMonths = Math.floor(togetherDays / 30.44);
  const togetherYears = (togetherDays / 365.25).toFixed(1);

  // Activity by day for last 14 days
  const sparkDays = 14;
  const dayCounts = Array.from({ length: sparkDays }, (_, i) => {
    const d = daysAgo(sparkDays - 1 - i);
    return data.filter(a => a.date === d).length;
  });
  const maxCount = Math.max(...dayCounts, 1);

  return (
    <div className="stack lg">
      <div className="row between">
        <div className="seg">
          <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>30 дней</button>
          <button className={period === 'year'  ? 'active' : ''} onClick={() => setPeriod('year')}>Год</button>
          <button className={period === 'all'   ? 'active' : ''} onClick={() => setPeriod('all')}>Всё время</button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{togetherYears}<span className="unit">года</span></div>
          <div className="stat-label">Вместе с {fmtDateFull(COUPLE.start)}</div>
          <div className="stat-delta">{togetherDays} {plural(togetherDays, 'день', 'дня', 'дней')} · {togetherMonths} мес</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.length}<span className="unit">{plural(data.length, 'запись', 'записи', 'записей')}</span></div>
          <div className="stat-label">за выбранный период</div>
          {period !== 'all' && (
            <div className={'stat-delta' + (delta < 0 ? ' down' : '')}>
              {delta >= 0 ? `+${delta}` : delta} к прошлому периоду
            </div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-value">{likes}<span className="unit">💌</span></div>
          <div className="stat-label">Благодарностей друг другу</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{byBoth}<span className="unit">вместе</span></div>
          <div className="stat-label">Совместных активностей</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Баланс участия</div>
        <ProgressBar maria={byMaria} daniil={byDaniil} />
        <div className="row between" style={{ marginTop: 12 }}>
          <div className="row" style={{ gap: 10 }}>
            <Avatar who="maria" size="sm" />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{COUPLE.maria.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>{byMaria} личных записей</div>
            </div>
          </div>
          <div className="muted" style={{ fontSize: 12.5, textAlign: 'center', maxWidth: 240 }}>
            <span className="serif" style={{ fontSize: 16, color: 'var(--ink-2)' }}>Оба вкладываются.</span>
            <br/>Это не соревнование, а напоминание о хорошем.
          </div>
          <div className="row" style={{ gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{COUPLE.daniil.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>{byDaniil} личных записей</div>
            </div>
            <Avatar who="daniil" size="sm" />
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Активность за 14 дней</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, marginBottom: 10 }}>
            {dayCounts.map((c, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                  <div style={{
                    width: '100%',
                    height: `${(c / maxCount) * 100}%`,
                    background: c > 0 ? 'linear-gradient(180deg, var(--maria) 0%, var(--daniil) 100%)' : 'var(--bg-soft)',
                    borderRadius: 4,
                    minHeight: 2,
                  }}></div>
                </div>
                <div style={{ fontSize: 9, color: 'var(--ink-muted)' }}>{sparkDays - 1 - i}</div>
              </div>
            ))}
          </div>
          <div className="muted" style={{ fontSize: 12 }}>дней назад →</div>
        </div>
        <div className="card">
          <div className="card-title">По категориям</div>
          <div className="stack sm">
            {Object.entries(byType)
              .sort((a,b) => b[1] - a[1])
              .filter(([_, c]) => c > 0)
              .map(([k, c]) => {
                const pct = (c / data.length) * 100;
                return (
                  <div key={k}>
                    <div className="row between" style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: 13 }}>{ACTIVITY_TYPES[k].icon} {ACTIVITY_TYPES[k].label}</span>
                      <span className="muted" style={{ fontSize: 12 }}>{c}</span>
                    </div>
                    <div className="progress" style={{ height: 5 }}>
                      <div className="progress-fill both" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ACHIEVEMENTS — badges
   ========================================================= */
function AchievementsScreen({ achievements, level, onSelect }) {
  const unlocked = achievements.filter(a => a.unlocked);
  const locked   = achievements.filter(a => !a.unlocked);
  return (
    <div className="stack lg">
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--both-soft) 0%, var(--surface) 60%)', border: '1px solid var(--both)' }}>
        <div className="row" style={{ gap: 16 }}>
          <div className="avatar lg" style={{ background: 'linear-gradient(135deg, var(--gold), var(--maria))', fontSize: 22 }}>🏆</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Уровень пары</div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {level.name} <span className="serif" style={{ color: 'var(--ink-muted)' }}>· уровень {level.level}</span>
            </div>
            <div className="progress" style={{ marginTop: 10, height: 8 }}>
              <div className="progress-fill both" style={{ width: `${level.progress}%` }}></div>
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              {level.next
                ? <>До уровня «{level.next}» ещё {level.toNext} {plural(level.toNext, 'очко', 'очка', 'очков')} — записи, благодарности и бейджи приближают его</>
                : 'Максимальный уровень — вы легенда!'}
              {' '}· сейчас {level.points} {plural(level.points, 'очко', 'очка', 'очков')}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="card-title">Открыто · {unlocked.length}</div>
        <div className="ach-grid">
          {unlocked.map(a => (
            <div key={a.id} className="ach-card unlocked" style={{ cursor: 'pointer' }} onClick={() => onSelect && onSelect(a)}>
              <div className="ach-medal">{a.icon}</div>
              <div className="ach-name">{a.name}</div>
              <div className="ach-desc">{a.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="card-title">В пути · {locked.length}</div>
        <div className="ach-grid">
          {locked.map(a => (
            <div key={a.id} className="ach-card locked" style={{ cursor: 'pointer' }} onClick={() => onSelect && onSelect(a)}>
              <div className="ach-medal">{a.icon}</div>
              <div className="ach-name">{a.name}</div>
              <div className="ach-desc">{a.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   NOTES — gratitudes & love notes
   ========================================================= */
function NotesScreen({ notes, onAdd, onSelect }) {
  return (
    <div className="stack lg">
      <div className="row between">
        <div className="muted" style={{ fontSize: 14 }}>
          Маленькие записки друг другу. Их видит только пара.
        </div>
        <button className="btn primary sm" onClick={onAdd}><Icon name="plus" size={14} /> Написать</button>
      </div>
      {notes.length === 0 && (
        <div className="card empty-state">
          <span className="serif">Пока ни одной записки</span>
          Напишите первую — приятные слова не бывают лишними.
        </div>
      )}
      <div className="notes-grid">
        {notes.map(n => (
          <div key={n.id} className={'note from-' + n.from} style={{ cursor: 'pointer' }} onClick={() => onSelect && onSelect(n)}>
            <div className="note-quote">«{n.text}»</div>
            <div className="note-foot">
              <Avatar who={n.from} size="sm" />
              <span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>{COUPLE[n.from].name}</span>
              <span>·</span>
              <span>{fmtRelative(n.date)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   MEDIA — movies, shows, books
   ========================================================= */
function MediaScreen({ media, onAdd, onSelect }) {
  const [tab, setTab] = useScState('all');
  const filtered = tab === 'all' ? media : media.filter(m => m.type === tab);
  const TABS = [
    ['all', 'Всё'], ['movie', '🎬 Фильмы'], ['show', '📺 Сериалы'], ['book', '📖 Книги'],
  ];
  return (
    <div className="stack lg">
      <div className="row between wrap">
        <div className="seg">
          {TABS.map(([k, label]) => (
            <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>
        <button className="btn primary sm" onClick={onAdd}><Icon name="plus" size={14} /> Добавить</button>
      </div>

      {filtered.length === 0 && (
        <div className="card empty-state">
          <span className="serif">Здесь пока пусто</span>
          Добавьте первый фильм, сериал или книгу.
        </div>
      )}
      <div className="media-grid">
        {filtered.map(m => (
          <div key={m.id} className="media" style={{ cursor: 'pointer' }} onClick={() => onSelect && onSelect(m)}>
            <div className="media-cover">{m.cover}</div>
            <div className="media-body">
              <div className="media-title">{m.title}</div>
              <div className="media-meta">{m.author}</div>
              {m.desc && <div className="media-desc">{m.desc}</div>}
              {m.status === 'watched' && (() => {
                const rs = [m.ratingMaria, m.ratingDaniil].filter(x => x > 0);
                const avg = rs.length ? Math.round(rs.reduce((a, b) => a + b, 0) / rs.length) : 0;
                return (
                  <div className="stack" style={{ gap: 5 }}>
                    <Stars value={avg} />
                    <div className="row" style={{ gap: 10, fontSize: 11 }}>
                      <span style={{ color: 'var(--maria-ink)', fontWeight: 700 }}>{COUPLE.maria.name} {m.ratingMaria || '—'}</span>
                      <span style={{ color: 'var(--daniil-ink)', fontWeight: 700 }}>{COUPLE.daniil.name} {m.ratingDaniil || '—'}</span>
                    </div>
                  </div>
                );
              })()}
              {m.status === 'reading' && <span className="pill"><span className="dot"></span>{m.type === 'book' ? 'Читаем' : 'Смотрим'}</span>}
              {m.status === 'planned' && <span className="pill"><span className="dot"></span>В планах</span>}
              {m.date && <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>{fmtDateLong(m.date)}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  FeedScreen, CalendarScreen, TasksScreen, DatesScreen,
  StatsScreen, AchievementsScreen, NotesScreen, MediaScreen,
});
