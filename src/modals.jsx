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
function ActivityDetailModal({ item, onClose, onDelete, onLike }) {
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
              className={'btn sm ' + (liked ? '' : '')}
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

/* ---------- Task detail ---------- */
function TaskDetailModal({ item, onClose, onToggle, onDelete }) {
  if (!item) return null;
  // Mock completion history
  const history = [
    { date: daysAgo(0),  by: item.lastBy || 'maria' },
    { date: daysAgo(7),  by: item.lastBy === 'maria' ? 'daniil' : 'maria' },
    { date: daysAgo(14), by: item.lastBy || 'maria' },
  ];
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
          <button className="btn primary" onClick={() => { onToggle(item.id); onClose(); }}>
            {item.done ? 'Вернуть в работу' : 'Отметить сделанным'}
          </button>
        </>
      }
    >
      <div className="stack">
        <div>
          <div className="label">История выполнения</div>
          <div className="stack sm">
            {history.map((h, i) => (
              <div key={i} className="row" style={{ padding: 10, background: 'var(--surface-2)', borderRadius: 10, gap: 10 }}>
                <Avatar who={h.by} size="sm" />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{COUPLE[h.by].name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{fmtRelative(h.date)}</div>
                </div>
                <Icon name="check" size={14} style={{ marginLeft: 'auto', color: 'var(--daniil-ink)' }} />
              </div>
            ))}
          </div>
        </div>
        <div className="muted" style={{ fontSize: 12.5, padding: 10, background: 'var(--bg-soft)', borderRadius: 10 }}>
          💡 За последний месяц эту задачу выполняли {history.length} раз. Очередь — на {COUPLE[history[0].by === 'maria' ? 'daniil' : 'maria'].name}е.
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Achievement detail ---------- */
function AchievementDetailModal({ item, onClose }) {
  if (!item) return null;
  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title={item.name}
      sub={item.unlocked ? 'Открыто 14 апреля 2026' : 'Ещё не открыто — но всё впереди'}
      maxWidth={440}
      actions={<button className="btn" onClick={onClose}>Закрыть</button>}
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
              <span style={{ fontWeight: 600 }}>62%</span>
            </div>
            <div className="progress"><div className="progress-fill both" style={{ width: '62%' }}></div></div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ---------- Note detail ---------- */
function NoteDetailModal({ item, onClose, onDelete }) {
  if (!item) return null;
  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title={'Записка от ' + COUPLE[item.from].name + (item.from === 'maria' ? ' для Даниила' : ' для Марии')}
      sub={fmtDateLong(item.date) + ' · ' + fmtRelative(item.date)}
      maxWidth={460}
      actions={
        <>
          <button className="btn" onClick={onClose}>Закрыть</button>
          <button className="btn" style={{ color: 'var(--maria-ink)' }} onClick={() => onDelete(item)}>Удалить</button>
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
function MediaDetailModal({ item, onClose, onDelete, onRate }) {
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
        </>
      }
    >
      <div className="row" style={{ gap: 18, alignItems: 'flex-start' }}>
        <div className="media-cover" style={{ width: 130, flexShrink: 0, borderRadius: 10 }}>{item.cover}</div>
        <div className="stack" style={{ flex: 1, gap: 14 }}>
          <div>
            <div className="label">Статус</div>
            <div className="row" style={{ gap: 6 }}>
              {item.status === 'watched' && <span className="pill both"><span className="dot"></span>Просмотрено</span>}
              {item.status === 'reading' && <span className="pill maria"><span className="dot"></span>Читаем</span>}
              {item.status === 'planned' && <span className="pill"><span className="dot"></span>В планах</span>}
              {item.date && <span className="muted" style={{ fontSize: 12.5 }}>{fmtDateLong(item.date)}</span>}
            </div>
          </div>
          {item.status === 'watched' && (
            <div>
              <div className="label">Наша оценка</div>
              <div className="row" style={{ gap: 4 }}>
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    className="icon-btn"
                    style={{ color: n <= item.rating ? 'var(--gold)' : 'var(--border-strong)' }}
                    onClick={() => onRate(item.id, n)}
                  >
                    <Icon name="star" size={20} />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="muted" style={{ fontSize: 12.5, padding: 10, background: 'var(--bg-soft)', borderRadius: 10 }}>
            💡 Это уже {item.type === 'movie' ? 'двадцать второй' : 'девятый'} {typeLabel.toLowerCase()} в вашем общем списке.
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Couple / profile settings ---------- */
function CoupleSettingsModal({ open, onClose }) {
  const [mariaName, setMariaName]   = useMState('Мария');
  const [daniilName, setDaniilName] = useMState('Даниил');
  const [anniversary, setAnniversary] = useMState('2023-09-14');
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Настройки пары"
      sub="Имена, важные даты и предпочтения"
      actions={
        <>
          <button className="btn" onClick={onClose}>Отмена</button>
          <button className="btn primary" onClick={onClose}>Сохранить</button>
        </>
      }
    >
      <div className="stack">
        <div className="grid-2">
          <div>
            <label className="label">Имя 1 (вы)</label>
            <div className="row" style={{ gap: 10 }}>
              <Avatar who="maria" />
              <input className="input" value={mariaName} onChange={e => setMariaName(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Имя 2 (партнёр)</label>
            <div className="row" style={{ gap: 10 }}>
              <Avatar who="daniil" />
              <input className="input" value={daniilName} onChange={e => setDaniilName(e.target.value)} />
            </div>
          </div>
        </div>
        <div>
          <label className="label">Годовщина</label>
          <input className="input" type="date" value={anniversary} onChange={e => setAnniversary(e.target.value)} />
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            До следующей годовщины — 119 дней
          </div>
        </div>
        <div>
          <label className="label">Важные даты</label>
          <div className="stack sm">
            <div className="row" style={{ padding: 10, background: 'var(--surface-2)', borderRadius: 10, gap: 10 }}>
              <span style={{ fontSize: 18 }}>🎂</span>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>День рождения Марии</span>
              <span className="muted" style={{ fontSize: 12, marginLeft: 'auto' }}>3 марта</span>
            </div>
            <div className="row" style={{ padding: 10, background: 'var(--surface-2)', borderRadius: 10, gap: 10 }}>
              <span style={{ fontSize: 18 }}>🎂</span>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>День рождения Даниила</span>
              <span className="muted" style={{ fontSize: 12, marginLeft: 'auto' }}>18 ноября</span>
            </div>
            <button className="btn sm ghost" style={{ alignSelf: 'flex-start' }}>
              <Icon name="plus" size={12} /> Добавить дату
            </button>
          </div>
        </div>
        <div>
          <label className="label">Уведомления</label>
          <div className="stack sm">
            <label className="row" style={{ gap: 10, padding: 10, background: 'var(--surface-2)', borderRadius: 10 }}>
              <input type="checkbox" defaultChecked />
              <span style={{ fontSize: 13.5 }}>Напоминать о свиданиях за день</span>
            </label>
            <label className="row" style={{ gap: 10, padding: 10, background: 'var(--surface-2)', borderRadius: 10 }}>
              <input type="checkbox" defaultChecked />
              <span style={{ fontSize: 13.5 }}>Подсказки, если не было записей 3+ дня</span>
            </label>
            <label className="row" style={{ gap: 10, padding: 10, background: 'var(--surface-2)', borderRadius: 10 }}>
              <input type="checkbox" />
              <span style={{ fontSize: 13.5 }}>Сообщать партнёру о благодарностях</span>
            </label>
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
