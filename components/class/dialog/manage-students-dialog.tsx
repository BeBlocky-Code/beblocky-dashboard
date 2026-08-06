"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Search,
  UserPlus,
  Mail,
  MoreHorizontal,
  Trash2,
  Edit,
  Crown,
  Shield,
  User,
  Download,
  Upload,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IStudent } from "@/types/student";
import type { IUser } from "@/types/user";
import type { IClass } from "@/types/class";
import { studentApi } from "@/lib/api/student";
import { classApi } from "@/lib/api/class";
import { userApi } from "@/lib/api/user";
import { progressApi } from "@/lib/api/progress";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { ErrorPopup } from "@/components/ui/error-popup";

interface Student {
  _id: string;
  userId: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: "student" | "moderator" | "admin";
  status: "active" | "pending" | "inactive";
  joinedAt: Date;
  lastActive: Date;
  progress: number;
  avatar?: string;
  // Student-specific properties
  dateOfBirth?: Date;
  grade?: number;
  gender?: string;
  enrolledCourses?: string[];
  coins?: number;
  codingStreak?: number;
  totalCoinsEarned?: number;
  totalTimeSpent?: number;
  goals?: string[];
  subscription?: string;
  section?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface BulkImportResult {
  success: number;
  failed: number;
  results: Array<{
    email: string;
    status: "success" | "failed";
    message: string;
    studentId?: string;
  }>;
}

interface ModernManageStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  className: string;
}

