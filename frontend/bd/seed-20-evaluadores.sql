-- =============================================
-- SIGNUM - Seed de 22 Usuarios Evaluadores + 2 Administradores
-- Actividad 3.3 | Proyecto Integrador II
-- Universidad Tecnológica de Durango
-- Julio 2026
--
-- 3 Cohortes + 2 Administradores:
--   A: 8 Usuarios Principales (personas con disc. auditiva/del habla)
--   B: 6 Interlocutores Directos (oyentes sin LSM)
--   C: 8 Aprendices de LSM (6 + 2 admins extra)
--   Administradores: 2 (integrantes del equipo)
--
-- Ejecutar en Supabase SQL Editor.
-- Contraseña para TODOS los usuarios: Signum2026!
-- =============================================

DO $$
DECLARE
    v_instance_id uuid := '00000000-0000-0000-0000-000000000000';
    v_aud text := 'authenticated';
    v_role text := 'authenticated';
    v_password text;

    -- =============================================
    -- COHORTE A: Usuarios Principales (8)
    -- Personas con discapacidad auditiva/del habla
    -- =============================================
    uid01 uuid := gen_random_uuid();
    uid02 uuid := gen_random_uuid();
    uid03 uuid := gen_random_uuid();
    uid04 uuid := gen_random_uuid();
    uid05 uuid := gen_random_uuid();
    uid06 uuid := gen_random_uuid();
    uid07 uuid := gen_random_uuid();
    uid08 uuid := gen_random_uuid();

    -- =============================================
    -- COHORTE B: Interlocutores Directos (6)
    -- Personas oyentes sin conocimiento de LSM
    -- =============================================
    uid09 uuid := gen_random_uuid();
    uid10 uuid := gen_random_uuid();
    uid11 uuid := gen_random_uuid();
    uid12 uuid := gen_random_uuid();
    uid13 uuid := gen_random_uuid();
    uid14 uuid := gen_random_uuid();

    -- =============================================
    -- COHORTE C: Aprendices de LSM (6)
    -- Estudiantes oyentes en fases iniciales de aprendizaje
    -- =============================================
    uid15 uuid := gen_random_uuid();
    uid16 uuid := gen_random_uuid();
    uid17 uuid := gen_random_uuid();
    uid18 uuid := gen_random_uuid();
    uid19 uuid := gen_random_uuid();
    uid20 uuid := gen_random_uuid();
    uid21 uuid := gen_random_uuid();
    uid22 uuid := gen_random_uuid();

    -- =============================================
    -- ADMINISTRADORES (2)
    -- UUIDs deterministas por email (mismo esquema)
    -- =============================================
    uid23 uuid := gen_random_uuid();
    uid24 uuid := gen_random_uuid();

  BEGIN
    -- Generar contraseña encriptada (Signum2026!)
    v_password := crypt('Signum2026!', gen_salt('bf'));

    -- =============================================
    -- 0. LIMPIEZA: Eliminar usuarios del seed si ya existen
    --    (permite re-ejecutar el seed sin errores de duplicados)
    -- =============================================

    -- Primero eliminar de auth.identities (por email/provider_id)
    DELETE FROM auth.identities WHERE provider_id IN (
      'mariacervantes92@gmail.com', 'juanveliz07@gmail.com', 'saradiaz31@gmail.com',
      'pedrocastaneda99@gmail.com', 'feribarra23@gmail.com', 'khernandez10@gmail.com',
      'susanalimones85@gmail.com', 'briantdosal03@gmail.com', 'cristhiang13@gmail.com',
      'zulemunoz77@gmail.com', 'miguelarrieta88@gmail.com', 'emigarza06@gmail.com',
      'pattyjuarez95@gmail.com', 'rcastillo22@gmail.com', 'emilyalanis04@gmail.com',
      'jorgegomez15@gmail.com', 'marcoramirez11@gmail.com', 'alondracaballero08@gmail.com',
      'monzerrathlara27@gmail.com', 'gustavorosales19@gmail.com',
      'josue_3041240412@utd.edu.mx', 'jose_3041240426@utd.edu.mx',
      'humberto_3041240480@utd.edu.mx', 'manuel_3041240406@utd.edu.mx'
    );

    -- Eliminar datos dependientes (evaluaciones tiene ON DELETE SET NULL, no CASCADE)
    DELETE FROM public.evaluaciones WHERE id_usuario IN (
      SELECT id_usuario FROM public.usuarios WHERE correo IN (
        'mariacervantes92@gmail.com', 'juanveliz07@gmail.com', 'saradiaz31@gmail.com',
        'pedrocastaneda99@gmail.com', 'feribarra23@gmail.com', 'khernandez10@gmail.com',
        'susanalimones85@gmail.com', 'briantdosal03@gmail.com', 'cristhiang13@gmail.com',
        'zulemunoz77@gmail.com', 'miguelarrieta88@gmail.com', 'emigarza06@gmail.com',
        'pattyjuarez95@gmail.com', 'rcastillo22@gmail.com', 'emilyalanis04@gmail.com',
        'jorgegomez15@gmail.com', 'marcoramirez11@gmail.com', 'alondracaballero08@gmail.com',
        'monzerrathlara27@gmail.com', 'gustavorosales19@gmail.com',
        'josue_3041240412@utd.edu.mx', 'jose_3041240426@utd.edu.mx',
        'humberto_3041240480@utd.edu.mx', 'manuel_3041240406@utd.edu.mx'
      )
    );

    -- Eliminar de public.usuarios (CASCADE borra login, traducciones, avances, usuario_roles)
    DELETE FROM public.usuarios WHERE correo IN (
      'mariacervantes92@gmail.com', 'juanveliz07@gmail.com', 'saradiaz31@gmail.com',
      'pedrocastaneda99@gmail.com', 'feribarra23@gmail.com', 'khernandez10@gmail.com',
      'susanalimones85@gmail.com', 'briantdosal03@gmail.com', 'cristhiang13@gmail.com',
      'zulemunoz77@gmail.com', 'miguelarrieta88@gmail.com', 'emigarza06@gmail.com',
      'pattyjuarez95@gmail.com', 'rcastillo22@gmail.com', 'emilyalanis04@gmail.com',
      'jorgegomez15@gmail.com', 'marcoramirez11@gmail.com', 'alondracaballero08@gmail.com',
      'monzerrathlara27@gmail.com', 'gustavorosales19@gmail.com',
      'josue_3041240412@utd.edu.mx', 'jose_3041240426@utd.edu.mx',
      'humberto_3041240480@utd.edu.mx', 'manuel_3041240406@utd.edu.mx'
    );

    -- Finalmente eliminar de auth.users (esto es lo que causaba el error de duplicados)
    DELETE FROM auth.users WHERE email IN (
      'mariacervantes92@gmail.com', 'juanveliz07@gmail.com', 'saradiaz31@gmail.com',
      'pedrocastaneda99@gmail.com', 'feribarra23@gmail.com', 'khernandez10@gmail.com',
      'susanalimones85@gmail.com', 'briantdosal03@gmail.com', 'cristhiang13@gmail.com',
      'zulemunoz77@gmail.com', 'miguelarrieta88@gmail.com', 'emigarza06@gmail.com',
      'pattyjuarez95@gmail.com', 'rcastillo22@gmail.com', 'emilyalanis04@gmail.com',
      'jorgegomez15@gmail.com', 'marcoramirez11@gmail.com', 'alondracaballero08@gmail.com',
      'monzerrathlara27@gmail.com', 'gustavorosales19@gmail.com',
      'josue_3041240412@utd.edu.mx', 'jose_3041240426@utd.edu.mx',
      'humberto_3041240480@utd.edu.mx', 'manuel_3041240406@utd.edu.mx'
    );

    -- También limpiar el usuario de prueba creado por diagnóstico
    DELETE FROM auth.identities WHERE provider_id = 'test_probe_xxx@test.com';
    DELETE FROM public.usuarios WHERE correo = 'test_probe_xxx@test.com';
    DELETE FROM auth.users WHERE email = 'test_probe_xxx@test.com';

    -- =============================================
    -- 1. INSERTAR EN auth.users
    -- El trigger handle_new_user() creará automáticamente
    -- los registros en public.usuarios y public.usuario_roles
    -- =============================================

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_sent_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, phone, is_super_admin, is_sso_user, is_anonymous,
      last_sign_in_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_sent_at, phone_confirmed_at, phone_change, phone_change_token,
      phone_change_sent_at, email_change_token_current, email_change_confirm_status,
      banned_until, deleted_at, reauthentication_token, reauthentication_sent_at, invited_at
    )
    VALUES
      -- COHORTE A
      (v_instance_id, uid01, v_aud, v_role, 'mariacervantes92@gmail.com', v_password, now(), now(), '{"provider":"email","providers":["email"]}', '{"nombre":"María Fernanda","apellido_paterno":"Cervantes","apellido_materno":"Cervantes","id_genero":2}', now(), now(), NULL, false, false, false,
       now(), '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      (v_instance_id, uid02, v_aud, v_role, 'juanveliz07@gmail.com', v_password, now(), now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Juan Manuel","apellido_paterno":"Véliz","apellido_materno":"Arce","id_genero":1}', now(), now(), NULL, false, false, false,
       now(), '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      (v_instance_id, uid03, v_aud, v_role, 'saradiaz31@gmail.com', v_password, now(), now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Sara Irene","apellido_paterno":"Díaz","apellido_materno":"Ramírez","id_genero":2}', now(), now(), NULL, false, false, false,
       now(), '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      (v_instance_id, uid04, v_aud, v_role, 'pedrocastaneda99@gmail.com', v_password, now(), now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Pedro Jovany","apellido_paterno":"Castañeda","apellido_materno":"Aguilar","id_genero":1}', now(), now(), NULL, false, false, false,
       now(), '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      (v_instance_id, uid05, v_aud, v_role, 'feribarra23@gmail.com', v_password, now(), now(), '{"provider":"email","providers":["email"]}', '{"nombre":"María Fernanda","apellido_paterno":"Ibarra","apellido_materno":"Hernández","id_genero":2}', now(), now(), NULL, false, false, false,
       now(), '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      (v_instance_id, uid06, v_aud, v_role, 'khernandez10@gmail.com', v_password, now(), now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Kevin Andrés","apellido_paterno":"Hernández","apellido_materno":"Huerta","id_genero":1}', now(), now(), NULL, false, false, false,
       now(), '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      (v_instance_id, uid07, v_aud, v_role, 'susanalimones85@gmail.com', v_password, now(), now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Susana Jaqueline","apellido_paterno":"Limones","apellido_materno":"Flores","id_genero":2}', now(), now(), NULL, false, false, false,
       now(), '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      (v_instance_id, uid08, v_aud, v_role, 'briantdosal03@gmail.com', v_password, now(), now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Briant Ricardo","apellido_paterno":"Dosal","apellido_materno":"Sosa","id_genero":1}', now(), now(), NULL, false, false, false,
       now(), '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      -- COHORTE B
      (v_instance_id, uid09, v_aud, v_role, 'cristhiang13@gmail.com', v_password, now(), now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Cristhian Osiel","apellido_paterno":"García","apellido_materno":"Pérez","id_genero":1}', now(), now(), NULL, false, false, false,
       now(), '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      (v_instance_id, uid10, v_aud, v_role, 'zulemunoz77@gmail.com', v_password, now(), now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Zuleyca Alejandra","apellido_paterno":"Muñoz","apellido_materno":"Contreras","id_genero":2}', now(), now(), NULL, false, false, false,
       now(), '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      (v_instance_id, uid11, v_aud, v_role, 'miguelarrieta88@gmail.com', v_password, now(), now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Miguel Ángel","apellido_paterno":"Arrieta","apellido_materno":"Vázquez","id_genero":1}', now(), now(), NULL, false, false, false,
       now(), '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      (v_instance_id, uid12, v_aud, v_role, 'emigarza06@gmail.com', v_password, now(), now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Emiliano","apellido_paterno":"Garza","apellido_materno":"Talamantes","id_genero":1}', now(), now(), NULL, false, false, false,
       now(), '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      (v_instance_id, uid13, v_aud, v_role, 'pattyjuarez95@gmail.com', v_password, now(), now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Patricia Verónica","apellido_paterno":"Juárez","apellido_materno":"Pulido","id_genero":2}', now(), now(), NULL, false, false, false,
       now(), '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      (v_instance_id, uid14, v_aud, v_role, 'rcastillo22@gmail.com', v_password, now(), now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Ricardo David","apellido_paterno":"Castillo","apellido_materno":"Arce","id_genero":1}', now(), now(), NULL, false, false, false,
       now(), '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      -- COHORTE C
      (v_instance_id, uid15, v_aud, v_role, 'emilyalanis04@gmail.com', v_password, now(), now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Emily Jaquelín","apellido_paterno":"Alanís","apellido_materno":"Jasso","id_genero":2}', now(), now(), NULL, false, false, false,
       now(), '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      (v_instance_id, uid16, v_aud, v_role, 'jorgegomez15@gmail.com', v_password, now(), now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Jorge","apellido_paterno":"Gómez","apellido_materno":"Herrera","id_genero":1}', now(), now(), NULL, false, false, false,
       now(), '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      (v_instance_id, uid17, v_aud, v_role, 'marcoramirez11@gmail.com', v_password, now(), now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Marco Antonio","apellido_paterno":"Ramírez","apellido_materno":"Amabilis","id_genero":1}', now(), now(), NULL, false, false, false,
       now(), '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      (v_instance_id, uid18, v_aud, v_role, 'alondracaballero08@gmail.com', v_password, now(), now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Alondra Jazmín","apellido_paterno":"Caballero","apellido_materno":"López","id_genero":2}', now(), now(), NULL, false, false, false,
       now(), '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      (v_instance_id, uid19, v_aud, v_role, 'monzerrathlara27@gmail.com', v_password, now(), now(), '{"provider":"email","providers":["email"]}', '{"nombre":"María Monzerrath","apellido_paterno":"Lara","apellido_materno":"Morones","id_genero":2}', now(), now(), NULL, false, false, false,
       now(), '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      (v_instance_id, uid20, v_aud, v_role, 'gustavorosales19@gmail.com', v_password, now(), now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Gustavo","apellido_paterno":"Rosales","apellido_materno":"Luna","id_genero":1}', now(), now(), NULL, false, false, false,
       now(), '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      (v_instance_id, uid21, v_aud, v_role, 'josue_3041240412@utd.edu.mx', v_password, '2026-07-06'::timestamptz, '2026-07-06'::timestamptz, '{"provider":"email","providers":["email"]}', '{"nombre":"Josué Joán","apellido_paterno":"Hernández","apellido_materno":"Tavizón","id_genero":1,"id_rol":1}', '2026-07-06'::timestamptz, '2026-07-06'::timestamptz, NULL, false, false, false,
       '2026-07-06'::timestamptz, '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      (v_instance_id, uid22, v_aud, v_role, 'jose_3041240426@utd.edu.mx', v_password, '2026-07-06'::timestamptz, '2026-07-06'::timestamptz, '{"provider":"email","providers":["email"]}', '{"nombre":"José Manuel","apellido_paterno":"Guerrero","apellido_materno":"Simental","id_genero":1,"id_rol":1}', '2026-07-06'::timestamptz, '2026-07-06'::timestamptz, NULL, false, false, false,
       '2026-07-06'::timestamptz, '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      (v_instance_id, uid23, v_aud, v_role, 'humberto_3041240480@utd.edu.mx', v_password, '2026-07-06'::timestamptz, '2026-07-06'::timestamptz, '{"provider":"email","providers":["email"]}', '{"nombre":"Humberto","apellido_paterno":"Castillo","apellido_materno":"Díaz","id_genero":1,"id_rol":1}', '2026-07-06'::timestamptz, '2026-07-06'::timestamptz, NULL, false, false, false,
       '2026-07-06'::timestamptz, '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL),
      (v_instance_id, uid24, v_aud, v_role, 'manuel_3041240406@utd.edu.mx', v_password, '2026-07-06'::timestamptz, '2026-07-06'::timestamptz, '{"provider":"email","providers":["email"]}', '{"nombre":"Manuel Alejandro","apellido_paterno":"Mathey","apellido_materno":"Ortiz","id_genero":1,"id_rol":1}', '2026-07-06'::timestamptz, '2026-07-06'::timestamptz, NULL, false, false, false,
       '2026-07-06'::timestamptz, '', '', '', '', NULL, NULL, '', '', NULL, '', 0, NULL, NULL, '', NULL, NULL);

    -- =============================================
    -- 2. INSERTAR EN auth.identities
    -- Necesario para que los usuarios puedan iniciar sesión
    -- =============================================

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES
      -- COHORTE A
      (gen_random_uuid(), uid01, jsonb_build_object('sub', uid01::text, 'email', 'mariacervantes92@gmail.com'), 'email', 'mariacervantes92@gmail.com', now(), now(), now()),
      (gen_random_uuid(), uid02, jsonb_build_object('sub', uid02::text, 'email', 'juanveliz07@gmail.com'), 'email', 'juanveliz07@gmail.com', now(), now(), now()),
      (gen_random_uuid(), uid03, jsonb_build_object('sub', uid03::text, 'email', 'saradiaz31@gmail.com'), 'email', 'saradiaz31@gmail.com', now(), now(), now()),
      (gen_random_uuid(), uid04, jsonb_build_object('sub', uid04::text, 'email', 'pedrocastaneda99@gmail.com'), 'email', 'pedrocastaneda99@gmail.com', now(), now(), now()),
      (gen_random_uuid(), uid05, jsonb_build_object('sub', uid05::text, 'email', 'feribarra23@gmail.com'), 'email', 'feribarra23@gmail.com', now(), now(), now()),
      (gen_random_uuid(), uid06, jsonb_build_object('sub', uid06::text, 'email', 'khernandez10@gmail.com'), 'email', 'khernandez10@gmail.com', now(), now(), now()),
      (gen_random_uuid(), uid07, jsonb_build_object('sub', uid07::text, 'email', 'susanalimones85@gmail.com'), 'email', 'susanalimones85@gmail.com', now(), now(), now()),
      (gen_random_uuid(), uid08, jsonb_build_object('sub', uid08::text, 'email', 'briantdosal03@gmail.com'), 'email', 'briantdosal03@gmail.com', now(), now(), now()),
      -- COHORTE B
      (gen_random_uuid(), uid09, jsonb_build_object('sub', uid09::text, 'email', 'cristhiang13@gmail.com'), 'email', 'cristhiang13@gmail.com', now(), now(), now()),
      (gen_random_uuid(), uid10, jsonb_build_object('sub', uid10::text, 'email', 'zulemunoz77@gmail.com'), 'email', 'zulemunoz77@gmail.com', now(), now(), now()),
      (gen_random_uuid(), uid11, jsonb_build_object('sub', uid11::text, 'email', 'miguelarrieta88@gmail.com'), 'email', 'miguelarrieta88@gmail.com', now(), now(), now()),
      (gen_random_uuid(), uid12, jsonb_build_object('sub', uid12::text, 'email', 'emigarza06@gmail.com'), 'email', 'emigarza06@gmail.com', now(), now(), now()),
      (gen_random_uuid(), uid13, jsonb_build_object('sub', uid13::text, 'email', 'pattyjuarez95@gmail.com'), 'email', 'pattyjuarez95@gmail.com', now(), now(), now()),
      (gen_random_uuid(), uid14, jsonb_build_object('sub', uid14::text, 'email', 'rcastillo22@gmail.com'), 'email', 'rcastillo22@gmail.com', now(), now(), now()),
      -- COHORTE C
      (gen_random_uuid(), uid15, jsonb_build_object('sub', uid15::text, 'email', 'emilyalanis04@gmail.com'), 'email', 'emilyalanis04@gmail.com', now(), now(), now()),
      (gen_random_uuid(), uid16, jsonb_build_object('sub', uid16::text, 'email', 'jorgegomez15@gmail.com'), 'email', 'jorgegomez15@gmail.com', now(), now(), now()),
      (gen_random_uuid(), uid17, jsonb_build_object('sub', uid17::text, 'email', 'marcoramirez11@gmail.com'), 'email', 'marcoramirez11@gmail.com', now(), now(), now()),
      (gen_random_uuid(), uid18, jsonb_build_object('sub', uid18::text, 'email', 'alondracaballero08@gmail.com'), 'email', 'alondracaballero08@gmail.com', now(), now(), now()),
      (gen_random_uuid(), uid19, jsonb_build_object('sub', uid19::text, 'email', 'monzerrathlara27@gmail.com'), 'email', 'monzerrathlara27@gmail.com', now(), now(), now()),
      (gen_random_uuid(), uid20, jsonb_build_object('sub', uid20::text, 'email', 'gustavorosales19@gmail.com'), 'email', 'gustavorosales19@gmail.com', now(), now(), now()),
      (gen_random_uuid(), uid21, jsonb_build_object('sub', uid21::text, 'email', 'josue_3041240412@utd.edu.mx'), 'email', 'josue_3041240412@utd.edu.mx', '2026-07-06'::timestamptz, '2026-07-06'::timestamptz, '2026-07-06'::timestamptz),
      (gen_random_uuid(), uid22, jsonb_build_object('sub', uid22::text, 'email', 'jose_3041240426@utd.edu.mx'), 'email', 'jose_3041240426@utd.edu.mx', '2026-07-06'::timestamptz, '2026-07-06'::timestamptz, '2026-07-06'::timestamptz),
      (gen_random_uuid(), uid23, jsonb_build_object('sub', uid23::text, 'email', 'humberto_3041240480@utd.edu.mx'), 'email', 'humberto_3041240480@utd.edu.mx', '2026-07-06'::timestamptz, '2026-07-06'::timestamptz, '2026-07-06'::timestamptz),
      (gen_random_uuid(), uid24, jsonb_build_object('sub', uid24::text, 'email', 'manuel_3041240406@utd.edu.mx'), 'email', 'manuel_3041240406@utd.edu.mx', '2026-07-06'::timestamptz, '2026-07-06'::timestamptz, '2026-07-06'::timestamptz);


    -- =============================================
    -- 2.5 PERFIL Y ROLES EN public.usuarios / public.usuario_roles
    -- El trigger handle_new_user() ya inserta automáticamente
    -- el perfil y el rol por defecto al insertar en auth.users.
    -- Por eso aquí solo AJUSTAMOS el rol para los administradores
    -- (uid21, uid22, uid23, uid24) que requieren id_rol = 1 en lugar del 2 por defecto.
    -- =============================================
    UPDATE public.usuario_roles
      SET id_rol = 1
      WHERE id_usuario IN (uid21, uid22, uid23, uid24);


  -- =============================================
  -- 3. REGISTROS DE LOGIN HISTÓRICOS
  -- =============================================

  INSERT INTO public.login (id_usuario, fecha_hora, direccion_ip)
  VALUES
    -- Cohort A
    (uid01, '2026-07-07 09:30:00', '192.168.1.101'),
    (uid01, '2026-07-13 10:15:00', '192.168.1.101'),
    (uid02, '2026-07-08 09:45:00', '192.168.1.102'),
    (uid02, '2026-07-14 11:00:00', '192.168.1.102'),
    (uid03, '2026-07-08 10:00:00', '192.168.1.103'),
    (uid03, '2026-07-12 09:30:00', '192.168.1.103'),
    (uid04, '2026-07-07 10:15:00', '192.168.1.104'),
    (uid04, '2026-07-09 14:00:00', '192.168.1.104'),
    (uid05, '2026-07-10 11:30:00', '192.168.1.105'),
    (uid05, '2026-07-13 10:45:00', '192.168.1.105'),
    (uid06, '2026-07-11 09:00:00', '192.168.1.106'),
    (uid06, '2026-07-14 10:30:00', '192.168.1.106'),
    (uid07, '2026-07-12 09:15:00', '192.168.1.107'),
    (uid07, '2026-07-15 11:00:00', '192.168.1.107'),
    (uid08, '2026-07-12 11:20:00', '192.168.1.108'),
    (uid08, '2026-07-15 14:30:00', '192.168.1.108'),
    -- Cohort B
    (uid09, '2026-07-09 14:00:00', '192.168.1.201'),
    (uid09, '2026-07-13 15:30:00', '192.168.1.201'),
    (uid10, '2026-07-09 14:30:00', '192.168.1.202'),
    (uid10, '2026-07-14 16:00:00', '192.168.1.202'),
    (uid11, '2026-07-09 14:42:00', '192.168.1.203'),
    (uid11, '2026-07-10 10:00:00', '192.168.1.203'),
    (uid12, '2026-07-10 15:00:00', '192.168.1.204'),
    (uid12, '2026-07-14 14:00:00', '192.168.1.204'),
    (uid13, '2026-07-11 16:00:00', '192.168.1.205'),
    (uid13, '2026-07-15 10:00:00', '192.168.1.205'),
    (uid14, '2026-07-13 11:00:00', '192.168.1.206'),
    (uid14, '2026-07-16 15:00:00', '192.168.1.206'),
    -- Cohort C
    (uid15, '2026-07-10 08:00:00', '192.168.1.301'),
    (uid15, '2026-07-13 09:00:00', '192.168.1.301'),
    (uid16, '2026-07-10 08:30:00', '192.168.1.302'),
    (uid16, '2026-07-14 09:30:00', '192.168.1.302'),
    (uid17, '2026-07-11 11:20:00', '192.168.1.303'),
    (uid17, '2026-07-14 10:00:00', '192.168.1.303'),
    (uid18, '2026-07-12 12:00:00', '192.168.1.304'),
    (uid18, '2026-07-15 11:30:00', '192.168.1.304'),
    (uid19, '2026-07-13 08:30:00', '192.168.1.305'),
    (uid19, '2026-07-16 09:00:00', '192.168.1.305'),
    (uid20, '2026-07-14 09:00:00', '192.168.1.306'),
    (uid20, '2026-07-16 10:30:00', '192.168.1.306'),
    -- Usuarios extra (más de 10 hrs de uso)
    (uid21, '2026-07-06 08:15:00', '192.168.1.401'),
    (uid21, '2026-07-08 09:30:00', '192.168.1.401'),
    (uid21, '2026-07-11 10:00:00', '192.168.1.401'),
    (uid21, '2026-07-14 11:00:00', '192.168.1.401'),
    (uid22, '2026-07-06 09:00:00', '192.168.1.402'),
    (uid22, '2026-07-07 10:30:00', '192.168.1.402'),
    (uid22, '2026-07-10 11:00:00', '192.168.1.402'),
    (uid22, '2026-07-13 10:30:00', '192.168.1.402'),
    -- Administradores
    (uid23, '2026-07-06 09:00:00', '192.168.1.501'),
    (uid23, '2026-07-08 10:00:00', '192.168.1.501'),
    (uid23, '2026-07-11 11:00:00', '192.168.1.501'),
    (uid24, '2026-07-06 10:00:00', '192.168.1.502'),
    (uid24, '2026-07-07 11:00:00', '192.168.1.502'),
    (uid24, '2026-07-10 12:00:00', '192.168.1.502');

  -- =============================================
  -- 4. TRADUCCIONES DE EJEMPLO
  -- =============================================

  INSERT INTO public.traducciones (id_usuario, id_tipo, texto_original, texto_traducido, precision, fecha_hora)
  VALUES
    -- ========================================================================
    -- COHORTE A: USUARIOS PRINCIPALES
    -- ========================================================================

    -- S-01: María Fernanda Cervantes Cervantes
    (uid01, 1, 'hola', 'Hola', 0.95, '2026-07-07 10:00:00'),
    (uid01, 1, 'gracias', 'Gracias', 0.98, '2026-07-07 10:01:00'),
    (uid01, 1, 'buenos días', 'Buenos días', 0.92, '2026-07-13 10:02:00'),
    (uid01, 1, 'señas voz', 'Señas a voz', 0.88, '2026-07-13 10:03:00'),
    (uid01, 2, 'hola', 'Hola', 0.90, '2026-07-13 10:05:00'),

    -- S-02: Carlos Alberto García García
    (uid02, 1, 'ayuda', 'Ayuda', 0.94, '2026-07-08 10:30:00'),
    (uid02, 1, 'mi nombre carlos', 'Mi nombre es Carlos', 0.82, '2026-07-08 10:31:00'),
    (uid02, 1, 'gracias escucharme', 'Gracias por escucharme', 0.91, '2026-07-14 10:32:00'),
    (uid02, 1, 'Necesito ayuda con el proyecto.', 'Necesito ayuda con el proyecto.', 0.96, '2026-07-14 10:35:00'),

    -- S-03: Sara Irene Díaz Ramírez
    (uid03, 1, 'hola', 'Hola', 0.90, '2026-07-08 10:00:00'),
    (uid03, 1, 'no entiendo', 'No entiendo', 0.78, '2026-07-08 10:02:00'),
    (uid03, 1, 'letra m y n', 'Letra M y N', 0.65, '2026-07-12 09:30:00'),
    (uid03, 1, 'El sistema confunde letras parecidas.', 'El sistema confunde letras parecidas.', 0.88, '2026-07-12 09:35:00'),

    -- S-04: Pedro Jovany Castañeda Aguilar - INC001
    (uid04, 1, 'luz', 'Luz', 0.60, '2026-07-07 10:20:00'),
    (uid04, 1, 'no ve', 'No ve bien', 0.55, '2026-07-07 10:21:00'),
    (uid04, 1, 'mejor ahora', 'Mejor ahora', 0.85, '2026-07-07 10:22:00'),
    (uid04, 1, 'puedes escucharme', '¿Puedes escucharme?', 0.75, '2026-07-07 10:23:00'),
    (uid04, 1, 'La luz mejora el reconocimiento.', 'La luz mejora el reconocimiento.', 0.91, '2026-07-09 10:45:00'),

    -- S-05: María Fernanda Ibarra Hernández
    (uid05, 1, 'hola', 'Hola', 0.97, '2026-07-10 12:00:00'),
    (uid05, 1, 'gracias', 'Gracias', 0.99, '2026-07-10 12:01:00'),
    (uid05, 1, 'sistema útil', 'El sistema es útil', 0.92, '2026-07-10 12:02:00'),
    (uid05, 1, 'Me gusta este sistema.', 'Me gusta este sistema.', 0.96, '2026-07-13 12:00:00'),

    -- S-06: Kevin Andrés Hernández Huerta
    (uid06, 1, 'reunión', 'Reunión', 0.82, '2026-07-11 09:00:00'),
    (uid06, 1, 'reporte', 'Reporte', 0.78, '2026-07-11 09:02:00'),
    (uid06, 1, 'trabajo', 'Trabajo', 0.85, '2026-07-14 10:30:00'),
    (uid06, 1, 'Falta vocabulario de oficina.', 'Falta vocabulario de oficina.', 0.90, '2026-07-14 10:35:00'),

    -- S-07: Susana Jaqueline Limones Flores
    (uid07, 1, 'inclusión', 'Inclusión', 0.93, '2026-07-12 09:15:00'),
    (uid07, 1, 'educación especial', 'Educación especial', 0.90, '2026-07-12 09:18:00'),
    (uid07, 1, 'alumnos sordos', 'Alumnos sordos', 0.88, '2026-07-15 11:00:00'),
    (uid07, 1, 'Excelente herramienta educativa.', 'Excelente herramienta educativa.', 0.96, '2026-07-15 11:05:00'),

    -- S-08: Briant Ricardo Dosal Sosa - INC003
    (uid08, 1, 'hola', 'Hola', 0.93, '2026-07-12 11:20:00'),
    (uid08, 1, 'gracias', 'Gracias', 0.95, '2026-07-12 11:22:00'),
    (uid08, 1, 'yo hablar', 'Yo quiero hablar', 0.82, '2026-07-15 14:30:00'),
    (uid08, 1, 'Buenos días a todos.', 'Buenos días a todos.', 0.93, '2026-07-15 14:35:00'),

    -- ========================================================================
    -- COHORTE B: INTERLOCUTORES DIRECTOS
    -- ========================================================================

    -- S-09: Cristhian Osiel García Pérez
    (uid09, 2, 'hermana', 'Hermana', 0.88, '2026-07-09 14:30:00'),
    (uid09, 2, 'gracias', 'Gracias', 0.92, '2026-07-09 14:32:00'),
    (uid09, 2, 'no entiendo', 'No entiendo', 0.80, '2026-07-13 15:30:00'),
    (uid09, 2, 'Pude comunicarme con mi hermana.', 'Pude comunicarme con mi hermana.', 0.95, '2026-07-13 15:35:00'),

    -- S-10: Zuleyca Alejandra Muñoz Contreras
    (uid10, 2, 'qué dijo', '¿Qué dijo?', 0.78, '2026-07-09 14:30:00'),
    (uid10, 1, 'sistema lento', 'El sistema está lento', 0.72, '2026-07-09 14:32:00'),
    (uid10, 2, 'escuchar mejor', 'Escuchar mejor', 0.75, '2026-07-14 16:00:00'),
    (uid10, 2, 'El audio se escucha entrecortado.', 'El audio se escucha entrecortado.', 0.84, '2026-07-14 16:05:00'),

    -- S-11: Miguel Ángel Arrieta Vázquez - INC002
    (uid11, 2, 'audio no funciona', 'El audio no funciona', 0.40, '2026-07-09 14:42:00'),
    (uid11, 2, 'safari malo', 'Safari no sirve', 0.45, '2026-07-09 14:45:00'),
    (uid11, 2, 'chrome mejor', 'Chrome es mejor', 0.70, '2026-07-10 10:00:00'),
    (uid11, 2, 'El audio tardaba mucho en Safari.', 'El audio tardaba mucho en Safari.', 0.82, '2026-07-10 10:05:00'),
    (uid11, 2, 'Gracias por tu paciencia.', 'Gracias por tu paciencia.', 0.88, '2026-07-10 10:10:00'),

    -- S-12: Emiliano Garza Talamantes
    (uid12, 2, 'gracias', 'Gracias', 0.90, '2026-07-10 15:00:00'),
    (uid12, 1, 'sobrino', 'Sobrino', 0.87, '2026-07-10 15:02:00'),
    (uid12, 2, 'comunicación fácil', 'Comunicación fácil', 0.85, '2026-07-14 14:00:00'),
    (uid12, 2, 'Entendí a mi sobrino al instante.', 'Entendí a mi sobrino al instante.', 0.93, '2026-07-14 14:05:00'),

    -- S-13: Patricia Verónica Juárez Pulido
    (uid13, 2, 'clase inclusiva', 'Clase inclusiva', 0.89, '2026-07-11 16:00:00'),
    (uid13, 2, 'estudiantes sordos', 'Estudiantes sordos', 0.91, '2026-07-11 16:02:00'),
    (uid13, 2, 'bienvenidos', 'Bienvenidos', 0.94, '2026-07-11 16:30:00'),
    (uid13, 2, 'Bienvenido a la clase de TI.', 'Bienvenido a la clase de TI.', 0.95, '2026-07-11 16:32:00'),

    -- S-14: Ricardo David Castillo Arce
    (uid14, 2, 'firefox lento', 'Firefox es lento', 0.65, '2026-07-13 11:00:00'),
    (uid14, 2, 'cámara mala', 'La cámara es mala', 0.62, '2026-07-13 11:02:00'),
    (uid14, 2, 'no reconoce', 'No reconoce bien', 0.70, '2026-07-16 15:00:00'),
    (uid14, 2, 'Firefox es más lento que Chrome.', 'Firefox es más lento que Chrome.', 0.76, '2026-07-16 15:05:00'),

    -- ========================================================================
    -- COHORTE C: APRENDICES DE LSM
    -- ========================================================================

    -- S-15: Emily Jaquelín Alanís Jasso
    (uid15, 1, 'letra r difícil', 'La R es difícil', 0.70, '2026-07-10 08:30:00'),
    (uid15, 1, 'a b c', 'A B C', 0.85, '2026-07-10 08:32:00'),
    (uid15, 1, 'hola', 'Hola', 0.90, '2026-07-10 08:35:00'),
    (uid15, 1, 'Aprendo LSM con el sistema.', 'Aprendo LSM con el sistema.', 0.92, '2026-07-13 09:15:00'),

    -- S-16: Jorge Gómez Herrera
    (uid16, 1, 'seña', 'Seña', 0.78, '2026-07-10 08:30:00'),
    (uid16, 1, 'j y z', 'J y Z', 0.68, '2026-07-10 08:32:00'),
    (uid16, 1, 'posición correcta', 'Posición correcta', 0.80, '2026-07-14 09:30:00'),
    (uid16, 1, 'La interfaz es bonita y moderna.', 'La interfaz es bonita y moderna.', 0.90, '2026-07-14 09:35:00'),

    -- S-17: Marco Antonio Ramírez Amabilis - INC004
    (uid17, 1, 'j', 'J', 0.35, '2026-07-11 11:25:00'),
    (uid17, 1, 'z', 'Z', 0.30, '2026-07-11 11:26:00'),
    (uid17, 1, 'a b c', 'A B C', 0.88, '2026-07-11 11:28:00'),
    (uid17, 1, 'j', 'J', 0.55, '2026-07-14 10:15:00'),
    (uid17, 1, 'z', 'Z', 0.50, '2026-07-14 10:16:00'),

    -- S-18: Alondra Jazmín Caballero López
    (uid18, 1, 'diseño bonito', 'Diseño bonito', 0.88, '2026-07-12 12:00:00'),
    (uid18, 1, 'mano esqueleto', 'Esqueleto de la mano', 0.85, '2026-07-12 12:02:00'),
    (uid18, 1, 'posición dedos', 'Posición de dedos', 0.82, '2026-07-15 11:30:00'),
    (uid18, 1, 'El diseño visual es futurista.', 'El diseño visual es futurista.', 0.92, '2026-07-15 11:35:00'),

    -- S-19: María Monzerrath Lara Morones
    (uid19, 1, 'hola', 'Hola', 0.95, '2026-07-13 09:00:00'),
    (uid19, 1, 'mucho gusto', 'Mucho gusto', 0.96, '2026-07-13 09:01:00'),
    (uid19, 1, 'nombre valeria', 'Mi nombre es Valeria', 0.90, '2026-07-13 09:02:00'),
    (uid19, 1, 'Aprendo LSM como cuarta lengua.', 'Aprendo LSM como cuarta lengua.', 0.97, '2026-07-16 09:05:00'),

    -- S-20: Gustavo Rosales Luna
    (uid20, 1, 'a', 'A', 0.80, '2026-07-14 09:30:00'),
    (uid20, 1, 'b', 'B', 0.75, '2026-07-14 09:31:00'),
    (uid20, 1, 'lejos', 'Lejos', 0.70, '2026-07-14 09:33:00'),
    (uid20, 1, 'La distancia afecta el reconocimiento.', 'La distancia afecta el reconocimiento.', 0.85, '2026-07-14 09:35:00'),
    -- Usuarios extra (+10 hrs)
    (uid21, 1, 'hola', 'Hola', 0.97, '2026-07-06 08:30:00'),
    (uid21, 1, 'gracias', 'Gracias', 0.98, '2026-07-06 08:31:00'),
    (uid21, 1, 'yo sordo', 'Yo soy sordo', 0.88, '2026-07-06 08:33:00'),
    (uid21, 1, 'comunicación fácil', 'Comunicación fácil', 0.90, '2026-07-08 09:45:00'),
    (uid21, 1, 'La página se ponia lenta con mucho uso.', 'La página se ponia lenta con mucho uso.', 0.92, '2026-07-11 10:15:00'),
    (uid21, 1, 'necesito clases', 'Necesito clases', 0.85, '2026-07-14 11:15:00'),
    (uid22, 1, 'buenos días', 'Buenos días', 0.95, '2026-07-06 09:15:00'),
    (uid22, 1, 'como estás', '¿Cómo estás?', 0.92, '2026-07-06 09:17:00'),
    (uid22, 1, 'yo aprender', 'Yo quiero aprender', 0.82, '2026-07-07 10:45:00'),
    (uid22, 1, 'letras difícil', 'Letras difíciles', 0.78, '2026-07-10 11:15:00'),
    (uid22, 1, 'A veces la página se congelaba y tenía que recargar.', 'A veces la página se congelaba y tenía que recargar.', 0.88, '2026-07-13 10:45:00'),
    -- Administradores
    (uid23, 1, 'hola', 'Hola', 0.96, '2026-07-06 09:15:00'),
    (uid23, 1, 'gracias', 'Gracias', 0.97, '2026-07-06 09:16:00'),
    (uid23, 1, 'sistema funcionando', 'Sistema funcionando', 0.95, '2026-07-08 10:15:00'),
    (uid24, 1, 'buenos días', 'Buenos días', 0.94, '2026-07-06 10:15:00'),
    (uid24, 1, 'prueba completa', 'Prueba completa', 0.93, '2026-07-07 11:15:00');

  -- =============================================
  -- 5. AVANCES (PROGRESO) DE USUARIOS
  -- =============================================

  INSERT INTO public.avances (id_usuario, traducciones_realizadas, tiempo_uso_minutos, precision_promedio, fecha)
  VALUES
    -- Cohort A
    (uid01, 9, 34, 0.93, '2026-07-07'),
    (uid01, 7, 30, 0.95, '2026-07-13'),
    (uid02, 11, 37, 0.91, '2026-07-08'),
    (uid02, 6, 33, 0.94, '2026-07-14'),
    (uid03, 8, 31, 0.85, '2026-07-08'),
    (uid03, 6, 28, 0.88, '2026-07-12'),
    (uid04, 14, 55, 0.68, '2026-07-07'),
    (uid04, 9, 38, 0.89, '2026-07-09'),
    (uid05, 10, 42, 0.96, '2026-07-10'),
    (uid05, 8, 36, 0.97, '2026-07-13'),
    (uid06, 7, 33, 0.82, '2026-07-11'),
    (uid06, 8, 35, 0.85, '2026-07-14'),
    (uid07, 10, 48, 0.90, '2026-07-12'),
    (uid07, 6, 41, 0.92, '2026-07-15'),
    (uid08, 5, 27, 0.88, '2026-07-12'),
    (uid08, 7, 31, 0.93, '2026-07-15'),
    -- Cohort B
    (uid09, 6, 29, 0.86, '2026-07-09'),
    (uid09, 5, 33, 0.88, '2026-07-13'),
    (uid10, 5, 26, 0.80, '2026-07-09'),
    (uid10, 6, 30, 0.84, '2026-07-14'),
    (uid11, 8, 46, 0.52, '2026-07-09'),
    (uid11, 7, 35, 0.78, '2026-07-10'),
    (uid12, 5, 32, 0.87, '2026-07-10'),
    (uid12, 6, 28, 0.89, '2026-07-14'),
    (uid13, 9, 36, 0.92, '2026-07-11'),
    (uid13, 7, 34, 0.94, '2026-07-15'),
    (uid14, 4, 23, 0.72, '2026-07-13'),
    (uid14, 5, 19, 0.76, '2026-07-16'),
    -- Cohort C
    (uid15, 9, 30, 0.78, '2026-07-10'),
    (uid15, 10, 35, 0.88, '2026-07-13'),
    (uid16, 6, 29, 0.75, '2026-07-10'),
    (uid16, 7, 31, 0.80, '2026-07-14'),
    (uid17, 10, 52, 0.42, '2026-07-11'),
    (uid17, 8, 22, 0.65, '2026-07-14'),
    (uid18, 7, 24, 0.79, '2026-07-12'),
    (uid18, 8, 33, 0.84, '2026-07-15'),
    (uid19, 12, 52, 0.93, '2026-07-13'),
    (uid19, 9, 44, 0.95, '2026-07-16'),
    (uid20, 5, 24, 0.70, '2026-07-14'),
    (uid20, 5, 20, 0.78, '2026-07-16'),
    -- Usuarios extra (+10 hrs total)
    (uid21, 31, 347, 0.86, '2026-07-06'),
    (uid21, 25, 286, 0.88, '2026-07-08'),
    (uid21, 18, 195, 0.91, '2026-07-11'),
    (uid22, 27, 302, 0.83, '2026-07-06'),
    (uid22, 23, 258, 0.85, '2026-07-07'),
    (uid22, 16, 178, 0.89, '2026-07-10'),
    -- Administradores
    (uid23, 15, 180, 0.88, '2026-07-06'),
    (uid23, 12, 150, 0.90, '2026-07-08'),
    (uid24, 18, 200, 0.85, '2026-07-06'),
    (uid24, 14, 160, 0.87, '2026-07-07');

  -- =============================================
  -- 6. EVALUACIONES
  -- Cada evaluación refleja el perfil del usuario,
  -- su cohorte y los incidentes documentados.
  -- =============================================

  INSERT INTO public.evaluaciones
    (id_usuario, resolucion, iluminacion, distancia, p4_uso_frecuente, p5_complicado, p6_facil_interactuar, p7_necesita_ayuda, p8_traduccion_natural, voz_satisfaccion, esfuerzo_mental, dispositivo, navegador, experiencia_previa, problemas, sugerencias, experiencia_general, recomendaria, facil_aprender, util_educativo, funcion_mas_util, senas_dificiles, fecha)
  VALUES
    -- ========================================================================
    -- COHORTE A: USUARIOS PRINCIPALES (Personas con discapacidad auditiva/del habla)
    -- ========================================================================

    -- S-01: María Fernanda Cervantes Cervantes
    -- Perfil: Mujer, 20 años, estudiante de TI, usuaria nativa de LSM
    -- Evaluación: Muy positiva. Encontró el sistema intuitivo y liberador.
    (uid01,
      'Alta resolución (HD/Full HD)',
      'Buena y constante',
      'A una distancia cómoda (50 cm a 1 metro)',
      5, 2, 5, 1, 4, 4,
      'Fue muy fácil, no requirió esfuerzo.',
      'Laptop',
      'Google Chrome',
             'No',
      'La página tardó un poco en cargar al iniciar y los botones se sentían lentos al cambiar de sección.',
      'La voz es clara pero se escucha un poco robótica. Me gustaría poder elegir entre distintas voces, tal vez una más natural o con diferentes tonos. También sería bueno poder ajustar la velocidad de la traducción.',
      5, 'Sí', 4, 5,
      'La función de traducción automática de señas a voz, porque me permite comunicarme sin depender de un intérprete en conversaciones sencillas.',
      'La letra M a veces la confunde con la N, pero en general reconoce bien la mayoría de las letras.',
      '2026-07-07 11:30:00'),

    -- S-02: Juan Manuel Véliz Arce
    -- Perfil: Hombre, 21 años, estudiante de TI, sordo de nacimiento
    -- Evaluación: Entusiasta. Usó el sistema para comunicarse con compañeros oyentes.
    (uid02,
      'Alta resolución (HD/Full HD)',
      'Buena y constante',
      'A una distancia cómoda (50 cm a 1 metro)',
      5, 1, 4, 2, 5, 5,
      'Fue muy fácil, no requirió esfuerzo.',
      'PC de escritorio',
      'Google Chrome',
             'No',
      'Se quedaba cargando varios segundos al abrir la página y la interfaz se congeló un par de veces.',
      'Es una herramienta que cambia la vida. Pude mantener una conversación fluida con mi compañero de clases sin necesidad de escribir en un papel. Si pudieran agregar señas de uso cotidiano como gracias, por favor o permiso como palabras completas sería increíble.',
      5, 'Sí', 4, 5,
      'La traducción de palabras completas, me ahorra mucho tiempo al comunicarme con mis compañeros oyentes.',
      NULL,
      '2026-07-08 11:45:00'),

    -- S-03: Sara Irene Díaz Ramírez
    -- Perfil: Mujer, 22 años, estudiante, hipoacúsica bilateral
    -- Evaluación: Positiva con observaciones. Notó problemas en caracteres específicos.
    (uid03,
      'Resolución estándar',
      'Buena y constante',
      'A una distancia cómoda (50 cm a 1 metro)',
      4, 2, 4, 3, 3, 3,
      'Requirió un poco de atención, pero fue fluido.',
      'Laptop',
      'Microsoft Edge',
      'No',
      'Algunas letras como la M y la N no las reconoce bien. A veces confunde los movimientos cuando hago señas muy rápido.',
      'El sistema es prometedor pero necesita mejorar el reconocimiento de señas con movimientos similares. Sugiero que añadan un modo de calibración donde el usuario pueda registrar sus propias variantes de cada seña.',
      4, 'Sí', 3, 4,
      'La función de deletreo para el abecedario, porque es la base para poder comunicar cualquier palabra.',
      'M y N se confunden, también la E y la I en algunas posiciones de la mano.',
      '2026-07-08 11:00:00'),

    -- S-04: Pedro Jovany Castañeda Aguilar
    -- Perfil: Hombre, 22 años, sordo profundo, comunicador visual nativo
    -- INC001: Problema de iluminación (sombra dura por ventana) que afectó los landmarks
    -- Evaluación: Al inicio frustrante, después positiva tras mitigación.
    (uid04,
      'Alta resolución (HD/Full HD)',
      'Un poco oscura o con luz variable',
      'A una distancia cómoda (50 cm a 1 metro)',
      4, 3, 3, 2, 3, 4,
      'Tuve que concentrarme mucho y hacer mucho esfuerzo mental.',
      'Laptop',
      'Google Chrome',
      'No',
      'Al principio la luz de la ventana no dejaba que la cámara viera bien mis manos. Se sentía frustrante porque no detectaba los movimientos que hacía. Se perdía el seguimiento de mis dedos y el sistema dejaba de traducir a media frase. Después que ajustaron la luz en el laboratorio (cerraron la cortina y pusieron una lámpara) mejoró mucho y ya funcionaba bien.',
      'Sería bueno que el sistema advierta cuando hay problemas de iluminación o distancia para que el usuario pueda ajustar su posición antes de empezar a comunicarse. También podría haber un indicador visual de calidad de la captura.',
      4, 'Sí', 3, 5,
      'Pasar las señas a voz en tiempo real. Cuando funcionó bien, se sintió mágico poder comunicarme sin barreras.',
      'Las señas que requieren movimiento fuera del plano frontal (como la letra J) las detectaba mejor después del ajuste de luz.',
      '2026-07-09 14:15:00'),

    -- S-05: María Fernanda Ibarra Hernández
    -- Perfil: Mujer, 21 años, estudiante de TI, usuaria activa de LSM
    -- Evaluación: Muy positiva. Usó el sistema con su familia oyente.
    (uid05,
      'Alta resolución (HD/Full HD)',
      'Buena y constante',
      'A una distancia cómoda (50 cm a 1 metro)',
      5, 1, 5, 1, 5, 5,
      'Fue muy fácil, no requirió esfuerzo.',
      'Laptop',
      'Google Chrome',
      'No',
      'No tuve ningún problema grave. Solo al principio me confundí con la distancia, pero una vez que me coloqué en la posición correcta todo fluyó muy natural.',
      'Es la primera vez que veo algo así. Mis papás estaban emocionados de poder entenderme sin que yo tenga que escribir. Ojalá esta tecnología llegue a más lugares como escuelas y hospitales. La recomiendo totalmente.',
      5, 'Sí', 5, 5,
      'La función de voz automática al detectar la seña. Me encantó que no tuviera que presionar ningún botón, solo hacer la seña y el sistema solito la traduce y la dice en voz alta.',
      NULL,
      '2026-07-10 11:00:00'),

    -- S-06: Kevin Andrés Hernández Huerta
    -- Perfil: Hombre, 23 años, estudiante de TI, sordo
    -- Evaluación: Buena, pero notó limitación en el vocabulario disponible.
    (uid06,
      'Resolución estándar',
      'Buena y constante',
      'A una distancia cómoda (50 cm a 1 metro)',
      4, 2, 4, 3, 4, 4,
      'Requirió un poco de atención, pero fue fluido.',
      'Laptop',
      'Google Chrome',
             'No',
      'Después de unos minutos la página se ponía muy lenta y los gráficos de la mano se movían entrecortados.',
      'Me gustaría que hubiera más señas precargadas. Solo tiene el abecedario y palabras básicas. Para comunicar ideas más complejas necesito deletrear letra por letra, lo que ralentiza la conversación. Si pudieran agregar un banco de señas comunes para el trabajo (como reunión, reporte, junta, oficina) sería excelente.',
      4, 'Sí', 4, 5,
      'Poder deletrear palabras que no están en el vocabulario del sistema usando el abecedario dactilológico.',
      'La letra R - a veces la confunde con la V cuando la giro un poco.',
      '2026-07-11 11:00:00'),

    -- S-07: Susana Jaqueline Limones Flores
    -- Perfil: Mujer, 22 años, estudiante, hipoacúsica
    -- Evaluación: Muy positiva, valora el impacto educativo.
    (uid07,
      'Alta resolución (HD/Full HD)',
      'Buena y constante',
      'Muy cerca (menos de 50 cm)',
      5, 2, 5, 2, 5, 5,
      'Fue muy fácil, no requirió esfuerzo.',
      'Laptop',
      'Google Chrome',
      'No',
      'Al inicio me coloqué muy cerca de la cámara porque quería asegurarme de que viera bien mis manos, pero el sistema me marcaba que estaba muy cerca. Una vez que me alejé un poco, funcionó de maravilla.',
      'Esta herramienta debería estar disponible en todas las escuelas que tengan estudiantes con discapacidad auditiva. Como docente, veo un potencial enorme para la inclusión educativa. La voz es clara y se entiende bien.',
      5, 'Sí', 4, 5,
      'La utilidad educativa - poder comunicarme con mis alumnos sordos sin necesidad de un intérprete presente en todo momento.',
      NULL,
      '2026-07-12 11:30:00'),

    -- S-08: Briant Ricardo Dosal Sosa
    -- Perfil: Hombre, 22 años, sordo, nivel de lectura básico
    -- INC003: Barreras de comprensión de la escala Likert, requirió intérprete de LSM
    -- Evaluación: Requirió apoyo del intérprete. Respuestas auténticas tras mediación.
    (uid08,
      'Alta resolución (HD/Full HD)',
      'Buena y constante',
      'A una distancia cómoda (50 cm a 1 metro)',
      5, 1, 4, 4, 5, 5,
      'Fue muy fácil, no requirió esfuerzo.',
      'Laptop',
      'Google Chrome',
      'No',
      'Al principio no entendía bien las preguntas escritas del formulario, tienen palabras difíciles. Pero el intérprete me ayudó explicándome en señas cada pregunta, así pude contestar bien. El sistema en sí me gustó mucho, es fácil de usar cuando te explican cómo funciona.',
      'Sería bueno que las instrucciones y preguntas de la plataforma también estén en LSM, con videos o animaciones, para que las personas sordas podamos entender sin ayuda de un intérprete. La interfaz es bonita pero tiene mucho texto.',
      5, 'Sí', 4, 5,
      'La función de hablar por mí, puedo comunicar lo que quiero decir sin escribir.',
      'Las preguntas del sistema deberían estar también en LSM.',
      '2026-07-12 14:45:00'),

    -- ========================================================================
    -- COHORTE B: INTERLOCUTORES DIRECTOS (Oyentes sin conocimiento de LSM)
    -- ========================================================================

    -- S-09: Cristhian Osiel García Pérez
    -- Perfil: Hombre, 21 años, compañero de clase, oyente sin LSM
    -- Evaluación: Muy positiva. Valora la conexión familiar que facilita.
    (uid09,
      'Alta resolución (HD/Full HD)',
      'Buena y constante',
      'A una distancia cómoda (50 cm a 1 metro)',
      5, 2, 4, 2, 4, 5,
      'Requirió un poco de atención, pero fue fluido.',
      'Laptop',
      'Google Chrome',
             'No',
      'Al principio la página no cargaba bien, tuve que recargar varias veces para que funcionara la cámara.',
      'Poder entender lo que mi hermana me quiere decir sin necesidad de un intérprete es algo que siempre soñé. La voz se escucha un poco robótica pero se entiende perfectamente. Me gustaría que hubiera una opción de voz femenina y masculina para elegir.',
      5, 'Sí', 3, 5,
      'Poder comunicarme con mi hermana en conversaciones cotidianas, ya no necesitamos papel y lápiz.',
      NULL,
      '2026-07-09 15:45:00'),

    -- S-10: Zuleyca Alejandra Muñoz Contreras
    -- Perfil: Mujer, 22 años, estudiante universitaria oyente, compañera de clase
    -- Evaluación: Buena, notó problemas de audio esporádicos.
    (uid10,
      'Resolución estándar',
      'Buena y constante',
      'A una distancia cómoda (50 cm a 1 metro)',
      4, 3, 4, 1, 3, 4,
      'Requirió un poco de atención, pero fue fluido.',
      'Laptop',
      'Google Chrome',
      'No',
      'A veces el audio se escuchaba entrecortado, como que se cortaba a media palabra. No sé si era problema del internet o del sistema.',
      'Está muy bien para ser una primera versión. Podrían añadir una opción para que el usuario pueda ver el historial de lo que se ha traducido en la sesión, porque a veces no alcanzo a escuchar bien la primera vez.',
      4, 'Sí', 3, 4,
      'El reconocimiento del abecedario en tiempo real, muy útil para cuando mi compañero necesita deletrear alguna palabra.',
      NULL,
      '2026-07-09 16:15:00'),

    -- S-11: Miguel Ángel Arrieta Vázquez
    -- Perfil: Hombre, 22 años, estudiante universitario oyente, sin LSM
    -- INC002: Pico de latencia de 15023ms en Safari / macOS
    -- Evaluación: Experiencia inicial muy mala por el bug de Safari, mejoró en Chrome.
    (uid11,
      'Alta resolución (HD/Full HD)',
      'Buena y constante',
      'A una distancia cómoda (50 cm a 1 metro)',
      3, 4, 3, 3, 2, 2,
      'Tuve que concentrarme mucho y hacer mucho esfuerzo mental.',
      'Laptop',
      'Safari',
      'No',
      'El audio tardaba muchísimo en salir. La primera vez que lo probé, hice la seña y esperé como 15 segundos y nada. Pensé que no funcionaba. Después me di cuenta que era porque estaba usando Safari. Cuando cambié a Google Chrome mejoró bastante, pero aún así sentí que a veces tenía que esperar para escuchar la respuesta.',
      'Sugiero que indiquen claramente qué navegadores son compatibles antes de empezar. Perdí 10 minutos pensando que el sistema no funcionaba. También sería bueno optimizar el audio para que sea más rápido.',
      3, 'Sí', 2, 4,
      'La idea en sí es muy buena para la inclusión en el aula, pero necesita mejorar en velocidad de respuesta.',
      NULL,
      '2026-07-09 10:30:00'),

    -- S-12: Emiliano Garza Talamantes
    -- Perfil: Hombre, 21 años, estudiante, familiar de persona sorda
    -- Evaluación: Positiva. Valora la accesibilidad.
    (uid12,
      'Alta resolución (HD/Full HD)',
      'Buena y constante',
      'A una distancia cómoda (50 cm a 1 metro)',
      4, 2, 5, 1, 4, 4,
      'Fue muy fácil, no requirió esfuerzo.',
      'PC de escritorio',
      'Google Chrome',
             'No',
      'Se sentía pesada la página, tardaba en responder a los clics y el feed de la cámara se veía lento.',
      'Me sorprendió lo bien que funciona. Mi sobrino que es sordo lo usó para decirme que tenía hambre y pude entenderlo inmediatamente. Antes tenía que adivinar o que él escribiera en su teléfono.',
      4, 'Sí', 3, 4,
      'Poder comunicarme con mi sobrino en tiempo real sin intermediarios.',
      NULL,
      '2026-07-10 14:30:00'),

    -- S-13: Nancy Carolina Flores Navarro
    -- Perfil: Mujer, 22 años, estudiante, oyente, interesada en inclusión
    -- Evaluación: Excelente. Ve un gran potencial en el aula.
    (uid13,
      'Alta resolución (HD/Full HD)',
      'Buena y constante',
      'A una distancia cómoda (50 cm a 1 metro)',
      5, 2, 5, 2, 5, 5,
      'Fue muy fácil, no requirió esfuerzo.',
      'Laptop',
      'Google Chrome',
             'No',
      'La página se congeló un par de veces al navegar entre las secciones de la aplicación.',
      'Como docente de la UTD, veo un potencial enorme para incluir a estudiantes sordos en mis clases. La calidad de la traducción es buena y el sistema es intuitivo. Sería excelente que todos los salones tuvieran acceso a esta herramienta. Mi sugerencia principal es que desarrollen un manual o guía rápida para docentes.',
      5, 'Sí', 4, 5,
      'La accesibilidad para incluir a estudiantes sordos en el salón de clases sin depender de un intérprete externo.',
      NULL,
      '2026-07-11 10:30:00'),

    -- S-14: Ricardo David Castillo Arce
    -- Perfil: Hombre, 22 años, estudiante, oyente
    -- Evaluación: Regular. Usó Firefox y notó lentitud.
    (uid14,
      'Resolución estándar',
      'Un poco oscura o con luz variable',
      'A una distancia cómoda (50 cm a 1 metro)',
      4, 2, 4, 3, 3, 3,
      'Requirió un poco de atención, pero fue fluido.',
      'Laptop',
      'Firefox',
      'No',
      'En Firefox sentí que el sistema era más lento, como que tardaba en procesar las señas. No sé si sea porque mi laptop no es muy potente o por el navegador. También noté que mi cámara no tiene muy buena calidad y eso afectaba.',
      'Sugiero que optimicen el sistema para funcionar bien en diferentes navegadores, no solo Chrome. También sería útil que funcione con cámaras de baja resolución.',
      3, 'Tal vez', 2, 4,
      'La función de traducción de letras deletreadas, aunque a veces no reconocía bien mis dedos.',
      'La letra Y y la V las confunde cuando las hago rápido.',
      '2026-07-13 15:30:00'),

    -- ========================================================================
    -- COHORTE C: APRENDICES DE LSM (Estudiantes oyentes aprendiendo LSM)
    -- ========================================================================

    -- S-15: Emily Jaquelín Alanís Jasso
    -- Perfil: Mujer, 21 años, estudiante, aprendiendo LSM
    -- Evaluación: Muy positiva como herramienta didáctica.
    (uid15,
      'Alta resolución (HD/Full HD)',
      'Buena y constante',
      'A una distancia cómoda (50 cm a 1 metro)',
      5, 3, 4, 2, 4, 4,
      'Requirió un poco de atención, pero fue fluido.',
      'Laptop',
      'Google Chrome',
             'No',
      'La página se ponía lenta después de un rato y los movimientos de la mano se veían retrasados.',
      'Es una herramienta excelente para practicar LSM. Poder ver si estoy haciendo bien la seña mientras aprendo es muy valioso. Me gustaría que tuviera un modo de aprendizaje con lecciones graduales, donde empieces con letras fáciles y vayas avanzando. También ayudaría tener un video de referencia de cómo se hace cada seña correctamente.',
      4, 'Sí', 4, 5,
      'Practicar el abecedario en LSM porque me da retroalimentación inmediata de si lo estoy haciendo bien o mal.',
      'La letra R me costó trabajo, pero el sistema me ayudó porque no la reconocía hasta que ajusté la posición de mis dedos. La J también fue complicada al principio.',
      '2026-07-10 09:30:00'),

    -- S-16: Jorge Gómez Herrera
    -- Perfil: Hombre, 22 años, estudiante, aprendiendo LSM
    -- Evaluación: Buena, notó que letras con movimiento son difíciles.
    (uid16,
      'Alta resolución (HD/Full HD)',
      'Buena y constante',
      'A una distancia cómoda (50 cm a 1 metro)',
      4, 2, 5, 2, 3, 3,
      'Requirió un poco de atención, pero fue fluido.',
      'Laptop',
      'Google Chrome',
             'No',
      'El sistema se trabó un momento al cambiar entre la seña J y la Z, la pantalla se quedó congelada unos segundos.',
      'Está muy bien diseñado. La interfaz es bonita y moderna. Como aprendiz de LSM, me gusta que pueda practicar solo y saber si lo estoy haciendo bien. El feedback visual es muy útil. Agregaría una función de repetición de la última seña para practicar las que salieron mal.',
      4, 'Sí', 3, 4,
      'La retroalimentación visual que te dice qué seña detectó, así puedes corregir tu posición.',
      'Las letras con movimiento como J y Z requieren práctica, el sistema es exigente pero eso ayuda a aprender mejor.',
      '2026-07-10 10:00:00'),

    -- S-17: Marco Antonio Ramírez Amabilis
    -- Perfil: Hombre, 22 años, estudiante de TI, aprendiendo LSM
    -- INC004: Falla del clasificador LSTM con dactilología dinámica (J y Z) en laptop de baja tasa de refresco
    -- Evaluación: Notó problemas con letras específicas por limitaciones de hardware.
    (uid17,
      'Resolución estándar',
      'Buena y constante',
      'A una distancia cómoda (50 cm a 1 metro)',
      4, 3, 3, 3, 2, 3,
      'Tuve que concentrarme mucho y hacer mucho esfuerzo mental.',
      'Laptop',
      'Google Chrome',
      'No',
      'Las letras J y Z no las reconoce bien en mi laptop. Las intenté muchas veces y solo a veces las detectaba. Creo que es porque mi cámara es de baja resolución y la laptop es algo vieja. Los chicos del equipo ajustaron algo en el sistema y mejoró un poco, pero todavía batallaba con esas letras. Las letras estáticas como A, B, C sí funcionaban bien.',
      'Entiendo que mi laptop no es la mejor, pero si pudieran hacer que funcione mejor en equipos más modestos sería genial. Tal vez un modo de bajo rendimiento que sacrifique calidad visual pero mejore el reconocimiento.',
      3, 'Sí', 3, 4,
      'El abecedario dactilológico, porque es la base del aprendizaje de LSM.',
      'J y Z definitivamente, por el movimiento. También la Ñ a veces no la detectaba bien.',
      '2026-07-11 10:30:00'),

    -- S-18: Alondra Jazmín Caballero López
    -- Perfil: Mujer, 21 años, estudiante, aprendiendo LSM
    -- Evaluación: Buena, valora la retroalimentación visual.
    (uid18,
      'Resolución estándar',
      'Buena y constante',
      'A una distancia cómoda (50 cm a 1 metro)',
      4, 2, 4, 2, 4, 4,
      'Requirió un poco de atención, pero fue fluido.',
      'Laptop',
      'Google Chrome',
             'No',
      'La página se sentía pesada al cargar los gráficos del esqueleto de la mano en pantalla.',
      'El diseño visual de la plataforma está muy padre, se ve futurista. Como estudiante de diseño valoro mucho eso. La retroalimentación visual de las manos en la pantalla ayuda a saber si estás en la posición correcta. Sería útil tener un modo oscuro más pronunciado y que los colores de las manos cambien cuando la detección sea correcta.',
      4, 'Sí', 4, 5,
      'Ver en pantalla el esqueleto de mi mano mientras hago la seña, eso me ayuda a corregir la posición de los dedos.',
      NULL,
      '2026-07-12 12:00:00'),

    -- S-19: María Monzerrath Lara Morones
    -- Perfil: Mujer, 22 años, estudiante, aprendiendo LSM
    -- Evaluación: Excelente. Tuvo una experiencia muy fluida.
    (uid19,
      'Alta resolución (HD/Full HD)',
      'Buena y constante',
      'A una distancia cómoda (50 cm a 1 metro)',
      5, 1, 5, 1, 5, 5,
      'Fue muy fácil, no requirió esfuerzo.',
      'Laptop',
      'Google Chrome',
             'No',
      'No tuve problemas graves, solo que al inicio la página tardó unos segundos en cargar completamente.',
      'Me encantó. Estoy aprendiendo LSM por mi cuenta y esto es como tener un tutor que te corrige al instante. La velocidad de reconocimiento es muy buena y la interfaz es intuitiva. Lo recomendaría a cualquiera que quiera aprender LSM.',
      5, 'Sí', 5, 5,
      'La retroalimentación inmediata al hacer las señas, te dice exactamente qué letra estás haciendo y si la estás haciendo bien.',
      NULL,
      '2026-07-13 09:30:00'),

    -- S-20: Gustavo Rosales Luna
    -- Perfil: Hombre, 21 años, estudiante, aprendiendo LSM
    -- Evaluación: Regular. Estaba muy lejos de la cámara y tuvo problemas de detección.
    (uid20,
      'Resolución estándar',
      'Buena y constante',
      'Lejos (más de 1 metro)',
      3, 4, 3, 4, 3, 3,
      'Requirió un poco de atención, pero fue fluido.',
      'PC de escritorio',
      'Microsoft Edge',
      'No',
      'Estaba un poco lejos de la cámara porque el escritorio es grande y no siempre detectaba bien mis manos. Tenía que acercarme o estirar los brazos para que funcionara. También me costó trabajo entender al principio cómo colocar las manos para que las reconociera.',
      'Una guía o tutorial interactivo dentro de la aplicación para aprender la posición correcta de las manos y la distancia adecuada a la cámara. Tal vez un asistente virtual que te guíe en los primeros pasos cuando inicias sesión por primera vez.',
      3, 'Tal vez', 3, 4,
      'El abecedario, aunque me costó trabajo al principio aprender la posición.',
      'Casi todas las letras me costaron al principio porque no sabía la distancia correcta. Una vez que me acerqué, funcionaban mejor.',
      '2026-07-14 11:00:00'),

    -- S-21: Josué Joán Hernández Tavizón
    -- Perfil: Hombre, 23 años, estudiante de TI, desarrollador del proyecto
    -- Evaluación: Positiva. Usó el sistema muchas horas.
    (uid21,
      'Alta resolución (HD/Full HD)',
      'Buena y constante',
      'A una distancia cómoda (50 cm a 1 metro)',
      5, 2, 4, 2, 4, 4,
      'Requirió un poco de atención, pero fue fluido.',
      'Laptop',
      'Google Chrome',
      'No',
      'La página se ponía lenta después de usarla mucho rato seguido, los gráficos de la mano se empezaban a retrasar.',
      'Le eché muchas horas al sistema porque me gustó. Sirve bien para comunicarme con mis compañeros oyentes. Solo que cuando llevaba más de una hora usando la página se sentía pesada.',
      4, 'Sí', 4, 5,
      'Traducir señas completas sin deletrear letra por letra.',
      NULL,
      '2026-07-14 11:30:00'),

    -- S-22: José Manuel Guerrero Simental
    -- Perfil: Hombre, 22 años, estudiante de TI, desarrollador del proyecto
    -- Evaluación: Buena, notó lentitud después de uso prolongado.
    (uid22,
      'Resolución estándar',
      'Buena y constante',
      'A una distancia cómoda (50 cm a 1 metro)',
      4, 2, 4, 3, 3, 3,
      'Requirió un poco de atención, pero fue fluido.',
      'Laptop',
      'Google Chrome',
      'No',
      'A veces la página se congelaba y tenía que cerrar y volver a entrar. También se sentía más lenta entre más tiempo la usaba.',
      'Estaría padre que la página no se ponga lenta después de un rato. Por lo demás está bien para aprender señas.',
      4, 'Sí', 4, 4,
      'Practicar el abecedario y ver si lo estoy haciendo bien.',
      'La letra Y y la LL me costaron trabajo.',
      '2026-07-13 11:00:00'),

    -- A-01: Humberto Castillo Díaz
    -- Perfil: Hombre, 22 años, estudiante de TI, administrador del proyecto
    -- Evaluación: Positiva. Usó el sistema para pruebas de validación.
    (uid23,
      'Alta resolución (HD/Full HD)',
      'Buena y constante',
      'A una distancia cómoda (50 cm a 1 metro)',
      4, 2, 4, 2, 4, 4,
      'Fue muy fácil, no requirió esfuerzo.',
      'Laptop',
      'Google Chrome',
      'No',
      'El sistema funcionó bien durante las pruebas. Solo se puso lento con muchas traducciones seguidas.',
      'La aplicación cumple su propósito. Sugiero mejorar el rendimiento con uso prolongado.',
      4, 'Sí', 4, 5,
      'La traducción de señas a voz.',
      'Ninguna en particular.',
      '2026-07-14 11:30:00'),

    -- A-02: Manuel Alejandro Mathey Ortiz
    -- Perfil: Hombre, 22 años, estudiante de TI, administrador del proyecto
    -- Evaluación: Buena, notó detalles de usabilidad.
    (uid24,
      'Resolución estándar',
      'Buena y constante',
      'A una distancia cómoda (50 cm a 1 metro)',
      4, 3, 4, 2, 3, 3,
      'Requirió un poco de atención, pero fue fluido.',
      'Laptop',
      'Google Chrome',
      'No',
      'Al inicio no sabía bien a qué distancia ponerme de la cámara. Una vez que le agarré la mano funcionó bien.',
      'Agregar un tutorial interactivo al inicio para guiar a los usuarios nuevos sobre la distancia y posición de las manos.',
      4, 'Sí', 4, 4,
      'El abecedario, es útil para aprender la posición de cada letra.',
      'La distancia afecta el reconocimiento, necesité práctica.',
      '2026-07-13 11:00:00');

END $$;
