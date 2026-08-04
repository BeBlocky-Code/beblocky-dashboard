"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/auth-client";
import type { IStudent } from "@/types/student";
import { Gender } from "@/types/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Search,
  TrendingUp,
  Calendar,
  UserCheck,
  Clock,
  Sparkles,
  Filter,
  Download,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAllStudents, useAllProgress, useAllUsers } from "@/lib/hooks/queries";
import type { ICourseProgress } from "@/lib/api/progress";
import type { IUser } from "@/types/user";
import { cn } from "@/lib/utils";
import {
  IncompleteProfileNotice,
  type IncompleteProfileStudent,
} from "@/components/admin/incomplete-profile-notice";

interface StudentRow extends IStudent {
  displayName: string;
  email?: string;
  age?: number;
  averageCompletion: number | null;
}

function calculateAge(dateOfBirth?: Date): number | null {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

function buildStudentCompletionMap(progressRecords: ICourseProgress[]) {
  const progressByStudent = new Map<string, number[]>();

  for (const record of progressRecords) {
    if (!record.studentId) continue;
    const existing = progressByStudent.get(record.studentId) ?? [];
    existing.push(record.completionPercentage ?? 0);
    progressByStudent.set(record.studentId, existing);
  }

  const studentAverage = new Map<string, number>();
  for (const [studentId, percentages] of progressByStudent) {
    if (percentages.length === 0) continue;
    const average =
      percentages.reduce((sum, value) => sum + value, 0) / percentages.length;
    studentAverage.set(studentId, Math.round(average * 100) / 100);
  }

  return studentAverage;
}

function averageOf(values: (number | null | undefined)[]): number | null {
  const numbers = values.filter((v): v is number => v != null);
  if (numbers.length === 0) return null;
  const total = numbers.reduce((sum, value) => sum + value, 0);
  return Math.round((total / numbers.length) * 10) / 10;
}

function formatTimeSpent(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatDate(date?: Date): string {
  if (!date) return "N/A";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

export default function AdminStudentsPage() {
  const session = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [minAge, setMinAge] = useState<string>("");
  const [maxAge, setMaxAge] = useState<string>("");
  const [pageSize, setPageSize] = useState<10 | 50 | 100>(10);
  const [page, setPage] = useState(1);

  const enabled = !session.isPending && !!session.data?.user;

  const {
    data: rawStudents = [],
    isLoading: isStudentsLoading,
    isError: isStudentsError,
    error: studentsError,
    refetch: refetchStudents,
    isFetching: isStudentsFetching,
  } = useAllStudents({ enabled });

  const {
    data: progressRecords = [],
    isLoading: isProgressLoading,
    isError: isProgressError,
  } = useAllProgress({ enabled });

  const { data: users = [], isError: isUsersError } = useAllUsers({ enabled });

  useEffect(() => {
    if (isProgressError) toast.error("Failed to load progress data");
  }, [isProgressError]);

  useEffect(() => {
    if (isUsersError) toast.error("Failed to load user profiles");
  }, [isUsersError]);

  const usersById = useMemo(() => {
    const map = new Map<string, IUser>();
    for (const user of users) {
      if (user?._id) map.set(String(user._id), user);
    }
    return map;
  }, [users]);

  const studentCompletionMap = useMemo(
    () => buildStudentCompletionMap(progressRecords),
    [progressRecords]
  );

  const students = useMemo<StudentRow[]>(() => {
    return rawStudents.map((student) => {
      const userId = String(student.userId ?? "");
      const user = usersById.get(userId);
      const studentId = student._id ? String(student._id) : undefined;

      return {
        ...student,
        displayName:
          user?.name || student.displayName || `Student ${shortId(userId)}`,
        email: user?.email,
        age: calculateAge(student.dateOfBirth) ?? undefined,
        averageCompletion: studentId
          ? (studentCompletionMap.get(studentId) ?? null)
          : null,
      };
    });
  }, [rawStudents, usersById, studentCompletionMap]);

  const filteredStudents = useMemo(() => {
    let filtered = students;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.displayName.toLowerCase().includes(searchLower) ||
          student.email?.toLowerCase().includes(searchLower) ||
          student.userId.toLowerCase().includes(searchLower)
      );
    }

    if (genderFilter !== "all") {
      filtered = filtered.filter((student) => student.gender === genderFilter);
    }

    if (ageFilter !== "all") {
      filtered = filtered.filter((student) => {
        if (student.age == null) return false;
        const age = student.age;

        if (ageFilter === "custom") {
          const min = minAge ? parseInt(minAge, 10) : 0;
          const max = maxAge ? parseInt(maxAge, 10) : 150;
          return age >= min && age <= max;
        }

        if (ageFilter === "0-5") return age >= 0 && age <= 5;
        if (ageFilter === "6-10") return age >= 6 && age <= 10;
        if (ageFilter === "11-15") return age >= 11 && age <= 15;
        if (ageFilter === "16-20") return age >= 16 && age <= 20;
        if (ageFilter === "21+") return age >= 21;

        return true;
      });
    }

    return [...filtered].sort((a, b) =>
      a.displayName.localeCompare(b.displayName, undefined, {
        sensitivity: "base",
        numeric: true,
      })
    );
  }, [students, searchTerm, genderFilter, ageFilter, minAge, maxAge]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const pageStart =
    filteredStudents.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, filteredStudents.length);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, genderFilter, ageFilter, minAge, maxAge, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const analytics = useMemo(() => {
    const withAge = students.filter((s) => s.age != null);
    const studentsOver17 = withAge.filter((s) => (s.age as number) > 17);

    return {
      total: students.length,
      withAge: withAge.length,
      maleCount: students.filter((s) => s.gender === Gender.MALE).length,
      femaleCount: students.filter((s) => s.gender === Gender.FEMALE).length,
      otherCount: students.filter((s) => s.gender === Gender.OTHER).length,
      averageAge: averageOf(withAge.map((s) => s.age)),
      studentsOver17Count: studentsOver17.length,
      averageCompletion: averageOf(students.map((s) => s.averageCompletion)),
      averageCompletionOver17: averageOf(
        studentsOver17.map((s) => s.averageCompletion)
      ),
      studentsWithProgress: students.filter((s) => s.averageCompletion != null)
        .length,
      studentsOver17WithProgress: studentsOver17.filter(
        (s) => s.averageCompletion != null
      ).length,
      totalCoins: students.reduce((sum, s) => sum + (s.coins || 0), 0),
      totalTimeSpent: students.reduce(
        (sum, s) => sum + (s.totalTimeSpent || 0),
        0
      ),
    };
  }, [students]);

  const incompleteProfiles = useMemo<IncompleteProfileStudent[]>(() => {
    return students
      .filter((student) => !student.dateOfBirth || !student.gender)
      .map((student) => ({
        id: String(student._id ?? student.userId),
        name: student.displayName,
        identifier: student.email || student.userId,
        missingDateOfBirth: !student.dateOfBirth,
        missingGender: !student.gender,
      }));
  }, [students]);

  const handleExport = useCallback(() => {
    if (filteredStudents.length === 0) {
      toast.error("Nothing to export");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Age",
      "Gender",
      "Grade",
      "Coins",
      "Streak",
      "Time Spent (min)",
      "Courses",
      "Completion (%)",
      "Joined",
    ];
    const escape = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = filteredStudents.map((student) =>
      [
        student.displayName,
        student.email ?? student.userId,
        student.age ?? "",
        student.gender ?? "",
        student.grade ?? "",
        student.coins ?? 0,
        student.codingStreak ?? 0,
        student.totalTimeSpent ?? 0,
        student.enrolledCourses?.length ?? 0,
        student.averageCompletion ?? "",
        formatDate(student.createdAt),
      ]
        .map(escape)
        .join(",")
    );

    const csv = [headers.map(escape).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredStudents.length} students`);
  }, [filteredStudents]);

  if (session.isPending || isStudentsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
        <div className="container mx-auto px-6 py-8">
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/40 px-5 py-4 shadow-sm backdrop-blur-sm">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              <span className="text-sm text-muted-foreground">
                Loading students…
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isStudentsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
        <div className="container mx-auto px-6 py-8">
          <Card className="mx-auto max-w-lg rounded-2xl border-destructive/30 bg-destructive/5 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="mb-2 text-lg font-semibold">
              Couldn&apos;t load students
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {studentsError instanceof Error
                ? studentsError.message
                : "The API did not respond."}{" "}
              Check that the API is running and reachable.
            </p>
            <Button
              onClick={() => refetchStudents()}
              disabled={isStudentsFetching}
            >
              <RefreshCw
                className={cn(
                  "mr-2 h-4 w-4",
                  isStudentsFetching && "animate-spin"
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
        {/* Hero */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 p-8">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Student Management
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                All Students
              </h1>
              <p className="max-w-2xl text-muted-foreground">
                Demographics, engagement, and course completion across every
                student on the platform.
              </p>
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <IncompleteProfileNotice
          students={incompleteProfiles}
          totalStudents={analytics.total}
          ready={!isStudentsLoading}
        />

        {/* Primary stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Students"
            value={analytics.total.toString()}
            icon={Users}
            iconClass="text-primary bg-primary/10"
            delay={0}
          />
          <StatCard
            title="Average Age"
            value={analytics.averageAge != null ? `${analytics.averageAge}` : "N/A"}
            hint={`${analytics.withAge} with date of birth`}
            icon={Calendar}
            iconClass="text-secondary bg-secondary/10"
            delay={0.05}
          />
          <StatCard
            title="Total Coins"
            value={analytics.totalCoins.toLocaleString()}
            icon={Sparkles}
            iconClass="text-primary bg-muted/40"
            delay={0.1}
          />
          <StatCard
            title="Total Time Spent"
            value={formatTimeSpent(analytics.totalTimeSpent)}
            icon={Clock}
            iconClass="text-secondary bg-muted/40"
            delay={0.15}
          />
        </div>

        {/* Age & completion */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            title="Students Over 17"
            value={analytics.studentsOver17Count.toString()}
            hint={`Age known for ${analytics.withAge} students`}
            icon={UserCheck}
            iconClass="text-primary bg-primary/10"
            delay={0.2}
          />
          <StatCard
            title="Avg Course Completion"
            value={
              isProgressLoading
                ? "…"
                : analytics.averageCompletion != null
                  ? `${analytics.averageCompletion}%`
                  : "N/A"
            }
            hint={`${analytics.studentsWithProgress} students with progress`}
            icon={TrendingUp}
            iconClass="text-secondary bg-secondary/10"
            delay={0.25}
            isLoading={isProgressLoading}
          />
          <StatCard
            title="Avg Completion (17+)"
            value={
              isProgressLoading
                ? "…"
                : analytics.averageCompletionOver17 != null
                  ? `${analytics.averageCompletionOver17}%`
                  : "N/A"
            }
            hint={`${analytics.studentsOver17WithProgress} over 17 with progress`}
            icon={TrendingUp}
            iconClass="text-primary bg-muted/40"
            delay={0.3}
            isLoading={isProgressLoading}
          />
        </div>

        {/* Gender distribution */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <GenderCard label="Male" value={analytics.maleCount} />
          <GenderCard label="Female" value={analytics.femaleCount} />
          <GenderCard label="Other" value={analytics.otherCount} />
        </div>

        {/* Filters */}
        <Card className="mb-6 rounded-2xl border border-border/40 bg-card/40 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, email, or user ID…"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value={Gender.MALE}>Male</SelectItem>
                  <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                  <SelectItem value={Gender.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Age Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                <SelectItem value="0-5">0-5 years</SelectItem>
                <SelectItem value="6-10">6-10 years</SelectItem>
                <SelectItem value="11-15">11-15 years</SelectItem>
                <SelectItem value="16-20">16-20 years</SelectItem>
                <SelectItem value="21+">21+ years</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {ageFilter === "custom" && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  className="w-20"
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value)}
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  className="w-20"
                  value={maxAge}
                  onChange={(e) => setMaxAge(e.target.value)}
                />
              </div>
            )}
          </div>
        </Card>

        {/* Students table */}
        <Card className="rounded-2xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-sm">
          <div className="p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold">
                Students{" "}
                <span className="text-muted-foreground">
                  ({filteredStudents.length})
                </span>
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rows</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) =>
                    setPageSize(Number(value) as 10 | 50 | 100)
                  }
                >
                  <SelectTrigger className="w-[88px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Coins</TableHead>
                    <TableHead>Streak</TableHead>
                    <TableHead>Time Spent</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="py-10 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-10 w-10 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">
                            {students.length === 0
                              ? "No students yet"
                              : "No students match these filters"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStudents.map((student, index) => (
                      <TableRow key={String(student._id ?? student.userId)}>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {(currentPage - 1) * pageSize + index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.displayName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {student.email ?? (
                            <span className="font-mono text-xs">
                              {shortId(student.userId)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {student.age != null ? (
                            <Badge variant="outline">{student.age}</Badge>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {student.gender ? (
                            <Badge
                              variant={
                                student.gender === Gender.MALE
                                  ? "default"
                                  : student.gender === Gender.FEMALE
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {student.gender.charAt(0).toUpperCase() +
                                student.gender.slice(1)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {student.grade ? (
                            <Badge variant="outline">
                              Grade {student.grade}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-secondary" />
                            {student.coins || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          {student.codingStreak ? (
                            <Badge variant="outline">
                              {student.codingStreak} days
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatTimeSpent(student.totalTimeSpent || 0)}
                        </TableCell>
                        <TableCell>
                          {student.enrolledCourses?.length || 0}
                        </TableCell>
                        <TableCell>
                          {isProgressLoading ? (
                            <span className="text-muted-foreground">…</span>
                          ) : student.averageCompletion != null ? (
                            <Badge variant="outline">
                              {student.averageCompletion}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(student.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-border/40 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {filteredStudents.length === 0
                  ? "No results"
                  : `Showing ${pageStart}–${pageEnd} of ${filteredStudents.length}`}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <span className="min-w-[5.5rem] text-center text-xs text-muted-foreground tabular-nums">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  delay: number;
  isLoading?: boolean;
}

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  iconClass,
  delay,
  isLoading = false,
}: StatCardProps) {
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
              iconClass
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p
            className={cn(
              "mt-1 text-2xl font-bold tracking-tight",
              isLoading && "animate-pulse text-muted-foreground"
            )}
          >
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function GenderCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="rounded-2xl border border-border/40 bg-card/40 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground">
          <UserCheck className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
