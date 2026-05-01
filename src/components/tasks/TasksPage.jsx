// src/components/tasks/TasksPage.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import { useAllTasks } from '../../hooks/useTasks';
import { updateTaskStatus } from '../../services/taskService';
import { Badge, Spinner, EmptyState, PageHeader } from '../shared/UI';
import { STATUS_CONFIG, PRIORITY_CONFIG, formatDate, isOverdue, isDueSoon } from '../../utils/helpers';
import toast from 'react-hot-toast';

// Member can only move forward: todo -> in_progress -> done
const MEMBER_NEXT = { todo: 'in_progress', in_progress: 'done', done: null };
const MEMBER_BTN_LABEL = { todo: '▶ Start', in_progress: '✓ Done', done: null };

const TaskRow = ({ task, projectName, onStatusChange, canManage, isMember, userId }) => {
  const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
  const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const over = isOverdue(task.dueDate, task.status);
  const soon = isDueSoon(task.dueDate, task.status);
  const navigate = useNavigate();
  const isMyTask = task.assigneeId === userId;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 110px 120px 120px 130px 120px',
      gap: 10, alignItems: 'center',
      padding: '12px 16px',
      borderBottom: '1px solid var(--border)',
      background: over ? 'rgba(248,113,113,0.04)' : 'transparent',
      transition: 'background 0.1s',
    }}
      onMouseEnter={(e) => !over && (e.currentTarget.style.background = 'var(--surface2)')}
      onMouseLeave={(e) => !over && (e.currentTarget.style.background = 'transparent')}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{task.title}</div>
        <button className="btn btn-ghost btn-sm" style={{ padding: 0, fontSize: 11, color: 'var(--accent)', height: 'auto' }}
          onClick={() => navigate(`/projects/${task.projectId}`)}>
          {projectName}
        </button>
      </div>
      <Badge label={pc.label} color={pc.color} bg={pc.bg} />

      {/* Status cell */}
      <div>
        {canManage ? (
          // Admin sees full dropdown
          <select value={task.status} onChange={(e) => onStatusChange(task.id, e.target.value)}
            style={{ fontSize: 12, padding: '4px 8px', background: sc.bg, color: sc.color, border: 'none', borderRadius: 4, cursor: 'pointer', width: '100%' }}>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k} style={{ background: 'var(--surface)', color: 'var(--text)' }}>{v.label}</option>
            ))}
          </select>
        ) : (
          // Member sees badge + advance button if it's their task
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Badge label={sc.label} color={sc.color} bg={sc.bg} />
            {isMyTask && MEMBER_NEXT[task.status] && (
              <button className="btn btn-ghost btn-sm"
                style={{ fontSize: 11, color: MEMBER_NEXT[task.status] === 'done' ? '#34d399' : '#fbbf24', padding: '2px 4px' }}
                onClick={() => onStatusChange(task.id, MEMBER_NEXT[task.status])}>
                {MEMBER_BTN_LABEL[task.status]}
              </button>
            )}
          </div>
        )}
      </div>

      <span style={{ fontSize: 12, color: over ? 'var(--red)' : soon ? 'var(--amber)' : 'var(--text3)' }}>
        {task.dueDate ? (over ? '⚠ ' : soon ? '⏰ ' : '') + formatDate(task.dueDate) : '—'}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{task.assigneeName || '—'}</span>
      {/* Updated label */}
      <span style={{ fontSize: 11, color: 'var(--text3)' }}>
        {task.updatedAt?.toDate ? formatDate(task.updatedAt) : '—'}
      </span>
    </div>
  );
};

const TasksPage = () => {
  const { user, profile } = useAuth();
  const { projects } = useProjects();
  const { tasks, loading, refetch } = useAllTasks(projects.map((p) => p.id));
  const [filter, setFilter] = useState('mine');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const isAdmin = profile?.role === 'admin';
  const isMember = profile?.role === 'member';

  const projectMap = useMemo(() =>
    Object.fromEntries(projects.map((p) => [p.id, p.name])),
    [projects]
  );

  const filtered = useMemo(() => {
    let t = tasks;
    if (filter === 'mine') t = t.filter((x) => x.assigneeId === user?.uid);
    else if (filter === 'overdue') t = t.filter((x) => isOverdue(x.dueDate, x.status));
    else if (filter === 'due_soon') t = t.filter((x) => isDueSoon(x.dueDate, x.status));
    if (statusFilter !== 'all') t = t.filter((x) => x.status === statusFilter);
    if (search) t = t.filter((x) => x.title.toLowerCase().includes(search.toLowerCase()));
    return t;
  }, [tasks, filter, statusFilter, search, user]);

  const handleStatusChange = async (taskId, status) => {
    await updateTaskStatus(taskId, status);
    toast.success('Status updated');
    refetch();
  };

  // Stats
  const stats = useMemo(() => {
    const mine = tasks.filter(t => t.assigneeId === user?.uid);
    return {
      myTodo: mine.filter(t => t.status === 'todo').length,
      myInProgress: mine.filter(t => t.status === 'in_progress').length,
      myDone: mine.filter(t => t.status === 'done').length,
    };
  }, [tasks, user]);

  return (
    <div>
      <PageHeader
        title={isAdmin ? 'All Tasks' : 'My Tasks'}
        subtitle={`${filtered.length} tasks`}
      />

      {/* Member stats bar */}
      {isMember && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'To Do', value: stats.myTodo, color: '#9998b0' },
            { label: 'In Progress', value: stats.myInProgress, color: '#fbbf24' },
            { label: 'Done', value: stats.myDone, color: '#34d399' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '12px 16px',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', borderRadius: 8, padding: 4 }}>
          {(isAdmin
            ? [['all','All'],['mine','Mine'],['overdue','Overdue'],['due_soon','Due Soon']]
            : [['mine','My Tasks'],['overdue','Overdue'],['due_soon','Due Soon']]
          ).map(([v, l]) => (
            <button key={v} className="btn btn-ghost btn-sm"
              style={{ background: filter === v ? 'var(--surface)' : 'transparent', color: filter === v ? 'var(--text)' : 'var(--text2)', borderRadius: 6 }}
              onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: 'auto', minWidth: 140 }}>
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input type="text" placeholder="Search tasks…" value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 200 }} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 60 }}><Spinner size={28} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="◻" title="No tasks found" message="Try adjusting your filters or create tasks in a project" />
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 110px 120px 120px 130px 120px',
            gap: 10, padding: '10px 16px',
            background: 'var(--surface2)', borderBottom: '1px solid var(--border)',
          }}>
            {['Task', 'Priority', 'Status', 'Due Date', 'Assignee', 'Last Updated'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>
          {filtered.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              projectName={projectMap[task.projectId] || 'Unknown'}
              onStatusChange={handleStatusChange}
              canManage={isAdmin}
              isMember={isMember}
              userId={user?.uid}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksPage;
