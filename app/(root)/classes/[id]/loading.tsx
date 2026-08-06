export default function ClassDetailLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-muted/10">
      <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/40 px-5 py-4 shadow-sm backdrop-blur-sm">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <span className="text-sm text-muted-foreground">Loading class…</span>
      </div>
    </div>
  );
}
