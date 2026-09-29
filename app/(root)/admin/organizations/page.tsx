"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { organizationApi } from "@/lib/api/organization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2 } from "lucide-react";

export default function AdminOrganizationsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const query = useQuery({
    queryKey: ["organizations"],
    queryFn: () => organizationApi.list(),
  });
  const create = useMutation({
    mutationFn: () => organizationApi.createSchool(name, email),
    onSuccess: () => {
      setName("");
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });

  const orgs = query.data ?? [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Building2 className="h-8 w-8 text-primary" />
          Organizations
        </h1>
        <p className="mt-2 text-muted-foreground">
          Create a school and invite it. Teachers are invited by that Organization.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create and invite a school</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row">
          <Input
            placeholder="School name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            type="email"
            placeholder="Organization email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            disabled={!name || !email || create.isPending}
            onClick={() => create.mutate()}
          >
            Invite
          </Button>
        </CardContent>
      </Card>
      {create.isError && (
        <p className="text-sm text-destructive">
          {(create.error as Error).message}
        </p>
      )}
      {query.isLoading ? (
        <p className="text-muted-foreground">Loading Organizations…</p>
      ) : orgs.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No Organizations yet.
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {orgs.map((org) => (
            <Card key={org._id}>
              <CardHeader>
                <CardTitle>{org.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {org.teachers?.length ?? 0} teachers · {org.students?.length ?? 0}{" "}
                learners
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
