import { httpClient, type ApiEnvelope } from './httpClient';
import type { ResourceIconHint } from './coursesApi';

export type ProfileRole = 'STUDENT' | 'LECTURER';
export type ProfileLevel = 'L100' | 'L200' | 'L300' | 'L400';

export interface ProfileCourseSummary {
  id: string;
  title: string;
  code: string;
}

export interface UserProfile {
  id: string;
  name: string;
  level: ProfileLevel | null;
  role: ProfileRole;
  enrolledCourses: ProfileCourseSummary[];
  postCount: number;
  commentCount: number;
  resourceCount: number;
}

export interface MyResource {
  id: string;
  courseId: string;
  uploaderId: string;
  title: string;
  fileUrl: string;
  fileType: string;
  iconHint: ResourceIconHint;
  createdAt: string;
  course: ProfileCourseSummary;
}

interface MyPostActivity {
  type: 'post';
  id: string;
  content: string;
  createdAt: string;
  forum: { id: string; title: string; courseId: string };
}

interface MyCommentActivity {
  type: 'comment';
  id: string;
  content: string;
  createdAt: string;
  post: { id: string; forumId: string };
}

export type MyActivityItem = MyPostActivity | MyCommentActivity;

export interface MyEnrollment {
  course: {
    id: string;
    title: string;
    code: string;
    lecturer: { id: string; name: string };
  };
}

export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const { data } = await httpClient.get<ApiEnvelope<UserProfile>>(`/users/${userId}/profile`);
  return data.data;
}

export async function updateCurrentUserName(name: string): Promise<void> {
  await httpClient.put('/users/me', { name: name.trim() });
}

export async function changeCurrentUserPassword(currentPassword: string, newPassword: string): Promise<void> {
  await httpClient.put('/users/me/password', { currentPassword, newPassword });
}

export async function fetchMyResources(): Promise<MyResource[]> {
  const { data } = await httpClient.get<ApiEnvelope<MyResource[]>>('/users/me/resources');
  return data.data;
}

export async function fetchMyPosts(): Promise<MyPostActivity[]> {
  const { data } = await httpClient.get<ApiEnvelope<MyActivityItem[]>>('/users/me/activity', {
    params: { limit: 50, offset: 0 },
  });
  return data.data.filter((item): item is MyPostActivity => item.type === 'post');
}

export async function fetchMyEnrollments(): Promise<MyEnrollment[]> {
  const { data } = await httpClient.get<ApiEnvelope<MyEnrollment[]>>('/users/me/enrollments');
  return data.data;
}
