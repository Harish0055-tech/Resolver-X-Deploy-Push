import React, { createContext, useContext, useState, useCallback } from "react";
import { Query, QueryStatus, Attachment } from "@/types/query";
import { mockQueries } from "@/data/mockQueries";

interface QueryContextType {
  queries: Query[];
  addQuery: (query: Omit<Query, "id" | "createdAt" | "updatedAt" | "activities">, attachments?: Attachment[]) => string;
  getQuery: (id: string) => Query | undefined;
  addComment: (queryId: string, user: string, content: string) => void;
  updateQueryStatus: (id: string, status: QueryStatus) => void;
  deleteQuery: (id: string) => void;
}

const QueryContext = createContext<QueryContextType | undefined>(undefined);

let nextId = 1009;

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queries, setQueries] = useState<Query[]>(mockQueries);

  const addQuery = useCallback((data: Omit<Query, "id" | "createdAt" | "updatedAt" | "activities">, attachments?: Attachment[]) => {
    const id = `QR-${nextId++}`;
    const now = new Date().toISOString();
    const newQuery: Query = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      activities: [
        { id: `a-${Date.now()}`, timestamp: now, type: "status_change", user: "System", content: "Ticket created", newStatus: "open" },
      ],
      attachments: attachments || [],
    };
    setQueries((prev) => [newQuery, ...prev]);
    return id;
  }, []);

  const getQuery = useCallback((id: string) => queries.find((q) => q.id === id), [queries]);

  const addComment = useCallback((queryId: string, user: string, content: string) => {
    setQueries((prev) =>
      prev.map((q) =>
        q.id === queryId
          ? {
            ...q,
            updatedAt: new Date().toISOString(),
            activities: [
              ...q.activities,
              { id: `a-${Date.now()}`, timestamp: new Date().toISOString(), type: "comment" as const, user, content },
            ],
          }
          : q
      )
    );
  }, []);

  const updateQueryStatus = useCallback((id: string, status: QueryStatus) => {
    setQueries((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const now = new Date().toISOString();
          return {
            ...q,
            status,
            updatedAt: now,
            activities: [
              ...q.activities,
              {
                id: `a-${Date.now()}`,
                timestamp: now,
                type: "status_change" as const,
                user: "Resolver", // In a real app, this would be the logged-in user
                content: `Status updated to ${status}`,
                oldStatus: q.status,
                newStatus: status
              }
            ]
          };
        }
        return q;
      })
    );
  }, []);

  const deleteQuery = useCallback((id: string) => {
    setQueries((prev) => prev.filter((q) => q.id !== id));
  }, []);

  return (
    <QueryContext.Provider value={{ queries, addQuery, getQuery, addComment, updateQueryStatus, deleteQuery }}>
      {children}
    </QueryContext.Provider>
  );
}

export function useQueries() {
  const context = useContext(QueryContext);
  if (!context) throw new Error("useQueries must be used within QueryProvider");
  return context;
}
