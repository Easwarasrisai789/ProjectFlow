// src/hooks/useTasks.js
import { useState, useEffect, useCallback } from 'react';
import { getProjectTasks, getAllTasksForProjects } from '../services/taskService';

export const useProjectTasks = (projectId) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await getProjectTasks(projectId);
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { tasks, loading, refetch: fetch };
};

export const useAllTasks = (projectIds) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectIds?.length) { setTasks([]); setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getAllTasksForProjects(projectIds);
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(projectIds)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { tasks, loading, refetch: fetch };
};
