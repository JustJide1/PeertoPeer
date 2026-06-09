import { Router } from 'express';
import {
  createResource,
  deleteResource,
  downloadResource,
  listResourcesForCourse,
} from '../controllers/resources.controller';
import { authenticate } from '../middleware/authenticate';
import { uploadResourceFile } from '../middleware/upload';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  courseIdParamValidators,
  createResourceValidators,
  resourceIdParamValidators,
} from '../validators/resources.validators';

// Mounted at /courses/:courseId/resources
export const courseResourcesRouter = Router({ mergeParams: true });

courseResourcesRouter.use(authenticate);

courseResourcesRouter.get(
  '/',
  validate(courseIdParamValidators),
  asyncHandler(listResourcesForCourse),
);
courseResourcesRouter.post(
  '/',
  uploadResourceFile,
  validate([...courseIdParamValidators, ...createResourceValidators]),
  asyncHandler(createResource),
);

// Mounted at /resources
export const resourcesRouter = Router();

resourcesRouter.use(authenticate);

resourcesRouter.delete(
  '/:id',
  validate(resourceIdParamValidators),
  asyncHandler(deleteResource),
);
resourcesRouter.get(
  '/:id/download',
  validate(resourceIdParamValidators),
  asyncHandler(downloadResource),
);
