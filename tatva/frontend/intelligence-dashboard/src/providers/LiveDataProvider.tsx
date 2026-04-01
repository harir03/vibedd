import type { TatvaDataProvider } from "./DataContext";

/**
 * LiveDataProvider — Calls real API Gateway endpoints.
 *
 * In production, this provider routes all requests through the API Gateway (port 8080)
 * which forwards to the appropriate microservice.
 *
 * Implemented as stubs in T0. Real API integration in T1+.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

async function apiFetch(path: string, options?: RequestInit): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const liveDataProvider: TatvaDataProvider = {
  mode: "live",

  getEntities: async (params) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch(`/graph/entities${query}`) as Promise<unknown[]>;
  },

  getEntityById: async (id) => {
    return apiFetch(`/graph/entities/${id}`);
  },

  search: async (query) => {
    return apiFetch(`/search?q=${encodeURIComponent(query)}`) as Promise<unknown[]>;
  },

  getNeighborhood: async (entityId, depth = 2) => {
    return apiFetch(`/graph/entities/${entityId}/neighborhood?depth=${depth}`);
  },

  getPath: async (fromId, toId) => {
    return apiFetch(`/graph/path?from=${fromId}&to=${toId}`);
  },

  getDomainStats: async () => {
    return apiFetch("/analytics/domains") as Promise<unknown[]>;
  },

  getAlerts: async (params) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch(`/alerts${query}`) as Promise<unknown[]>;
  },

  askTatva: async (question) => {
    return apiFetch("/nlp/query/translate", {
      method: "POST",
      body: JSON.stringify({ text: question, language: "en" }),
    });
  },

  getHealth: async () => {
    return apiFetch("/health");
  },
};
