// src/components/projects/ProjectsPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import { createProject, deleteProject, updateProject } from '../../services/projectService';
import { Modal, Field, Badge, Spinner, EmptyState, PageHeader, ConfirmModal, Avatar } from '../shared/UI';
import { PROJECT_STATUS_CONFIG, formatDate } from '../../utils/helpers';

// ─── Create/Edit Project Modal (Admin only) ───────────────
const ProjectModal = ({ open, onClose, onSaved, editProject }) => {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({ name: '', description: '', status: 'active' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (editProject) {
      setForm({ name: editProject.name || '', description: editProject.description || '', status: editProject.status || 'active' });
    } else {
      setForm({ name: '', description: '', status: 'active' });
    }
    setErrors({});
  }, [editProject, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErrors({ name: 'Name required' }); return; }
    setLoading(true);
    try {
      if (editProject) {
        await updateProject(editProject.id, form);
        toast.success('Project updated');
      } else {
        await createProject({ name: form.name, description: form.description, ownerId: user.uid, ownerName: profile.name });
        toast.success('Project created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editProject ? 'Edit Project' : 'New Project'}>
      <form onSubmit={handleSubmit}>
        <Field label="Project Name" error={errors.name}>
          <input type="text" placeholder="e.g. Website Redesign" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Description">
          <textarea placeholder="What's this project about?" rows={3} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        {editProject && (
          <Field label="Status">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving…' : editProject ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Project Card ─────────────────────────────────────────
const ProjectCard = ({ project, taskCount, doneCount, onEdit, onDelete, canManage }) => {
  const navigate = useNavigate();
  const sc = PROJECT_STATUS_CONFIG[project.status] || PROJECT_STATUS_CONFIG.active;
  const pct = taskCount ? Math.round((doneCount / taskCount) * 100) : 0;

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, padding: 20, cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s',
    }}
      onClick={() => navigate(`/projects/${project.id}`)}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{project.name}</div>
          {project.description && (
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>
              {project.description.slice(0, 80)}{project.description.length > 80 ? '…' : ''}
            </div>
          )}
        </div>
        <Badge label={sc.label} color={sc.color} bg={`${sc.color}22`} />
      </div>

      {/* Members preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <div style={{ display: 'flex' }}>
          {(project.members || []).slice(0, 4).map((m, i) => (
            <div key={m.uid} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i, position: 'relative' }}>
              <Avatar name={m.name} size={24} color={m.role === 'admin' ? '#7c6af7' : '#60a5fa'} />
            </div>
          ))}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
          {project.members?.length || 0} member{project.members?.length !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 'auto' }}>
          {taskCount} task{taskCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 3, transition: 'width 0.4s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{pct}% complete</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            Created {formatDate(project.createdAt)}
          </span>
        </div>
      </div>

      {canManage && (
        <div style={{ display: 'flex', gap: 6, paddingTop: 10, borderTop: '1px solid var(--border)' }}
          onClick={(e) => e.stopPropagation()}>
          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onEdit(project); }}
            style={{ fontSize: 12 }}>✎ Edit</button>
          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onDelete(project); }}
            style={{ fontSize: 12, color: 'var(--red)' }}>✕ Delete</button>
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────
const ProjectsPage = () => {
  const { profile } = useAuth();
  const { projects, loading, refetch, taskCounts } = useProjects();
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const isAdmin = profile?.role === 'admin';

  const filtered = projects.filter(p => statusFilter === 'all' || p.status === statusFilter);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteProject(deleteTarget.id, deleteTarget.memberIds || []);
    toast.success('Project deleted');
    setDeleteTarget(null);
    refetch();
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${filtered.length} project${filtered.length !== 1 ? 's' : ''}`}
        action={isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditProject(null); setShowModal(true); }}>
            + New Project
          </button>
        )}
      />

      {!isAdmin && (
        <div style={{
          background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: 'var(--text2)',
        }}>
          👤 You are a <strong>Member</strong>. You can view projects you've been assigned to and update your task statuses.
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['all','All'], ['active','Active'], ['completed','Completed'], ['archived','Archived']].map(([v, l]) => (
          <button key={v} className="btn btn-ghost btn-sm"
            style={{ background: statusFilter === v ? 'var(--surface2)' : 'transparent' }}
            onClick={() => setStatusFilter(v)}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 60 }}><Spinner size={32} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="⬡" title={isAdmin ? "No projects yet" : "No projects assigned"}
          message={isAdmin ? "Create your first project to get started" : "Ask your admin to add you to a project"}
          action={isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
          )} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              taskCount={taskCounts?.[project.id]?.total || 0}
              doneCount={taskCounts?.[project.id]?.done || 0}
              onEdit={(p) => { setEditProject(p); setShowModal(true); }}
              onDelete={setDeleteTarget}
              canManage={isAdmin}
            />
          ))}
        </div>
      )}

      {isAdmin && (
        <>
          <ProjectModal
            open={showModal}
            onClose={() => { setShowModal(false); setEditProject(null); }}
            onSaved={refetch}
            editProject={editProject}
          />
          <ConfirmModal
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            title="Delete Project"
            message={`Delete "${deleteTarget?.name}"? All tasks in this project will be lost.`}
            danger
          />
        </>
      )}
    </div>
  );
};

export default ProjectsPage;
