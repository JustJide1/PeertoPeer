import fs from 'node:fs';
import path from 'node:path';
import { Role } from '@prisma/client';
import type { Request, Response } from 'express';
import { buildFileUrl, storageConfig, UPLOAD_DIR } from '../config/storage';
import { prisma } from '../config/prisma';
import { HttpError } from '../middleware/errorHandler';

type IconHint = 'pdf' | 'word' | 'powerpoint' | 'image' | 'zip' | 'file';

function fileIconHint(fileType: string): IconHint {
  if (fileType === 'application/pdf') return 'pdf';
  if (fileType.includes('wordprocessingml') || fileType === 'application/msword') return 'word';
  if (fileType.includes('presentationml') || fileType === 'application/vnd.ms-powerpoint') return 'powerpoint';
  if (fileType.startsWith('image/')) return 'image';
  if (fileType.includes('zip')) return 'zip';
  return 'file';
}

function withIconHint<T extends { fileType: string }>(resource: T): T & { iconHint: IconHint } {
  return { ...resource, iconHint: fileIconHint(resource.fileType) };
}

export async function listResourcesForCourse(req: Request, res: Response): Promise<void> {
  const courseId = req.params.courseId;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new HttpError(404, `Course ${courseId} not found`);
  }

  const resources = await prisma.resource.findMany({
    where: { courseId },
    include: { uploader: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ data: resources.map(withIconHint) });
}

export async function createResource(req: Request, res: Response): Promise<void> {
  const courseId = req.params.courseId;
  const file = req.file;

  if (!file) {
    throw new HttpError(400, 'A file is required');
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new HttpError(404, `Course ${courseId} not found`);
  }

  const isLecturer = course.lecturerId === req.user!.sub;
  if (!isLecturer) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.user!.sub, courseId } },
    });
    if (!enrollment) {
      throw new HttpError(403, 'You must be enrolled in this course to share resources');
    }
  }

  const title = ((req.body as { title?: string }).title?.trim() || file.originalname);

  const resource = await prisma.resource.create({
    data: {
      courseId,
      title,
      fileUrl: buildFileUrl(file.filename),
      fileType: file.mimetype,
      uploaderId: req.user!.sub,
    },
    include: { uploader: { select: { id: true, name: true } } },
  });

  res.status(201).json({ data: withIconHint(resource) });
}

export async function deleteResource(req: Request, res: Response): Promise<void> {
  const resourceId = req.params.id;

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) {
    throw new HttpError(404, `Resource ${resourceId} not found`);
  }
  if (resource.uploaderId !== req.user!.sub && req.user!.role !== Role.LECTURER) {
    throw new HttpError(403, 'You can only delete resources you uploaded');
  }

  await prisma.resource.delete({ where: { id: resourceId } });

  if (storageConfig.driver === 'local') {
    const filePath = path.join(UPLOAD_DIR, path.basename(resource.fileUrl));
    fs.promises.unlink(filePath).catch(() => undefined);
  }

  res.status(204).send();
}

export async function downloadResource(req: Request, res: Response): Promise<void> {
  const resourceId = req.params.id;

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) {
    throw new HttpError(404, `Resource ${resourceId} not found`);
  }

  if (storageConfig.driver === 's3') {
    // Stub: in production, generate a signed S3 GET URL and redirect to it
    res.redirect(resource.fileUrl);
    return;
  }

  const filePath = path.join(UPLOAD_DIR, path.basename(resource.fileUrl));
  if (!fs.existsSync(filePath)) {
    throw new HttpError(404, 'File not found on server');
  }

  res.download(filePath, resource.title);
}
