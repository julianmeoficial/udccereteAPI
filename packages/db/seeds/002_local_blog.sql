-- Datos de blog para desarrollo local (sin auth.users).
-- Requiere 001_catalog.sql y migraciones Drizzle aplicadas.

INSERT INTO profiles (id, email, full_name, role, center_id, program_id, email_verified)
VALUES
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa001',
    'editor@unicartagena.edu.co',
    'Editor de Prueba',
    'editor',
    '11111111-1111-4111-8111-111111111101',
    '11111111-1111-4111-8111-111111111102',
    true
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa002',
    'estudiante@unicartagena.edu.co',
    'Estudiante de Prueba',
    'student',
    '11111111-1111-4111-8111-111111111101',
    '11111111-1111-4111-8111-111111111102',
    true
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa003',
    'visitante@gmail.com',
    'Visitante Externo',
    'visitor',
    NULL,
    NULL,
    true
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO posts (
  id,
  title,
  slug,
  excerpt,
  content,
  category_id,
  author_id,
  area,
  status,
  published_at
)
VALUES
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb001',
    'Comunicado de bienvenida',
    'comunicado-bienvenida',
    'Mensaje inicial del blog de prueba.',
    'Contenido completo del comunicado de bienvenida para smoke tests.',
    '22222222-2222-4222-8222-222222222201',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa001',
    'Cereté',
    'published',
    NOW() - INTERVAL '2 days'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb002',
    'Borrador interno',
    'borrador-interno',
    'Este post no debe aparecer en listados públicos.',
    'Contenido de borrador para validar filtro published.',
    '22222222-2222-4222-8222-222222222201',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa001',
    'Cereté',
    'draft',
    NULL
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO post_tags (post_id, tag_id)
VALUES
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb001', '33333333-3333-4333-8333-333333333301'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb001', '33333333-3333-4333-8333-333333333302')
ON CONFLICT DO NOTHING;

INSERT INTO comments (id, post_id, author_id, parent_id, body, moderation_status)
VALUES
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccc01',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa002',
    NULL,
    '¡Excelente comunicado!',
    'approved'
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccc02',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa002',
    'cccccccc-cccc-4ccc-8ccc-cccccccccc01',
    'Gracias por la información.',
    'approved'
  )
ON CONFLICT (id) DO NOTHING;
