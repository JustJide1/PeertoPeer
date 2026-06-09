import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import ResourceCard from '../components/ResourceCard';
import ResourceUploadModal from '../components/ResourceUploadModal';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useSetBreadcrumbs } from '../context/BreadcrumbContext';
import { getErrorMessage } from '../lib/httpClient';
import { formatRelativeTime } from '../lib/time';
import {
  checkEnrollment,
  createForum,
  deleteResource,
  downloadResource,
  fetchCourse,
  fetchForumsForCourse,
  fetchResourcesForCourse,
  type CourseDetail,
  type Forum,
  type Resource,
} from '../lib/coursesApi';

type Tab = 'forums' | 'resources';

function NewForumForm({
  onCreate,
  onCancel,
}: {
  onCreate: (payload: { title: string; description?: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title is required');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onCreate({ title: trimmedTitle, description: description.trim() || undefined });
      setTitle('');
      setDescription('');
      onCancel();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create the forum. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-blue-950">New forum</h3>
      <div className="mt-3 space-y-3">
        <div>
          <label htmlFor="forum-title" className="block text-xs font-medium text-gray-700">
            Title
          </label>
          <input
            id="forum-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900"
          />
        </div>
        <div>
          <label htmlFor="forum-description" className="block text-xs font-medium text-gray-700">
            Description (optional)
          </label>
          <textarea
            id="forum-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900"
          />
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Spinner className="h-3.5 w-3.5" />}
          Create forum
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function ForumListSkeleton() {
  return (
    <ul className="mt-4 space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <li key={index} className="animate-pulse rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="h-4 w-1/3 rounded bg-gray-200" />
          <div className="mt-2 h-3 w-2/3 rounded bg-gray-200" />
        </li>
      ))}
    </ul>
  );
}

function ForumRow({ forum }: { forum: Forum }) {
  return (
    <li className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-blue-950">{forum.title}</h3>
          {forum.description && <p className="mt-1 line-clamp-2 text-xs text-gray-600">{forum.description}</p>}
        </div>
        <div className="flex-none text-right text-xs text-gray-500">
          <p>{forum._count.posts} {forum._count.posts === 1 ? 'post' : 'posts'}</p>
          <p className="mt-1">{forum.latestActivity ? formatRelativeTime(forum.latestActivity) : 'No activity yet'}</p>
        </div>
      </div>
    </li>
  );
}

