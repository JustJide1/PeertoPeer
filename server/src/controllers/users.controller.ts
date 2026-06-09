import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { HttpError } from '../middleware/errorHandler';
import { comparePassword, hashPassword } from '../utils/password';

const userListSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  level: true,
  createdAt: true,
} as const;

const courseSummarySelect = { id: true, title: true, code: true } as const;

type IconHint = 'pdf' | 'word' | 'powerpoint' | 'image' | 'zip' | 'file';

function fileIconHint(fileType: string): IconHint {
  if (fileType === 'application/pdf') return 'pdf';
  if (fileType.includes('wordprocessingml') || fileType === 'application/msword') return 'word';
  if (fileType.includes('presentationml') || fileType === 'application/vnd.ms-powerpoint') return 'powerpoint';
  if (fileType.startsWith('image/')) return 'image';
  if (fileType.includes('zip')) return 'zip';
  return 'file';
}

export async function listUsers(_req: Request, res: Response): Promise<void> {
  const users = await prisma.user.findMany({ select: userListSelect, orderBy: { createdAt: 'asc' } });
  res.json({ data: users });
}

export async function getUser(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      ...userListSelect,
      enrollments: { include: { course: true } },
    },
  });

  if (!user) {
    throw new HttpError(404, `User ${req.params.id} not found`);
  }

  res.json({ data: user });
}

export async function getUserProfile(req: Request, res: Response): Promise<void> {
  const userId = req.params.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      level: true,
      role: true,
      enrollments: { select: { course: { select: courseSummarySelect } } },
      _count: { select: { posts: true, comments: true, resources: true } },
    },
  });

  if (!user) {
    throw new HttpError(404, `User ${userId} not found`);
  }

  res.json({
    data: {
      id: user.id,
      name: user.name,
      level: user.level,
      role: user.role,
      enrolledCourses: user.enrollments.map((enrollment) => enrollment.course),
      postCount: user._count.posts,
      commentCount: user._count.comments,
      resourceCount: user._count.resources,
    },
  });
}

export async function updateCurrentUser(req: Request, res: Response): Promise<void> {
  const { name } = req.body as { name: string };

  const user = await prisma.user.update({
    where: { id: req.user!.sub },
    data: { name },
    select: userListSelect,
  });

  res.json({ data: user });
}

export async function changeCurrentUserPassword(req: Request, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const matches = await comparePassword(currentPassword, user.passwordHash);
  if (!matches) {
    throw new HttpError(401, 'Current password is incorrect');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword), refreshTokenHash: null },
  });

  res.status(204).send();
}

export async function getCurrentUserActivity(req: Request, res: Response): Promise<void> {
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  const fetchCount = limit + offset;

  const [posts, comments] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: req.user!.sub },
      take: fetchCount,
      orderBy: { createdAt: 'desc' },
      include: { forum: { select: { id: true, title: true, courseId: true } } },
    }),
    prisma.comment.findMany({
      where: { authorId: req.user!.sub },
      take: fetchCount,
      orderBy: { createdAt: 'desc' },
      include: { post: { select: { id: true, forumId: true } } },
    }),
  ]);

  const activity = [
    ...posts.map((post) => ({
      type: 'post' as const,
      id: post.id,
      content: post.content,
      createdAt: post.createdAt,
      forum: post.forum,
    })),
    ...comments.map((comment) => ({
      type: 'comment' as const,
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      post: comment.post,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(offset, offset + limit);

  res.json({ data: activity, meta: { limit, offset } });
}

export async function getCurrentUserResources(req: Request, res: Response): Promise<void> {
  const resources = await prisma.resource.findMany({
    where: { uploaderId: req.user!.sub },
    include: { course: { select: courseSummarySelect } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ data: resources.map((resource) => ({ ...resource, iconHint: fileIconHint(resource.fileType) })) });
}

export async function getCurrentUserEnrollments(req: Request, res: Response): Promise<void> {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: req.user!.sub },
    include: {
      course: {
        include: {
          lecturer: { select: { id: true, name: true } },
          _count: { select: { forums: true, enrollments: true } },
        },
      },
    },
  });

  const data = await Promise.all(
    enrollments.map(async ({ course }) => {
      const [totalPosts, myPosts] = await Promise.all([
        prisma.post.count({ where: { forum: { courseId: course.id } } }),
        prisma.post.count({ where: { forum: { courseId: course.id }, authorId: req.user!.sub } }),
      ]);

      return {
        course: {
          id: course.id,
          title: course.title,
          code: course.code,
          lecturer: course.lecturer,
          forumCount: course._count.forums,
          enrolledCount: course._count.enrollments,
        },
        forumActivity: { totalPosts, myPosts },
      };
    }),
  );

  res.json({ data });
}
