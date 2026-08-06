"use client";

import { HourOfCodeSection } from "@/components/bundles/hour-of-code-section";
import { CourseBundlesSection } from "@/components/bundles/course-bundles-section";

export default function BundlesPage() {
  return (
    <div className="min-h-full bg-muted/10">
      <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Bundles
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage Hour of Code and course bundles
          </p>
        </div>

        <div className="mx-auto max-w-3xl space-y-5">
          <HourOfCodeSection />
          <CourseBundlesSection />
        </div>
      </div>
    </div>
  );
}
