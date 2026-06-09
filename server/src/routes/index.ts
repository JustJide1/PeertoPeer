import { Router } from 'express';
import { authRouter } from './auth';
import { commentsRouter } from './comments.routes';
import { coursesRouter } from './courses.routes';
import { courseForumsRouter, forumsRouter } from './forums.routes';
import { healthRouter } from './health.routes';
import { forumPostsRouter, postsRouter } from './posts.routes';
import { courseResourcesRouter, resourcesRouter } from './resources.routes';
import { usersRouter } from './users.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/courses/:courseId/forums', courseForumsRouter);
apiRouter.use('/courses/:courseId/resources', courseResourcesRouter);
apiRouter.use('/courses', coursesRouter);
apiRouter.use('/forums/:forumId/posts', forumPostsRouter);
apiRouter.use('/forums', forumsRouter);
apiRouter.use('/posts', postsRouter);
apiRouter.use('/comments', commentsRouter);
apiRouter.use('/resources', resourcesRouter);
