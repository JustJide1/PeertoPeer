import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useSetBreadcrumbs } from '../context/BreadcrumbContext';
import { getErrorMessage } from '../lib/httpClient';
import { formatDate, formatRelativeTime } from '../lib/time';
import {
  changeCurrentUserPassword,
  fetchMyEnrollments,
  fetchMyPosts,
  fetchUserProfile,
  updateCurrentUserName,
  type MyActivityItem,
  type MyEnrollment,
  type UserProfile,
} from '../lib/usersApi';

type Tab = 'posts' | 'courses';

const LEVEL_LABELS: Record<string, string> = {
  L100: '100 Level',
  L200: '200 Level',
  L300: '300 Level',
  L400: '400 Level',
};

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/`{1,3}[^`]*`{1,3}/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function postTitle(content: string): string {
  const firstLine = content.split('\n').map((line) => line.trim()).find(Boolean);
  return firstLine ? truncate(stripMarkdown(firstLine), 100) : 'Untitled post';
}

function StatCard({ label, value, isLoading }: { label: string; value: number | null; isLoading: boolean }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      {isLoading || value === null ? (
        <div className="mt-2 h-7 w-12 animate-pulse rounded bg-gray-200" />
      ) : (
        <p className="mt-2 text-2xl font-bold text-blue-950">{value}</p>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <ul className="mt-4 space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <li key={index} className="animate-pulse rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="h-4 w-2/3 rounded bg-gray-200" />
          <div className="mt-2 h-3 w-1/3 rounded bg-gray-200" />
        </li>
      ))}
    </ul>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-sm text-gray-500">{children}</p>;
}

function CourseListItem({ course }: { course: { id: string; title: string; code: string; lecturerName?: string } }) {
  return (
    <li>
      <Link
        to={`/courses/${course.id}`}
        className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-blue-950">{course.title}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {course.code}
            {course.lecturerName && ` · ${course.lecturerName}`}
          </p>
        </div>
        <span className="flex-none text-xs font-medium text-blue-900">View &rarr;</span>
      </Link>
    </li>
  );
}

function PostListItem({ post }: { post: MyActivityItem & { type: 'post' } }) {
  return (
    <li>
      <Link
        to={`/forums/${post.forum.id}`}
        className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      >
        <p className="truncate text-sm font-semibold text-blue-950">{postTitle(post.content)}</p>
        <p className="mt-1 text-xs text-gray-500">
          {post.forum.title} · {formatRelativeTime(post.createdAt)}
        </p>
      </Link>
    </li>
  );
}

export default function ProfilePage() {
  const { id: routeId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const { user, refreshToken } = useAuth();

  const targetId = routeId ?? user?.id ?? null;
  const isOwnProfile = Boolean(user && targetId === user.id);

  const requestedTab = searchParams.get('tab');
  const initialTab: Tab = requestedTab === 'courses' ? requestedTab : 'posts';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useSetBreadcrumbs(
    isOwnProfile
      ? [{ label: 'Profile' }]
      : profile
        ? [{ label: 'Profile', to: '/profile' }, { label: profile.name }]
        : null,
  );

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const [posts, setPosts] = useState<(MyActivityItem & { type: 'post' })[] | null>(null);
  const [postsError, setPostsError] = useState<string | null>(null);

  const [enrollments, setEnrollments] = useState<MyEnrollment[] | null>(null);
  const [enrollmentsError, setEnrollmentsError] = useState<string | null>(null);

  useEffect(() => {
    if (!targetId) return;
    let cancelled = false;
    setProfile(null);
    setLoadError(null);

    fetchUserProfile(targetId)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load this profile.'));
      });

    return () => {
      cancelled = true;
    };
  }, [targetId]);

  useEffect(() => {
    setActiveTab(initialTab);
    setPosts(null);
    setEnrollments(null);
  }, [targetId, initialTab]);

  useEffect(() => {
    if (!isOwnProfile || activeTab !== 'posts' || posts !== null) return;
    let cancelled = false;
    setPostsError(null);

    fetchMyPosts()
      .then((data) => {
        if (!cancelled) setPosts(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setPostsError(getErrorMessage(err, 'Could not load your posts.'));
      });

    return () => {
      cancelled = true;
    };
  }, [isOwnProfile, activeTab, posts]);

  useEffect(() => {
    if (!isOwnProfile || activeTab !== 'courses' || enrollments !== null) return;
    let cancelled = false;
    setEnrollmentsError(null);

    fetchMyEnrollments()
      .then((data) => {
        if (!cancelled) setEnrollments(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setEnrollmentsError(getErrorMessage(err, 'Could not load your courses.'));
      });

    return () => {
      cancelled = true;
    };
  }, [isOwnProfile, activeTab, enrollments]);

  if (!targetId) {
    return null;
  }

  function startEditingName() {
    if (!profile) return;
    setNameDraft(profile.name);
    setNameError(null);
    setIsEditingName(true);
  }

  async function handleSaveName() {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameError('Name cannot be empty');
      return;
    }

    setIsSavingName(true);
    setNameError(null);
    try {
      await updateCurrentUserName(trimmed);
      await refreshToken();
      setProfile((prev) => (prev ? { ...prev, name: trimmed } : prev));
      setIsEditingName(false);
    } catch (err) {
      setNameError(getErrorMessage(err, 'Could not save your name. Please try again.'));
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changeCurrentUserPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Your password has been updated.');
    } catch (err) {
      setPasswordError(getErrorMessage(err, 'Could not change your password. Please try again.'));
    } finally {
      setIsChangingPassword(false);
    }
  }

  const tabLabels: Record<Tab, string> = isOwnProfile
    ? { posts: 'My Posts', courses: 'My Courses' }
    : { posts: 'Posts', courses: 'Courses' };

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      {loadError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {loadError}
        </p>
      )}

      {!profile && !loadError && (
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-gray-200" />
            <div className="space-y-2">
              <div className="h-5 w-40 rounded bg-gray-200" />
              <div className="h-3 w-56 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      )}

      {profile && (
        <>
          <header className="flex flex-wrap items-center gap-4">
            <Avatar name={profile.name} size="lg" />
            <div className="min-w-0 flex-1">
              {isEditingName ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={nameDraft}
                    onChange={(event) => setNameDraft(event.target.value)}
                    autoFocus
                    className="rounded-md border border-gray-300 px-2.5 py-1 text-lg font-bold text-blue-950 shadow-sm focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSaveName()}
                    disabled={isSavingName}
                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-900 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingName && <Spinner className="h-3.5 w-3.5" />}
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    disabled={isSavingName}
                    className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-blue-950">{profile.name}</h1>
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={startEditingName}
                      aria-label="Edit name"
                      className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-900"
                    >
                      ✎
                    </button>
                  )}
                </div>
              )}
              {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}

              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {isOwnProfile && user && <p className="text-sm text-gray-500">{user.email}</p>}
                {profile.level && (
                  <span className="inline-flex items-center rounded-full bg-blue-900/10 px-2.5 py-0.5 text-xs font-semibold text-blue-900">
                    {LEVEL_LABELS[profile.level] ?? profile.level}
                  </span>
                )}
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-600">
                  {profile.role.toLowerCase()}
                </span>
              </div>
              {isOwnProfile && user && (
                <p className="mt-1 text-xs text-gray-500">Member since {formatDate(user.createdAt)}</p>
              )}
            </div>
          </header>

          {isOwnProfile && (
            <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-blue-950">Change password</h2>
              <form onSubmit={handleChangePassword} className="mt-3 space-y-3">
                <div>
                  <label htmlFor="current-password" className="block text-xs font-medium text-gray-700">
                    Current password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="new-password" className="block text-xs font-medium text-gray-700">
                      New password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      required
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirm-password" className="block text-xs font-medium text-gray-700">
                      Confirm new password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900"
                    />
                  </div>
                </div>

                {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}
                {passwordSuccess && <p className="text-xs text-green-700">{passwordSuccess}</p>}

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isChangingPassword && <Spinner className="h-3.5 w-3.5" />}
                  Update password
                </button>
              </form>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Posts" value={profile.postCount} isLoading={false} />
            <StatCard label="Comments" value={profile.commentCount} isLoading={false} />
            <StatCard label="Resources" value={profile.resourceCount} isLoading={false} />
            <StatCard label="Courses enrolled" value={profile.enrolledCourses.length} isLoading={false} />
          </div>

          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex gap-6">
              {(['posts', 'courses'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'border-blue-900 text-blue-950'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tabLabels[tab]}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'posts' && (
            <div className="mt-4">
              {!isOwnProfile ? (
                <EmptyNote>
                  {profile.name} has written {profile.postCount} {profile.postCount === 1 ? 'post' : 'posts'} and{' '}
                  {profile.commentCount} {profile.commentCount === 1 ? 'comment' : 'comments'}.
                </EmptyNote>
              ) : (
                <>
                  {postsError && (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                      {postsError}
                    </p>
                  )}
                  {posts === null && !postsError ? (
                    <ListSkeleton />
                  ) : posts && posts.length === 0 ? (
                    <EmptyNote>You haven&apos;t posted in any forums yet.</EmptyNote>
                  ) : posts ? (
                    <ul className="space-y-3">
                      {posts.map((post) => (
                        <PostListItem key={post.id} post={post} />
                      ))}
                    </ul>
                  ) : null}
                </>
              )}
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="mt-4">
              {!isOwnProfile ? (
                profile.enrolledCourses.length === 0 ? (
                  <EmptyNote>{profile.name} is not enrolled in any courses yet.</EmptyNote>
                ) : (
                  <ul className="space-y-3">
                    {profile.enrolledCourses.map((course) => (
                      <CourseListItem key={course.id} course={course} />
                    ))}
                  </ul>
                )
              ) : (
                <>
                  {enrollmentsError && (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                      {enrollmentsError}
                    </p>
                  )}
                  {enrollments === null && !enrollmentsError ? (
                    <ListSkeleton />
                  ) : enrollments && enrollments.length === 0 ? (
                    <EmptyNote>You&apos;re not enrolled in any courses yet.</EmptyNote>
                  ) : enrollments ? (
                    <ul className="space-y-3">
                      {enrollments.map(({ course }) => (
                        <CourseListItem
                          key={course.id}
                          course={{ ...course, lecturerName: course.lecturer.name }}
                        />
                      ))}
                    </ul>
                  ) : null}
                </>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