function ResourceListSkeleton() {
  return (
    <ul className="mt-4 space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <li key={index} className="flex animate-pulse items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="h-9 w-9 flex-none rounded-md bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 rounded bg-gray-200" />
            <div className="h-3 w-1/3 rounded bg-gray-200" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useSetBreadcrumbs(
    course ? [{ label: 'Courses', to: '/courses' }, { label: course.code }] : null,
  );

  const [activeTab, setActiveTab] = useState<Tab>('forums');

  const [forums, setForums] = useState<Forum[] | null>(null);
  const [forumsError, setForumsError] = useState<string | null>(null);
  const [showForumForm, setShowForumForm] = useState(false);

  const [resources, setResources] = useState<Resource[] | null>(null);
  const [resourcesError, setResourcesError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoadError(null);

    Promise.all([fetchCourse(id), checkEnrollment(id)])
      .then(([courseData, enrolled]) => {
        if (cancelled) return;
        setCourse(courseData);
        setIsEnrolled(enrolled);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load this course.'));
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id || activeTab !== 'forums' || forums !== null) return;
    let cancelled = false;
    setForumsError(null);

    fetchForumsForCourse(id)
      .then((data) => {
        if (!cancelled) setForums(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setForumsError(getErrorMessage(err, 'Could not load forums for this course.'));
      });

    return () => {
      cancelled = true;
    };
  }, [id, activeTab, forums]);

  useEffect(() => {
    if (!id || activeTab !== 'resources' || resources !== null) return;
    let cancelled = false;
    setResourcesError(null);

    fetchResourcesForCourse(id)
      .then((data) => {
        if (!cancelled) setResources(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setResourcesError(getErrorMessage(err, 'Could not load resources for this course.'));
      });

    return () => {
      cancelled = true;
    };
  }, [id, activeTab, resources]);

  if (!id) {
    return null;
  }

  const isLecturerOfCourse = Boolean(user && course && user.role === 'LECTURER' && user.id === course.lecturerId);
  const canUploadResources = isEnrolled || isLecturerOfCourse;

  async function handleCreateForum(payload: { title: string; description?: string }) {
    const created = await createForum(id!, payload);
    setForums((prev) => [created, ...(prev ?? [])]);
  }

  function handleResourceUploaded(resource: Resource) {
    setResources((prev) => [resource, ...(prev ?? [])]);
  }

  async function handleDownload(resource: Resource) {
    if (downloadingId) return;
    setDownloadError(null);
    setDownloadingId(resource.id);
    try {
      await downloadResource(resource.id, resource.title);
    } catch (err) {
      setDownloadError(getErrorMessage(err, 'Could not download this resource.'));
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDeleteResource(resource: Resource) {
    if (deletingId) return;
    setDeleteError(null);
    setDeletingId(resource.id);
    try {
      await deleteResource(resource.id);
      setResources((prev) => prev?.filter((item) => item.id !== resource.id) ?? null);
    } catch (err) {
      setDeleteError(getErrorMessage(err, 'Could not delete this resource.'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/courses" className="text-sm font-medium text-blue-900 hover:text-blue-950">
        &larr; Back to courses
      </Link>

      {loadError && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {loadError}
        </p>
      )}

      {!course && !loadError && (
        <div className="mt-6 animate-pulse space-y-3">
          <div className="h-3 w-20 rounded bg-gray-200" />
          <div className="h-7 w-2/3 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-200" />
        </div>
      )}

      {course && (
        <>
          <header className="mt-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{course.code}</p>
              {isEnrolled && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                  Enrolled
                </span>
              )}
            </div>
            <h1 className="mt-1 text-2xl font-bold text-blue-950">{course.title}</h1>
            {course.description && <p className="mt-2 text-sm text-gray-600">{course.description}</p>}
            <p className="mt-2 text-sm text-gray-500">
              Lecturer: <span className="font-medium text-gray-700">{course.lecturer.name}</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">{course._count.enrollments} students enrolled</p>
          </header>

          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex gap-6">
              {(['forums', 'resources'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`border-b-2 px-1 pb-3 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-blue-900 text-blue-950'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'forums' && (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-blue-950">Discussion forums</h2>
                {isLecturerOfCourse && !showForumForm && (
                  <button
                    type="button"
                    onClick={() => setShowForumForm(true)}
                    className="inline-flex items-center gap-1 rounded-md bg-blue-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-950"
                  >
                    + New Forum
                  </button>
                )}
              </div>

              {showForumForm && (
                <div className="mt-4">
                  <NewForumForm onCreate={handleCreateForum} onCancel={() => setShowForumForm(false)} />
                </div>
              )}

              {forumsError && (
                <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {forumsError}
                </p>
              )}

              {forums === null && !forumsError ? (
                <ForumListSkeleton />
              ) : forums && forums.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No forums have been created for this course yet.</p>
              ) : forums ? (
                <ul className="mt-4 space-y-3">
                  {forums.map((forum) => (
                    <ForumRow key={forum.id} forum={forum} />
                  ))}
                </ul>
              ) : null}
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-blue-950">Resources</h2>
                {canUploadResources && (
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="inline-flex items-center gap-1 rounded-md bg-blue-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-950"
                  >
                    + Upload Resource
                  </button>
                )}
              </div>

              {downloadError && (
                <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {downloadError}
                </p>
              )}

              {deleteError && (
                <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {deleteError}
                </p>
              )}

              {resourcesError && (
                <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {resourcesError}
                </p>
              )}

              {resources === null && !resourcesError ? (
                <ResourceListSkeleton />
              ) : resources && resources.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No resources have been shared for this course yet.</p>
              ) : resources ? (
                <ul className="mt-4 space-y-3">
                  {resources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      canDelete={Boolean(user && (resource.uploaderId === user.id || isLecturerOfCourse))}
                      isDownloading={downloadingId === resource.id}
                      isDeleting={deletingId === resource.id}
                      onDownload={handleDownload}
                      onDelete={handleDeleteResource}
                    />
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </>
      )}

      <ResourceUploadModal
        courseId={id}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploaded={handleResourceUploaded}
      />
    </section>
  );
}
