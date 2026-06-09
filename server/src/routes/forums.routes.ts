import { Router } from 'express';
import { createForum, getForum, listForumsForCourse } from '../controllers/forums.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  courseIdParamValidators,
  createForumValidators,
  forumIdParamValidators,
} from '../validators/forums.validators';

// Mounted at /courses/:courseId/forums
export const courseForumsRouter = Router({ mergeParams: true });

courseForumsRouter.use(authenticate);

courseForumsRouter.get(
  '/',
  validate(courseIdParamValidators),
  asyncHandler(listForumsForCourse),
);
courseForumsRouter.post(
  '/',
  validate([...courseIdParamValidators, ...createForumValidators]),
  asyncHandler(createForum),
);

// Mounted at /forums
export const forumsRouter = Router();

forumsRouter.use(authenticate);

forumsRouter.get('/:id', validate(forumIdParamValidators), asyncHandler(getForum));
