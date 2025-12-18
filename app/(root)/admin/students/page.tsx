"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { studentApi } from "@/lib/api/student";
import { userApi } from "@/lib/api/user";
import type { IStudent } from "@/types/student";
import type { IUser } from "@/types/user";
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
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface StudentWithUser extends IStudent {
  displayName?: string;
  email?: string;
  age?: number;
}

export default function AdminStudentsPage() {
  const session = useSession();
  const [students, setStudents] = useState<StudentWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [minAge, setMinAge] = useState<string>("");
  const [maxAge, setMaxAge] = useState<string>("");

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth?: Date): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Load all students
  useEffect(() => {
    const loadStudents = async () => {
      setIsLoading(true);
      try {
        const studentsData = await studentApi.getAllStudents();

        // Process students data - calculate age and set display info
        // The API response includes all necessary fields (displayName, email, dateOfBirth, gender, etc.)
        const processedStudents = studentsData.map((student: any) => {
          const age = calculateAge(student.dateOfBirth);
          return {
            ...student,
            displayName: student.displayName || student.name || student.userId,
            email: student.email || student.userId,
            age: age || undefined,
          };
        });

        setStudents(processedStudents);
      } catch (error) {
        console.error("Failed to load students:", error);
        toast.error("Failed to load students");
      } finally {
        setIsLoading(false);
      }
    };

    if (session.data?.user) {
      loadStudents();
    }
  }, [session.data?.user]);

  // Filter students
  const filteredStudents = useMemo(() => {
    let filtered = students;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.displayName?.toLowerCase().includes(searchLower) ||
          student.email?.toLowerCase().includes(searchLower) ||
          student.userId.toLowerCase().includes(searchLower)
      );
    }

    // Gender filter
    if (genderFilter !== "all") {
      filtered = filtered.filter((student) => student.gender === genderFilter);
    }

    // Age filter
    if (ageFilter !== "all") {
      filtered = filtered.filter((student) => {
        if (!student.age) return false;
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

    return filtered;
  }, [students, searchTerm, genderFilter, ageFilter, minAge, maxAge]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const total = students.length;
    const withAge = students.filter(
      (s) => s.age !== null && s.age !== undefined
    ).length;
    const withGender = students.filter((s) => s.gender).length;
    const maleCount = students.filter((s) => s.gender === Gender.MALE).length;
    const femaleCount = students.filter(
      (s) => s.gender === Gender.FEMALE
    ).length;
    const otherCount = students.filter((s) => s.gender === Gender.OTHER).length;

    const averageAge =
      students
        .map((s) => s.age)
        .filter((age): age is number => age !== null && age !== undefined)
        .reduce((sum, age, _, arr) => sum + age / arr.length, 0) || 0;

    const totalCoins = students.reduce((sum, s) => sum + (s.coins || 0), 0);
    const totalTimeSpent = students.reduce(
      (sum, s) => sum + (s.totalTimeSpent || 0),
      0
    );
    const totalEnrolledCourses = students.reduce(
      (sum, s) => sum + (s.enrolledCourses?.length || 0),
      0
    );

    return {
      total,
      withAge,
      withGender,
      maleCount,
      femaleCount,
      otherCount,
      averageAge: Math.round(averageAge * 10) / 10,
      totalCoins,
      totalTimeSpent,
      totalEnrolledCourses,
    };
  }, [students]);

  const formatTimeSpent = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (date?: Date): string => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-6 py-8 pt-24">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <span className="ml-3 text-muted-foreground">
              Loading students...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-2">
            Student Management
          </h1>
          <p className="text-muted-foreground">
            View and manage all students in the system
          </p>
        </div>

        {/* Analytics Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Students
                  </p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {analytics.total}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Average Age
                  </p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {analytics.averageAge || "N/A"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Coins
                  </p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                    {analytics.totalCoins.toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Time Spent
                  </p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                    {formatTimeSpent(analytics.totalTimeSpent)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Gender Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Male</p>
                <p className="text-2xl font-bold">{analytics.maleCount}</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Female</p>
                <p className="text-2xl font-bold">{analytics.femaleCount}</p>
              </div>
              <UserCheck className="h-8 w-8 text-pink-500" />
            </div>
          </Card>
          <Card className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Other</p>
                <p className="text-2xl font-bold">{analytics.otherCount}</p>
              </div>
              <UserCheck className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Gender Filter */}
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

            {/* Age Filter */}
            <div className="flex items-center gap-2">
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
            </div>

            {/* Custom Age Range Inputs */}
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

            {/* Export Button */}
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </Card>

        {/* Students Table */}
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Students ({filteredStudents.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Coins</TableHead>
                    <TableHead>Streak</TableHead>
                    <TableHead>Time Spent</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-12 w-12 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            No students found
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell className="font-medium">
                          {student.displayName || "Unknown"}
                        </TableCell>
                        <TableCell>{student.email || student.userId}</TableCell>
                        <TableCell>
                          {student.age !== undefined ? (
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
                            <Sparkles className="h-3 w-3 text-yellow-500" />
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
                        <TableCell className="text-muted-foreground">
                          {formatDate(student.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
