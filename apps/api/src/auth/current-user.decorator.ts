import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { JwtPayload } from './jwt.strategy';

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): JwtPayload => {
  const gqlContext = GqlExecutionContext.create(context);
  const gqlRequest = gqlContext.getContext().req;
  const request = gqlRequest ?? context.switchToHttp().getRequest();
  return request.user;
});
