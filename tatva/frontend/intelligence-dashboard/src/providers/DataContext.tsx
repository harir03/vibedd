"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

/**
 * DataContext — Provides the dual-panel data switching mechanism.
 *
 * Both Live and Mock panels use the SAME components and API interfaces.
 * The DataContext determines which data provider backs the current session.
 *
 * - "live" → LiveDataProvider → real API Gateway → real microservices → real Neo4j
 * - "mock" → MockDataProvider → JSON fixtures + seeded Neo4j subgraph
 */

export type DataMode = "live" | "mock";

export interface TatvaDataProvider {
  mode: DataMode;

  // Entity operations
  getEntities: (params?: Record<string, string>) => Promise<unknown[]>;
  getEntityById: (id: string) => Promise<unknown>;

  // Search operations
  search: (query: string) => Promise<unknown[]>;

  // Graph operations
  getNeighborhood: (entityId: string, depth?: number) => Promise<unknown>;
  getPath: (fromId: string, toId: string) => Promise<unknown>;

  // Domain operations
  getDomainStats: () => Promise<unknown[]>;

  // Alert operations
  getAlerts: (params?: Record<string, string>) => Promise<unknown[]>;

  // NL Query
  askTatva: (question: string) => Promise<unknown>;

  // System health
  getHealth: () => Promise<unknown>;
}

interface DataContextValue {
  mode: DataMode;
  setMode: (mode: DataMode) => void;
  provider: TatvaDataProvider;
}

const DataContext = createContext<DataContextValue | null>(null);

export function useDataContext(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useDataContext must be used within a DataContextProvider");
  }
  return ctx;
}

interface DataContextProviderProps {
  children: ReactNode;
  liveProvider: TatvaDataProvider;
  mockProvider: TatvaDataProvider;
}

export function DataContextProvider({
  children,
  liveProvider,
  mockProvider,
}: DataContextProviderProps) {
  const [mode, setMode] = useState<DataMode>("live");
  const provider = mode === "live" ? liveProvider : mockProvider;

  return (
    <DataContext.Provider value={{ mode, setMode, provider }}>
      {children}
    </DataContext.Provider>
  );
}
