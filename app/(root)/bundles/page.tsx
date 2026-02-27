"use client";

import { HourOfCodeSection } from "@/components/bundles/hour-of-code-section";
import { CourseBundlesSection } from "@/components/bundles/course-bundles-section";

export default function BundlesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-8 pt-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Bundles
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage Hour of Code and course bundles.
          </p>
        </div>

        <div className="space-y-6 max-w-3xl">
          <HourOfCodeSection />
          <CourseBundlesSection />
        </div>
      </div>
    </div>
  );
}
