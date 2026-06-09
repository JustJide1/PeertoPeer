import { Role } from '@prisma/client';
import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { HttpError } from '../middleware/errorHandler';

const authorSelect = { select: { id: true, name: true, role: true } } as const;

export async function listPostsForForum(req: Request, res: Response): Promise<void> {
  const forumId = req.params.forumId;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const offset = req.query.offset ? Number(req.query.offset) : 0;

  const forum = await prisma.forum.findUnique({ where: { id: forumId } });
  if (!forum) {
    throw new HttpError(404, `Forum ${forumId} not found`);
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { forumId },
      take: limit,
      skip: offset,
      include: { author: { select: { id: true, name: true } }, _count: { select: { comments: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.post.count({ where: { forumId } }),
  ]);

  res.json({ data: posts, meta: { total, limit, offset } });
}

export async function getPost(req: Request, res: Response): Promise<void> {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: {
      author: authorSelect,
      forum: { select: { id: true, title: true, courseId: true } },
      comments: { include: { author: authorSelect }, orderBy: { createdAt: 'asc' } },
    },
  });

  if (!post) {
    throw new HttpError(404, `Post ${req.params.id} not found`);
  }

  res.json({ data: post });
}

export async function createPost(req: Request, res: Response): Promise<void> {
  const forumId = req.params.forumId;
  const { content } = req.body as { content: string };

  const forum = await prisma.forum.findUnique({
    where: { id: forumId },
    include: { course: { select: { lecturerId: true } } },
  });
  if (!forum) {
    throw new HttpError(404, `Forum ${forumId} not found`);
  }

  const isLecturer = forum.course.lecturerId === req.user!.sub;
  if (!isLecturer) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.user!.sub, courseId: forum.courseId } },
    });
    if (!enrollment) {
      throw new HttpError(403, 'You must be enrolled in this course to post in its forums');
    }
  }

  const post = await prisma.post.create({
    data: { forumId, content, authorId: req.user!.sub },
    include: { author: authorSelect },
  });

  res.status(201).json({ data: post });
}

export async function updatePost(req: Request, res: Response): Promise<void> {
  const postId = req.params.id;
  const { content } = req.body as { content: string };

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new HttpError(404, `Post ${postId} not found`);
  }
  if (post.authorId !== req.user!.sub) {
    throw new HttpError(403, 'You can only edit your own posts');
  }

  const updated = await prisma.post.update({ where: { id: postId }, data: { content } });
  res.json({ data: updated });
}

export async function deletePost(req: Request, res: Response): Promise<void> {
  const postId = req.params.id;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new HttpError(404, `Post ${postId} not found`);
  }
  if (post.authorId !== req.user!.sub && req.user!.role !== Role.LECTURER) {
    throw new HttpError(403, 'You can only delete your own posts');
  }

  await prisma.post.delete({ where: { id: postId } });
  res.status(204).send();
}

export async function listCommentsForPost(req: Request, res: Response): Promise<void> {
  const postId = req.params.id;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new HttpError(404, `Post ${postId} not found`);
  }

  const comments = await prisma.comment.findMany({
    where: { postId },
    include: { author: authorSelect },
    orderBy: { createdAt: 'asc' },
  });

  res.json({ data: comments });
}

export async function createComment(req: Request, res: Response): Promise<void> {
  const postId = req.params.id;
  const { content } = req.body as { content: string };

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new HttpError(404, `Post ${postId} not found`);
  }

  const comment = await prisma.comment.create({
    data: { postId, content, authorId: req.user!.sub },
    include: { author: authorSelect },
  });

  res.status(201).json({ data: comment });
}
