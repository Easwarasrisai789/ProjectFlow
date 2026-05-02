// src/components/projects/ProjectDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useProjectTasks } from '../../hooks/useTasks';
import { getProject, addMemberToProject, removeMemberFromProject, getAllUsers } from '../../services/projectService';
import { createTask, updateTaskStatus, deleteTask, updateTask } from '../../services/taskService';
import { subscribeToProjectChat, sendMessage } from '../../services/chatService';
import { Modal, Field, Badge, Spinner, Avatar, ConfirmModal, EmptyState } from '../shared/UI';
import { STATUS_CONFIG, PRIORITY_CONFIG, formatDate, isOverdue } from '../../utils/helpers';

// ─── Task Card ────────────────────────────────────────────
const TaskCard = ({ task, taskNumber, onEdit, onDelete, canManage, onStatusChange, isMember, currentUserId }) => {
  const sc = STATUS_CONFIG[task.status];
  const pc = PRIORITY_CONFIG[task.priority];
  const over = isOverdue(task.dueDate, task.status);
  const isMyTask = task.assigneeId === currentUserId;

  const STATUS_FLOW = { todo: 'in_progress', in_progress: 'in_review', in_review: 'done', done: null };
  const STATUS_BTN = {
    todo:        { label: '▶ Start Task',         color: '#fbbf24' },
    in_progress: { label: '🔍 Submit for Review',  color: '#60a5fa' },
    in_review:   { label: '✓ Mark Done',           color: '#34d399' },
    done:        null,
  };
  const nextStatus = STATUS_FLOW[task.status];
  const btnCfg = STATUS_BTN[task.status];

  return (
    <div style={{
      background: 'var(--surface2)',
      border: `1px solid ${over ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`,
      borderRadius: 10, padding: '12px 14px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          {taskNumber && (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'rgba(100,87,232,0.12)', borderRadius: 4, padding: '2px 7px', flexShrink: 0 }}>
              #{taskNumber}
            </span>
          )}
          <span style={{ fontSize: 13, fontWeight: 500, flex: 1, lineHeight: 1.4 }}>{task.title}</span>
        </div>
        {canManage && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(task)} style={{ padding: '2px 6px', fontSize: 12 }}>✎</button>
            <button className="btn btn-ghost btn-sm" onClick={() => onDelete(task)} style={{ padding: '2px 6px', fontSize: 12, color: 'var(--red)' }}>✕</button>
          </div>
        )}
      </div>
      {task.description && (
        <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6, lineHeight: 1.4 }}>
          {task.description.slice(0, 100)}{task.description.length > 100 ? '…' : ''}
        </p>
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <Badge label={pc.label} color={pc.color} bg={pc.bg} />
        <Badge label={sc.label} color={sc.color} bg={sc.bg} />
        {task.dueDate && (
          <span style={{ fontSize: 11, color: over ? 'var(--red)' : 'var(--text3)' }}>
            {over ? '⚠ ' : '📅 '}{formatDate(task.dueDate)}
          </span>
        )}
        {task.assigneeName && (
          <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>→ {task.assigneeName}</span>
        )}
      </div>
      {isMember && isMyTask && nextStatus && btnCfg && (
        <div style={{ marginTop: 10 }}>
          <button className="btn btn-ghost btn-sm"
            style={{ fontSize: 12, color: btnCfg.color, border: `1px solid ${btnCfg.color}33`, borderRadius: 6, padding: '4px 10px' }}
            onClick={() => onStatusChange(task.id, nextStatus)}>
            {btnCfg.label}
          </button>
        </div>
      )}
      {isMember && isMyTask && task.status === 'done' && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#34d399', fontWeight: 500 }}>✅ Task completed</div>
      )}
    </div>
  );
};

