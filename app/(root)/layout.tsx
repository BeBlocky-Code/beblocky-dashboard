import { AppSidebar } from "@/components/layout/app-sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="min-w-0 flex-1 pt-14 md:pt-0">{children}</main>
    </div>
  );
}
