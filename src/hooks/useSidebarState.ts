import { useState, useEffect, useCallback } from 'react';

const SIDEBAR_STATE_KEY = 'thiago-imports-sidebar-collapsed';

/**
 * Hook para persistir estado do sidebar no localStorage.
 * O estado é sincronizado entre sessões e páginas.
 * 
 * @param defaultCollapsed - Estado padrão (default: false = expandido)
 * @returns [isCollapsed, toggleSidebar] - Estado atual e função de toggle
 */
export function useSidebarState(defaultCollapsed: boolean = false) {
  // Ler estado inicial do localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SIDEBAR_STATE_KEY);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return defaultCollapsed;
  });
  
  // Persistir no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, String(isCollapsed));
  }, [isCollapsed]);
  
  // Toggle do estado
  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);
  
  return [isCollapsed, toggleSidebar] as const;
}

export default useSidebarState;
