import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useSetBreadcrumbs } from '../context/BreadcrumbContext';
import { checkEnrollment } from '../lib/coursesApi';
import {
  createPost,
  fetchForum,
  fetchPostsForForum,
  type ForumDetail,
  type PostSummary,
} from '../lib/forumApi';
import { getErrorMessage } from '../lib/httpClient';
import { formatRelativeTime } from '../lib/time';

const PAGE_SIZE = 10;

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

function summarizePost(content: string): { title: string; preview: string } {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const [firstLine, ...rest] = lines;

  const title = firstLine ? truncate(stripMarkdown(firstLine), 100) : 'Untitled post';
  const preview = truncate(stripMarkdown(rest.join(' ')), 180);

  return { title, preview };
}

function PostListSkeleton() {
  return (
    <ul className="mt-4 space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <li key={index} className="flex animate-pulse gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="h-10 w-10 flex-none rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 rounded bg-gray-200" />
            <div className="h-3 w-3/4 rounded bg-gray-200" />
            <div className="h-3 w-1/3 rounded bg-gray-200" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function PostRow({ post }: { post: PostSummary }) {
  const { title, preview } = summarizePost(post.content);

  return (
    <li>
      <Link
        to={`/posts/${post.id}`}
        className="flex gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      >
        <Avatar name={post.author.name} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-blue-950">{title}</h3>
          {preview && <p className="mt-1 line-clamp-2 text-xs text-gray-600">{preview}</p>}
          <p className="mt-2 text-xs text-gray-500">
            {post.author.name} · {formatRelativeTime(post.createdAt)} · {post._count.comments}{' '}
            {post._count.comments === 1 ? 'comment' : 'comments'}
          </p>
        </div>
      </Link>
    </li>
  );
}

function NewPostForm({
  onCreate,
  onCancel,
}: {
  onCreate: (content: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      setError('Write something before posting');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onCreate(trimmed);
      setContent('');
      onCancel();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create the post. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-blue-950">New post</h3>
      <div className="mt-3">
        <label htmlFor="post-content" className="block text-xs font-medium text-gray-700">
          Content (Markdown supported — start with a line that will become the post title)
        </label>
        <textarea
          id="post-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={5}
          placeholder={'How do I approach assignment 2?\n\nI keep getting stuck on the recursive case...'}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900"
        />
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Spinner className="h-3.5 w-3.5" />}
          Post
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

export default function ForumPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [forum, setForum] = useState<ForumDetail | null>(null);
  const [canPost, setCanPost] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useSetBreadcrumbs(
    forum
      ? [
          { label: 'Courses', to: '/courses' },
          { label: forum.course.code, to: `/courses/${forum.course.id}` },
          { label: forum.title },
        ]
      : null,
  );

  const [posts, setPosts] = useState<PostSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoadError(null);

    fetchForum(id)
      .then(async (forumData) => {
        if (cancelled) return;
        setForum(forumData);

        if (user?.role === 'LECTURER') {
          setCanPost(true);
          return;
        }

        try {
          const enrolled = await checkEnrollment(forumData.course.id);
          if (!cancelled) setCanPost(enrolled);
        } catch {
          if (!cancelled) setCanPost(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load this forum.'));
      });

    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const loadPosts = useCallback(
    (targetPage: number) => {
      if (!id) return;
      let cancelled = false;
      setPostsError(null);

      fetchPostsForForum(id, { limit: PAGE_SIZE, offset: (targetPage - 1) * PAGE_SIZE })
        .then(({ posts: postList, total: totalCount }) => {
          if (cancelled) return;
          setPosts(postList);
          setTotal(totalCount);
        })
        .catch((err: unknown) => {
          if (!cancelled) setPostsError(getErrorMessage(err, 'Could not load posts for this forum.'));
        });

      return () => {
        cancelled = true;
      };
    },
    [id],
  );

  useEffect(() => {
    setPosts(null);
    const cleanup = loadPosts(page);
    return cleanup;
  }, [loadPosts, page]);

  if (!id) {
    return null;
  }

  async function handleCreatePost(content: string) {
    const created = await createPost(id!, content);
    if (page === 1) {
      setPosts((prev) => [created, ...(prev ?? [])].slice(0, PAGE_SIZE));
    } else {
      setPage(1);
    }
    setTotal((prev) => prev + 1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      {forum && (
        <Link to={`/courses/${forum.course.id}`} className="text-sm font-medium text-blue-900 hover:text-blue-950">
          &larr; Back to {forum.course.code}
        </Link>
      )}

      {loadError && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {loadError}
        </p>
      )}

      {!forum && !loadError && (
        <div className="mt-6 animate-pulse space-y-3">
          <div className="h-3 w-20 rounded bg-gray-200" />
          <div className="h-7 w-2/3 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-200" />
        </div>
      )}

      {forum && (
        <>
          <header className="mt-4">
            <h1 className="text-2xl font-bold text-blue-950">{forum.title}</h1>
            {forum.description && <p className="mt-2 text-sm text-gray-600">{forum.description}</p>}
          </header>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-blue-950">Posts</h2>
            {canPost && !showNewPostForm && (
              <button
                type="button"
                onClick={() => setShowNewPostForm(true)}
                className="inline-flex items-center gap-1 rounded-md bg-blue-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-950"
              >
                + New Post
              </button>
            )}
          </div>

          {showNewPostForm && (
            <div className="mt-4">
              <NewPostForm onCreate={handleCreatePost} onCancel={() => setShowNewPostForm(false)} />
            </div>
          )}

          {postsError && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {postsError}
            </p>
          )}

          {posts === null && !postsError ? (
            <PostListSkeleton />
          ) : posts && posts.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No posts yet. Be the first to start a discussion!</p>
          ) : posts ? (
            <>
              <ul className="mt-4 space-y-3">
                {posts.map((post) => (
                  <PostRow key={post.id} post={post} />
                ))}
              </ul>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page <= 1}
                    className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={page >= totalPages}
                    className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : null}
        </>
      )}
    </section>
  );
}
