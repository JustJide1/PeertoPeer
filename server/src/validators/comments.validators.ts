import { param } from 'express-validator';

export const commentIdParamValidators = [param('id').isUUID().withMessage('Invalid comment id')];
