import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Work } from '../types/models';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface WorkContextType {
  works: Work[];
  activeWork: Work | null;
  setActiveWork: (work: Work) => void;
  loading: boolean;
  refreshWorks: () => Promise<void>;
  isWorkAdmin: boolean;
  hasAccessToAnyWork: boolean;
}

const WorkContext = createContext<WorkContextType | undefined>(undefined);

export const WorkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isMainAdmin } = useAuth();
  const [works, setWorks] = useState<Work[]>([]);
  const [activeWork, setActiveWorkState] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshWorks = useCallback(async () => {
    if (!currentUser) {
      setWorks([]);
      setActiveWorkState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userWorks = await api.getWorks(currentUser);
      setWorks(userWorks);

      // Check if previously stored work is in list
      const savedWorkId = localStorage.getItem('kaj_active_work_id');
      const matched = userWorks.find((w) => w.workId === savedWorkId);

      if (matched) {
        setActiveWorkState(matched);
      } else if (userWorks.length > 0) {
        setActiveWorkState(userWorks[0]);
        localStorage.setItem('kaj_active_work_id', userWorks[0].workId);
      } else {
        setActiveWorkState(null);
      }
    } catch (err) {
      console.error('Error loading works:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    refreshWorks();
  }, [refreshWorks]);

  const setActiveWork = (work: Work) => {
    setActiveWorkState(work);
    localStorage.setItem('kaj_active_work_id', work.workId);
  };

  const isWorkAdmin = Boolean(
    isMainAdmin || (activeWork && currentUser && activeWork.createdBy === currentUser.uid)
  );

  const hasAccessToAnyWork = isMainAdmin || works.length > 0;

  return (
    <WorkContext.Provider
      value={{
        works,
        activeWork,
        setActiveWork,
        loading,
        refreshWorks,
        isWorkAdmin,
        hasAccessToAnyWork,
      }}
    >
      {children}
    </WorkContext.Provider>
  );
};

export const useWork = () => {
  const context = useContext(WorkContext);
  if (!context) {
    throw new Error('useWork must be used within a WorkProvider');
  }
  return context;
};

