import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import Spinner from './Spinner';
import { getErrorMessage } from '../lib/httpClient';
import { uploadResource, type Resource } from '../lib/coursesApi';

const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.zip,image/*';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ResourceUploadModalProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploaded: (resource: Resource) => void;
}

export default function ResourceUploadModal({ courseId, isOpen, onClose, onUploaded }: ResourceUploadModalProps) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) {
    return null;
  }

  function resetAndClose() {
    setTitle('');
    setFile(null);
    setProgress(null);
    setError(null);
    onClose();
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError('Please choose a file to upload');
      return;
    }

    setSubmitting(true);
    setError(null);
    setProgress(0);

    try {
      const created = await uploadResource(courseId, file, title, setProgress);
      onUploaded(created);
      resetAndClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not upload the resource. Please try again.'));
      setProgress(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={() => {
        if (!submitting) resetAndClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-resource-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="upload-resource-title" className="text-lg font-semibold text-blue-950">
            Upload resource
          </h2>
          <button
            type="button"
            onClick={resetAndClose}
            disabled={submitting}
            aria-label="Close"
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="resource-modal-title" className="block text-xs font-medium text-gray-700">
              Title (optional)
            </label>
            <input
              id="resource-modal-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Defaults to the file name"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900"
            />
          </div>

          <div>
            <span className="block text-xs font-medium text-gray-700">File</span>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-1 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
                isDragging ? 'border-blue-900 bg-blue-900/5' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <p className="text-sm text-gray-600">
                Drag and drop a file here, or <span className="font-medium text-blue-900 underline">browse</span>
              </p>
              <p className="text-xs text-gray-400">PDF, Word, PowerPoint, images, or ZIP — up to 20MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                onChange={handleFileInputChange}
                className="sr-only"
              />
            </div>

            {file && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                {!submitting && (
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="flex-none text-xs font-medium text-gray-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>

          {progress !== null && (
            <div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-900 transition-[width] duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">{progress}% uploaded</p>
            </div>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Spinner className="h-3.5 w-3.5" />}
              Upload
            </button>
            <button
              type="button"
              onClick={resetAndClose}
              disabled={submitting}
              className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
