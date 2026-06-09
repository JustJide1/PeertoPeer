import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../lib/httpClient';
import { formatRelativeTime } from '../lib/time';
import {
  fetchMyActivity,
  fetchMyEnrollments,
  fetchMyResourceCount,
  type ActivityItem,
  type EnrollmentWithStats,
} from '../lib/dashboardApi';

const FEED_LIMIT = 10;
const ACTIVITY_FETCH_LIMIT = 50;

const LEVEL_LABELS: Record<string, string> = {
  L100: '100 Level',
  L200: '200 Level',
  L300: '300 Level',
  L400: '400 Level',
};

const QUICK_ACTIONS = [
  { label: 'Browse Courses', description: 'Discover and enroll in courses', to: '/courses' },
  { label: 'Upload Resource', description: 'Share notes and materials', to: '/courses' },
  { label: 'Start Discussion', description: 'Ask a question in a forum', to: '/courses' },
];

function lastPostActivityFor(courseId: string, activity: ActivityItem[]): string | null {
  const match = activity.find((item) => item.type === 'post' && item.forum?.courseId === courseId);
  return match?.createdAt ?? null;
}

function StatCard({ label, value, isLoading }: { label: string; value: number; isLoading: boolean }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      {isLoading ? (
        <div className="mt-2 h-7 w-12 animate-pulse rounded bg-gray-200" />
      ) : (
        <p className="mt-2 text-2xl font-bold text-blue-950">{value}</p>
      )}
    </div>
  );
}

function CourseCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="h-3 w-16 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-3/4 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
      <div className="mt-5 flex justify-between">
        <div className="h-3 w-20 rounded bg-gray-200" />
        <div className="h-3 w-16 rounded bg-gray-200" />
      </div>
    </div>
  );
}

function CourseCard({
  enrollment,
  lastActivity,
}: {
  enrollment: EnrollmentWithStats;
  lastActivity: string | null;
}) {
  const { course, forumActivity } = enrollment;
  const unreadCount = Math.max(forumActivity.totalPosts - forumActivity.myPosts, 0);

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{course.code}</p>
      <h3 className="mt-1 truncate text-base font-semibold text-blue-950">{course.title}</h3>
      <p className="mt-1 text-xs text-gray-500">Lecturer: {course.lecturer.name}</p>

      <dl className="mt-4 flex items-end justify-between">
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Last activity</dt>
          <dd className="mt-0.5 text-xs text-gray-600">
            {lastActivity ? formatRelativeTime(lastActivity) : 'No recent activity'}
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Unread posts</dt>
          <dd className="mt-1">
            {unreadCount > 0 ? (
              <span className="inline-flex items-center justify-center rounded-full bg-blue-900 px-2 py-0.5 text-xs font-semibold text-white">
                {unreadCount}
              </span>
            ) : (
              <span className="text-xs text-gray-400">0</span>
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function ActivityRowSkeleton() {
  return (
    <li className="flex animate-pulse gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="h-8 w-8 flex-none rounded-full bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-2/3 rounded bg-gray-200" />
        <div className="h-3 w-1/3 rounded bg-gray-200" />
      </div>
    </li>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const isPost = item.type === 'post';

  return (
    <li className="flex gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <span
        className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-xs font-semibold ${
          isPost ? 'bg-blue-900 text-white' : 'bg-blue-100 text-blue-900'
        }`}
        aria-hidden="true"
      >
        {isPost ? 'P' : 'C'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm text-gray-800">{item.content}</p>
        <p className="mt-1 text-xs text-gray-500">
          {isPost ? `Posted in ${item.forum?.title ?? 'a forum'}` : 'Commented on a post'}
          {' · '}
          {formatRelativeTime(item.createdAt)}
        </p>
      </div>
    </li>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();

  const [enrollments, setEnrollments] = useState<EnrollmentWithStats[] | null>(null);
  const [activity, setActivity] = useState<ActivityItem[] | null>(null);
  const [resourceCount, setResourceCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    Promise.all([fetchMyEnrollments(), fetchMyActivity(ACTIVITY_FETCH_LIMIT), fetchMyResourceCount()])
      .then(([enrollmentData, activityData, resources]) => {
        if (cancelled) return;
        setEnrollments(enrollmentData);
        setActivity(activityData);
        setResourceCount(resources);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load your dashboard.'));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash, enrollments]);

  const isLoading = enrollments === null || activity === null || resourceCount === null;

  const stats = {
    enrolledCourses: enrollments?.length ?? 0,
    postsMade: enrollments?.reduce((sum, e) => sum + e.forumActivity.myPosts, 0) ?? 0,
    resourcesShared: resourceCount ?? 0,
    commentsGiven: activity?.filter((item) => item.type === 'comment').length ?? 0,
  };

  const recentActivity = activity?.slice(0, FEED_LIMIT) ?? [];

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-blue-950">
          Welcome back{user?.name ? `, ${user.name}` : ''}
        </h1>
        {user?.level && (
          <span className="inline-flex items-center rounded-full bg-blue-900/10 px-3 py-1 text-xs font-semibold text-blue-900">
            {LEVEL_LABELS[user.level] ?? user.level}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-600">
        Here&apos;s what&apos;s happening across your courses.
      </p>

      {error && (
        <p className="mt-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {/* Stats row */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Enrolled Courses" value={stats.enrolledCourses} isLoading={isLoading} />
        <StatCard label="Posts Made" value={stats.postsMade} isLoading={isLoading} />
        <StatCard label="Resources Shared" value={stats.resourcesShared} isLoading={isLoading} />
        <StatCard label="Comments Given" value={stats.commentsGiven} isLoading={isLoading} />
      </div>

      {/* My Courses */}
      <div id="my-courses" className="mt-10 scroll-mt-20">
        <h2 className="text-lg font-semibold text-blue-950">My Courses</h2>

        {isLoading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <CourseCardSkeleton key={index} />
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            You&apos;re not enrolled in any courses yet.{' '}
            <Link to="/courses" className="font-medium text-blue-900 hover:text-blue-950">
              Browse courses
            </Link>{' '}
            to get started.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => (
              <CourseCard
                key={enrollment.course.id}
                enrollment={enrollment}
                lastActivity={lastPostActivityFor(enrollment.course.id, activity ?? [])}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-blue-950">Recent Activity</h2>

        {isLoading ? (
          <ul className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <ActivityRowSkeleton key={index} />
            ))}
          </ul>
        ) : recentActivity.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No activity yet — join a forum discussion to get started.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {recentActivity.map((item) => (
              <ActivityRow key={`${item.type}-${item.id}`} item={item} />
            ))}
          </ul>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-blue-950">Quick Actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-900 hover:bg-blue-900/5"
            >
              <p className="text-sm font-semibold text-blue-950">{action.label}</p>
              <p className="mt-1 text-xs text-gray-500">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
