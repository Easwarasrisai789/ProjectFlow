// src/components/shared/UI.jsx
import React from 'react';
import { getInitials } from '../../utils/helpers';

export const Spinner = ({ size = 20 }) => (
  <div style={{
    width: size, height: size,
    border: '2px solid rgba(124,106,247,0.2)',
    borderTopColor: '#7c6af7',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
  }} />
);

export const Avatar = ({ name, size = 32, color = '#7c6af7' }) => (
  <div style={{
    width: size, height: size,
    borderRadius: '50%',
    background: `${color}22`,
    border: `1px solid ${color}44`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.36, fontWeight: 600, color,
    flexShrink: 0,
  }}>
    {getInitials(name)}
  </div>
);

export const Badge = ({ label, color, bg }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '2px 8px', borderRadius: 4,
    fontSize: 11, fontWeight: 600, letterSpacing: '0.03em',
    color, background: bg, whiteSpace: 'nowrap',
  }}>
    {label}
  </span>
);

export const EmptyState = ({ icon, title, message, action }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '60px 24px', textAlign: 'center',
  }}>
    <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.4 }}>{icon}</div>
    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 13, color: 'var(--text2)', maxWidth: 300, marginBottom: 20 }}>{message}</div>
    {action}
  </div>
);

export const Modal = ({ open, onClose, title, children, width = 480 }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, width, maxWidth: '100%', maxHeight: '90vh',
        overflow: 'auto', padding: 28,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={{ fontSize: 17, fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text2)',
            cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '2px 6px', borderRadius: 6,
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const ConfirmModal = ({ open, onClose, onConfirm, title, message, danger }) => (
  <Modal open={open} onClose={onClose} title={title} width={380}>
    <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>{message}</p>
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
      <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
      <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
        Confirm
      </button>
    </div>
  </Modal>
);

export const Field = ({ label, error, children }) => (
  <div className="field">
    {label && <label>{label}</label>}
    {children}
    {error && <div className="error-msg">{error}</div>}
  </div>
);

export const PageHeader = ({ title, subtitle, action }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{title}</h1>
      {subtitle && <p style={{ color: 'var(--text2)', fontSize: 13 }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const StatCard = ({ label, value, color = 'var(--accent)', icon }) => (
  <div style={{
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '18px 20px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      {icon && <span style={{ fontSize: 16, opacity: 0.6 }}>{icon}</span>}
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
  </div>
);
