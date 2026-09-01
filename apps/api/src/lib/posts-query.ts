import type { JwtUser, PostsQuery } from '@udccerete/schemas';
import { hasPermission } from './permissions.js';

export function resolvePostsListQuery(query: PostsQuery, user?: JwtUser): PostsQuery {
  const canSeeUnpublished =
    user !== undefined &&
    (hasPermission(user.role, 'publish_post') || hasPermission(user.role, 'moderate'));

  return canSeeUnpublished ? query : { ...query, status: 'published' as const };
}
