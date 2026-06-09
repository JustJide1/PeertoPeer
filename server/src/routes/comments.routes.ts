import { Router } from 'express';
import { deleteComment } from '../controllers/comments.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { commentIdParamValidators } from '../validators/comments.validators';

export const commentsRouter = Router();

commentsRouter.use(authenticate);

commentsRouter.delete('/:id', validate(commentIdParamValidators), asyncHandler(deleteComment));
