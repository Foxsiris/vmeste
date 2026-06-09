// Detail & confirmation modals — opened by clicking items
const { useState: useMState, useEffect: useMEffect } = React;

/* ---------- Generic confirmation modal ---------- */
function ConfirmModal({ confirm, onClose }) {
  if (!confirm) return null;
  return (
    <Modal
      open={!!confirm}
      onClose={onClose}
      title={confirm.title || 'Подтвердите действие'}
      sub={confirm.message}
      maxWidth={420}
      actions={
        <>
          <button className="btn" onClick={onClose}>Отмена</button>
          <button
            className="btn primary"
            style={{ background: 'var(--maria-ink)', borderColor: 'var(--maria-ink)' }}
            onClick={() => { confirm.onConfirm(); onClose(); }}
          >
            {confirm.confirmLabel || 'Удалить'}
          </button>
        </>
      }
    >
      <div></div>
    </Modal>
  );
}

/* ---------- Activity detail ---------- */
function ActivityDetailModal({ item, onClose, onDelete, onEdit, onLike }) {
  if (!item) return null;
  const type = ACTIVITY_TYPES[item.type];
  const liked = item.likedBy && item.likedBy.length > 0;
  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title={item.title}
      sub={`${type.label} · ${fmtDateLong(item.date)} (${fmtRelative(item.date)})`}
      actions={
        <>
          <button className="btn" onClick={onClose}>Закрыть</button>
          <button className="btn" style={{ color: 'var(--maria-ink)' }} onClick={() => onDelete(item)}>Удалить</button>
          <button className="btn primary" onClick={() => onEdit(item)}><Icon name="edit" size={14} /> Редактировать</button>
        </>
      }
    >
      <div className="stack">
        <div className="row" style={{ gap: 14 }}>
          <div className={'activity-icon ' + item.by} style={{ width: 56, height: 56, fontSize: 26 }}>
            {item.icon || type.icon}
          </div>
          <div>
            <ByPill by={item.by} />
            <div style={{ marginTop: 8, fontSize: 13.5, color: 'var(--ink-2)' }}>
              {item.by === 'both' ? 'Совместная активность' : `${COUPLE[item.by].name} сделал${item.by === 'maria' ? 'а' : ''} это`}
            </div>
          </div>
        </div>
        {item.note && (
          <div>
            <div className="label">Заметка</div>
            <div className="activity-note" style={{ marginTop: 0 }}>{item.note}</div>
          </div>
        )}
        <div>
          <div className="label">Реакция</div>
          <div className="row" style={{ gap: 8 }}>
            <button
              className="btn sm"
              onClick={() => onLike(item.id)}
              style={liked ? { background: 'var(--maria-soft)', borderColor: 'var(--maria-soft)', color: 'var(--maria-ink)' } : {}}
            >
              <Icon name="heart" size={14} /> {liked ? 'Спасибо отправлено' : 'Поблагодарить'}
            </button>
            {liked && <span className="muted" style={{ fontSize: 12 }}>{item.likedBy.length} ❤</span>}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Task detail — real completion history ---------- */
function TaskDetailModal({ item, completions = [], onClose, onToggle, onEdit, onDelete }) {
  if (!item) return null;
  const history = completions.slice(0, 6);
  const monthAgo = daysAgo(30);
  const lastMonthCount = completions.filter(c => c.date >= monthAgo).length;
  const nextTurn = item.assignee === 'rotate'
    ? (item.lastBy === 'maria' ? 'daniil' : 'maria')
    : null;
  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title={item.title}
      sub={`${item.recur} · ${item.assignee === 'rotate' ? 'По очереди' : item.assignee === 'both' ? 'Вместе' : COUPLE[item.assignee].name}`}
      actions={
        <>
          <button className="btn" onClick={onClose}>Закрыть</button>
          <button className="btn" style={{ color: 'var(--maria-ink)' }} onClick={() => onDelete(item)}>Удалить</button>
          <button className="btn" onClick={() => onEdit(item)}><Icon name="edit" size={14} /> Изменить</button>
          {item.assignee !== 'both' && (
            <button className="btn primary" onClick={() => { onToggle(item.id); onClose(); }}>
              {item.done ? 'Вернуть в работу' : 'Отметить сделанным'}
            </button>
          )}
        </>
      }
    >
      <div className="stack">
        <div>
          <div className="label">История выполнения</div>
          {history.length === 0 ? (
            <div className="muted" style={{ fontSize: 13, padding: '8px 0' }}>
              Эту задачу ещё ни разу не отмечали выполненной.
            </div>
          ) : (
            <div className="stack sm">
              {history.map((h) => (
                <div key={h.id} className="row" style={{ padding: 10, background: 'var(--surface-2)', borderRadius: 10, gap: 10 }}>
                  <Avatar who={h.by} size="sm" />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{COUPLE[h.by].name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{fmtRelative(h.date)}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', color: 'var(--daniil-ink)' }}><Icon name="check" size={14} /></span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="muted" style={{ fontSize: 12.5, padding: 10, background: 'var(--bg-soft)', borderRadius: 10 }}>
          💡 За последний месяц — {lastMonthCount} {plural(lastMonthCount, 'выполнение', 'выполнения', 'выполнений')}.
          {nextTurn && <> Очередь — за {COUPLE[nextTurn].name}.</>}
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Achievement detail ---------- */
function AchievementDetailModal({ item, onClose, onToggle }) {
  if (!item) return null;
  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title={item.name}
      sub={item.unlocked
        ? (item.unlockedAt ? 'Открыто ' + fmtDateFull(item.unlockedAt) : 'Открыто')
        : 'Ещё не открыто — но всё впереди'}
      maxWidth={440}
      actions={
        <>
          <button className="btn" onClick={onClose}>Закрыть</button>
          <button className={'btn ' + (item.unlocked ? '' : 'primary')} onClick={() => onToggle(item)}>
            {item.unlocked ? 'Снять отметку' : '🏆 Отметить открытым'}
          </button>
        </>
      }
    >
      <div className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
        <div className={'ach-medal ' + (item.unlocked ? '' : 'locked')} style={{
          width: 96, height: 96, fontSize: 44,
          background: item.unlocked ? 'linear-gradient(135deg, var(--both-soft), var(--maria-soft))' : 'var(--surface-2)',
          borderColor: item.unlocked ? 'var(--gold)' : 'var(--border)',
          margin: '8px 0',
          opacity: item.unlocked ? 1 : 0.4,
        }}>{item.icon}</div>
        <div style={{ fontSize: 14, color: 'var(--ink-2)', maxWidth: 320 }}>{item.desc}</div>
        {item.unlocked ? (
          <div style={{ background: 'var(--both-soft)', padding: '10px 14px', borderRadius: 10, fontSize: 13, color: '#7a5a2f' }}>
            <span className="serif" style={{ fontSize: 17 }}>Поздравляем!</span>
            <br/>Вы открыли это вместе.
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            <div className="row between" style={{ fontSize: 12, marginBottom: 6 }}>
              <span className="muted">Прогресс</span>
              <span style={{ fontWeight: 600 }}>{item.progress || 0}%</span>
            </div>
            <div className="progress"><div className="progress-fill both" style={{ width: `${item.progress || 0}%` }}></div></div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ---------- Note detail ---------- */
function NoteDetailModal({ item, onClose, onEdit, onDelete }) {
  if (!item) return null;
  const to = item.from === 'maria' ? 'daniil' : 'maria';
  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title={'Записка от ' + COUPLE[item.from].name}
      sub={`для: ${COUPLE[to].name} · ${fmtDateLong(item.date)} (${fmtRelative(item.date)})`}
      maxWidth={460}
      actions={
        <>
          <button className="btn" onClick={onClose}>Закрыть</button>
          <button className="btn" style={{ color: 'var(--maria-ink)' }} onClick={() => onDelete(item)}>Удалить</button>
          <button className="btn primary" onClick={() => onEdit(item)}><Icon name="edit" size={14} /> Редактировать</button>
        </>
      }
    >
      <div className={'note from-' + item.from} style={{ marginBottom: 0 }}>
        <div className="note-quote" style={{ fontSize: 22 }}>«{item.text}»</div>
        <div className="note-foot" style={{ marginTop: 8 }}>
          <Avatar who={item.from} size="sm" />
          <span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>{COUPLE[item.from].name}</span>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Media detail ---------- */
function MediaDetailModal({ item, onClose, onEdit, onDelete, onRate }) {
  if (!item) return null;
  const typeLabel = { movie: 'Фильм', show: 'Сериал', book: 'Книга' }[item.type] || '';
  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title={item.title}
      sub={`${typeLabel} · ${item.author}`}
      maxWidth={520}
      actions={
        <>
          <button className="btn" onClick={onClose}>Закрыть</button>
          <button className="btn" style={{ color: 'var(--maria-ink)' }} onClick={() => onDelete(item)}>Удалить</button>
          <button className="btn primary" onClick={() => onEdit(item)}><Icon name="edit" size={14} /> Редактировать</button>
        </>
      }
    >
      <div className="row" style={{ gap: 18, alignItems: 'flex-start' }}>
        <div className="media-cover" style={{ width: 130, flexShrink: 0, borderRadius: 10 }}>{item.cover}</div>
        <div className="stack" style={{ flex: 1, gap: 14 }}>
          <div>
            <div className="label">Статус</div>
            <div className="row" style={{ gap: 6 }}>
              {item.status === 'watched' && <span className="pill both"><span className="dot"></span>{item.type === 'book' ? 'Прочитано' : 'Просмотрено'}</span>}
              {item.status === 'reading' && <span className="pill maria"><span className="dot"></span>{item.type === 'book' ? 'Читаем' : 'Смотрим'}</span>}
              {item.status === 'planned' && <span className="pill"><span className="dot"></span>В планах</span>}
              {item.date && <span className="muted" style={{ fontSize: 12.5 }}>{fmtDateLong(item.date)}</span>}
            </div>
          </div>
          {item.desc && (
            <div>
              <div className="label">Описание</div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          )}
          {item.status === 'watched' && (
            <div>
              <div className="label">Оценки — каждый свою</div>
              <div className="stack sm">
                {[['maria', COUPLE.maria.name, item.ratingMaria], ['daniil', COUPLE.daniil.name, item.ratingDaniil]].map(([who, name, val]) => (
                  <div key={who} className="row" style={{ gap: 10 }}>
                    <Avatar who={who} size="sm" />
                    <span style={{ fontSize: 13, fontWeight: 600, width: 58 }}>{name}</span>
                    <div className="row" style={{ gap: 2 }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          className="icon-btn"
                          title={`${name}: ${n}`}
                          style={{ color: n <= val ? 'var(--gold)' : 'var(--border-strong)' }}
                          onClick={() => onRate(item.id, who, n)}
                        >
                          <Icon name="star" size={20} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Couple / profile settings — persisted to Supabase ---------- */
function CoupleSettingsModal({ open, onClose, settings, onSave, importantDates = [], onAddDate, onDeleteDate }) {
  const [mariaName, setMariaName]   = useMState('Мария');
  const [daniilName, setDaniilName] = useMState('Даниил');
  const [anniversary, setAnniversary] = useMState('2023-09-14');
  const [adding, setAdding]     = useMState(false);
  const [newLabel, setNewLabel] = useMState('');
  const [newWhen, setNewWhen]   = useMState('');

  // local notification prefs (static site — stored on this device)
  const [notif, setNotif] = useMState(() => {
    try { return JSON.parse(localStorage.getItem('vmeste_notif')) || { dates: true, idle: true, thanks: false }; }
    catch { return { dates: true, idle: true, thanks: false }; }
  });
  const toggleNotif = (key) => {
    const next = { ...notif, [key]: !notif[key] };
    setNotif(next);
    try { localStorage.setItem('vmeste_notif', JSON.stringify(next)); } catch {}
  };

  useMEffect(() => {
    if (!open) return;
    setMariaName(settings?.mariaName || COUPLE.maria.name);
    setDaniilName(settings?.daniilName || COUPLE.daniil.name);
    setAnniversary(settings?.anniversary || COUPLE.start);
    setAdding(false); setNewLabel(''); setNewWhen('');
  }, [open, settings]);

  const saveDate = () => {
    if (!newLabel.trim() || !newWhen.trim()) return;
    onAddDate && onAddDate({ label: newLabel.trim(), when: newWhen.trim(), icon: '🎂' });
    setNewLabel(''); setNewWhen(''); setAdding(false);
  };

  const daysLeft = anniversary ? daysToAnniversary(anniversary) : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Настройки пары"
      sub="Имена, важные даты и предпочтения"
      actions={
        <>
          <button className="btn" onClick={onClose}>Отмена</button>
          <button
            className="btn primary"
            disabled={!mariaName.trim() || !daniilName.trim() || !anniversary}
            onClick={() => onSave({ mariaName: mariaName.trim(), daniilName: daniilName.trim(), anniversary })}
          >
            Сохранить
          </button>
        </>
      }
    >
      <div className="stack">
        <div className="grid-2">
          <div>
            <label className="label">Имя 1</label>
            <div className="row" style={{ gap: 10 }}>
              <Avatar who="maria" />
              <input className="input" value={mariaName} onChange={e => setMariaName(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Имя 2</label>
            <div className="row" style={{ gap: 10 }}>
              <Avatar who="daniil" />
              <input className="input" value={daniilName} onChange={e => setDaniilName(e.target.value)} />
            </div>
          </div>
        </div>
        <div>
          <label className="label">Годовщина</label>
          <input className="input" type="date" value={anniversary} onChange={e => setAnniversary(e.target.value)} />
          {daysLeft !== null && (
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              {daysLeft === 0
                ? '🎉 Годовщина сегодня!'
                : `До следующей годовщины — ${daysLeft} ${plural(daysLeft, 'день', 'дня', 'дней')}`}
            </div>
          )}
        </div>
        <div>
          <label className="label">Важные даты</label>
          <div className="stack sm">
            {importantDates.length === 0 && (
              <div className="muted" style={{ fontSize: 12.5 }}>Пока нет важных дат.</div>
            )}
            {importantDates.map(d => (
              <div key={d.id} className="row" style={{ padding: 10, background: 'var(--surface-2)', borderRadius: 10, gap: 10 }}>
                <span style={{ fontSize: 18 }}>{d.icon}</span>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{d.label}</span>
                <span className="muted" style={{ fontSize: 12, marginLeft: 'auto' }}>{d.when}</span>
                {onDeleteDate && (
                  <button className="icon-btn" title="Удалить" style={{ width: 26, height: 26 }} onClick={() => onDeleteDate(d.id)}>
                    <Icon name="x" size={13} />
                  </button>
                )}
              </div>
            ))}
            {adding ? (
              <div className="stack sm" style={{ padding: 10, background: 'var(--surface-2)', borderRadius: 10 }}>
                <input className="input" value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Например: Годовщина свадьбы" autoFocus />
                <div className="row" style={{ gap: 8 }}>
                  <input className="input" value={newWhen} onChange={e => setNewWhen(e.target.value)} placeholder="7 июля" />
                  <button className="btn primary sm" onClick={saveDate} disabled={!newLabel.trim() || !newWhen.trim()}>Сохранить</button>
                  <button className="btn sm" onClick={() => { setAdding(false); setNewLabel(''); setNewWhen(''); }}>Отмена</button>
                </div>
              </div>
            ) : (
              <button className="btn sm ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setAdding(true)}>
                <Icon name="plus" size={12} /> Добавить дату
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="label">Уведомления (на этом устройстве)</label>
          <div className="stack sm">
            {[['dates', 'Напоминать о свиданиях за день'], ['idle', 'Подсказки, если не было записей 3+ дня'], ['thanks', 'Сообщать партнёру о благодарностях']].map(([key, text]) => (
              <label key={key} className="row" style={{ gap: 10, padding: 10, background: 'var(--surface-2)', borderRadius: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!notif[key]} onChange={() => toggleNotif(key)} />
                <span style={{ fontSize: 13.5 }}>{text}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

Object.assign(window, {
  ConfirmModal,
  ActivityDetailModal,
  TaskDetailModal,
  AchievementDetailModal,
  NoteDetailModal,
  MediaDetailModal,
  CoupleSettingsModal,
});
