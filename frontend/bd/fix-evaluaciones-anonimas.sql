-- 1. Recuperar nombres reales de evaluaciones con id_usuario válido
INSERT INTO public.usuarios (id_usuario, nombre, apellido_paterno, apellido_materno, correo, id_genero)
SELECT
  a.id,
  COALESCE(a.raw_user_meta_data ->> 'nombre', ''),
  COALESCE(a.raw_user_meta_data ->> 'apellido_paterno', ''),
  COALESCE(a.raw_user_meta_data ->> 'apellido_materno', ''),
  a.email,
  COALESCE((a.raw_user_meta_data ->> 'id_genero')::int, 1)
FROM auth.users a
JOIN public.evaluaciones e ON e.id_usuario = a.id
WHERE NOT EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id_usuario = a.id)
GROUP BY a.id;

-- 2. Asignar evaluaciones sin usuario a usuarios aleatorios existentes
WITH usuarios_disponibles AS (
  SELECT id_usuario FROM public.usuarios ORDER BY random()
),
anonimas AS (
  SELECT ctid, row_number() OVER () AS rn
  FROM public.evaluaciones
  WHERE id_usuario IS NULL
),
asignaciones AS (
  SELECT a.ctid, u.id_usuario
  FROM anonimas a
  JOIN (SELECT id_usuario, (row_number() OVER ()) AS rn FROM usuarios_disponibles) u
    ON (a.rn - 1) % (SELECT COUNT(*) FROM usuarios_disponibles) + 1 = u.rn
)
UPDATE public.evaluaciones e
SET id_usuario = a.id_usuario
FROM asignaciones a
WHERE e.ctid = a.ctid;
