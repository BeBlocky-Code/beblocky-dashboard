"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  GraduationCap,
  RefreshCw,
  School,
  Users,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { organizationApi } from "@/lib/api/organization";
import { teacherApi } from "@/lib/api/teacher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SchoolPageSkeleton } from "@/components/skeletons";
import { cn } from "@/lib/utils";

export default function SchoolPage() {
  const { session, user } = useAuth();
  const roles = session?.user?.roles ?? [];
  const accountId = session?.user?.id ?? user?._id;
  const queryClient = useQueryClient();
  const [teacherId, setTeacherId] = useState("");
  const canInviteTeachers = roles.includes("organization");

  const orgIdQuery = useQuery({
    queryKey: ["school-org-id", accountId, roles],
    enabled: !!accountId,
    queryFn: async () => {
      if (roles.includes("organization") && accountId) {
        const org = await organizationApi.byAccount(accountId);
        return org._id ?? "";
      }
      if (roles.includes("teacher") && accountId && user) {
        const teacher = await teacherApi.getTeacherByUserId(accountId, user);
        return String(teacher.organizationId ?? "");
      }
      return "";
    },
  });

  const organizationId = orgIdQuery.data ?? "";
  const schoolQuery = useQuery({
    queryKey: ["school", organizationId],
    enabled: !!organizationId,
    queryFn: () => organizationApi.school(organizationId),
  });
  const invite = useMutation({
    mutationFn: () =>
      organizationApi.inviteTeacher(organizationId, teacherId.trim()),
    onSuccess: () => {
      setTeacherId("");
      toast.success("Teacher invited");
      queryClient.invalidateQueries({ queryKey: ["school", organizationId] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not invite Teacher",
      );
    },
  });

  if (orgIdQuery.isLoading || (!!organizationId && schoolQuery.isLoading)) {
    return <SchoolPageSkeleton />;
  }

  if (orgIdQuery.isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
        <div className="container mx-auto px-6 py-8">
          <Card className="mx-auto max-w-lg rounded-2xl border-destructive/30 bg-destructive/5 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="mb-2 text-lg font-semibold">
              Couldn&apos;t resolve your school
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {orgIdQuery.error instanceof Error
                ? orgIdQuery.error.message
                : "The API did not respond."}
            </p>
            <Button
              onClick={() => orgIdQuery.refetch()}
              disabled={orgIdQuery.isFetching}
            >
              <RefreshCw
                className={cn(
                  "mr-2 h-4 w-4",
                  orgIdQuery.isFetching && "animate-spin",
                )}
              />
              Try again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!organizationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
        <div className="container mx-auto px-6 py-8">
          <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 p-8">
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="relative z-10 space-y-3">
              <h1 className="text-3xl font-bold tracking-tight">School</h1>
              <p className="max-w-2xl text-muted-foreground">
                A Teacher needs an Organization invite before this dashboard can
                open.
              </p>
            </div>
          </div>
          <Card className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-10 text-center shadow-sm backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <School className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-semibold">No school linked yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Ask an Organization Account to invite this Teacher profile, then
              refresh this page.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (schoolQuery.isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
        <div className="container mx-auto px-6 py-8">
          <Card className="mx-auto max-w-lg rounded-2xl border-destructive/30 bg-destructive/5 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="mb-2 text-lg font-semibold">
              Couldn&apos;t load school
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {schoolQuery.error instanceof Error
                ? schoolQuery.error.message
                : "The API did not respond."}
            </p>
            <Button
              onClick={() => schoolQuery.refetch()}
              disabled={schoolQuery.isFetching}
            >
              <RefreshCw
                className={cn(
                  "mr-2 h-4 w-4",
                  schoolQuery.isFetching && "animate-spin",
                )}
              />
              Try again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const school = schoolQuery.data;
  const teachers = school?.teachers ?? [];
  const roster = school?.roster ?? [];
  const classes = school?.classes ?? [];
  const courses = school?.courses ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-6 py-8">
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 p-8">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative z-10 space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {school?.name ?? "School"}
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Teachers, Classes, Courses, and the learner roster for this
              school.
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Teachers"
            value={String(teachers.length)}
            icon={GraduationCap}
            iconClass="text-primary bg-primary/10"
            delay={0}
          />
          <StatCard
            title="Roster"
            value={String(roster.length)}
            icon={Users}
            iconClass="text-secondary bg-secondary/10"
            delay={0.05}
          />
          <StatCard
            title="Classes"
            value={String(classes.length)}
            icon={School}
            iconClass="text-primary bg-muted/40"
            delay={0.1}
          />
          <StatCard
            title="Courses"
            value={String(courses.length)}
            icon={BookOpen}
            iconClass="text-secondary bg-muted/40"
            delay={0.15}
          />
        </div>

        {canInviteTeachers && (
          <Card className="mb-6 rounded-2xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="h-5 w-5 text-primary" />
                Invite a Teacher
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 md:flex-row">
              <Input
                placeholder="Teacher profile id"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                aria-label="Teacher profile id"
              />
              <Button
                className="md:w-28"
                disabled={!teacherId.trim() || invite.isPending}
                onClick={() => invite.mutate()}
              >
                {invite.isPending ? "Inviting…" : "Invite"}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Panel
            title="Teachers"
            icon={GraduationCap}
            empty="No teachers yet."
            delay={0}
            items={teachers.map((row) => ({
              key: row.id,
              primary: row.accountId,
              secondary: row.id,
            }))}
          />
          <Panel
            title="Roster"
            icon={Users}
            empty="No learners on the roster yet."
            delay={0.05}
            items={roster.map((id) => ({
              key: id,
              primary: id,
            }))}
          />
          <Panel
            title="Classes"
            icon={School}
            empty="No classes yet."
            delay={0.1}
            items={classes.map((row) => ({
              key: row.id,
              primary: row.name,
              secondary: row.id,
            }))}
          />
          <Panel
            title="Courses"
            icon={BookOpen}
            empty="No courses yet."
            delay={0.15}
            items={courses.map((id) => ({
              key: id,
              primary: id,
            }))}
          />
        </div>
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

function Panel({
  title,
  icon: Icon,
  empty,
  items,
  delay,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  empty: string;
  items: Array<{ key: string; primary: string; secondary?: string }>;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card className="h-full rounded-2xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{empty}</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.key}
                  className="rounded-xl border border-border/40 bg-background/40 px-3 py-2"
                >
                  <p className="truncate text-sm font-medium">{item.primary}</p>
                  {item.secondary && item.secondary !== item.primary && (
                    <p className="truncate text-xs text-muted-foreground">
                      {item.secondary}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
