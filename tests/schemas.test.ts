import { describe, expect, it } from 'vitest';
import { CreatePostSchema } from '../packages/schemas/src/posts/index.js';
import { CreateForumOpinionSchema } from '../packages/schemas/src/forum/index.js';
import { PaginationQuerySchema } from '../packages/schemas/src/common/pagination.schema.js';
import { RoleSchema } from '../packages/schemas/src/common/role.schema.js';

describe('PaginationQuerySchema', () => {
  it('applies defaults', () => {
    const parsed = PaginationQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
  });

  it('rejects pageSize over 100', () => {
    expect(() => PaginationQuerySchema.parse({ pageSize: 101 })).toThrow();
  });
});

describe('RoleSchema', () => {
  it('accepts valid roles', () => {
    expect(RoleSchema.parse('editor')).toBe('editor');
  });

  it('rejects unknown role', () => {
    expect(() => RoleSchema.parse('root')).toThrow();
  });
});

describe('CreatePostSchema', () => {
  it('requires title and content', () => {
    const result = CreatePostSchema.parse({
      title: 'Comunicado',
      content: '<p>Hola</p>',
    });
    expect(result.status).toBe('draft');
  });
});

describe('CreateForumOpinionSchema', () => {
  it('requires courseId for course target', () => {
    expect(() =>
      CreateForumOpinionSchema.parse({
        targetType: 'course',
        rating: 4,
        body: 'Buen curso, material claro y tutor disponible.',
      }),
    ).toThrow();
  });

  it('accepts valid course opinion', () => {
    const result = CreateForumOpinionSchema.parse({
      targetType: 'course',
      courseId: '550e8400-e29b-41d4-a716-446655440000',
      rating: 5,
      body: 'Excelente acompañamiento durante el semestre.',
    });
    expect(result.rating).toBe(5);
  });
});
