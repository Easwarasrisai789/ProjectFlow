// src/components/team/TeamPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import { useAllTasks } from '../../hooks/useTasks';
import { getAllUsers } from '../../services/projectService';
import { Avatar, Badge, Spinner, PageHeader, EmptyState } from '../shared/UI';

const TeamPage = () => {
  const { profile } = useAuth();
  const { projects } = useProjects();
  const { tasks, loading: tasksLoading } = useAllTasks(projects.map(p => p.id));
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    getAllUsers().then(u => { setAllUsers(u); setUsersLoading(false); });
  }, []);

  const visibleUsers = useMemo(() => {
    if (isAdmin) return allUsers;
    const myProjectMemberIds = new Set(
      projects.flatMap(p => p.memberIds || [])
    );
    return allUsers.filter(u => myProjectMemberIds.has(u.id));
  }, [allUsers, projects, isAdmin]);

  const filtered = useMemo(() => {
    return visibleUsers
      .filter(u => roleFilter === 'all' || u.role === roleFilter)
      .filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) ||
                   u.email?.toLowerCase().includes(search.toLowerCase()));
  }, [visibleUsers, roleFilter, search]);

  const getUserStats = (userId) => {
    const userTasks = tasks.filter(t => t.assigneeId === userId);
    return {
      total: userTasks.length,
      todo: userTasks.filter(t => t.status === 'todo').length,
      inProgress: userTasks.filter(t => t.status === 'in_progress').length,
      done: userTasks.filter(t => t.status === 'done').length,
    };
  };

  const getUserProjects = (userId) => {
    return projects.filter(p => p.memberIds?.includes(userId)).map(p => p.name);
  };

  if (usersLoading || tasksLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}><Spinner size={32} /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle={`${filtered.length} member${filtered.length !== 1 ? 's' : ''}`}
      />

      {!isAdmin && (
        <div style={{
          background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: 'var(--text2)',
        }}>
          Showing teammates from your shared projects.
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', borderRadius: 8, padding: 4 }}>
          {[['all', 'All'], ['admin', 'Admins'], ['member', 'Members']].map(([v, l]) => (
            <button key={v} className="btn btn-ghost btn-sm"
              style={{ background: roleFilter === v ? 'var(--surface)' : 'transparent', borderRadius: 6 }}
              onClick={() => setRoleFilter(v)}>{l}</button>
          ))}
        </div>
        <input type="text" placeholder="Search by name or email…" value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 240 }} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="◎" title="No team members found" message="Try adjusting your search" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map((u) => {
            const stats = getUserStats(u.id);
            const userProjects = getUserProjects(u.id);
            return (
              <div key={u.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, padding: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <Avatar name={u.name} size={40} color={u.role === 'admin' ? '#7c6af7' : '#60a5fa'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{u.email}</div>
                  </div>
                  <Badge
                    label={u.role === 'admin' ? '🔑 Admin' : '👤 Member'}
                    color={u.role === 'admin' ? '#7c6af7' : '#60a5fa'}
                    bg={u.role === 'admin' ? 'rgba(124,106,247,0.12)' : 'rgba(96,165,250,0.12)'}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                  {[
                    { label: 'To Do', value: stats.todo, color: '#9998b0' },
                    { label: 'In Progress', value: stats.inProgress, color: '#fbbf24' },
                    { label: 'Done', value: stats.done, color: '#34d399' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{
                      textAlign: 'center', padding: '8px 4px', background: 'var(--surface2)', borderRadius: 8,
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {userProjects.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Projects
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {userProjects.slice(0, 3).map((pName) => (
                        <span key={pName} style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 4,
                          background: 'var(--surface2)', color: 'var(--text2)',
                        }}>{pName}</span>
                      ))}
                      {userProjects.length > 3 && (
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>+{userProjects.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamPage;