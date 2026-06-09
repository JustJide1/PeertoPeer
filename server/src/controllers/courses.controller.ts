import { Role } from '@prisma/client';
import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { HttpError } from '../middleware/errorHandler';

export async function listCourses(req: Request, res: Response): Promise<void> {
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const offset = req.query.offset ? Number(req.query.offset) : 0;

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      take: limit,
      skip: offset,
      include: {
        lecturer: { select: { id: true, name: true, email: true } },
        _count: { select: { enrollments: true, forums: true, resources: true } },
      },
      orderBy: { code: 'asc' },
    }),
    prisma.course.count(),
  ]);

  res.json({ data: courses, meta: { total, limit, offset } });
}

export async function getCourse(req: Request, res: Response): Promise<void> {
  const course = await prisma.course.findUnique({
    where: { id: req.params.id },
    include: {
      lecturer: { select: { id: true, name: true, email: true } },
      forums: true,
      _count: { select: { enrollments: true } },
    },
  });

  if (!course) {
    throw new HttpError(404, `Course ${req.params.id} not found`);
  }

  res.json({ data: course });
}

export async function createCourse(req: Request, res: Response): Promise<void> {
  if (req.user!.role !== Role.LECTURER) {
    throw new HttpError(403, 'Only lecturers can create courses');
  }

  const { title, code, description } = req.body as {
    title: string;
    code: string;
    description?: string;
  };

  const existing = await prisma.course.findUnique({ where: { code } });
  if (existing) {
    throw new HttpError(409, `A course with code ${code} already exists`);
  }

  const course = await prisma.course.create({
    data: { title, code, description, lecturerId: req.user!.sub },
  });

  res.status(201).json({ data: course });
}

export async function updateCourse(req: Request, res: Response): Promise<void> {
  const courseId = req.params.id;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new HttpError(404, `Course ${courseId} not found`);
  }

  if (course.lecturerId !== req.user!.sub) {
    throw new HttpError(403, 'Only the course lecturer can update this course');
  }

  const { title, code, description } = req.body as {
    title?: string;
    code?: string;
    description?: string;
  };

  if (code && code !== course.code) {
    const existing = await prisma.course.findUnique({ where: { code } });
    if (existing) {
      throw new HttpError(409, `A course with code ${code} already exists`);
    }
  }

  const updated = await prisma.course.update({
    where: { id: courseId },
    data: { title, code, description },
  });

  res.json({ data: updated });
}

export async function enrollInCourse(req: Request, res: Response): Promise<void> {
  const courseId = req.params.id;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new HttpError(404, `Course ${courseId} not found`);
  }

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: req.user!.sub, courseId } },
    update: {},
    create: { userId: req.user!.sub, courseId },
  });

  res.status(201).json({ data: enrollment });
}

export async function unenrollFromCourse(req: Request, res: Response): Promise<void> {
  const courseId = req.params.id;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new HttpError(404, `Course ${courseId} not found`);
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: req.user!.sub, courseId } },
  });
  if (!enrollment) {
    throw new HttpError(404, 'You are not enrolled in this course');
  }

  await prisma.enrollment.delete({
    where: { userId_courseId: { userId: req.user!.sub, courseId } },
  });

  res.status(204).send();
}

export async function checkEnrollment(req: Request, res: Response): Promise<void> {
  const courseId = req.params.id;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new HttpError(404, `Course ${courseId} not found`);
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: req.user!.sub, courseId } },
  });

  res.json({ data: { enrolled: enrollment !== null } });
}
