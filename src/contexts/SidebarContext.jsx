import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [sidebarState, setSidebarState] = useState('normal'); // 'normal', 'expanded', 'hidden'

  const sidebarWidths = {
    normal: 256,
    expanded: 420, // 100px más que antes
    hidden: 0
  };

  const toggleSidebar = () => {
    setSidebarState(current => {
      switch (current) {
        case 'normal':
          return 'expanded';
        case 'expanded':
          return 'hidden';
        case 'hidden':
          return 'normal';
        default:
          return 'normal';
      }
    });
  };

  const getSidebarWidth = () => sidebarWidths[sidebarState];
  const isVisible = sidebarState !== 'hidden';

  const value = {
    sidebarState,
    sidebarWidth: getSidebarWidth(),
    isVisible,
    toggleSidebar,
    setSidebarState
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}; 