"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Building2,
  GraduationCap,
  Mail,
  RefreshCw,
  School,
  Users,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { organizationApi } from "@/lib/api/organization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminOrganizationsSkeleton } from "@/components/skeletons";
import { cn } from "@/lib/utils";

export default function AdminOrganizationsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const query = useQuery({
    queryKey: ["organizations"],
    queryFn: () => organizationApi.list(),
  });
  const create = useMutation({
    mutationFn: () => organizationApi.createSchool(name.trim(), email.trim()),
    onSuccess: () => {
      setName("");
      setEmail("");
      toast.success("School invited");
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not invite school",
      );
    },
  });

  const orgs = query.data ?? [];
  const stats = useMemo(() => {
    const teachers = orgs.reduce(
      (sum, org) => sum + (org.teachers?.length ?? 0),
      0,
    );
    const learners = orgs.reduce(
      (sum, org) => sum + (org.students?.length ?? 0),
      0,
    );
    return {
      schools: orgs.length,
      teachers,
      learners,
    };
  }, [orgs]);

  if (query.isLoading) {
    return <AdminOrganizationsSkeleton />;
  }

  if (query.isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
        <div className="container mx-auto px-6 py-8">
          <Card className="mx-auto max-w-lg rounded-2xl border-destructive/30 bg-destructive/5 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="mb-2 text-lg font-semibold">
              Couldn&apos;t load Organizations
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {query.error instanceof Error
                ? query.error.message
                : "The API did not respond."}
            </p>
            <Button
              onClick={() => query.refetch()}
              disabled={query.isFetching}
            >
              <RefreshCw
                className={cn(
                  "mr-2 h-4 w-4",
                  query.isFetching && "animate-spin",
                )}
              />
              Try again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-6 py-8">
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 p-8">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative z-10 space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
            <p className="max-w-2xl text-muted-foreground">
              Create a school and invite it. Teachers are invited by that
              Organization once it is on the platform.
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            title="Schools"
            value={String(stats.schools)}
            icon={Building2}
            iconClass="text-primary bg-primary/10"
            delay={0}
          />
          <StatCard
            title="Teachers"
            value={String(stats.teachers)}
            icon={GraduationCap}
            iconClass="text-secondary bg-secondary/10"
            delay={0.05}
          />
          <StatCard
            title="Learners"
            value={String(stats.learners)}
            icon={Users}
            iconClass="text-primary bg-muted/40"
            delay={0.1}
          />
        </div>

        <Card className="mb-6 rounded-2xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-primary" />
              Create and invite a school
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 md:flex-row">
            <Input
              placeholder="School name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="School name"
            />
            <Input
              type="email"
              placeholder="Organization email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Organization email"
            />
            <Button
              className="md:w-28"
              disabled={!name.trim() || !email.trim() || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending ? "Inviting…" : "Invite"}
            </Button>
          </CardContent>
        </Card>

        {orgs.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-10 text-center shadow-sm backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <School className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-semibold">No Organizations yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Invite the first school above. It will show up here with teacher
              and learner counts once it joins.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {orgs.map((org, index) => (
              <motion.div
                key={org._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3) }}
              >
                <Card className="h-full rounded-2xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-sm transition-colors hover:bg-card/60">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg leading-tight">
                          {org.name}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary" className="shrink-0 capitalize">
                        {org.status ?? "active"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <div className="flex flex-wrap gap-4">
                      <span className="inline-flex items-center gap-1.5">
                        <GraduationCap className="h-4 w-4" />
                        {org.teachers?.length ?? 0} teachers
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        {org.students?.length ?? 0} learners
                      </span>
                    </div>
                    {org.contactInfo?.email && (
                      <p className="mt-3 truncate text-xs">
                        {org.contactInfo.email}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconClass,
  delay,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card className="h-full rounded-2xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-sm transition-colors hover:bg-card/60">
        <div className="p-5">
          <div
            className={cn(
              "mb-4 flex h-11 w-11 items-center justify-center rounded-2xl",
              iconClass,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        </div>
      </Card>
    </motion.div>
  );
}
