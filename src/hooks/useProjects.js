// src/hooks/useProjects.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProjects } from '../services/projectService';
import { getAllTasksForProjects } from '../services/taskService';

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [taskCounts, setTaskCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const ps = await getUserProjects(user.uid);
      setProjects(ps);
      // Fetch task counts
      if (ps.length) {
        const tasks = await getAllTasksForProjects(ps.map(p => p.id));
        const counts = {};
        ps.forEach(p => {
          const pt = tasks.filter(t => t.projectId === p.id);
          counts[p.id] = {
            total: pt.length,
            done: pt.filter(t => t.status === 'done').length,
          };
        });
        setTaskCounts(counts);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { projects, loading, refetch: fetch, taskCounts };
};
