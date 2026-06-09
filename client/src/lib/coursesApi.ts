import { httpClient, type ApiEnvelope } from './httpClient';

export interface CourseLecturer {
  id: string;
  name: string;
  email: string;
}

export interface Course {
  id: string;
  title: string;
  code: string;
  description: string | null;
  lecturerId: string;
  lecturer: CourseLecturer;
  _count: { enrollments: number; forums: number; resources: number };
}

export interface CourseDetail {
  id: string;
  title: string;
  code: string;
  description: string | null;
  lecturerId: string;
  lecturer: CourseLecturer;
  _count: { enrollments: number };
}

export interface Forum {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  _count: { posts: number };
  latestActivity: string | null;
}

export type ResourceIconHint = 'pdf' | 'word' | 'powerpoint' | 'image' | 'zip' | 'file';

export interface Resource {
  id: string;
  courseId: string;
  uploaderId: string;
  uploader: { id: string; name: string };
  title: string;
  fileUrl: string;
  fileType: string;
  iconHint: ResourceIconHint;
  createdAt: string;
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

export interface CourseStudent {
  id: string;
  name: string;
  email: string;
  level: string | null;
}

export async function fetchCourses(): Promise<Course[]> {
  const { data } = await httpClient.get<ListEnvelope<Course[]>>('/courses', {
    params: { limit: 100 },
  });
  return data.data;
}

export async function fetchCourse(courseId: string): Promise<CourseDetail> {
  const { data } = await httpClient.get<ApiEnvelope<CourseDetail>>(`/courses/${courseId}`);
  return data.data;
}

export async function checkEnrollment(courseId: string): Promise<boolean> {
  const { data } = await httpClient.get<ApiEnvelope<{ enrolled: boolean }>>(`/courses/${courseId}/enrolled`);
  return data.data.enrolled;
}

export async function enrollInCourse(courseId: string): Promise<void> {
  await httpClient.post(`/courses/${courseId}/enroll`);
}

export async function unenrollFromCourse(courseId: string): Promise<void> {
  await httpClient.delete(`/courses/${courseId}/enroll`);
}

export async function fetchForumsForCourse(courseId: string): Promise<Forum[]> {
  const { data } = await httpClient.get<ApiEnvelope<Forum[]>>(`/courses/${courseId}/forums`);
  return data.data;
}

export async function createForum(
  courseId: string,
  payload: { title: string; description?: string },
): Promise<Forum> {
  const { data } = await httpClient.post<ApiEnvelope<Forum>>(`/courses/${courseId}/forums`, payload);
  return data.data;
}

export async function fetchResourcesForCourse(courseId: string): Promise<Resource[]> {
  const { data } = await httpClient.get<ApiEnvelope<Resource[]>>(`/courses/${courseId}/resources`);
  return data.data;
}

export async function uploadResource(
  courseId: string,
  file: File,
  title?: string,
  onProgress?: (percent: number) => void,
): Promise<Resource> {
  const form = new FormData();
  form.append('file', file);
  if (title?.trim()) form.append('title', title.trim());

  const { data } = await httpClient.post<ApiEnvelope<Resource>>(`/courses/${courseId}/resources`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (!onProgress || !event.total) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });
  return data.data;
}

export async function fetchCourseStudents(courseId: string): Promise<CourseStudent[]> {
  const { data } = await httpClient.get<ApiEnvelope<CourseStudent[]>>(`/courses/${courseId}/enrollments`);
  return data.data;
}

export async function removeStudentFromCourse(courseId: string, userId: string): Promise<void> {
  await httpClient.delete(`/courses/${courseId}/students/${userId}`);
}

export async function deleteResource(resourceId: string): Promise<void> {
  await httpClient.delete(`/resources/${resourceId}`);
}

export async function downloadResource(resourceId: string, fileName: string): Promise<void> {
  const response = await httpClient.get<Blob>(`/resources/${resourceId}/download`, {
    responseType: 'blob',
  });

  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
