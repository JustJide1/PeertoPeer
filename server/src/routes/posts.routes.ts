import { Router } from 'express';
import {
  createComment,
  createPost,
  deletePost,
  getPost,
  listCommentsForPost,
  listPostsForForum,
  updatePost,
} from '../controllers/posts.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  contentValidators,
  forumIdParamValidators,
  listPostsValidators,
  postIdParamValidators,
} from '../validators/posts.validators';

// Mounted at /forums/:forumId/posts
export const forumPostsRouter = Router({ mergeParams: true });

forumPostsRouter.use(authenticate);

forumPostsRouter.get(
  '/',
  validate([...forumIdParamValidators, ...listPostsValidators]),
  asyncHandler(listPostsForForum),
);
forumPostsRouter.post(
  '/',
  validate([...forumIdParamValidators, ...contentValidators]),
  asyncHandler(createPost),
);

// Mounted at /posts
export const postsRouter = Router();

postsRouter.use(authenticate);

postsRouter.get('/:id', validate(postIdParamValidators), asyncHandler(getPost));
postsRouter.put(
  '/:id',
  validate([...postIdParamValidators, ...contentValidators]),
  asyncHandler(updatePost),
);
postsRouter.delete('/:id', validate(postIdParamValidators), asyncHandler(deletePost));
postsRouter.get(
  '/:id/comments',
  validate(postIdParamValidators),
  asyncHandler(listCommentsForPost),
);
postsRouter.post(
  '/:id/comments',
  validate([...postIdParamValidators, ...contentValidators]),
  asyncHandler(createComment),
);
