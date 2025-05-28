import { useCallback, useEffect, useRef } from 'react';

interface AutoSaveOptions {
  key: string;
  delay?: number;
  onSave?: (data: any) => void;
}

export function useAutoSave(options: AutoSaveOptions) {
  const { key, delay = 2000, onSave } = options;
  const timeoutRef = useRef<NodeJS.Timeout>();

  const saveData = useCallback((data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      onSave?.(data);
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }, [key, onSave]);

  const loadData = useCallback(() => {
    try {
      const savedData = localStorage.getItem(key);
      return savedData ? JSON.parse(savedData) : null;
    } catch (error) {
      console.error('Failed to load data:', error);
      return null;
    }
  }, [key]);

  const clearData = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }, [key]);

  const debouncedSave = useCallback((data: any) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      saveData(data);
    }, delay);
  }, [saveData, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveData,
    loadData,
    clearData,
    debouncedSave,
  };
}
