import { httpClient, type ApiEnvelope } from './httpClient';

export type AuthorRole = 'STUDENT' | 'LECTURER';

export interface Author {
  id: string;
  name: string;
  role: AuthorRole;
}

export interface ForumDetail {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  course: { id: string; code: string; title: string };
}

export interface PostSummary {
  id: string;
  forumId: string;
  authorId: string;
  author: { id: string; name: string };
  content: string;
  createdAt: string;
  updatedAt: string;
  _count: { comments: number };
}

export interface CommentItem {
  id: string;
  postId: string;
  authorId: string;
  author: Author;
  content: string;
  createdAt: string;
}

export interface PostDetail {
  id: string;
  forumId: string;
  authorId: string;
  author: Author;
  content: string;
  createdAt: string;
  updatedAt: string;
  forum: { id: string; title: string; courseId: string };
  comments: CommentItem[];
}

interface ListMeta {
  total: number;
  limit: number;
  offset: number;
}

interface ListEnvelope<T> {
  data: T;
  meta: ListMeta;
}

export async function fetchForum(forumId: string): Promise<ForumDetail> {
  const { data } = await httpClient.get<ApiEnvelope<ForumDetail>>(`/forums/${forumId}`);
  return data.data;
}

export async function fetchPostsForForum(
  forumId: string,
  params: { limit: number; offset: number },
): Promise<{ posts: PostSummary[]; total: number }> {
  const { data } = await httpClient.get<ListEnvelope<PostSummary[]>>(`/forums/${forumId}/posts`, { params });
  return { posts: data.data, total: data.meta.total };
}

export async function fetchPost(postId: string): Promise<PostDetail> {
  const { data } = await httpClient.get<ApiEnvelope<PostDetail>>(`/posts/${postId}`);
  return data.data;
}

export async function createPost(forumId: string, content: string): Promise<PostSummary> {
  const { data } = await httpClient.post<ApiEnvelope<PostSummary>>(`/forums/${forumId}/posts`, { content });
  return data.data;
}

export async function updatePost(postId: string, content: string): Promise<{ content: string; updatedAt: string }> {
  const { data } = await httpClient.put<ApiEnvelope<{ content: string; updatedAt: string }>>(`/posts/${postId}`, {
    content,
  });
  return data.data;
}

export async function deletePost(postId: string): Promise<void> {
  await httpClient.delete(`/posts/${postId}`);
}

export async function createComment(postId: string, content: string): Promise<CommentItem> {
  const { data } = await httpClient.post<ApiEnvelope<CommentItem>>(`/posts/${postId}/comments`, { content });
  return data.data;
}
