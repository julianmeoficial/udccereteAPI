import type { Role } from '@udccerete/schemas';

export type PermissionAction =
  | 'read_public'
  | 'comment'
  | 'publish_post'
  | 'upload_resource'
  | 'moderate'
  | 'manage_users'
  | 'view_analytics'
  | 'manage_calendar'
  | 'manage_events'
  | 'manage_wellbeing';

const ROLE_PERMISSIONS: Record<Role, PermissionAction[]> = {
  super_admin: [
    'read_public',
    'comment',
    'publish_post',
    'upload_resource',
    'moderate',
    'manage_users',
    'view_analytics',
    'manage_calendar',
    'manage_events',
    'manage_wellbeing',
  ],
  admin: [
    'read_public',
    'comment',
    'publish_post',
    'upload_resource',
    'moderate',
    'view_analytics',
    'manage_calendar',
    'manage_events',
    'manage_wellbeing',
  ],
  editor: ['read_public', 'comment', 'publish_post', 'upload_resource', 'moderate'],
  teacher: ['read_public', 'comment', 'upload_resource'],
  student: ['read_public', 'comment'],
  visitor: ['read_public'],
};

export function hasPermission(role: Role, action: PermissionAction): boolean {
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}

export function requirePermission(role: Role, action: PermissionAction): void {
  if (!hasPermission(role, action)) {
    throw new PermissionError(action);
  }
}

export class PermissionError extends Error {
  constructor(public readonly action: PermissionAction) {
    super(`Permiso denegado: ${action}`);
    this.name = 'PermissionError';
  }
}

export const INSTITUTIONAL_EMAIL_DOMAIN = '@unicartagena.edu.co';

export function isInstitutionalEmail(email: string): boolean {
  return email.toLowerCase().endsWith(INSTITUTIONAL_EMAIL_DOMAIN);
}

export function requireInstitutionalEmail(email: string): void {
  if (!isInstitutionalEmail(email)) {
    throw new InstitutionalEmailError();
  }
}

export class InstitutionalEmailError extends Error {
  constructor() {
    super('Se requiere correo institucional verificado');
    this.name = 'InstitutionalEmailError';
  }
}
