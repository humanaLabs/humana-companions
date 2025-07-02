'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ProjectFolder } from '@/lib/db/schema';

interface FoldersContextType {
  folders: ProjectFolder[];
  loading: boolean;
  error: string | null;
  loadFolders: () => Promise<void>;
  addFolder: (folder: ProjectFolder) => void;
  removeFolder: (folderId: string) => void;
  updateFolder: (folderId: string, updates: Partial<ProjectFolder>) => void;
}

const FoldersContext = createContext<FoldersContextType | undefined>(undefined);

export function FoldersProvider({ 
  children,
  user 
}: { 
  children: React.ReactNode;
  user?: { id: string } | null;
}) {
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

  const loadFolders = async () => {
    if (!user?.id) {
      console.log('🔍 loadFolders: Sem usuário, pulando');
      return;
    }

    // Prevent multiple simultaneous calls using ref
    if (loadingRef.current) {
      console.log('🔍 loadFolders: Já carregando (ref check), pulando');
      return;
    }

    console.log('🔍 loadFolders: Iniciando carregamento para usuário:', user.id);
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/folders');
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 loadFolders: Sucesso - carregou', data.length, 'pastas');
        setFolders(data);
      } else {
        throw new Error('Failed to load folders');
      }
    } catch (err) {
      console.error('🔍 loadFolders: Erro:', err);
      setError(err instanceof Error ? err.message : 'Failed to load folders');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const addFolder = useCallback((folder: ProjectFolder) => {
    setFolders(prev => [...prev, folder]);
  }, []);

  const removeFolder = useCallback((folderId: string) => {
    setFolders(prev => prev.filter(f => f.id !== folderId));
  }, []);

  const updateFolder = useCallback((folderId: string, updates: Partial<ProjectFolder>) => {
    setFolders(prev => prev.map(f => 
      f.id === folderId ? { ...f, ...updates } : f
    ));
  }, []);

  // Load folders when user changes
  useEffect(() => {
    console.log('🔍 FoldersContext useEffect: user?.id =', user?.id);
    
    // Only load if user changed and we're not already loading
    if (user?.id && user.id !== userIdRef.current) {
      userIdRef.current = user.id;
      loadFolders();
    } else if (!user?.id) {
      console.log('🔍 FoldersContext: Limpando pastas (sem usuário)');
      userIdRef.current = null;
      setFolders([]);
    }
  }, [user?.id]); // Only depend on user?.id

  const value: FoldersContextType = {
    folders,
    loading,
    error,
    loadFolders,
    addFolder,
    removeFolder,
    updateFolder,
  };

  return (
    <FoldersContext.Provider value={value}>
      {children}
    </FoldersContext.Provider>
  );
}

export function useFolders() {
  const context = useContext(FoldersContext);
  if (context === undefined) {
    throw new Error('useFolders must be used within a FoldersProvider');
  }
  return context;
} 