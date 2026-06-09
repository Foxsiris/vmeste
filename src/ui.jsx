// Shared UI primitives — Avatar, Modal, Pill, Icon, etc.
const { useState, useEffect, useRef, useMemo } = React;

function Avatar({ who, size = '', name }) {
  if (who === 'both') {
    return (
      <div className="row" style={{ gap: 0 }}>
        <div className={`avatar maria ${size}`} style={{ marginRight: -10, border: '2px solid var(--surface)' }}>М</div>
        <div className={`avatar daniil ${size}`} style={{ border: '2px solid var(--surface)' }}>Д</div>
      </div>
    );
  }
  const c = COUPLE[who];
  return <div className={`avatar ${c.role} ${size}`} title={c.name}>{c.initial}</div>;
}

function ByPill({ by }) {
  if (by === 'both') return <span className="pill both"><span className="dot"></span>Вместе</span>;
  if (by === 'maria')  return <span className="pill maria"><span className="dot"></span>Мария</span>;
  if (by === 'daniil') return <span className="pill daniil"><span className="dot"></span>Даниил</span>;
  return null;
}

function Icon({ name, size = 16 }) {
  // Simple inline SVG icons - thin warm strokes
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 1.8,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (name) {
    case 'feed':       return <svg {...props}><path d="M4 6h16M4 12h16M4 18h10"/></svg>;
    case 'calendar':   return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
    case 'check':      return <svg {...props}><path d="M4 12l5 5L20 6"/></svg>;
    case 'heart':      return <svg {...props}><path d="M12 21s-7-4.5-7-11a4 4 0 017-2.5A4 4 0 0119 10c0 6.5-7 11-7 11z"/></svg>;
    case 'star':       return <svg {...props}><path d="M12 3l2.6 6.4L21 10l-5 4.3 1.6 6.7L12 17.7l-5.6 3.3L8 14.3 3 10l6.4-0.6z" fill="currentColor"/></svg>;
    case 'star-empty': return <svg {...props}><path d="M12 3l2.6 6.4L21 10l-5 4.3 1.6 6.7L12 17.7l-5.6 3.3L8 14.3 3 10l6.4-0.6z"/></svg>;
    case 'plus':       return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'x':          return <svg {...props}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'arrow-left':  return <svg {...props}><path d="M15 18l-6-6 6-6"/></svg>;
    case 'arrow-right': return <svg {...props}><path d="M9 18l6-6-6-6"/></svg>;
    case 'trophy':     return <svg {...props}><path d="M7 4h10v4a5 5 0 01-10 0V4z"/><path d="M5 6H3a4 4 0 004 4M19 6h2a4 4 0 01-4 4M10 14h4v3l1 3H9l1-3z"/></svg>;
    case 'stats':      return <svg {...props}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>;
    case 'task':       return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 12l2 2 4-4"/></svg>;
    case 'film':       return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 12h18"/></svg>;
    case 'sparkle':    return <svg {...props}><path d="M12 4v4M12 16v4M4 12h4M16 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/></svg>;
    case 'note':       return <svg {...props}><path d="M4 4h12l4 4v12H4z"/><path d="M16 4v4h4"/></svg>;
    case 'filter':     return <svg {...props}><path d="M3 5h18l-7 9v6l-4-2v-4z"/></svg>;
    case 'menu':       return <svg {...props}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
    case 'edit':       return <svg {...props}><path d="M17 3l4 4L8 20l-5 1 1-5z"/></svg>;
    default: return null;
  }
}

function Modal({ open, onClose, title, sub, children, actions, maxWidth }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={maxWidth ? { maxWidth } : {}} onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{title}</h2>
        {sub && <div className="modal-sub">{sub}</div>}
        {children}
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return <div className="toast"><Icon name="check" size={16} />{message}</div>;
}

function Stars({ value, max = 5 }) {
  return (
    <div className="media-rating">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={'star ' + (i < value ? '' : 'empty')}>
          <Icon name={i < value ? 'star' : 'star-empty'} size={13} />
        </span>
      ))}
    </div>
  );
}

function ProgressBar({ maria, daniil }) {
  const total = maria + daniil || 1;
  const mp = (maria / total) * 100;
  const dp = (daniil / total) * 100;
  return (
    <div className="progress" title={`${maria} / ${daniil}`}>
      <div className="progress-fill maria" style={{ width: `${mp}%` }}></div>
      <div className="progress-fill daniil" style={{ width: `${dp}%` }}></div>
    </div>
  );
}

Object.assign(window, { Avatar, ByPill, Icon, Modal, Toast, Stars, ProgressBar });
