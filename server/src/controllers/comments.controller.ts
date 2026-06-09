import { Role } from '@prisma/client';
import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { HttpError } from '../middleware/errorHandler';

export async function deleteComment(req: Request, res: Response): Promise<void> {
  const commentId = req.params.id;

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) {
    throw new HttpError(404, `Comment ${commentId} not found`);
  }
  if (comment.authorId !== req.user!.sub && req.user!.role !== Role.LECTURER) {
    throw new HttpError(403, 'You can only delete your own comments');
  }

  await prisma.comment.delete({ where: { id: commentId } });
  res.status(204).send();
}
