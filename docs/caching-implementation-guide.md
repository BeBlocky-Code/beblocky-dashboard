# TanStack Query Caching Implementation Guide

This guide explains how to use the caching system implemented in the Beblocky Dashboard application.

## Overview

The caching system is built on [TanStack Query](https://tanstack.com/query/latest) (formerly React Query) v5, which provides:

- **Automatic caching**: Data is cached in memory and optionally persisted to localStorage
- **Background refetching**: Stale data is refetched automatically
- **Deduplication**: Multiple components requesting the same data only trigger one request
- **Optimistic updates**: UI updates immediately while waiting for server confirmation
- **Query invalidation**: Automatic cache invalidation after mutations

## File Structure

```
lib/
├── query-client.ts      # QueryClient configuration and persistence
├── query-keys.ts        # Centralized query key factory
└── hooks/
    └── queries/
        ├── index.ts           # Export all query hooks
        ├── use-courses.ts     # Course-related queries and mutations
        ├── use-classes.ts     # Class-related queries and mutations
        ├── use-users.ts       # User queries
        ├── use-students.ts    # Student queries
        └── use-teachers.ts    # Teacher queries and mutations

components/
└── providers/
    └── query-provider.tsx  # QueryClientProvider wrapper
```

## Quick Start

### Using Queries

Replace direct API calls with query hooks:

```tsx
// Before (direct API call)
const [courses, setCourses] = useState([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  fetchAllCoursesWithDetails()
    .then(setCourses)
    .finally(() => setIsLoading(false));
}, []);

// After (with TanStack Query)
import { useCoursesWithDetails } from "@/lib/hooks/queries";

const { data: courses, isLoading, error, refetch } = useCoursesWithDetails();
```

### Using Mutations

Replace direct mutation calls with mutation hooks:

```tsx
// Before
const handleDelete = async (courseId: string) => {
  await deleteCourse(courseId);
  // Manually refetch courses
  await loadCourses();
};

// After
import { useDeleteCourse } from "@/lib/hooks/queries";

const deleteCourseMutation = useDeleteCourse();

const handleDelete = async (courseId: string) => {
  await deleteCourseMutation.mutateAsync(courseId);
  // Cache is automatically invalidated!
};
```

## Available Hooks

### Course Hooks

| Hook | Description |
|------|-------------|
| `useCoursesWithDetails()` | Fetch all courses with lesson/slide counts |
| `useCourse(courseId)` | Fetch a single course |
| `useCourseComplete(courseId)` | Fetch course with all lessons and slides |
| `useLessonsForCourse(courseId)` | Fetch lessons for a course |
| `useSlidesForCourse(courseId)` | Fetch slides for a course |
| `useCreateCourse()` | Mutation to create a course |
| `useUpdateCourse()` | Mutation to update a course |
| `useDeleteCourse()` | Mutation to delete a course |
| `useCreateLesson()` | Mutation to create a lesson |
| `useUpdateLesson()` | Mutation to update a lesson |
| `useDeleteLesson()` | Mutation to delete a lesson |
| `useCreateSlide()` | Mutation to create a slide |
| `useUpdateSlide()` | Mutation to update a slide |
| `useDeleteSlide()` | Mutation to delete a slide |

### Class Hooks

| Hook | Description |
|------|-------------|
| `useClasses(user, filters?)` | Fetch all classes |
| `useClass(classId, user)` | Fetch a single class |
| `useClassStats(classId, user)` | Fetch class statistics |
| `useCreateClass()` | Mutation to create a class |
| `useUpdateClass()` | Mutation to update a class |
| `useDeleteClass()` | Mutation to delete a class |
| `useAddStudentToClass()` | Mutation to add a student |
| `useRemoveStudentFromClass()` | Mutation to remove a student |
| `useAddCourseToClass()` | Mutation to add a course |
| `useRemoveCourseFromClass()` | Mutation to remove a course |
| `useUpdateClassSettings()` | Mutation to update settings |

### User/Auth Hooks

| Hook | Description |
|------|-------------|
| `useUserByEmail(email)` | Fetch user by email |
| `useCurrentUser(user)` | Fetch current user profile |
| `useStudentByEmail(email, user)` | Fetch student by email |
| `useStudentByUserId(userId, user)` | Fetch student by user ID |
| `useAllStudents()` | Fetch all students (admin) |
| `useTeacherByUserId(userId, user)` | Fetch teacher by user ID |
| `useCurrentTeacher(user)` | Fetch current teacher |
| `useCreateTeacher()` | Mutation to create a teacher |

## Query Keys

Query keys are managed centrally in `lib/query-keys.ts`. Use them for manual cache operations:

```tsx
import { queryKeys } from "@/lib/query-keys";
import { useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

// Invalidate all courses
queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });

// Invalidate a specific course
queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) });

// Remove a course from cache
queryClient.removeQueries({ queryKey: queryKeys.courses.detail(courseId) });
```

## Stale Times

Configure how long data is considered fresh in `lib/query-client.ts`:

```typescript
export const STALE_TIMES = {
  STATIC: 5 * 60 * 1000,   // 5 minutes - courses, lessons
  USER: 3 * 60 * 1000,     // 3 minutes - user profiles
  LISTS: 2 * 60 * 1000,    // 2 minutes - lists
  DYNAMIC: 60 * 1000,      // 1 minute - progress, conversations
  REALTIME: 30 * 1000,     // 30 seconds - real-time data
};
```

## Common Patterns

### Conditional Queries

Use the `enabled` option to conditionally run queries:

```tsx
const { data: student } = useStudentByUserId(userId, user, {
  enabled: !!userId && user?.role === "student",
});
```

### Loading States

```tsx
const { data, isLoading, isFetching, error } = useCoursesWithDetails();

if (isLoading) return <Skeleton />;
if (error) return <Error message={error.message} />;
if (isFetching) return <RefreshIndicator />; // Background refresh

return <CourseList courses={data} />;
```

### Mutation States

```tsx
const mutation = useCreateCourse();

const handleSubmit = async (data: ICreateCourseDto) => {
  try {
    await mutation.mutateAsync({ courseData: data, userId });
    toast.success("Course created!");
  } catch (error) {
    toast.error("Failed to create course");
  }
};

return (
  <Button disabled={mutation.isPending}>
    {mutation.isPending ? "Creating..." : "Create Course"}
  </Button>
);
```

### Optimistic Updates

For instant UI feedback:

```tsx
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: updateCourse,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: queryKeys.courses.detail(newData.courseId) });
    
    // Snapshot current value
    const previousCourse = queryClient.getQueryData(queryKeys.courses.detail(newData.courseId));
    
    // Optimistically update
    queryClient.setQueryData(queryKeys.courses.detail(newData.courseId), newData);
    
    return { previousCourse };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(
      queryKeys.courses.detail(newData.courseId),
      context?.previousCourse
    );
  },
});
```

## Persistence

The cache is automatically persisted to localStorage. To disable:

```tsx
// In query-provider.tsx, remove this line:
setupQueryPersistence(client);
```

## DevTools

In development, React Query DevTools are available at the bottom-left corner. Use them to:

- Inspect cached queries
- View query states
- Trigger refetches
- Clear cache

## Migration Guide

### Step 1: Replace useEffect data fetching

```tsx
// Before
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchData().then(setData).finally(() => setLoading(false));
}, [dependency]);

// After
const { data, isLoading } = useQuery({
  queryKey: ['key', dependency],
  queryFn: fetchData,
});
```

### Step 2: Replace manual cache management

```tsx
// Before
const loadData = async () => {
  const data = await fetchData();
  setData(data);
};

const handleUpdate = async () => {
  await updateData();
  await loadData(); // Manual refetch
};

// After
const { data } = useQuery({ queryKey: ['key'], queryFn: fetchData });
const mutation = useMutation({
  mutationFn: updateData,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['key'] }),
});
```

### Step 3: Use provided hooks

Instead of creating custom queries, use the hooks in `lib/hooks/queries/`:

```tsx
// Use existing hooks
import { useCoursesWithDetails, useCreateCourse } from "@/lib/hooks/queries";

// These handle caching, invalidation, and error handling automatically
```

## Best Practices

1. **Always use query keys from `lib/query-keys.ts`** - ensures consistency
2. **Use the provided hooks** - they handle invalidation automatically
3. **Don't duplicate data in local state** - derive from query data
4. **Handle loading and error states** - queries provide these automatically
5. **Use `enabled` for conditional queries** - prevents unnecessary requests
6. **Invalidate related queries after mutations** - already handled in hooks

## Troubleshooting

### Data not updating after mutation

Check that the mutation hook invalidates the correct query keys.

### Too many requests

Increase `staleTime` for data that doesn't change often.

### Cache not persisting

Ensure `setupQueryPersistence` is called in `QueryProvider`.

### DevTools not showing

Only available in development mode (`NODE_ENV === "development"`).
