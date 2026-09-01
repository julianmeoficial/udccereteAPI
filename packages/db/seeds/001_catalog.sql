-- Catálogo base (centros, programas, taxonomía del blog, bienestar).
-- Idempotente: seguro de ejecutar varias veces.

INSERT INTO centers (id, name, slug)
VALUES (
  '11111111-1111-4111-8111-111111111101',
  'Centro Tutorial Cereté',
  'cerete'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO programs (id, center_id, name, slug, description)
VALUES (
  '11111111-1111-4111-8111-111111111102',
  '11111111-1111-4111-8111-111111111101',
  'Ingeniería de Sistemas',
  'ingenieria-sistemas',
  'Programa académico de prueba'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, slug, description)
VALUES (
  '22222222-2222-4222-8222-222222222201',
  'Noticias',
  'noticias',
  'Comunicados y novedades del centro'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tags (id, name, slug)
VALUES
  ('33333333-3333-4333-8333-333333333301', 'Cereté', 'cerete'),
  ('33333333-3333-4333-8333-333333333302', 'Académico', 'academico')
ON CONFLICT (id) DO NOTHING;

INSERT INTO wellbeing_routes (
  id,
  center_id,
  area,
  responsible_name,
  phone,
  email,
  schedule,
  description,
  sort_order
)
VALUES (
  '44444444-4444-4444-8444-444444444401',
  '11111111-1111-4111-8111-111111111101',
  'Psicología',
  'Bienestar Estudiantil',
  '+57 300 000 0000',
  'bienestar@unicartagena.edu.co',
  'Lunes a viernes 8:00–17:00',
  'Ruta de apoyo psicosocial de prueba',
  '1'
)
ON CONFLICT (id) DO NOTHING;
