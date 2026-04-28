"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type AppContextType = {
  selectedGroup: string;
  setSelectedGroup: (group: string) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedGroup, setSelectedGroup] = useState<string>("all");

  return (
    <AppContext.Provider value={{ selectedGroup, setSelectedGroup }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
