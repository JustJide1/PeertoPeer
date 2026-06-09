import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Spinner from '../components/Spinner';
import { getErrorMessage } from '../lib/httpClient';
import { fetchMyEnrollments } from '../lib/dashboardApi';
import {
  enrollInCourse,
  fetchCourses,
  unenrollFromCourse,
  type Course,
} from '../lib/coursesApi';

interface CourseRow extends Course {
  isEnrolled: boolean;
}

function CourseCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="h-3 w-16 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-3/4 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
      <div className="mt-5 flex justify-between">
        <div className="h-3 w-24 rounded bg-gray-200" />
        <div className="h-7 w-20 rounded bg-gray-200" />
      </div>
    </div>
  );
}

function CourseCard({
  course,
  isPending,
  onToggleEnroll,
}: {
  course: CourseRow;
  isPending: boolean;
  onToggleEnroll: (courseId: string) => void;
}) {
  return (
    <article className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{course.code}</p>
          <Link
            to={`/courses/${course.id}`}
            className="mt-1 block truncate text-base font-semibold text-blue-950 hover:underline"
          >
            {course.title}
          </Link>
        </div>
        {course.isEnrolled && (
          <span className="inline-flex flex-none items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
            Enrolled
          </span>
        )}
      </div>

      <p className="mt-1 text-xs text-gray-500">Lecturer: {course.lecturer.name}</p>

      <dl className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <div>
          <dt className="inline font-semibold text-gray-700">{course._count.enrollments}</dt> enrolled
        </div>
        <div>
          <dt className="inline font-semibold text-gray-700">{course._count.forums}</dt> forums
        </div>
      </dl>

      <div className="mt-4 flex-1" />

      <button
        type="button"
        onClick={() => onToggleEnroll(course.id)}
        disabled={isPending}
        className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          course.isEnrolled
            ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            : 'bg-blue-900 text-white hover:bg-blue-950'
        }`}
      >
        {isPending && <Spinner className="h-3.5 w-3.5" />}
        {course.isEnrolled ? 'Unenroll' : 'Enroll'}
      </button>
    </article>
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseRow[] | null>(null);
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);

    Promise.all([fetchCourses(), fetchMyEnrollments()])
      .then(([courseList, enrollments]) => {
        if (cancelled) return;
        const enrolledIds = new Set(enrollments.map((enrollment) => enrollment.course.id));
        setCourses(courseList.map((course) => ({ ...course, isEnrolled: enrolledIds.has(course.id) })));
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load courses.'));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    const query = search.trim().toLowerCase();
    if (!query) return courses;
    return courses.filter(
      (course) => course.title.toLowerCase().includes(query) || course.code.toLowerCase().includes(query),
    );
  }, [courses, search]);

  async function handleToggleEnroll(courseId: string) {
    if (pendingIds.has(courseId)) return;
    const target = courses?.find((course) => course.id === courseId);
    if (!target) return;

    const wasEnrolled = target.isEnrolled;
    const countDelta = wasEnrolled ? -1 : 1;

    setActionError(null);
    setPendingIds((prev) => new Set(prev).add(courseId));
    setCourses(
      (prev) =>
        prev?.map((course) =>
          course.id === courseId
            ? {
                ...course,
                isEnrolled: !wasEnrolled,
                _count: { ...course._count, enrollments: course._count.enrollments + countDelta },
              }
            : course,
        ) ?? null,
    );

    try {
      if (wasEnrolled) {
        await unenrollFromCourse(courseId);
      } else {
        await enrollInCourse(courseId);
      }
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not update your enrollment. Please try again.'));
      setCourses(
        (prev) =>
          prev?.map((course) =>
            course.id === courseId
              ? {
                  ...course,
                  isEnrolled: wasEnrolled,
                  _count: { ...course._count, enrollments: course._count.enrollments - countDelta },
                }
              : course,
          ) ?? null,
      );
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(courseId);
        return next;
      });
    }
  }

  const isLoading = courses === null && !loadError;

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-blue-950">Courses</h1>
      <p className="mt-1 text-sm text-gray-600">Browse available courses and manage your enrollments.</p>

      <div className="mt-6">
        <label htmlFor="course-search" className="sr-only">
          Search courses by title or code
        </label>
        <input
          id="course-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by course title or code..."
          className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900"
        />
      </div>

      {loadError && (
        <p className="mt-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {loadError}
        </p>
      )}
      {actionError && (
        <p className="mt-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      )}

      {isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CourseCardSkeleton key={index} />
          ))}
        </div>
      ) : !loadError && filteredCourses.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">
          {search.trim() ? 'No courses match your search.' : 'No courses are available yet.'}
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isPending={pendingIds.has(course.id)}
              onToggleEnroll={handleToggleEnroll}
            />
          ))}
        </div>
      )}
    </section>
  );
}
