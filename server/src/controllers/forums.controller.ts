import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { HttpError } from '../middleware/errorHandler';

export async function listForumsForCourse(req: Request, res: Response): Promise<void> {
  const courseId = req.params.courseId;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new HttpError(404, `Course ${courseId} not found`);
  }

  const forums = await prisma.forum.findMany({
    where: { courseId },
    include: {
      _count: { select: { posts: true } },
      posts: { take: 1, orderBy: { createdAt: 'desc' }, select: { createdAt: true } },
    },
  });

  res.json({
    data: forums.map(({ posts, ...forum }) => ({
      ...forum,
      latestActivity: posts[0]?.createdAt ?? null,
    })),
  });
}

export async function getForum(req: Request, res: Response): Promise<void> {
  const forum = await prisma.forum.findUnique({
    where: { id: req.params.id },
    include: {
      course: { select: { id: true, code: true, title: true } },
      posts: {
        include: { author: { select: { id: true, name: true } }, _count: { select: { comments: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!forum) {
    throw new HttpError(404, `Forum ${req.params.id} not found`);
  }

  res.json({ data: forum });
}

export async function createForum(req: Request, res: Response): Promise<void> {
  const courseId = req.params.courseId;
  const { title, description } = req.body as { title: string; description?: string };

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new HttpError(404, `Course ${courseId} not found`);
  }

  if (course.lecturerId !== req.user!.sub) {
    throw new HttpError(403, 'Only the course lecturer can create forums for this course');
  }

  const forum = await prisma.forum.create({ data: { courseId, title, description } });
  res.status(201).json({ data: forum });
}
