import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ResourceCard from '../components/ResourceCard';
import { useAuth } from '../context/AuthContext';
import { useSetBreadcrumbs } from '../context/BreadcrumbContext';
import { downloadResource } from '../lib/coursesApi';
import { getErrorMessage } from '../lib/httpClient';
import { fetchMyResources, type MyResource } from '../lib/usersApi';

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

export default function ResourcesPage() {
  const { user } = useAuth();

  useSetBreadcrumbs([{ label: 'Resources' }]);

  const [resources, setResources] = useState<MyResource[] | null>(null);
  const [resourcesError, setResourcesError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResourcesError(null);

    fetchMyResources()
      .then((data) => {
        if (!cancelled) setResources(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setResourcesError(getErrorMessage(err, 'Could not load your resources.'));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDownload(resource: MyResource) {
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

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-blue-950">My Resources</h1>

      {downloadError && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {downloadError}
        </p>
      )}
      {resourcesError && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {resourcesError}
        </p>
      )}

      {resources === null && !resourcesError ? (
        <ListSkeleton />
      ) : resources && resources.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">You haven&apos;t uploaded any resources yet.</p>
      ) : resources ? (
        <div className="mt-4 space-y-4">
          {resources.map((resource) => (
            <div key={resource.id}>
              <Link
                to={`/courses/${resource.courseId}`}
                className="text-xs font-medium text-blue-900 hover:underline"
              >
                {resource.course.title} ({resource.course.code})
              </Link>
              <ul className="mt-1.5">
                <ResourceCard
                  resource={{ ...resource, uploader: { id: resource.uploaderId, name: user?.name ?? '' } }}
                  canDelete={false}
                  isDownloading={downloadingId === resource.id}
                  isDeleting={false}
                  onDownload={() => void handleDownload(resource)}
                  onDelete={() => {}}
                />
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
