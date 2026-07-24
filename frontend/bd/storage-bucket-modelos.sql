-- =============================================
-- SIGNUM Fase 2: Configuracion del bucket "modelos"
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Crear el bucket "modelos" (no publico, sin descarga anonima)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'modelos',
  'modelos',
  false,
  52428800, -- 50 MB max
  ARRAY['application/json']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Politica: usuarios autenticados pueden leer/descargar modelos
CREATE POLICY "Usuarios descargan modelos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'modelos');

-- 3. Politica: usuarios autenticados pueden subir modelos (colaborativo)
CREATE POLICY "Usuarios suben modelos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'modelos');

-- 4. Politica: usuarios solo pueden actualizar/eliminar sus propios archivos
CREATE POLICY "Usuarios actualizan sus modelos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'modelos' AND owner = auth.uid());

CREATE POLICY "Usuarios eliminan sus modelos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'modelos' AND owner = auth.uid());
