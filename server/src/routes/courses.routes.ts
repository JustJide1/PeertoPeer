import { Router } from 'express';
import {
  checkEnrollment,
  createCourse,
  enrollInCourse,
  getCourse,
  listCourses,
  unenrollFromCourse,
  updateCourse,
} from '../controllers/courses.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  courseIdParamValidators,
  createCourseValidators,
  listCoursesValidators,
  updateCourseValidators,
} from '../validators/courses.validators';

export const coursesRouter = Router();

coursesRouter.use(authenticate);

coursesRouter.get('/', validate(listCoursesValidators), asyncHandler(listCourses));
coursesRouter.post('/', validate(createCourseValidators), asyncHandler(createCourse));
coursesRouter.get('/:id', validate(courseIdParamValidators), asyncHandler(getCourse));
coursesRouter.put(
  '/:id',
  validate([...courseIdParamValidators, ...updateCourseValidators]),
  asyncHandler(updateCourse),
);
coursesRouter.post(
  '/:id/enroll',
  validate(courseIdParamValidators),
  asyncHandler(enrollInCourse),
);
coursesRouter.delete(
  '/:id/enroll',
  validate(courseIdParamValidators),
  asyncHandler(unenrollFromCourse),
);
coursesRouter.get(
  '/:id/enrolled',
  validate(courseIdParamValidators),
  asyncHandler(checkEnrollment),
);
