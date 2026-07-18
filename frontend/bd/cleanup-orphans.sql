-- =============================================
-- LIMPIEZA DE HUÉRFANOS POR RE-EJECUCIONES DEL SEED
-- Ejecutar en Supabase SQL Editor ANTES de re-ejecutar el seed
-- =============================================

-- 1. Eliminar evaluaciones huérfanas (id_usuario no existe en public.usuarios)
DELETE FROM public.evaluaciones
WHERE id_usuario IS NULL
   OR id_usuario NOT IN (SELECT id_usuario FROM public.usuarios);

-- 2. Eliminar traducciones huérfanas
DELETE FROM public.traducciones
WHERE id_usuario IS NULL
   OR id_usuario NOT IN (SELECT id_usuario FROM public.usuarios);

-- 3. Eliminar avances huérfanos
DELETE FROM public.avances
WHERE id_usuario IS NULL
   OR id_usuario NOT IN (SELECT id_usuario FROM public.usuarios);

-- 4. Eliminar login huérfanos
DELETE FROM public.login
WHERE id_usuario IS NULL
   OR id_usuario NOT IN (SELECT id_usuario FROM public.usuarios);

-- 5. Eliminar roles huérfanos
DELETE FROM public.usuario_roles
WHERE id_usuario IS NULL
   OR id_usuario NOT IN (SELECT id_usuario FROM public.usuarios);

-- 6. Eliminar identidades huérfanas (sin user en auth.users)
DELETE FROM auth.identities
WHERE user_id IS NULL
   OR user_id NOT IN (SELECT id FROM auth.users);

-- 7. Eliminar usuarios auth huérfanos (sin perfil en public.usuarios)
DELETE FROM auth.users
WHERE id NOT IN (SELECT id_usuario FROM public.usuarios);

-- 8. Eliminar usuario_roles duplicados (si los hay)
DELETE FROM public.usuario_roles ur
WHERE id_usuario_rol NOT IN (
  SELECT MIN(id_usuario_rol) FROM public.usuario_roles GROUP BY id_usuario
);

-- 9. Crear índice único para evitar duplicados a futuro
CREATE UNIQUE INDEX IF NOT EXISTS usuario_roles_unique
  ON public.usuario_roles (id_usuario, id_rol);

-- 10. Verificación final
SELECT
  (SELECT COUNT(*) FROM public.evaluaciones WHERE id_usuario IS NULL OR id_usuario NOT IN (SELECT id_usuario FROM public.usuarios)) AS evaluaciones_huerfanas,
  (SELECT COUNT(*) FROM public.traducciones WHERE id_usuario IS NULL OR id_usuario NOT IN (SELECT id_usuario FROM public.usuarios)) AS traducciones_huerfanas,
  (SELECT COUNT(*) FROM public.avances WHERE id_usuario IS NULL OR id_usuario NOT IN (SELECT id_usuario FROM public.usuarios)) AS avances_huerfanos,
  (SELECT COUNT(*) FROM public.login WHERE id_usuario IS NULL OR id_usuario NOT IN (SELECT id_usuario FROM public.usuarios)) AS login_huerfanos,
  (SELECT COUNT(*) FROM auth.users WHERE id NOT IN (SELECT id_usuario FROM public.usuarios)) AS usuarios_auth_huerfanos;