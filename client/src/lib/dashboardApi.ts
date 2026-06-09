import { httpClient } from './httpClient';

export interface CourseSummary {
  id: string;
  title: string;
  code: string;
}

export interface EnrollmentWithStats {
  course: CourseSummary & {
    lecturer: { id: string; name: string };
    forumCount: number;
    enrolledCount: number;
  };
  forumActivity: { totalPosts: number; myPosts: number };
}

export type ActivityType = 'post' | 'comment';

export interface ActivityItem {
  type: ActivityType;
  id: string;
  content: string;
  createdAt: string;
  forum?: { id: string; title: string; courseId: string } | null;
  post?: { id: string; forumId: string } | null;
}

interface DataEnvelope<T> {
  data: T;
}

export async function fetchMyEnrollments(): Promise<EnrollmentWithStats[]> {
  const { data } = await httpClient.get<DataEnvelope<EnrollmentWithStats[]>>('/users/me/enrollments');
  return data.data;
}

export async function fetchMyActivity(limit: number): Promise<ActivityItem[]> {
  const { data } = await httpClient.get<DataEnvelope<ActivityItem[]>>('/users/me/activity', {
    params: { limit },
  });
  return data.data;
}

export async function fetchMyResourceCount(): Promise<number> {
  const { data } = await httpClient.get<DataEnvelope<unknown[]>>('/users/me/resources');
  return data.data.length;
}
