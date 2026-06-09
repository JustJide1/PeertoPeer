import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useSetBreadcrumbs } from '../context/BreadcrumbContext';
import {
  createComment,
  deletePost,
  fetchPost,
  updatePost,
  type CommentItem,
  type PostDetail,
} from '../lib/forumApi';
import { getErrorMessage } from '../lib/httpClient';
import { formatDateTime, formatRelativeTime } from '../lib/time';

const MARKDOWN_CONTAINER_CLASSES = [
  'text-sm leading-relaxed text-gray-800',
  '[&>*+*]:mt-3',
  '[&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-blue-950',
  '[&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-blue-950',
  '[&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-blue-950',
  '[&_a]:font-medium [&_a]:text-blue-900 [&_a]:underline [&_a:hover]:text-blue-950',
  '[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5',
  '[&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5',
  '[&_blockquote]:border-l-4 [&_blockquote]:border-blue-900/30 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600',
  '[&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]',
  '[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-gray-900 [&_pre]:p-3 [&_pre]:text-gray-100',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit',
  '[&_hr]:my-4 [&_hr]:border-gray-200',
  '[&_img]:max-w-full [&_img]:rounded-md',
].join(' ');

function CommentRow({ comment }: { comment: CommentItem }) {
  const isOptimistic = comment.id.startsWith('optimistic-');

  return (
    <li className={`flex gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${isOptimistic ? 'opacity-60' : ''}`}>
      <Avatar name={comment.author.name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500">
          <span className="font-medium text-gray-800">{comment.author.name}</span>
          {' · '}
          {isOptimistic ? 'Sending…' : formatRelativeTime(comment.createdAt)}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{comment.content}</p>
      </div>
    </li>
  );
}

function CommentListSkeleton() {
  return (
    <ul className="mt-4 space-y-3">
      {Array.from({ length: 2 }).map((_, index) => (
        <li key={index} className="flex animate-pulse gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="h-8 w-8 flex-none rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-gray-200" />
            <div className="h-3 w-2/3 rounded bg-gray-200" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useSetBreadcrumbs(
    post
      ? [
          { label: 'Courses', to: '/courses' },
          { label: post.forum.title, to: `/forums/${post.forum.id}` },
          { label: post.content.length > 40 ? `${post.content.slice(0, 40)}…` : post.content },
        ]
      : null,
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const optimisticCounter = useRef(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoadError(null);

    fetchPost(id)
      .then((data) => {
        if (cancelled) return;
        setPost(data);
        setComments(data.comments);
        setEditContent(data.content);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load this post.'));
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return null;
  }

  const isOwnPost = Boolean(user && post && user.id === post.authorId);

  function startEditing() {
    if (!post) return;
    setEditContent(post.content);
    setEditError(null);
    setIsEditing(true);
  }

  async function handleSaveEdit() {
    const trimmed = editContent.trim();
    if (!trimmed) {
      setEditError('Content cannot be empty');
      return;
    }

    setIsSaving(true);
    setEditError(null);
    try {
      const updated = await updatePost(id!, trimmed);
      setPost((prev) => (prev ? { ...prev, content: updated.content, updatedAt: updated.updatedAt } : prev));
      setIsEditing(false);
    } catch (err) {
      setEditError(getErrorMessage(err, 'Could not save your changes. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deletePost(id!);
      if (post) {
        navigate(`/forums/${post.forumId}`, { replace: true });
      }
    } catch (err) {
      setDeleteError(getErrorMessage(err, 'Could not delete this post. Please try again.'));
      setIsDeleting(false);
      setConfirmingDelete(false);
    }
  }

  async function submitComment() {
    const trimmed = commentDraft.trim();
    if (!trimmed || !user || isSubmittingComment) return;

    optimisticCounter.current += 1;
    const optimisticId = `optimistic-${optimisticCounter.current}`;
    const optimisticComment: CommentItem = {
      id: optimisticId,
      postId: id!,
      authorId: user.id,
      author: { id: user.id, name: user.name, role: user.role },
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [...(prev ?? []), optimisticComment]);
    setCommentDraft('');
    setCommentError(null);
    setIsSubmittingComment(true);

    try {
      const created = await createComment(id!, trimmed);
      setComments((prev) => prev?.map((comment) => (comment.id === optimisticId ? created : comment)) ?? [created]);
    } catch (err) {
      setComments((prev) => prev?.filter((comment) => comment.id !== optimisticId) ?? null);
      setCommentDraft(trimmed);
      setCommentError(getErrorMessage(err, 'Could not post your comment. Please try again.'));
    } finally {
      setIsSubmittingComment(false);
    }
  }

  function handleCommentKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void submitComment();
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 pb-40">
      {post && (
        <Link to={`/forums/${post.forumId}`} className="text-sm font-medium text-blue-900 hover:text-blue-950">
          &larr; Back to {post.forum.title}
        </Link>
      )}

      {loadError && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {loadError}
        </p>
      )}

      {!post && !loadError && (
        <div className="mt-6 animate-pulse space-y-3">
          <div className="h-4 w-1/3 rounded bg-gray-200" />
          <div className="h-7 w-2/3 rounded bg-gray-200" />
          <div className="h-24 rounded bg-gray-200" />
        </div>
      )}

      {post && (
        <>
          <article className="mt-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <Avatar name={post.author.name} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-blue-950">{post.author.name}</p>
                <p className="text-xs text-gray-500">
                  {formatDateTime(post.createdAt)}
                  {post.updatedAt !== post.createdAt && ' · edited'}
                </p>
              </div>

              {isOwnPost && !isEditing && (
                <div className="flex flex-none gap-2">
                  <button
                    type="button"
                    onClick={startEditing}
                    className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  {!confirmingDelete ? (
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(true)}
                      className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
                    >
                      Delete
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-600">Delete this post?</span>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDeleting && <Spinner className="h-3 w-3" />}
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(false)}
                        className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {deleteError && <p className="mt-3 text-xs text-red-600">{deleteError}</p>}

            {isEditing ? (
              <div className="mt-4">
                <textarea
                  value={editContent}
                  onChange={(event) => setEditContent(event.target.value)}
                  rows={8}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
                {editError && <p className="mt-2 text-xs text-red-600">{editError}</p>}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving && <Spinner className="h-3.5 w-3.5" />}
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditError(null);
                    }}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className={`mt-4 ${MARKDOWN_CONTAINER_CLASSES}`}>
                <ReactMarkdown>{post.content}</ReactMarkdown>
              </div>
            )}
          </article>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-blue-950">
              Comments {comments !== null && `(${comments.length})`}
            </h2>

            {commentError && (
              <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {commentError}
              </p>
            )}

            {comments === null ? (
              <CommentListSkeleton />
            ) : comments.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">No comments yet. Start the conversation below.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {comments.map((comment) => (
                  <CommentRow key={comment.id} comment={comment} />
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {post && user && (
        <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="mx-auto flex max-w-3xl items-end gap-3">
            <Avatar name={user.name} size="sm" />
            <div className="min-w-0 flex-1">
              <textarea
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                onKeyDown={handleCommentKeyDown}
                rows={2}
                placeholder="Write a comment... (Ctrl+Enter to send)"
                className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            </div>
            <button
              type="button"
              onClick={() => void submitComment()}
              disabled={isSubmittingComment || !commentDraft.trim()}
              className="inline-flex flex-none items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingComment && <Spinner className="h-3.5 w-3.5" />}
              Send
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
