// src/utils/helpers.js
import { format, isAfter, isBefore, addDays } from 'date-fns';

export const formatDate = (val) => {
  if (!val) return '—';
  try {
    const d = val?.toDate ? val.toDate() : new Date(val);
    return format(d, 'MMM d, yyyy');
  } catch { return '—'; }
};

export const formatDateTime = (val) => {
  if (!val) return '—';
  try {
    const d = val?.toDate ? val.toDate() : new Date(val);
    return format(d, 'MMM d, yyyy HH:mm');
  } catch { return '—'; }
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'done') return false;
  const d = dueDate?.toDate ? dueDate.toDate() : new Date(dueDate);
  return isBefore(d, new Date());
};

export const isDueSoon = (dueDate, status) => {
  if (!dueDate || status === 'done') return false;
  const d = dueDate?.toDate ? dueDate.toDate() : new Date(dueDate);
  const soon = addDays(new Date(), 3);
  return isAfter(d, new Date()) && isBefore(d, soon);
};

export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

// Light-theme-friendly badge colors
export const PRIORITY_CONFIG = {
  low:      { label: 'Low',      color: '#2563eb', bg: 'rgba(37,99,235,0.1)'   },
  medium:   { label: 'Medium',   color: '#d97706', bg: 'rgba(217,119,6,0.1)'   },
  high:     { label: 'High',     color: '#ea580c', bg: 'rgba(234,88,12,0.1)'   },
  critical: { label: 'Critical', color: '#dc2626', bg: 'rgba(220,38,38,0.1)'   },
};

export const STATUS_CONFIG = {
  todo:        { label: 'To Do',       color: '#6457e8', bg: 'rgba(100,87,232,0.08)' },
  in_progress: { label: 'In Progress', color: '#d97706', bg: 'rgba(217,119,6,0.08)'  },
  in_review:   { label: 'In Review',   color: '#2563eb', bg: 'rgba(37,99,235,0.08)'  },
  done:        { label: 'Done',        color: '#059669', bg: 'rgba(5,150,105,0.08)'  },
};

export const PROJECT_STATUS_CONFIG = {
  active:    { label: 'Active',    color: '#059669' },
  completed: { label: 'Completed', color: '#2563eb' },
  archived:  { label: 'Archived',  color: '#9399b8' },
};

export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const validatePassword = (pw) => pw.length >= 6;
