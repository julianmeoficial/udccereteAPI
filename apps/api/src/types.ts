import type { AuthUser } from './lib/auth-user.js';

export type AppBindings = {
  Variables: {
    requestId: string;
    user?: AuthUser;
  };
};
