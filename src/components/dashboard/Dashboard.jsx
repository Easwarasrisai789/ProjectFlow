// src/components/dashboard/Dashboard.jsx
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import { useAllTasks } from '../../hooks/useTasks';
import { StatCard, Badge, Spinner, EmptyState, Avatar } from '../shared/UI';
import {
  STATUS_CONFIG, PRIORITY_CONFIG,
  formatDate, isOverdue, isDueSoon,
} from '../../utils/helpers';

const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { projects, loading: pLoading } = useProjects();
  const projectIds = projects.map((p) => p.id);
  const { tasks, loading: tLoading } = useAllTasks(projectIds);

  const isAdmin = profile?.role === 'admin';

  const myTasks = useMemo(
    () => tasks.filter((t) => t.assigneeId === profile?.uid),
    [tasks, profile]
  );

  const stats = useMemo(() => ({
    total:      tasks.length,
    todo:       tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    done:       tasks.filter((t) => t.status === 'done').length,
    overdue:    tasks.filter((t) => isOverdue(t.dueDate, t.status)).length,
    myPending:  myTasks.filter((t) => t.status !== 'done').length,
  }), [tasks, myTasks]);

  // For members: show only their tasks sorted by due date
  const relevantTasks = useMemo(() => {
    if (isAdmin) {
      return [...tasks]
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 8);
    }
    return [...myTasks]
      .sort((a, b) => {
        const da = a.dueDate?.toDate ? a.dueDate.toDate() : new Date(a.dueDate || 0);
        const db_ = b.dueDate?.toDate ? b.dueDate.toDate() : new Date(b.dueDate || 0);
        return da - db_;
      });
  }, [tasks, myTasks, isAdmin]);

  if (pLoading || tLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}>
        <Spinner size={32} />
      </div>
    );
  }

  const MEMBER_NEXT = { todo: 'in_progress', in_progress: 'done', done: null };
  const MEMBER_BTN = { todo: '▶ Start', in_progress: '✓ Done', done: null };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
          Hey, {profile?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>
          {isAdmin
            ? "Here's what's happening across your projects"
            : `You have ${stats.myPending} pending task${stats.myPending !== 1 ? 's' : ''} assigned to you`}
        </p>
        {!isAdmin && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
            padding: '4px 10px', borderRadius: 6,
            background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)',
            fontSize: 12, color: '#60a5fa', fontWeight: 600,
          }}>
            👤 Member — Update task status: To Do → In Progress → Done
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 14, marginBottom: 32 }}>
        {isAdmin ? (
          <>
            <StatCard label="Total Tasks"  value={stats.total}      icon="◻" />
            <StatCard label="In Progress"  value={stats.inProgress}  color="#fbbf24" icon="◈" />
            <StatCard label="Completed"    value={stats.done}        color="#34d399" icon="✓" />
            <StatCard label="Overdue"      value={stats.overdue}     color="#f87171" icon="⚠" />
            <StatCard label="My Pending"   value={stats.myPending}   color="#7c6af7" icon="◎" />
            <StatCard label="Projects"     value={projects.length}   color="#60a5fa" icon="⬡" />
          </>
        ) : (
          <>
            <StatCard label="My To Do"     value={myTasks.filter(t => t.status === 'todo').length}        color="#9998b0" icon="◻" />
            <StatCard label="In Progress"  value={myTasks.filter(t => t.status === 'in_progress').length}  color="#fbbf24" icon="◈" />
            <StatCard label="Done"         value={myTasks.filter(t => t.status === 'done').length}         color="#34d399" icon="✓" />
            <StatCard label="Overdue"      value={myTasks.filter(t => isOverdue(t.dueDate, t.status)).length} color="#f87171" icon="⚠" />
            <StatCard label="Projects"     value={projects.length}   color="#60a5fa" icon="⬡" />
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Tasks panel */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>
              {isAdmin ? 'Recent Tasks' : 'My Tasks (by Due Date)'}
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>
              View all →
            </button>
          </div>
          {relevantTasks.length === 0 ? (
            <EmptyState icon="◻" title="No tasks yet"
              message={isAdmin ? "Create a project and add tasks" : "You have no tasks assigned yet"} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {relevantTasks.map((task) => {
                const over = isOverdue(task.dueDate, task.status);
                const soon = isDueSoon(task.dueDate, task.status);
                const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
                const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                return (
                  <div key={task.id} style={{
                    padding: '10px 14px', borderRadius: 8,
                    background: 'var(--surface2)',
                    border: `1px solid ${over ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`,
                    cursor: 'pointer',
                  }} onClick={() => navigate(`/projects/${task.projectId}`)}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.title}
                      </span>
                      <Badge label={sc.label} color={sc.color} bg={sc.bg} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                      <Badge label={pc.label} color={pc.color} bg={pc.bg} />
                      {task.dueDate && (
                        <span style={{ fontSize: 11, color: over ? '#f87171' : soon ? '#fbbf24' : 'var(--text3)' }}>
                          {over ? '⚠ ' : ''}{formatDate(task.dueDate)}
                        </span>
                      )}
                      {task.assigneeName && (
                        <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>
                          → {task.assigneeName}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Projects overview */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Projects</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>
              View all →
            </button>
          </div>
          {projects.length === 0 ? (
            <EmptyState icon="⬡" title="No projects"
              message={isAdmin ? "Create your first project to get started" : "You haven't been added to any projects yet"} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.slice(0, 6).map((proj) => {
                const pTasks = tasks.filter((t) => t.projectId === proj.id);
                const donePct = pTasks.length
                  ? Math.round((pTasks.filter((t) => t.status === 'done').length / pTasks.length) * 100)
                  : 0;
                const myProjTasks = pTasks.filter(t => t.assigneeId === profile?.uid);
                return (
                  <div key={proj.id}
                    style={{
                      padding: '12px 14px', borderRadius: 8, background: 'var(--surface2)',
                      border: '1px solid var(--border)', cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/projects/${proj.id}`)}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{proj.name}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {!isAdmin && myProjTasks.length > 0 && (
                          <span style={{ fontSize: 11, color: '#60a5fa' }}>{myProjTasks.length} mine</span>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{pTasks.length} tasks</span>
                      </div>
                    </div>
                    {/* Member previews */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      {(proj.members || []).slice(0, 5).map((m, i) => (
                        <div key={m.uid} style={{ marginLeft: i > 0 ? -6 : 0 }}>
                          <Avatar name={m.name} size={20} color={m.role === 'admin' ? '#7c6af7' : '#60a5fa'} />
                        </div>
                      ))}
                      {(proj.members?.length || 0) > 5 && (
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>+{proj.members.length - 5}</span>
                      )}
                    </div>
                    <div style={{ height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${donePct}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.4s' }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>{donePct}% complete</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
