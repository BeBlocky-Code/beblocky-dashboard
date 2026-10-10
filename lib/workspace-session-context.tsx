"use client";

import { createContext, useContext } from "react";
import type { SessionData } from "@/lib/auth-client";

const WorkspaceSessionContext = createContext<SessionData | null>(null);

export function WorkspaceSessionProvider({
  session,
  children,
}: {
  session: SessionData | null;
  children: React.ReactNode;
}) {
  return (
    <WorkspaceSessionContext.Provider value={session}>
      {children}
    </WorkspaceSessionContext.Provider>
  );
}

export function useWorkspaceSession(): SessionData | null {
  return useContext(WorkspaceSessionContext);
}
