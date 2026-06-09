import { useState } from 'react';
import Spinner from './Spinner';
import { type Resource, type ResourceIconHint } from '../lib/coursesApi';
import { formatDate } from '../lib/time';

const ICON_STYLES: Record<ResourceIconHint, { label: string; classes: string }> = {
  pdf: { label: 'PDF', classes: 'bg-red-100 text-red-700' },
  word: { label: 'DOCX', classes: 'bg-blue-100 text-blue-700' },
  powerpoint: { label: 'PPTX', classes: 'bg-orange-100 text-orange-700' },
  image: { label: 'IMG', classes: 'bg-green-100 text-green-700' },
  zip: { label: 'ZIP', classes: 'bg-gray-100 text-gray-700' },
  file: { label: 'FILE', classes: 'bg-gray-100 text-gray-700' },
};

interface ResourceCardProps {
  resource: Resource;
  canDelete: boolean;
  isDownloading: boolean;
  isDeleting: boolean;
  onDownload: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
}

export default function ResourceCard({
  resource,
  canDelete,
  isDownloading,
  isDeleting,
  onDownload,
  onDelete,
}: ResourceCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const icon = ICON_STYLES[resource.iconHint];

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <span
        className={`flex h-10 w-10 flex-none items-center justify-center rounded-md text-[10px] font-bold ${icon.classes}`}
        aria-hidden="true"
      >
        {icon.label}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{resource.title}</p>
        <p className="mt-0.5 text-xs text-gray-500">
          {resource.uploader.name} · {formatDate(resource.createdAt)}
        </p>
      </div>

      <div className="flex flex-none items-center gap-2">
        <button
          type="button"
          onClick={() => onDownload(resource)}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDownloading && <Spinner className="h-3.5 w-3.5" />}
          Download
        </button>

        {canDelete &&
          (!confirmingDelete ? (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
            >
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-600">Delete this resource?</span>
              <button
                type="button"
                onClick={() => onDelete(resource)}
                disabled={isDeleting}
                className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting && <Spinner className="h-3 w-3" />}
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={isDeleting}
                className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          ))}
      </div>
    </li>
  );
}
