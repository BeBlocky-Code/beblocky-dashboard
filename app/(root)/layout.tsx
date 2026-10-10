import { AppSidebar } from "@/components/layout/app-sidebar";
import { WorkspaceGate } from "@/components/layout/workspace-gate";
import { getServerWorkspaceSession } from "@/lib/server/workspace-session";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialSession = await getServerWorkspaceSession();

  return (
    <WorkspaceGate initialSession={initialSession}>
      <div className="flex h-screen bg-background">
        <AppSidebar />
        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
    </WorkspaceGate>
  );
}
