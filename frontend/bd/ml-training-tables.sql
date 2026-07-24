-- =============================================
-- SIGNUM Fase 2: Tablas para ML colaborativo
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. Tabla de muestras de entrenamiento colaborativas
-- Los usuarios suben landmarks de sus manos para
-- enriquecer el dataset global de LSM.
-- =============================================

CREATE TABLE IF NOT EXISTS public.muestras_entrenamiento (
  id_muestra bigserial PRIMARY KEY,
  id_usuario uuid NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  tipo varchar(20) NOT NULL CHECK (tipo IN ('letter', 'word', 'dynamic')),
  etiqueta varchar(100) NOT NULL,
  landmarks jsonb NOT NULL,
  metadatos jsonb DEFAULT '{}'::jsonb,
  fecha_creacion timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_muestras_tipo ON public.muestras_entrenamiento(tipo);
CREATE INDEX IF NOT EXISTS idx_muestras_etiqueta ON public.muestras_entrenamiento(etiqueta);
CREATE INDEX IF NOT EXISTS idx_muestras_usuario ON public.muestras_entrenamiento(id_usuario);

-- =============================================
-- 2. Tabla de modelos versionados
-- Guarda metadatos de cada modelo entrenado
-- y la ruta al archivo .json en Supabase Storage.
-- =============================================

CREATE TABLE IF NOT EXISTS public.modelos (
  id_modelo serial PRIMARY KEY,
  version varchar(20) NOT NULL UNIQUE,
  tipo varchar(20) NOT NULL CHECK (tipo IN ('letter', 'word', 'dynamic')),
  storage_path text NOT NULL,
  n_trees integer NOT NULL,
  n_features integer NOT NULL,
  n_clases integer NOT NULL,
  n_muestras integer NOT NULL,
  clases text[] NOT NULL,
  accuracy real,
  precision_promedio real,
  recall_promedio real,
  f1_score real,
  matriz_confusion jsonb,
  hiperparametros jsonb DEFAULT '{}'::jsonb,
  tamanio_bytes bigint,
  activo boolean DEFAULT false,
  fecha_entrenamiento timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_modelos_tipo ON public.modelos(tipo);
CREATE INDEX IF NOT EXISTS idx_modelos_activo ON public.modelos(activo) WHERE activo = true;

-- =============================================
-- 3. RLS: Políticas de seguridad
-- =============================================

ALTER TABLE public.muestras_entrenamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede insertar sus propias muestras
CREATE POLICY "Usuarios insertan sus propias muestras"
  ON public.muestras_entrenamiento FOR INSERT
  WITH CHECK (auth.uid() = id_usuario);

-- Los usuarios pueden leer todas las muestras (dataset colaborativo)
CREATE POLICY "Usuarios leen todas las muestras"
  ON public.muestras_entrenamiento FOR SELECT
  USING (auth.role() IS NOT NULL);

-- Los usuarios pueden eliminar solo sus muestras
CREATE POLICY "Usuarios eliminan sus propias muestras"
  ON public.muestras_entrenamiento FOR DELETE
  USING (auth.uid() = id_usuario);

-- Cualquier usuario autenticado puede leer los modelos
CREATE POLICY "Usuarios leen modelos"
  ON public.modelos FOR SELECT
  USING (auth.role() IS NOT NULL);

-- Solo administradores pueden modificar modelos (o el service_role)
CREATE POLICY "Administradores gestionan modelos"
  ON public.modelos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.usuario_roles ur
      JOIN public.roles r ON ur.id_rol = r.id_rol
      WHERE ur.id_usuario = auth.uid()
      AND r.nombre_rol = 'Administrador'
    )
  );

-- =============================================
-- 4. Función: marcar modelo como activo (solo uno por tipo)
-- =============================================

CREATE OR REPLACE FUNCTION public.activar_modelo(p_id_modelo integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_tipo varchar(20);
BEGIN
  SELECT tipo INTO v_tipo FROM public.modelos WHERE id_modelo = p_id_modelo;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Modelo con id % no existe', p_id_modelo;
  END IF;

  UPDATE public.modelos SET activo = false WHERE tipo = v_tipo;
  UPDATE public.modelos SET activo = true WHERE id_modelo = p_id_modelo;
END;
$$;

-- =============================================
-- 5. Permisos para las nuevas tablas
-- =============================================

GRANT ALL ON TABLE public.muestras_entrenamiento TO anon, authenticated;
GRANT ALL ON SEQUENCE public.muestras_entrenamiento_id_muestra_seq TO anon, authenticated;
GRANT ALL ON TABLE public.modelos TO anon, authenticated;
GRANT ALL ON SEQUENCE public.modelos_id_modelo_seq TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activar_modelo(integer) TO authenticated;

-- =============================================
-- 6. Bucket de Storage para modelos
-- NOTA: Esto se crea desde la UI de Supabase o vía API.
-- Ir a: Supabase Dashboard → Storage → New Bucket
--   Nombre: modelos
--   Público: NO (los modelos se descargan vía API autenticada)
--   Políticas:
--     - SELECT: authenticated (cualquier usuario autenticado puede descargar)
--     - INSERT/UPDATE/DELETE: solo service_role (el ML service usa service_role key)
-- =============================================

-- También se puede crear el bucket vía SQL (requiere extensión pgsodium si está disponible):
-- SELECT storage.create_bucket('modelos', false, false);

-- Políticas manuales para el bucket 'modelos' (ejecutar después de crear el bucket):
-- 
-- Permitir lectura a usuarios autenticados:
-- CREATE POLICY "Usuarios descargan modelos"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'modelos' AND auth.role() = 'authenticated');
--
-- Permitir escritura solo al service_role (usado por el ML service):
-- CREATE POLICY "Service role gestiona modelos"
--   ON storage.objects FOR ALL
--   USING (bucket_id = 'modelos' AND auth.role() = 'service_role');
