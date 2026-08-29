import { describe, expect, it } from 'vitest';
import {
  hasPermission,
  isInstitutionalEmail,
  INSTITUTIONAL_EMAIL_DOMAIN,
} from '../apps/api/src/lib/permissions.js';
import type { Role } from '../packages/schemas/src/common/role.schema.js';

describe('permissions matrix', () => {
  it('visitor can read public only', () => {
    expect(hasPermission('visitor', 'read_public')).toBe(true);
    expect(hasPermission('visitor', 'comment')).toBe(false);
  });

  it('student can comment', () => {
    expect(hasPermission('student', 'comment')).toBe(true);
    expect(hasPermission('student', 'publish_post')).toBe(false);
  });

  it('editor can publish and moderate', () => {
    expect(hasPermission('editor', 'publish_post')).toBe(true);
    expect(hasPermission('editor', 'moderate')).toBe(true);
    expect(hasPermission('editor', 'manage_users')).toBe(false);
  });

  it('super_admin can manage users', () => {
    expect(hasPermission('super_admin', 'manage_users')).toBe(true);
  });

  it('covers all roles', () => {
    const roles: Role[] = ['super_admin', 'admin', 'editor', 'teacher', 'student', 'visitor'];
    for (const role of roles) {
      expect(hasPermission(role, 'read_public')).toBe(true);
    }
  });
});

describe('institutional email', () => {
  it('accepts unicartagena domain', () => {
    expect(isInstitutionalEmail(`test${INSTITUTIONAL_EMAIL_DOMAIN}`)).toBe(true);
  });

  it('rejects external email', () => {
    expect(isInstitutionalEmail('test@gmail.com')).toBe(false);
  });
});
