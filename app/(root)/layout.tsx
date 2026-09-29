import { AppSidebar } from "@/components/layout/app-sidebar";
import { WorkspaceGate } from "@/components/layout/workspace-gate";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WorkspaceGate>
      <div className="flex h-screen bg-background">
        <AppSidebar />
        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
    </WorkspaceGate>
  );
}
