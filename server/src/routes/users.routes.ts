import { Router } from 'express';
import {
  changeCurrentUserPassword,
  getCurrentUserActivity,
  getCurrentUserEnrollments,
  getCurrentUserResources,
  getUser,
  getUserProfile,
  listUsers,
  updateCurrentUser,
} from '../controllers/users.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  changePasswordValidators,
  paginationValidators,
  updateCurrentUserValidators,
  userIdParamValidators,
} from '../validators/users.validators';

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get('/', asyncHandler(listUsers));

usersRouter.put('/me', validate(updateCurrentUserValidators), asyncHandler(updateCurrentUser));
usersRouter.put(
  '/me/password',
  validate(changePasswordValidators),
  asyncHandler(changeCurrentUserPassword),
);
usersRouter.get(
  '/me/activity',
  validate(paginationValidators),
  asyncHandler(getCurrentUserActivity),
);
usersRouter.get('/me/resources', asyncHandler(getCurrentUserResources));
usersRouter.get('/me/enrollments', asyncHandler(getCurrentUserEnrollments));

usersRouter.get(
  '/:id/profile',
  validate(userIdParamValidators),
  asyncHandler(getUserProfile),
);
usersRouter.get('/:id', validate(userIdParamValidators), asyncHandler(getUser));
