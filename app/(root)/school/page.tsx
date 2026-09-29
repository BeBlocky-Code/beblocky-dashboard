"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { organizationApi } from "@/lib/api/organization";
import { teacherApi } from "@/lib/api/teacher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2 } from "lucide-react";
import type { IUser } from "@/types/user";

export default function SchoolPage() {
  const { session, user } = useAuth();
  const roles = session?.user?.roles ?? [];
  const accountId = session?.user?.id ?? user?._id;
  const queryClient = useQueryClient();
  const [teacherId, setTeacherId] = useState("");

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
    mutationFn: () => organizationApi.inviteTeacher(organizationId, teacherId),
    onSuccess: () => {
      setTeacherId("");
      queryClient.invalidateQueries({ queryKey: ["school", organizationId] });
    },
  });

  if (orgIdQuery.isLoading) {
    return <p className="p-6 text-muted-foreground">Loading school…</p>;
  }

  if (!organizationId) {
    return (
      <div className="space-y-2 p-6">
        <h1 className="text-3xl font-bold">School</h1>
        <p className="text-muted-foreground">
          A Teacher needs an Organization invite before this dashboard can open.
        </p>
      </div>
    );
  }

  const school = schoolQuery.data;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Building2 className="h-8 w-8 text-primary" />
          {school?.name ?? "School"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Teachers, Classes, Courses, and the learner roster for this school.
        </p>
      </div>
      {roles.includes("organization") && (
        <Card>
          <CardHeader>
            <CardTitle>Invite a Teacher</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Input
              placeholder="Teacher profile id"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            />
            <Button
              disabled={!teacherId || invite.isPending}
              onClick={() => invite.mutate()}
            >
              Invite
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Teachers</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {(school?.teachers ?? []).length === 0
              ? "None yet."
              : school?.teachers.map((row) => (
                  <p key={row.id}>{row.accountId}</p>
                ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Roster</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {(school?.roster ?? []).length === 0
              ? "None yet."
              : school?.roster.map((id) => <p key={id}>{id}</p>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Classes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {(school?.classes ?? []).length === 0
              ? "None yet."
              : school?.classes.map((row) => <p key={row.id}>{row.name}</p>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {(school?.courses ?? []).length === 0
              ? "None yet."
              : school?.courses.map((id) => <p key={id}>{id}</p>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
