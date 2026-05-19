// Main app — loads state from Supabase, persists every mutation, handles
// navigation and the multi-mode add modal.
const { useState, useEffect, useMemo } = React;

const NAV = [
  { id: 'feed',      label: 'Лента',         icon: 'feed' },
  { id: 'calendar',  label: 'Календарь',     icon: 'calendar' },
  { id: 'tasks',     label: 'Дела по дому',  icon: 'task' },
  { id: 'dates',     label: 'Свидания',      icon: 'heart' },
  { id: 'stats',     label: 'Статистика',    icon: 'stats' },
  { id: 'ach',       label: 'Достижения',    icon: 'trophy' },
  { id: 'notes',     label: 'Заметки',       icon: 'note' },
  { id: 'media',     label: 'Фильмы и книги', icon: 'film' },
];

function App() {
  const [screen, setScreen] = useState('feed');
  const [activities, setActivities] = useState([]);
  const [tasks, setTasks]           = useState([]);
  const [dates, setDates]           = useState([]);
  const [notes, setNotes]           = useState([]);
  const [media, setMedia]           = useState([]);
  const [achievements, setAch]      = useState([]);
  const [importantDates, setImportantDates] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState(null);
  const [toast, setToast]           = useState('');
  const [addOpen, setAddOpen]       = useState(false);
  const [addMode, setAddMode]       = useState('activity');
  const [dayOpen, setDayOpen]       = useState(null);
  const [detail, setDetail]         = useState(null); // { kind, item }
  const [confirm, setConfirm]       = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [navOpen, setNavOpen]       = useState(false); // mobile drawer

  // ---------- initial load from Supabase ----------
  const reload = async () => {
    try {
      setLoadError(null);
      const all = await DB.loadAll();
      setActivities(all.activities);
      setTasks(all.tasks);
      setDates(all.dates);
      setNotes(all.notes);
      setMedia(all.media);
      setAch(all.achievements);
      setImportantDates(all.importantDates);
    } catch (e) {
      setLoadError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); }, []);

  const titles = {
    feed:     { t: 'Лента',         s: 'Что мы сделали друг для друга' },
    calendar: { t: 'Календарь',     s: 'Месяц нашего совместного быта' },
    tasks:    { t: 'Дела по дому',  s: 'Кто что делает и когда' },
    dates:    { t: 'Свидания',      s: 'Предложения и принятые планы' },
    stats:    { t: 'Статистика',    s: 'Прогресс отношений в цифрах' },
    ach:      { t: 'Достижения',    s: 'Бейджи, которые мы открыли вместе' },
    notes:    { t: 'Заметки',       s: 'Маленькие благодарности друг другу' },
    media:    { t: 'Фильмы и книги', s: 'Наш совместный плейлист культуры' },
  };

  const counts = {
    feed:     activities.length,
    tasks:    tasks.filter(t => !t.done).length,
    dates:    dates.filter(d => d.status === 'pending').length,
    notes:    notes.length,
    media:    media.length,
    ach:      achievements.filter(a => a.unlocked).length,
  };

  const fail = (e) => setToast('Ошибка: ' + (e.message || e));

  // ---------- activities ----------
  const onLike = (id) => {
    const a = activities.find(x => x.id === id);
    if (!a) return;
    const partner = a.by === 'maria' ? 'daniil' : (a.by === 'daniil' ? 'maria' : 'both');
    const lb = a.likedBy || [];
    const has = lb.includes(partner);
    const newLikes = has ? lb.filter(p => p !== partner) : [...lb, partner];
    if (!has) setToast('Спасибо отправлено ❤');
    setActivities(prev => prev.map(x => x.id === id ? { ...x, likedBy: newLikes } : x));
    setDetail(d => (d && d.kind === 'activity' && d.item.id === id)
      ? { kind: 'activity', item: { ...d.item, likedBy: newLikes } } : d);
    DB.setActivityLikes(id, newLikes).catch(fail);
  };

  const onDelete = (id) => {
    const item = activities.find(a => a.id === id);
    setConfirm({
      title: 'Удалить запись?',
      message: `«${item?.title}» исчезнет из ленты. Действие нельзя отменить.`,
      onConfirm: () => {
        setActivities(prev => prev.filter(a => a.id !== id));
        setDetail(null);
        setToast('Запись удалена');
        DB.deleteActivity(id).catch(fail);
      },
    });
  };

  const onNoteDelete = (item) => {
    setConfirm({
      title: 'Удалить записку?',
      message: 'Навсегда. Слова не вернуть.',
      onConfirm: () => {
        setNotes(prev => prev.filter(n => n.id !== item.id));
        setDetail(null);
        setToast('Записка удалена');
        DB.deleteNote(item.id).catch(fail);
      },
    });
  };

  const onMediaDelete = (item) => {
    setConfirm({
      title: 'Убрать из коллекции?',
      message: `«${item.title}» исчезнет из вашего списка.`,
      onConfirm: () => {
        setMedia(prev => prev.filter(m => m.id !== item.id));
        setDetail(null);
        setToast('Удалено из коллекции');
        DB.deleteMedia(item.id).catch(fail);
      },
    });
  };

  const onTaskDelete = (item) => {
    setConfirm({
      title: 'Удалить задачу?',
      message: `«${item.title}» больше не будет в списке.`,
      onConfirm: () => {
        setTasks(prev => prev.filter(t => t.id !== item.id));
        setDetail(null);
        setToast('Задача удалена');
        DB.deleteTask(item.id).catch(fail);
      },
    });
  };

  const onMediaRate = (id, who, value) => {
    const m = media.find(x => x.id === id);
    if (!m) return;
    const ratingMaria  = who === 'maria'  ? value : m.ratingMaria;
    const ratingDaniil = who === 'daniil' ? value : m.ratingDaniil;
    const other = who === 'maria' ? m.ratingDaniil : m.ratingMaria;
    const next = { ...m, ratingMaria, ratingDaniil };
    setMedia(prev => prev.map(x => x.id === id ? next : x));
    setDetail(prev => (prev && prev.kind === 'media' && prev.item.id === id) ? { kind: 'media', item: next } : prev);
    DB.setMediaRating(id, who, value, other).catch(fail);
  };

  const onTaskToggle = (id) => {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    if (t.assignee === 'both') {
      const v = !(t.doneMaria && t.doneDaniil);
      if (v) setToast('Готово!');
      setTasks(prev => prev.map(x => x.id === id ? { ...x, doneMaria: v, doneDaniil: v, done: v } : x));
      DB.setTaskParts(id, { doneMaria: v, doneDaniil: v, done: v }).catch(fail);
    } else {
      const done = !t.done;
      if (done) setToast('Готово!');
      setTasks(prev => prev.map(x => x.id === id ? { ...x, done } : x));
      DB.setTaskDone(id, done).catch(fail);
    }
  };

  // "Both" tasks: each partner checks in independently; done when both have
  const onTaskPartToggle = (id, who) => {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    const doneMaria  = who === 'maria'  ? !t.doneMaria  : t.doneMaria;
    const doneDaniil = who === 'daniil' ? !t.doneDaniil : t.doneDaniil;
    const done = doneMaria && doneDaniil;
    if (done && !(t.doneMaria && t.doneDaniil)) setToast('Оба отметили — готово! 🎉');
    setTasks(prev => prev.map(x => x.id === id ? { ...x, doneMaria, doneDaniil, done } : x));
    DB.setTaskParts(id, { doneMaria, doneDaniil, done }).catch(fail);
  };

  const onDateAccept = (id) => {
    setDates(prev => prev.map(d => d.id === id ? { ...d, status: 'accepted' } : d));
    setToast('Свидание подтверждено 💞');
    DB.setDateStatus(id, 'accepted').catch(fail);
  };
  const onDateDecline = (id) => {
    setConfirm({
      title: 'Отклонить предложение?',
      message: 'Партнёр увидит, что идея не подошла. Можно оставить заметку после.',
      confirmLabel: 'Отклонить',
      onConfirm: () => {
        setDates(prev => prev.filter(d => d.id !== id));
        setToast('Предложение отклонено');
        DB.deleteDate(id).catch(fail);
      },
    });
  };

  const onAddImportantDate = async (e) => {
    try {
      const row = await DB.addImportantDate(e);
      setImportantDates(prev => [...prev, row]);
      setToast('Дата добавлена');
    } catch (err) { fail(err); }
  };
  const onDeleteImportantDate = (id) => {
    setImportantDates(prev => prev.filter(d => d.id !== id));
    setToast('Дата удалена');
    DB.deleteImportantDate(id).catch(fail);
  };

  const openAdd = (mode = 'activity') => { setAddMode(mode); setAddOpen(true); };

  const handleAdd = async (entry) => {
    try {
      if (addMode === 'activity') {
        const row = await DB.addActivity({ ...entry, date: iso(TODAY) });
        setActivities(prev => [row, ...prev]);
        setToast('Запись добавлена в ленту');
      } else if (addMode === 'task') {
        const row = await DB.addTask(entry);
        setTasks(prev => [row, ...prev]);
        setToast('Задача добавлена');
      } else if (addMode === 'date') {
        const row = await DB.addDate(entry);
        setDates(prev => [row, ...prev]);
        setToast('Свидание предложено');
      } else if (addMode === 'note') {
        const row = await DB.addNote({ ...entry, date: iso(TODAY) });
        setNotes(prev => [row, ...prev]);
        setToast('Записка сохранена');
      } else if (addMode === 'media') {
        const row = await DB.addMedia(entry);
        setMedia(prev => [row, ...prev]);
        setToast('Добавлено в коллекцию');
      }
      setAddOpen(false);
    } catch (e) {
      fail(e);
    }
  };

  // ---------- loading / error gates ----------
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--ink-muted)' }}>
          <div className="brand-mark" style={{ margin: '0 auto 14px', width: 48, height: 48, fontSize: 26 }}>в</div>
          <div className="serif" style={{ fontSize: 24, color: 'var(--ink-2)' }}>Загружаем вашу историю…</div>
        </div>
      </div>
    );
  }
  if (loadError) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div className="card" style={{ maxWidth: 460, textAlign: 'center' }}>
          <div className="serif" style={{ fontSize: 26, color: 'var(--maria-ink)', marginBottom: 8 }}>Не удалось загрузить данные</div>
          <div className="muted" style={{ fontSize: 13.5, marginBottom: 16 }}>{loadError}</div>
          <button className="btn primary" onClick={() => { setLoading(true); reload(); }}>Повторить</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="topbar-btn" onClick={() => setNavOpen(true)} aria-label="Открыть меню">
          <Icon name="menu" size={22} />
        </button>
        <div className="topbar-brand">
          <div className="brand-mark" style={{ width: 30, height: 30, fontSize: 18, borderRadius: 9 }}>в</div>
          <span className="brand-name" style={{ fontSize: 16 }}>Вместе</span>
        </div>
        <button className="topbar-btn" style={{ width: 'auto', padding: '0 4px' }} onClick={() => setSettingsOpen(true)} aria-label="Настройки пары">
          <Avatar who="both" />
        </button>
      </header>

      <div className={'nav-backdrop' + (navOpen ? ' show' : '')} onClick={() => setNavOpen(false)}></div>

      <aside className={'sidebar' + (navOpen ? ' open' : '')}>
        <button className="sidebar-close" onClick={() => setNavOpen(false)} aria-label="Закрыть меню">
          <Icon name="x" size={18} />
        </button>
        <div className="brand">
          <div className="brand-mark">в</div>
          <div>
            <div className="brand-name">Вместе</div>
            <div className="brand-sub">наш трекер пары</div>
          </div>
        </div>

        <div className="couple-card" style={{ cursor: 'pointer' }} onClick={() => setSettingsOpen(true)} title="Настройки пары">
          <div className="couple-row">
            <Avatar who="maria" />
            <div>
              <div className="couple-name">Мария</div>
              <div className="couple-meta">это вы · сегодня онлайн</div>
            </div>
          </div>
          <div className="couple-row">
            <Avatar who="daniil" />
            <div>
              <div className="couple-name">Даниил</div>
              <div className="couple-meta">был час назад</div>
            </div>
          </div>
          <div className="divider"></div>
          <div className="row" style={{ gap: 6, justifyContent: 'center', fontSize: 12 }}>
            <span className="muted">Вместе</span>
            <span className="serif" style={{ color: 'var(--maria-ink)' }}>2 года 8 месяцев</span>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-section">Разделы</div>
          {NAV.map(item => (
            <button
              key={item.id}
              className={'nav-item ' + (screen === item.id ? 'active' : '')}
              onClick={() => { setScreen(item.id); setNavOpen(false); }}
            >
              <span className="icon"><Icon name={item.icon} size={17} /></span>
              <span>{item.label}</span>
              {counts[item.id] !== undefined && counts[item.id] > 0 && (
                <span className="badge">{counts[item.id]}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: '12px 8px', fontSize: 11.5, color: 'var(--ink-muted)' }}>
          <div style={{ marginBottom: 4 }}>💡 Совет дня</div>
          <div style={{ lineHeight: 1.45 }}>
            Запишите 3 хороших момента из недели — они формируют память пары быстрее, чем кажется.
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="page-head">
          <div>
            <h1 className="page-title">
              {titles[screen].t.split(' ')[0]} <span className="serif">{titles[screen].t.split(' ').slice(1).join(' ')}</span>
            </h1>
            <div className="page-sub">{titles[screen].s}</div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <Avatar who="both" size="lg" />
          </div>
        </div>

        {screen === 'feed'     && <FeedScreen     activities={activities} onLike={onLike} onDelete={onDelete} onSelect={(item) => setDetail({ kind: 'activity', item })} />}
        {screen === 'calendar' && <CalendarScreen activities={activities} onSelectDay={(date, events) => setDayOpen({ date, events })} />}
        {screen === 'tasks'    && <TasksScreen    tasks={tasks} onToggle={onTaskToggle} onPartToggle={onTaskPartToggle} onAdd={() => openAdd('task')} onSelect={(item) => setDetail({ kind: 'task', item })} />}
        {screen === 'dates'    && <DatesScreen    dates={dates} onAccept={onDateAccept} onDecline={onDateDecline} onAdd={() => openAdd('date')} />}
        {screen === 'stats'    && <StatsScreen    activities={activities} />}
        {screen === 'ach'      && <AchievementsScreen achievements={achievements} onSelect={(item) => setDetail({ kind: 'ach', item })} />}
        {screen === 'notes'    && <NotesScreen    notes={notes} onAdd={() => openAdd('note')} onSelect={(item) => setDetail({ kind: 'note', item })} />}
        {screen === 'media'    && <MediaScreen    media={media} onAdd={() => openAdd('media')} onSelect={(item) => setDetail({ kind: 'media', item })} />}
      </main>

      <button className="fab" title="Добавить запись" onClick={() => openAdd('activity')}>
        <Icon name="plus" size={20} />
      </button>

      <AddModal
        open={addOpen}
        mode={addMode}
        setMode={setAddMode}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
      />

      <DayModal day={dayOpen} onClose={() => setDayOpen(null)} onAdd={() => { setDayOpen(null); openAdd('activity'); }} />

      <ActivityDetailModal
        item={detail?.kind === 'activity' ? detail.item : null}
        onClose={() => setDetail(null)}
        onDelete={(item) => onDelete(item.id)}
        onLike={onLike}
      />
      <TaskDetailModal
        item={detail?.kind === 'task' ? detail.item : null}
        onClose={() => setDetail(null)}
        onToggle={onTaskToggle}
        onDelete={onTaskDelete}
      />
      <AchievementDetailModal
        item={detail?.kind === 'ach' ? detail.item : null}
        onClose={() => setDetail(null)}
      />
      <NoteDetailModal
        item={detail?.kind === 'note' ? detail.item : null}
        onClose={() => setDetail(null)}
        onDelete={onNoteDelete}
      />
      <MediaDetailModal
        item={detail?.kind === 'media' ? detail.item : null}
        onClose={() => setDetail(null)}
        onDelete={onMediaDelete}
        onRate={onMediaRate}
      />

      <CoupleSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        importantDates={importantDates}
        onAddDate={onAddImportantDate}
        onDeleteDate={onDeleteImportantDate}
      />
      <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} />

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}

/* ---------- Add modal — multi-mode ---------- */
function AddModal({ open, mode, setMode, onClose, onSubmit }) {
  const [type, setType] = useState('chore');
  const [by, setBy]     = useState('maria');
  const [title, setTitle] = useState('');
  const [note, setNote]   = useState('');

  // task fields
  const [taskAssignee, setTaskAssignee] = useState('rotate');
  const [taskRecur, setTaskRecur] = useState('Раз в неделю');

  // date fields
  const [dateWhen, setDateWhen] = useState('');
  const [dateTag, setDateTag] = useState('Романтика');

  // note fields
  const [noteFrom, setNoteFrom] = useState('maria');

  // media fields
  const [mediaType, setMediaType] = useState('movie');
  const [mediaAuthor, setMediaAuthor] = useState('');
  const [mediaDesc, setMediaDesc] = useState('');
  const [mediaRatingMaria, setMediaRatingMaria]   = useState(5);
  const [mediaRatingDaniil, setMediaRatingDaniil] = useState(5);

  useEffect(() => {
    if (open) {
      setTitle(''); setNote(''); setDateWhen(''); setMediaAuthor('');
      setMediaDesc(''); setMediaRatingMaria(5); setMediaRatingDaniil(5);
    }
  }, [open, mode]);

  const submit = () => {
    if (!title.trim()) return;
    if (mode === 'activity') {
      onSubmit({ type, by, title: title.trim(), note: note.trim() || undefined, icon: ACTIVITY_TYPES[type].icon });
    } else if (mode === 'task') {
      onSubmit({ title: title.trim(), assignee: taskAssignee, recur: taskRecur, lastBy: null });
    } else if (mode === 'date') {
      onSubmit({ title: title.trim(), desc: note.trim() || 'Без описания', by, when: dateWhen || 'Дата уточняется', tag: dateTag });
    } else if (mode === 'note') {
      onSubmit({ from: noteFrom, text: title.trim() });
    } else if (mode === 'media') {
      onSubmit({
        type: mediaType,
        title: title.trim(),
        author: mediaAuthor.trim() || '—',
        desc: mediaDesc.trim() || undefined,
        ratingMaria: mediaRatingMaria,
        ratingDaniil: mediaRatingDaniil,
        date: iso(TODAY),
        status: 'watched',
        cover: title.trim().charAt(0).toUpperCase(),
      });
    }
  };

  const MODES = [
    { id: 'activity', label: 'Действие' },
    { id: 'task',     label: 'Задача' },
    { id: 'date',     label: 'Свидание' },
    { id: 'note',     label: 'Записка' },
    { id: 'media',    label: 'Фильм/книга' },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Добавить запись"
      sub="Что произошло сегодня?"
      actions={
        <>
          <button className="btn" onClick={onClose}>Отмена</button>
          <button className="btn primary" onClick={submit} disabled={!title.trim()}>Сохранить</button>
        </>
      }
    >
      <div className="row wrap" style={{ gap: 6, marginBottom: 20 }}>
        {MODES.map(m => (
          <button key={m.id} className={'chip ' + (mode === m.id ? 'active' : '')} onClick={() => setMode(m.id)}>{m.label}</button>
        ))}
      </div>

      {mode === 'activity' && (
        <div className="stack">
          <div>
            <label className="label">Тип</label>
            <div className="row wrap" style={{ gap: 6 }}>
              {Object.entries(ACTIVITY_TYPES).map(([k, v]) => (
                <button key={k} className={'chip ' + (type === k ? 'active' : '')} onClick={() => setType(k)}>
                  {v.icon} {v.short}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Кто сделал</label>
            <div className="seg">
              <button className={by === 'maria'  ? 'active' : ''} onClick={() => setBy('maria')}>Мария</button>
              <button className={by === 'daniil' ? 'active' : ''} onClick={() => setBy('daniil')}>Даниил</button>
              <button className={by === 'both'   ? 'active' : ''} onClick={() => setBy('both')}>Вместе</button>
            </div>
          </div>
          <div>
            <label className="label">Что случилось</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Помыл(а) посуду, сходили в кино…" autoFocus />
          </div>
          <div>
            <label className="label">Заметка (необязательно)</label>
            <textarea className="textarea" value={note} onChange={e => setNote(e.target.value)} placeholder="Что-то особенное про этот момент…" />
          </div>
        </div>
      )}

      {mode === 'task' && (
        <div className="stack">
          <div>
            <label className="label">Задача</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: Поменять воду коту" autoFocus />
          </div>
          <div>
            <label className="label">Кто делает</label>
            <div className="row wrap" style={{ gap: 6 }}>
              {[['rotate','По очереди'],['maria','Мария'],['daniil','Даниил'],['both','Вместе']].map(([k,l]) => (
                <button key={k} className={'chip ' + (taskAssignee === k ? 'active' : '')} onClick={() => setTaskAssignee(k)}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Как часто</label>
            <select className="select" value={taskRecur} onChange={e => setTaskRecur(e.target.value)}>
              <option>Каждый день</option>
              <option>Через день</option>
              <option>2 раза в неделю</option>
              <option>Раз в неделю</option>
              <option>Раз в месяц</option>
              <option>Разовая</option>
            </select>
          </div>
        </div>
      )}

      {mode === 'date' && (
        <div className="stack">
          <div>
            <label className="label">Идея свидания</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Поход в гончарную мастерскую" autoFocus />
          </div>
          <div>
            <label className="label">Описание</label>
            <textarea className="textarea" value={note} onChange={e => setNote(e.target.value)} placeholder="Чем интересно, что нужно забронировать…" />
          </div>
          <div className="grid-2">
            <div>
              <label className="label">Когда</label>
              <input className="input" value={dateWhen} onChange={e => setDateWhen(e.target.value)} placeholder="Сб, 24 мая, 19:00" />
            </div>
            <div>
              <label className="label">Тип</label>
              <select className="select" value={dateTag} onChange={e => setDateTag(e.target.value)}>
                <option>Романтика</option>
                <option>Активно</option>
                <option>Культура</option>
                <option>Творчество</option>
                <option>Уют</option>
                <option>Еда</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">От кого</label>
            <div className="seg">
              <button className={by === 'maria'  ? 'active' : ''} onClick={() => setBy('maria')}>Мария</button>
              <button className={by === 'daniil' ? 'active' : ''} onClick={() => setBy('daniil')}>Даниил</button>
            </div>
          </div>
        </div>
      )}

      {mode === 'note' && (
        <div className="stack">
          <div>
            <label className="label">От кого</label>
            <div className="seg">
              <button className={noteFrom === 'maria'  ? 'active' : ''} onClick={() => setNoteFrom('maria')}>Мария → Даниилу</button>
              <button className={noteFrom === 'daniil' ? 'active' : ''} onClick={() => setNoteFrom('daniil')}>Даниил → Марии</button>
            </div>
          </div>
          <div>
            <label className="label">Записка</label>
            <textarea className="textarea" value={title} onChange={e => setTitle(e.target.value)} style={{ minHeight: 120, fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontSize: 17 }} placeholder="Спасибо, что…" autoFocus />
          </div>
        </div>
      )}

      {mode === 'media' && (
        <div className="stack">
          <div>
            <label className="label">Что это</label>
            <div className="seg">
              <button className={mediaType === 'movie' ? 'active' : ''} onClick={() => setMediaType('movie')}>🎬 Фильм</button>
              <button className={mediaType === 'show'  ? 'active' : ''} onClick={() => setMediaType('show')}>📺 Сериал</button>
              <button className={mediaType === 'book'  ? 'active' : ''} onClick={() => setMediaType('book')}>📖 Книга</button>
            </div>
          </div>
          <div>
            <label className="label">Название</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Дюна. Часть третья" autoFocus />
          </div>
          <div>
            <label className="label">{mediaType === 'book' ? 'Автор' : 'Режиссёр / студия'}</label>
            <input className="input" value={mediaAuthor} onChange={e => setMediaAuthor(e.target.value)} placeholder={mediaType === 'book' ? 'Харуки Мураками' : 'Дени Вильнёв'} />
          </div>
          <div>
            <label className="label">Описание</label>
            <textarea className="textarea" value={mediaDesc} onChange={e => setMediaDesc(e.target.value)} placeholder="О чём это, почему стоит посмотреть / прочитать…" />
          </div>
          <div>
            <label className="label">Оценки — каждый свою</label>
            <div className="stack sm">
              {[['maria', 'Мария', mediaRatingMaria, setMediaRatingMaria], ['daniil', 'Даниил', mediaRatingDaniil, setMediaRatingDaniil]].map(([who, name, val, setVal]) => (
                <div key={who} className="row" style={{ gap: 10 }}>
                  <Avatar who={who} size="sm" />
                  <span style={{ fontSize: 13, fontWeight: 600, width: 58 }}>{name}</span>
                  <div className="row" style={{ gap: 2 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        className="icon-btn"
                        style={{ color: n <= val ? 'var(--gold)' : 'var(--border-strong)' }}
                        onClick={() => setVal(n)}
                      >
                        <Icon name="star" size={22} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ---------- Day detail modal (from calendar click) ---------- */
function DayModal({ day, onClose, onAdd }) {
  if (!day) return null;
  return (
    <Modal
      open={!!day}
      onClose={onClose}
      title={fmtDateLong(day.date)}
      sub={day.events.length === 0 ? 'В этот день ничего не записано' : `${day.events.length} ${day.events.length === 1 ? 'запись' : 'записей'}`}
      actions={
        <>
          <button className="btn" onClick={onClose}>Закрыть</button>
          {onAdd && <button className="btn primary" onClick={onAdd}><Icon name="plus" size={14} /> Добавить запись</button>}
        </>
      }
    >
      <div className="stack sm">
        {day.events.map(e => (
          <div key={e.id} className="activity" style={{ padding: 12 }}>
            <div className={'activity-icon ' + e.by}>{e.icon || ACTIVITY_TYPES[e.type].icon}</div>
            <div className="activity-body">
              <div className="activity-title">{e.title}</div>
              <div className="activity-meta">
                <ByPill by={e.by} />
                <span>·</span>
                <span>{ACTIVITY_TYPES[e.type].label}</span>
              </div>
              {e.note && <div className="activity-note">{e.note}</div>}
            </div>
            <div></div>
          </div>
        ))}
        {day.events.length === 0 && (
          <div className="empty-state" style={{ padding: 24 }}>
            <span className="serif">Тихий день</span>
            Это нормально — не каждый день нужно отмечать.
          </div>
        )}
      </div>
    </Modal>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
