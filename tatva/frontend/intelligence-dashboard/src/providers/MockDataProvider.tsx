import type { TatvaDataProvider } from "./DataContext";

/**
 * MockDataProvider — Returns JSON fixture data for the Mock panel.
 *
 * Used during development, demos, and testing. Returns static data that mimics
 * the real API responses without requiring running backend services.
 *
 * Fixtures will be populated in T0-F8 (Mock Data Fixtures).
 */

const MOCK_DOMAINS = [
  { name: "Geopolitics", entityCount: 12847, newToday: 42, color: "#3b82f6" },
  { name: "Economics", entityCount: 9234, newToday: 38, color: "#22c55e" },
  { name: "Defense", entityCount: 7892, newToday: 25, color: "#ef4444" },
  { name: "Technology", entityCount: 6543, newToday: 67, color: "#a855f7" },
  { name: "Climate", entityCount: 4321, newToday: 18, color: "#f97316" },
  { name: "Society", entityCount: 5678, newToday: 31, color: "#eab308" },
];

const MOCK_ENTITIES = [
  { id: "e001", canonicalName: "India", type: "LOCATION", domain: "Geopolitics", credibilityScore: 0.98 },
  { id: "e002", canonicalName: "Narendra Modi", type: "PERSON", domain: "Geopolitics", credibilityScore: 0.95 },
  { id: "e003", canonicalName: "DRDO", type: "ORGANIZATION", domain: "Defense", credibilityScore: 0.92 },
  { id: "e004", canonicalName: "INS Arighat", type: "TECHNOLOGY", domain: "Defense", credibilityScore: 0.88 },
  { id: "e005", canonicalName: "CHIPS Act", type: "DOCUMENT", domain: "Technology", credibilityScore: 0.91 },
];

const MOCK_ALERTS = [
  { id: "a001", type: "ANOMALY_ALERT", priority: "CRITICAL", message: "Spike in South China Sea mentions", createdAt: new Date().toISOString() },
  { id: "a002", type: "CONTRADICTION_ALERT", priority: "WARNING", message: "Conflicting GDP figures", createdAt: new Date().toISOString() },
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockDataProvider: TatvaDataProvider = {
  mode: "mock",

  getEntities: async () => {
    await delay(200);
    return MOCK_ENTITIES;
  },

  getEntityById: async (id) => {
    await delay(100);
    return MOCK_ENTITIES.find((e) => e.id === id) || null;
  },

  search: async (query) => {
    await delay(300);
    const q = query.toLowerCase();
    return MOCK_ENTITIES.filter(
      (e) =>
        e.canonicalName.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        e.domain.toLowerCase().includes(q)
    );
  },

  getNeighborhood: async (entityId) => {
    await delay(200);
    return {
      center: MOCK_ENTITIES.find((e) => e.id === entityId),
      neighbors: MOCK_ENTITIES.filter((e) => e.id !== entityId).slice(0, 3),
      edges: [],
    };
  },

  getPath: async (fromId, toId) => {
    await delay(300);
    return {
      from: MOCK_ENTITIES.find((e) => e.id === fromId),
      to: MOCK_ENTITIES.find((e) => e.id === toId),
      path: [],
      hops: 0,
    };
  },

  getDomainStats: async () => {
    await delay(150);
    return MOCK_DOMAINS;
  },

  getAlerts: async () => {
    await delay(200);
    return MOCK_ALERTS;
  },

  askTatva: async (question) => {
    await delay(500);
    return {
      query: question,
      answer: "Mock answer — NL query engine will be available in Tier 2.",
      confidence: 0.0,
      sources: [],
      cypherQuery: null,
    };
  },

  getHealth: async () => {
    await delay(50);
    return {
      status: "healthy",
      mode: "mock",
      services: {
        neo4j: "mock",
        elasticsearch: "mock",
        kafka: "mock",
        redis: "mock",
        nlp: "mock",
        reasoning: "mock",
      },
    };
  },
};