// ─── Kanban Column ────────────────────────────────────────
const KanbanColumn = ({ status, tasks, taskNumbers, onEdit, onDelete, onStatusChange, canManage, isMember, currentUserId }) => {
  const sc = STATUS_CONFIG[status];
  const [dragOver, setDragOver] = useState(false);
  return (
    <div style={{
      flex: '1 1 220px', minWidth: 220,
      background: dragOver ? 'var(--surface2)' : 'var(--surface)',
      border: `1px solid ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 12, padding: 14, transition: 'all 0.15s',
    }}
      onDragOver={(e) => { e.preventDefault(); if (canManage) setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!canManage) return; const id = e.dataTransfer.getData('taskId'); if (id) onStatusChange(id, status); }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: sc.color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text2)' }}>{sc.label}</span>
        <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 'auto' }}>{tasks.length}</span>
      </div>
      <div>
        {tasks.map((task) => (
          <div key={task.id} draggable={canManage} onDragStart={(e) => canManage && e.dataTransfer.setData('taskId', task.id)} style={{ cursor: canManage ? 'grab' : 'default' }}>
            <TaskCard task={task} taskNumber={taskNumbers[task.id]} onEdit={onEdit} onDelete={onDelete} canManage={canManage} onStatusChange={onStatusChange} isMember={isMember} currentUserId={currentUserId} />
          </div>
        ))}
        {tasks.length === 0 && <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>No tasks</div>}
      </div>
    </div>
  );
};

// ─── Task Modal ───────────────────────────────────────────
const TaskModal = ({ open, onClose, onSaved, projectId, members, editTask, nextTaskNumber }) => {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({ title: '', description: '', assigneeId: '', assigneeName: '', priority: 'medium', dueDate: '', status: 'todo' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editTask) {
      setForm({
        title: editTask.title || '', description: editTask.description || '',
        assigneeId: editTask.assigneeId || '', assigneeName: editTask.assigneeName || '',
        priority: editTask.priority || 'medium', status: editTask.status || 'todo',
        dueDate: editTask.dueDate ? (editTask.dueDate?.toDate ? editTask.dueDate.toDate().toISOString().split('T')[0] : editTask.dueDate) : '',
      });
    } else {
      setForm({ title: '', description: '', assigneeId: '', assigneeName: '', priority: 'medium', dueDate: '', status: 'todo' });
    }
    setErrors({});
  }, [editTask, open]);

  const handleAssigneeChange = (uid) => {
    const m = members.find((x) => x.uid === uid);
    setForm({ ...form, assigneeId: uid, assigneeName: m?.name || '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setErrors({ title: 'Title required' }); return; }
    if (!form.dueDate) { setErrors({ dueDate: 'Due date is required' }); return; }
    setLoading(true);
    try {
      if (editTask) {
        await updateTask(editTask.id, form);
        toast.success('Task updated');
      } else {
        await createTask({ ...form, projectId, createdBy: user.uid, createdByName: profile.name, taskNumber: nextTaskNumber });
        toast.success(`Task #${nextTaskNumber} created`);
      }
      onSaved(); onClose();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={editTask ? 'Edit Task' : `New Task #${nextTaskNumber}`}>
      <form onSubmit={handleSubmit}>
        {!editTask && (
          <div style={{ background: 'rgba(100,87,232,0.08)', border: '1px solid rgba(100,87,232,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: 'var(--accent)' }}>
            This will be <strong>Task #{nextTaskNumber}</strong>. Assign it to a team member below.
          </div>
        )}
        <Field label="Task Title" error={errors.title}>
          <input type="text" placeholder={`e.g. Task ${nextTaskNumber}: Design homepage`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Description">
          <textarea placeholder="What needs to be done?" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Priority">
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Assign To Member">
            <select value={form.assigneeId} onChange={(e) => handleAssigneeChange(e.target.value)}>
              <option value="">— Unassigned —</option>
              {members.map((m) => <option key={m.uid} value={m.uid}>{m.name} ({m.role})</option>)}
            </select>
          </Field>
          <Field label="Due Date *" error={errors.dueDate}>
            <input type="date" value={form.dueDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving…' : editTask ? 'Save Changes' : `Create Task #${nextTaskNumber}`}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Members Panel ────────────────────────────────────────
const MembersPanel = ({ project, canManage, onRefresh }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  useEffect(() => { getAllUsers().then(setAllUsers); }, []);

  const nonMembers = allUsers.filter((u) => !(project.memberIds || []).includes(u.id) && u.name?.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = async (u) => {
    setAdding(true);
    try {
      await addMemberToProject(project.id, { uid: u.id, name: u.name, role: u.role || 'member' });
      toast.success(`${u.name} added`); onRefresh(); setSearch('');
    } catch (e) { toast.error(e.message); }
    finally { setAdding(false); }
  };

  const handleRemove = async (uid, name) => {
    try { await removeMemberFromProject(project.id, uid); toast.success(`${name} removed`); onRefresh(); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Team ({project.members?.length || 0})</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {(project.members || []).map((m) => (
          <div key={m.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--surface2)' }}>
            <Avatar name={m.name} size={30} color={m.role === 'admin' ? '#7c6af7' : '#60a5fa'} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: m.role === 'admin' ? 'var(--accent)' : 'var(--text3)', textTransform: 'uppercase' }}>{m.role}</div>
            </div>
            {canManage && m.uid !== project.ownerId && (
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', padding: '2px 6px' }} onClick={() => handleRemove(m.uid, m.name)}>✕</button>
            )}
          </div>
        ))}
      </div>
      {canManage && (
        <>
          <input type="text" placeholder="Search users to add…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 8 }} />
          {search && nonMembers.slice(0, 5).map((u) => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--surface2)', marginBottom: 4, cursor: 'pointer' }}
              onClick={() => !adding && handleAdd(u)}>
              <Avatar name={u.name} size={26} color="#60a5fa" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{u.email} · {u.role}</div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--accent)' }}>+ Add</span>
            </div>
          ))}
          {search && nonMembers.length === 0 && <div style={{ fontSize: 12, color: 'var(--text3)' }}>No users found</div>}
        </>
      )}
    </div>
  );
};

// ─── Group Chat ───────────────────────────────────────────
const GroupChat = ({ projectId, projectName, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsub = subscribeToProjectChat(projectId, setMessages);
    return unsub;
  }, [projectId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage({ projectId, senderId: currentUser.uid, senderName: currentUser.name, text: input.trim() });
      setInput('');
    } catch (e) { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  const fmtTime = (ts) => {
    if (!ts) return '';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, display: 'flex', flexDirection: 'column', height: 380, marginTop: 14 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>💬</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Team Chat</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{projectName}</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {messages.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12, marginTop: 40 }}>No messages yet — start the conversation!</div>}
        {messages.map((msg, i) => {
          const isMe = msg.senderId === currentUser.uid;
          const showName = !isMe && (i === 0 || messages[i - 1]?.senderId !== msg.senderId);
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              {showName && <span style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2, paddingLeft: 4 }}>{msg.senderName}</span>}
              <div style={{ maxWidth: '78%', background: isMe ? 'var(--accent)' : 'var(--surface2)', color: isMe ? '#fff' : 'var(--text)', borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px', padding: '7px 11px', fontSize: 13, lineHeight: 1.4 }}>
                {msg.text}
              </div>
              <span style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, paddingLeft: 4, paddingRight: 4 }}>{fmtTime(msg.createdAt)}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <input type="text" placeholder="Message… (Enter to send)" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          style={{ flex: 1, fontSize: 13 }} disabled={sending} />
        <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={handleSend} disabled={!input.trim() || sending}>
          Send
        </button>
      </div>
    </div>
  );
};

// ─── Timeline View ────────────────────────────────────────
const TaskTimeline = ({ tasks, taskNumbers }) => {
  const sorted = [...tasks].sort((a, b) => {
    const da = a.dueDate?.toDate ? a.dueDate.toDate() : new Date(a.dueDate || 0);
    const db_ = b.dueDate?.toDate ? b.dueDate.toDate() : new Date(b.dueDate || 0);
    return da - db_;
  });
  if (!sorted.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Task Timeline (by Due Date)</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map((task) => {
          const sc = STATUS_CONFIG[task.status];
          const over = isOverdue(task.dueDate, task.status);
          return (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--surface2)', borderLeft: `3px solid ${over ? '#f87171' : sc.color}` }}>
              {taskNumbers[task.id] && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'rgba(100,87,232,0.12)', borderRadius: 4, padding: '1px 6px' }}>#{taskNumbers[task.id]}</span>}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{task.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{task.assigneeName || 'Unassigned'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Badge label={sc.label} color={sc.color} bg={sc.bg} />
                <div style={{ fontSize: 11, color: over ? 'var(--red)' : 'var(--text3)', marginTop: 3 }}>{over ? '⚠ ' : ''}{formatDate(task.dueDate)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────
const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [project, setProject] = useState(null);
  const [projLoading, setProjLoading] = useState(true);
  const { tasks, loading: tasksLoading, refetch: refetchTasks } = useProjectTasks(projectId);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [view, setView] = useState('kanban');

  const loadProject = async () => { setProjLoading(true); const p = await getProject(projectId); setProject(p); setProjLoading(false); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadProject(); }, [projectId]);

  const isAdmin = profile?.role === 'admin';
  const isOwner = project?.ownerId === user?.uid;
  const canManage = isAdmin || isOwner;
  const isMember = !canManage && project?.memberIds?.includes(user?.uid);

  const taskNumbers = React.useMemo(() => {
    const sorted = [...tasks].sort((a, b) => (a.taskNumber || a.createdAt?.seconds || 0) - (b.taskNumber || b.createdAt?.seconds || 0));
    const map = {};
    sorted.forEach((t, i) => { map[t.id] = t.taskNumber || (i + 1); });
    return map;
  }, [tasks]);

  const nextTaskNumber = tasks.length + 1;
  const tasksByStatus = Object.keys(STATUS_CONFIG).reduce((acc, s) => { acc[s] = tasks.filter((t) => t.status === s); return acc; }, {});

  const handleStatusChange = async (taskId, status) => { await updateTaskStatus(taskId, status); toast.success('Status updated'); refetchTasks(); };
  const handleDeleteTask = async () => { if (!deleteTarget) return; await deleteTask(deleteTarget.id); toast.success('Task deleted'); setDeleteTarget(null); refetchTasks(); };

  if (projLoading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}><Spinner size={32} /></div>;
  if (!project) return <div style={{ padding: 40, color: 'var(--text2)' }}>Project not found. <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('/projects')}>Go back</span></div>;

  const myTasks = tasks.filter(t => t.assigneeId === user?.uid);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')} style={{ marginTop: 4 }}>← Back</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{project.name}</h1>
          {project.description && <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>{project.description}</p>}
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{tasks.length} task{tasks.length !== 1 ? 's' : ''} · {project.members?.length || 0} members</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 8, padding: 3 }}>
            {[['kanban', '⬡ Board'], ['timeline', '📅 Timeline']].map(([v, l]) => (
              <button key={v} className="btn btn-ghost btn-sm" style={{ background: view === v ? 'var(--surface)' : 'transparent', borderRadius: 6 }} onClick={() => setView(v)}>{l}</button>
            ))}
          </div>
          {canManage && <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowTaskModal(true); }}>+ Add Task</button>}
        </div>
      </div>

      {isMember && (
        <div style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>👤</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>You are a Member</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Advance your tasks: <strong>To Do → In Progress → In Review → Done</strong></div>
          </div>
        </div>
      )}

      {isMember && myTasks.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>My Assigned Tasks ({myTasks.length})</h3>
          {myTasks.map((task) => (
            <TaskCard key={task.id} task={task} taskNumber={taskNumbers[task.id]} onEdit={() => {}} onDelete={() => {}} canManage={false} onStatusChange={handleStatusChange} isMember={true} currentUserId={user?.uid} />
          ))}
        </div>
      )}

      {canManage && tasks.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Task Assignment Overview</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[...tasks].sort((a, b) => (taskNumbers[a.id] || 0) - (taskNumbers[b.id] || 0)).map((task) => {
              const sc = STATUS_CONFIG[task.status];
              return (
                <div key={task.id} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>#{taskNumbers[task.id]}</span>
                  <span>{task.assigneeName || 'Unassigned'}</span>
                  <span style={{ color: sc.color, fontSize: 11 }}>· {sc.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {tasksLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}><Spinner size={28} /></div>
          ) : tasks.length === 0 ? (
            <EmptyState icon="◻" title="No tasks yet"
              message={canManage ? "Create the first task and assign it to a member" : "No tasks assigned yet"}
              action={canManage && <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowTaskModal(true); }}>+ Create Task #1</button>}
            />
          ) : view === 'kanban' ? (
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
              {Object.keys(STATUS_CONFIG).map((status) => (
                <KanbanColumn key={status} status={status} tasks={tasksByStatus[status] || []} taskNumbers={taskNumbers}
                  onEdit={(t) => { setEditTask(t); setShowTaskModal(true); }} onDelete={setDeleteTarget}
                  onStatusChange={handleStatusChange} canManage={canManage} isMember={isMember} currentUserId={user?.uid} />
              ))}
            </div>
          ) : (
            <TaskTimeline tasks={tasks} taskNumbers={taskNumbers} />
          )}
        </div>

        <div style={{ width: 270, flexShrink: 0 }}>
          <MembersPanel project={project} canManage={canManage} onRefresh={loadProject} />
          <GroupChat projectId={projectId} projectName={project.name} currentUser={{ uid: user?.uid, name: profile?.name || 'User' }} />
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginTop: 14 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Progress</h3>
            {Object.entries(STATUS_CONFIG).map(([s, cfg]) => {
              const count = tasksByStatus[s]?.length || 0;
              const pct = tasks.length ? Math.round((count / tasks.length) * 100) : 0;
              return (
                <div key={s} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text2)' }}>{cfg.label}</span><span style={{ fontWeight: 600 }}>{count}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: cfg.color, borderRadius: 2, transition: 'width 0.4s' }} />
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 13, fontWeight: 600 }}>
              {tasks.length > 0 ? `${Math.round(((tasksByStatus['done']?.length || 0) / tasks.length) * 100)}% Complete` : 'No tasks yet'}
            </div>
          </div>
        </div>
      </div>

      {canManage && (
        <>
          <TaskModal open={showTaskModal} onClose={() => { setShowTaskModal(false); setEditTask(null); }} onSaved={refetchTasks} projectId={projectId} members={project.members || []} editTask={editTask} nextTaskNumber={nextTaskNumber} />
          <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteTask} title="Delete Task" message={`Delete "${deleteTarget?.title}"? This cannot be undone.`} danger />
        </>
      )}
    </div>
  );
};

export default ProjectDetail;