export function ModernManageStudentsDialog({
  open,
  onOpenChange,
  classId,
  className,
}: ModernManageStudentsDialogProps) {
  const session = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [importResults, setImportResults] = useState<BulkImportResult | null>(
    null
  );
  const [error, setError] = useState<{
    message: string;
    error: string;
    statusCode: number;
  } | null>(null);

  // Load real student data when dialog opens
  useEffect(() => {
    if (open && classId && session.data?.user) {
      loadStudents();
    }
  }, [open, classId, session.data?.user]);

  const loadStudents = async () => {
    if (!session.data?.user?.email) return;

    setIsLoadingStudents(true);
    try {
      const userData = await userApi.getUserByEmail(session.data.user.email);

      // Get class data to access student IDs
      const classData = await classApi.getClassById(classId, userData);
      const allProgress = await progressApi.getAllProgress();

      const averageProgressForStudent = (...studentKeys: string[]) => {
        const keySet = new Set(studentKeys.filter(Boolean));
        const records = allProgress.filter((p) => keySet.has(p.studentId));
        if (records.length === 0) return 0;
        return Math.round(
          records.reduce((sum, r) => sum + (r.completionPercentage || 0), 0) /
            records.length
        );
      };

      // Load student data for each student ID in the class
      const studentPromises = classData.students.map(async (studentId) => {
        const studentIdString = studentId.toString();
        try {
          const studentData = await studentApi.getStudentByUserId(
            studentIdString,
            userData
          );

          // Create a combined student object with UI-specific properties
          const student: Student = {
            ...studentData,
            _id: studentData._id || studentId.toString(),
            userId: studentData.userId || studentId.toString(),
            name: userData.name || "Unknown Student",
            email: userData.email || "unknown@example.com",
            emailVerified: userData.emailVerified || false,
            role: "student" as const,
            status: "active" as const,
            joinedAt: studentData.createdAt || new Date(),
            lastActive: studentData.lastCodingActivity || new Date(),
            progress: averageProgressForStudent(
              studentData._id?.toString() || "",
              studentData.userId?.toString() || "",
              studentIdString
            ),
            avatar: userData.image,
            dateOfBirth: studentData.dateOfBirth,
            grade: studentData.grade,
            gender: studentData.gender,
            enrolledCourses:
              studentData.enrolledCourses?.map((id) => id.toString()) || [],
            coins: studentData.coins,
            codingStreak: studentData.codingStreak,
            totalCoinsEarned: studentData.totalCoinsEarned,
            totalTimeSpent: studentData.totalTimeSpent,
            goals: studentData.goals,
            subscription: studentData.subscription,
            section: studentData.section,
            createdAt: studentData.createdAt,
            updatedAt: studentData.updatedAt,
          };

          return student;
        } catch (error) {
          console.warn(`Failed to load student ${studentId}:`, error);
          // Return a fallback student object
          return {
            _id: studentId.toString(),
            userId: studentId.toString(),
            name: `Student ${studentId}`,
            email: `student${studentId}@example.com`,
            emailVerified: false,
            role: "student" as const,
            status: "active" as const,
            joinedAt: new Date(),
            lastActive: new Date(),
            progress: 0,
            dateOfBirth: new Date(),
            grade: 1,
            gender: "other",
            enrolledCourses: [],
            coins: 0,
            codingStreak: 0,
            totalCoinsEarned: 0,
            totalTimeSpent: 0,
            goals: [],
            subscription: "free",
            section: "A",
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
      });

      const loadedStudents = await Promise.all(studentPromises);
      setStudents(loadedStudents);
    } catch (error) {
      console.error("Failed to load students:", error);
      toast.error("Failed to load students");
      // Fallback to empty array
      setStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(filteredStudents.map((s) => s._id).filter(Boolean));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
    }
  };

  // Updated single email invite using new endpoint
  const handleInviteStudent = async () => {
    if (!inviteEmail.trim() || !session.data?.user?.email) return;

    setIsLoading(true);
    setError(null);

    try {
      const userData = await userApi.getUserByEmail(session.data.user.email);

      // Use the correct endpoint for single student add
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/classes/${classId}/add-student-by-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userData._id || userData.email,
            "x-user-type": userData.role,
          },
          credentials: "include",
          body: JSON.stringify({ email: inviteEmail }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError({
          message: errorData.message || "Failed to add student",
          error: errorData.error || "Bad Request",
          statusCode: response.status,
        });
        return;
      }

      const result = await response.json();

      // Success - refresh the student list
      toast.success("Student added successfully!");
      setInviteEmail("");
      await loadStudents(); // Refresh the student list
    } catch (error) {
      console.error("Failed to invite student:", error);
      setError({
        message: "Failed to add student. Please try again.",
        error: "Internal Error",
        statusCode: 500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Improved CSV bulk import functionality
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !session.data?.user?.email) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError({
        message: "Please select a valid CSV file",
        error: "Invalid File Type",
        statusCode: 400,
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError({
        message: "File size must be less than 5MB",
        error: "File Too Large",
        statusCode: 400,
      });
      return;
    }

    setIsUploading(true);
    setError(null);
    setImportResults(null);

    try {
      const userData = await userApi.getUserByEmail(session.data.user.email);

      // Parse CSV file with better error handling
      const text = await file.text();

      // Handle different line endings and remove BOM
      const cleanText = text
        .replace(/^\uFEFF/, "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");
      const lines = cleanText.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        setError({
          message:
            "CSV file must contain at least a header row and one data row",
          error: "Invalid CSV Format",
          statusCode: 400,
        });
        return;
      }

      // Extract emails from CSV (assuming first column is email)
      const emails = lines
        .slice(1) // Skip header row
        .map((line, index) => {
          try {
            // Handle quoted values and multiple commas
            const columns = line
              .split(",")
              .map((col) => col.trim().replace(/^"|"$/g, ""));
            const email = columns[0];

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
              console.warn(
                `Invalid email format on line ${index + 2}: ${email}`
              );
              return null;
            }

            return email.toLowerCase();
          } catch (error) {
            console.warn(`Error parsing line ${index + 2}: ${line}`);
            return null;
          }
        })
        .filter((email): email is string => email !== null);

      if (emails.length === 0) {
        setError({
          message:
            "No valid email addresses found in CSV file. Please ensure the first column contains valid email addresses.",
          error: "No Valid Emails",
          statusCode: 400,
        });
        return;
      }

      // Remove duplicates
      const uniqueEmails = [...new Set(emails)];

      if (uniqueEmails.length !== emails.length) {
        console.warn(
          `Removed ${emails.length - uniqueEmails.length} duplicate emails`
        );
      }

      // Prepare payload for bulk import
      const payload = {
        students: uniqueEmails.map((email) => ({ email })),
      };

      console.log(
        `Attempting to import ${uniqueEmails.length} students:`,
        uniqueEmails
      );

      // Call bulk import endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/classes/${classId}/bulk-import-students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userData._id || userData.email,
            "x-user-type": userData.role,
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError({
          message: errorData.message || "Failed to import students",
          error: errorData.error || "Bad Request",
          statusCode: response.status,
        });
        return;
      }

      const result: BulkImportResult = await response.json();
      setImportResults(result);

      // Show success/failure summary
      if (result.success > 0) {
        toast.success(`Successfully imported ${result.success} student(s)`);
      }
      if (result.failed > 0) {
        toast.error(`Failed to import ${result.failed} student(s)`);
      }

      // Refresh student list if any were successfully added
      if (result.success > 0) {
        await loadStudents();
      }
    } catch (error) {
      console.error("Failed to import students:", error);
      setError({
        message: "Failed to import students. Please try again.",
        error: "Internal Error",
        statusCode: 500,
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!session.data?.user?.email) return;

    setIsLoading(true);
    setError(null);

    try {
      const userData = await userApi.getUserByEmail(session.data.user.email);

      // Call the API to remove student from class
      const result = await classApi.removeStudent(classId, studentId, userData);

      if (result.success && result.data) {
        // Success - refresh the student list
        toast.success("Student removed successfully!");
        await loadStudents(); // Refresh the student list
      } else if (result.error) {
        // Show error popup
        setError(result.error);
      }
    } catch (error) {
      console.error("Failed to remove student:", error);
      setError({
        message: "Failed to remove student. Please try again.",
        error: "Internal Error",
        statusCode: 500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkRemove = async () => {
    if (selectedStudents.length === 0 || !session.data?.user?.email) return;

    setIsLoading(true);
    setError(null);

    try {
      const userData = await userApi.getUserByEmail(session.data.user.email);

      // Remove each selected student
      const removePromises = selectedStudents.map((studentId) =>
        classApi.removeStudent(classId, studentId, userData)
      );

      const results = await Promise.all(removePromises);

      // Check if all removals were successful
      const allSuccessful = results.every((result) => result.success);

      if (allSuccessful) {
        toast.success(
          `${selectedStudents.length} student(s) removed successfully!`
        );
        setSelectedStudents([]);
        await loadStudents(); // Refresh the student list
      } else {
        // Show error for the first failed removal
        const firstError = results.find((result) => !result.success);
        if (firstError?.error) {
          setError(firstError.error);
        }
      }
    } catch (error) {
      console.error("Failed to remove students:", error);
      setError({
        message: "Failed to remove students. Please try again.",
        error: "Internal Error",
        statusCode: 500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case "moderator":
        return <Shield className="h-3 w-3 text-primary" />;
      default:
        return <User className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-3 w-3" />;
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "inactive":
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] rounded-2xl border border-border/40 bg-card/95 backdrop-blur-sm">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Manage Students
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{className}</p>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="students" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 rounded-xl border border-border/30 bg-muted/20">
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Students ({students.length})
            </TabsTrigger>
            <TabsTrigger value="invite" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Students
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-border/40 bg-card/40"
                />
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedStudents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/20 p-3"
              >
                <span className="text-sm font-medium">
                  {selectedStudents.length} student
                  {selectedStudents.length > 1 ? "s" : ""} selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="rounded-full border-border/40">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full border-border/40 text-destructive hover:text-destructive"
                    onClick={handleBulkRemove}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove ({selectedStudents.length})
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Students List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {isLoadingStudents ? (
                <div className="text-center py-8">
                  <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading students...</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-muted/20 p-3 text-sm font-medium">
                    <Checkbox
                      checked={
                        selectedStudents.length === filteredStudents.length &&
                        filteredStudents.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                    <div className="flex-1">Student</div>
                    <div className="w-24 text-center">Role</div>
                    <div className="w-24 text-center">Status</div>
                    <div className="w-20 text-center">Progress</div>
                    <div className="w-10"></div>
                  </div>

                  <AnimatePresence>
                    {filteredStudents.map((student, index) => (
                      <motion.div
                        key={student._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 rounded-xl border border-border/30 bg-muted/20 p-3 transition-colors hover:bg-muted/30"
                      >
                        <Checkbox
                          checked={selectedStudents.includes(student._id)}
                          onCheckedChange={(checked) =>
                            handleSelectStudent(student._id, checked as boolean)
                          }
                        />

                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={student.avatar || "/placeholder.svg"}
                              alt={student.name}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {student.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {student.name}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {student.email}
                            </p>
                          </div>
                        </div>

                        <div className="w-24 flex justify-center">
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            {getRoleIcon(student.role)}
                            {student.role}
                          </Badge>
                        </div>

                        <div className="w-24 flex justify-center">
                          <Badge
                            className={cn(
                              "flex items-center gap-1",
                              getStatusColor(student.status)
                            )}
                          >
                            {getStatusIcon(student.status)}
                            {student.status}
                          </Badge>
                        </div>

                        <div className="w-20 text-center">
                          <span className="text-sm font-medium">
                            {student.progress}%
                          </span>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleRemoveStudent(student._id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Student
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {filteredStudents.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No students found</p>
                      <p className="text-sm">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="invite" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Invite by Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="student@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="border-border/40 bg-card/40"
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleInviteStudent()
                    }
                  />
                  <Button
                    onClick={handleInviteStudent}
                    disabled={isLoading || !inviteEmail.trim()}
                    className="rounded-full"
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Bulk Import from CSV</Label>
                <div className="rounded-xl border border-dashed border-border/40 bg-muted/20 p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drop a CSV file here or click to upload
                  </p>
                  <div className="text-xs text-muted-foreground mb-4 space-y-1">
                    <p>
                      CSV should contain email addresses in the first column
                    </p>
                    <p className="rounded-lg border border-border/30 bg-muted/20 p-1 font-mono text-xs">
                      email
                      <br />
                      student1@example.com
                      <br />
                      student2@example.com
                    </p>
                    <p className="text-muted-foreground">
                      ⚠️ Students must already exist in the system
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-border/40"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Choose CSV File
                  </Button>
                </div>
              </div>

              {/* Import Results */}
              {importResults && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 rounded-xl border border-border/30 bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Import Results</h4>
                    <div className="flex gap-2 text-sm">
                      <span className="text-primary">
                        Success: {importResults.success}
                      </span>
                      <span className="text-destructive">
                        Failed: {importResults.failed}
                      </span>
                    </div>
                  </div>

                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {importResults.results.map((result, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-center gap-2 rounded-lg p-2 text-sm",
                          result.status === "success"
                            ? "border border-border/30 bg-muted/20 text-foreground"
                            : "rounded-xl border border-destructive/30 bg-destructive/10 text-destructive"
                        )}
                      >
                        {result.status === "success" ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <span className="font-medium">{result.email}</span>
                        <span className="text-xs opacity-75">
                          {result.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end border-t border-border/40 pt-4">
          <Button variant="outline" className="rounded-full border-border/40" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Error Popup */}
      <ErrorPopup
        error={error}
        onClose={() => setError(null)}
        onRetry={handleInviteStudent}
      />
    </Dialog>
  );
}
