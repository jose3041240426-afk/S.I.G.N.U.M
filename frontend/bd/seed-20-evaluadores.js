/**
 * SIGNUM - Seed de 20 Usuarios Evaluadores (Node.js)
 * Actividad 3.3 | Proyecto Integrador II
 * Universidad Tecnológica de Durango
 *
 * Alternativa al script SQL para cuando no se tiene acceso directo
 * a la tabla auth.users en Supabase.
 *
 * Requisitos:
 * - Tener la service_role key de Supabase en .env.local como:
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
 *
 * Uso:
 *   node bd/seed-20-evaluadores.js
 *
 * Contraseña para ingresar: Signum2026!
 */
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  // =============================================
  // COHORTE A: Usuarios Principales (8)
  // Personas con discapacidad auditiva/del habla
  // =============================================
  {
    id: "S-01", cohort: "A",
    email: "ana.lopez@gmail.com", password: "Signum2026!",
    nombre: "Ana María", apellido_paterno: "López", apellido_materno: "Hernández", id_genero: 2,
  },
  {
    id: "S-02", cohort: "A",
    email: "carlos.garcia@gmail.com", password: "Signum2026!",
    nombre: "Carlos Alberto", apellido_paterno: "García", apellido_materno: "García", id_genero: 1,
  },
  {
    id: "S-03", cohort: "A",
    email: "diana.martinez@gmail.com", password: "Signum2026!",
    nombre: "Diana Laura", apellido_paterno: "Martínez", apellido_materno: "Pérez", id_genero: 2,
  },
  {
    id: "S-04", cohort: "A",
    email: "eduardo.sanchez@gmail.com", password: "Signum2026!",
    nombre: "Eduardo Daniel", apellido_paterno: "Sánchez", apellido_materno: "Torres", id_genero: 1,
  },
  {
    id: "S-05", cohort: "A",
    email: "fernanda.cruz@gmail.com", password: "Signum2026!",
    nombre: "Fernanda Elizabeth", apellido_paterno: "Cruz", apellido_materno: "Flores", id_genero: 2,
  },
  {
    id: "S-06", cohort: "A",
    email: "gabriel.morales@gmail.com", password: "Signum2026!",
    nombre: "Gabriel Alejandro", apellido_paterno: "Morales", apellido_materno: "Ruiz", id_genero: 1,
  },
  {
    id: "S-07", cohort: "A",
    email: "hilda.vargas@gmail.com", password: "Signum2026!",
    nombre: "Hilda Patricia", apellido_paterno: "Vargas", apellido_materno: "Mendoza", id_genero: 2,
  },
  {
    id: "S-08", cohort: "A",
    email: "ignacio.reyes@gmail.com", password: "Signum2026!",
    nombre: "Ignacio Antonio", apellido_paterno: "Reyes", apellido_materno: "Jiménez", id_genero: 1,
  },
  // =============================================
  // COHORTE B: Interlocutores Directos (6)
  // =============================================
  {
    id: "S-09", cohort: "B",
    email: "jessica.ortiz@gmail.com", password: "Signum2026!",
    nombre: "Jessica Paola", apellido_paterno: "Ortiz", apellido_materno: "Castillo", id_genero: 2,
  },
  {
    id: "S-10", cohort: "B",
    email: "kevin.torres@gmail.com", password: "Signum2026!",
    nombre: "Kevin Andrés", apellido_paterno: "Torres", apellido_materno: "Aguilar", id_genero: 1,
  },
  {
    id: "S-11", cohort: "B",
    email: "laura.gonzalez@gmail.com", password: "Signum2026!",
    nombre: "Laura Gabriela", apellido_paterno: "González", apellido_materno: "Medina", id_genero: 2,
  },
  {
    id: "S-12", cohort: "B",
    email: "marco.delgado@gmail.com", password: "Signum2026!",
    nombre: "Marco Antonio", apellido_paterno: "Delgado", apellido_materno: "Vega", id_genero: 1,
  },
  {
    id: "S-13", cohort: "B",
    email: "nancy.flores@gmail.com", password: "Signum2026!",
    nombre: "Nancy Carolina", apellido_paterno: "Flores", apellido_materno: "Flores", id_genero: 2,
  },
  {
    id: "S-14", cohort: "B",
    email: "oscar.mendez@gmail.com", password: "Signum2026!",
    nombre: "Oscar Octavio", apellido_paterno: "Méndez", apellido_materno: "Ríos", id_genero: 1,
  },
  // =============================================
  // COHORTE C: Aprendices de LSM (6)
  // =============================================
  {
    id: "S-15", cohort: "C",
    email: "paulina.dominguez@gmail.com", password: "Signum2026!",
    nombre: "Paulina Alejandra", apellido_paterno: "Domínguez", apellido_materno: "Soto", id_genero: 2,
  },
  {
    id: "S-16", cohort: "C",
    email: "ricardo.herrera@gmail.com", password: "Signum2026!",
    nombre: "Ricardo Adrián", apellido_paterno: "Herrera", apellido_materno: "Ponce", id_genero: 1,
  },
  {
    id: "S-17", cohort: "C",
    email: "samantha.rangel@gmail.com", password: "Signum2026!",
    nombre: "Samantha Beatriz", apellido_paterno: "Rangel", apellido_materno: "Contreras", id_genero: 2,
  },
  {
    id: "S-18", cohort: "C",
    email: "tomas.trejo@gmail.com", password: "Signum2026!",
    nombre: "Tomás Israel", apellido_paterno: "Trejo", apellido_materno: "Miranda", id_genero: 1,
  },
  {
    id: "S-19", cohort: "C",
    email: "valeria.acosta@gmail.com", password: "Signum2026!",
    nombre: "Valeria Guadalupe", apellido_paterno: "Acosta", apellido_materno: "Navarro", id_genero: 2,
  },
  {
    id: "S-20", cohort: "C",
    email: "william.fuentes@gmail.com", password: "Signum2026!",
    nombre: "William Ernesto", apellido_paterno: "Fuentes", apellido_materno: "Salas", id_genero: 1,
  },
];

const evaluaciones = [
  // =============================================
  // COHORTE A: USUARIOS PRINCIPALES
  // =============================================
  {
    email: "ana.lopez@gmail.com",
    resolucion: "Alta resolución (HD/Full HD)",
    iluminacion: "Buena y constante",
    distancia: "A una distancia cómoda (50 cm a 1 metro)",
    p4_uso_frecuente: 5, p5_complicado: 2, p6_facil_interactuar: 5, p7_necesita_ayuda: 1, p8_traduccion_natural: 4,
    voz_satisfaccion: 4,
    esfuerzo_mental: "Fue muy fácil, no requirió esfuerzo.",
    dispositivo: "Laptop", navegador: "Google Chrome", experiencia_previa: "No",
    problemas: null,
    sugerencias: 'La voz es clara pero se escucha un poco robótica. Me gustaría poder elegir entre distintas voces, tal vez una más natural o con diferentes tonos.',
    experiencia_general: 5, recomendaria: "Sí", facil_aprender: 4, util_educativo: 5,
    funcion_mas_util: 'La traducción automática de señas a voz',
    senas_dificiles: 'La letra "M" a veces la confunde con la "N"',
    fecha: "2026-07-07 11:30:00",
  },
  {
    email: "carlos.garcia@gmail.com",
    resolucion: "Alta resolución (HD/Full HD)",
    iluminacion: "Buena y constante",
    distancia: "A una distancia cómoda (50 cm a 1 metro)",
    p4_uso_frecuente: 5, p5_complicado: 1, p6_facil_interactuar: 4, p7_necesita_ayuda: 2, p8_traduccion_natural: 5,
    voz_satisfaccion: 5,
    esfuerzo_mental: "Fue muy fácil, no requirió esfuerzo.",
    dispositivo: "PC de escritorio", navegador: "Google Chrome", experiencia_previa: "No",
    problemas: null,
    sugerencias: 'Pude mantener una conversación fluida con mi compañero de clases sin necesidad de escribir en un papel.',
    experiencia_general: 5, recomendaria: "Sí", facil_aprender: 4, util_educativo: 5,
    funcion_mas_util: 'La traducción de palabras completas',
    senas_dificiles: null,
    fecha: "2026-07-08 11:45:00",
  },
  {
    email: "diana.martinez@gmail.com",
    resolucion: "Resolución estándar",
    iluminacion: "Buena y constante",
    distancia: "A una distancia cómoda (50 cm a 1 metro)",
    p4_uso_frecuente: 4, p5_complicado: 2, p6_facil_interactuar: 4, p7_necesita_ayuda: 3, p8_traduccion_natural: 3,
    voz_satisfaccion: 3,
    esfuerzo_mental: "Requirió un poco de atención, pero fue fluido.",
    dispositivo: "Laptop", navegador: "Microsoft Edge", experiencia_previa: "No",
    problemas: 'Algunas letras como la M y la N no las reconoce bien. A veces confunde los movimientos cuando hago señas muy rápido.',
    sugerencias: 'Sugiero que añadan un modo de calibración donde el usuario pueda registrar sus propias variantes de cada seña.',
    experiencia_general: 4, recomendaria: "Sí", facil_aprender: 3, util_educativo: 4,
    funcion_mas_util: 'La función de deletreo para el abecedario',
    senas_dificiles: 'M y N se confunden, también la E y la I en algunas posiciones.',
    fecha: "2026-07-08 11:00:00",
  },
  {
    email: "eduardo.sanchez@gmail.com",
    resolucion: "Alta resolución (HD/Full HD)",
    iluminacion: "Un poco oscura o con luz variable",
    distancia: "A una distancia cómoda (50 cm a 1 metro)",
    p4_uso_frecuente: 4, p5_complicado: 3, p6_facil_interactuar: 3, p7_necesita_ayuda: 2, p8_traduccion_natural: 3,
    voz_satisfaccion: 4,
    esfuerzo_mental: "Tuve que concentrarme mucho y hacer mucho esfuerzo mental.",
    dispositivo: "Laptop", navegador: "Google Chrome", experiencia_previa: "No",
    problemas: 'Al principio la luz de la ventana no dejaba que la cámara viera bien mis manos. Después que ajustaron la luz en el laboratorio (cerraron la cortina y pusieron una lámpara) mejoró mucho.',
    sugerencias: 'Sería bueno que el sistema advierta cuando hay problemas de iluminación o distancia.',
    experiencia_general: 4, recomendaria: "Sí", facil_aprender: 3, util_educativo: 5,
    funcion_mas_util: 'Pasar las señas a voz en tiempo real',
    senas_dificiles: 'Las señas con movimiento fuera del plano frontal como la letra "J"',
    fecha: "2026-07-09 14:15:00",
  },
  {
    email: "fernanda.cruz@gmail.com",
    resolucion: "Alta resolución (HD/Full HD)",
    iluminacion: "Buena y constante",
    distancia: "A una distancia cómoda (50 cm a 1 metro)",
    p4_uso_frecuente: 5, p5_complicado: 1, p6_facil_interactuar: 5, p7_necesita_ayuda: 1, p8_traduccion_natural: 5,
    voz_satisfaccion: 5,
    esfuerzo_mental: "Fue muy fácil, no requirió esfuerzo.",
    dispositivo: "Laptop", navegador: "Google Chrome", experiencia_previa: "No",
    problemas: 'Solo al principio me confundí con la distancia, pero una vez que me coloqué en la posición correcta todo fluyó muy natural.',
    sugerencias: 'Mis papás estaban emocionados de poder entenderme sin que yo tenga que escribir. Ojalá esta tecnología llegue a más lugares.',
    experiencia_general: 5, recomendaria: "Sí", facil_aprender: 5, util_educativo: 5,
    funcion_mas_util: 'La función de voz automática al detectar la seña',
    senas_dificiles: null,
    fecha: "2026-07-10 11:00:00",
  },
  {
    email: "gabriel.morales@gmail.com",
    resolucion: "Resolución estándar",
    iluminacion: "Buena y constante",
    distancia: "A una distancia cómoda (50 cm a 1 metro)",
    p4_uso_frecuente: 4, p5_complicado: 2, p6_facil_interactuar: 4, p7_necesita_ayuda: 3, p8_traduccion_natural: 4,
    voz_satisfaccion: 4,
    esfuerzo_mental: "Requirió un poco de atención, pero fue fluido.",
    dispositivo: "Laptop", navegador: "Google Chrome", experiencia_previa: "No",
    problemas: null,
    sugerencias: 'Me gustaría que hubiera más señas precargadas. Solo tiene el abecedario y palabras básicas.',
    experiencia_general: 4, recomendaria: "Sí", facil_aprender: 4, util_educativo: 5,
    funcion_mas_util: 'Poder deletrear palabras que no están en el vocabulario del sistema',
    senas_dificiles: 'La letra "R" - a veces la confunde con la "V"',
    fecha: "2026-07-11 11:00:00",
  },
  {
    email: "hilda.vargas@gmail.com",
    resolucion: "Alta resolución (HD/Full HD)",
    iluminacion: "Buena y constante",
    distancia: "Muy cerca (menos de 50 cm)",
    p4_uso_frecuente: 5, p5_complicado: 2, p6_facil_interactuar: 5, p7_necesita_ayuda: 2, p8_traduccion_natural: 5,
    voz_satisfaccion: 5,
    esfuerzo_mental: "Fue muy fácil, no requirió esfuerzo.",
    dispositivo: "Laptop", navegador: "Google Chrome", experiencia_previa: "No",
    problemas: 'Al inicio me coloqué muy cerca de la cámara, pero el sistema me marcaba que estaba muy cerca.',
    sugerencias: 'Esta herramienta debería estar disponible en todas las escuelas que tengan estudiantes con discapacidad auditiva.',
    experiencia_general: 5, recomendaria: "Sí", facil_aprender: 4, util_educativo: 5,
    funcion_mas_util: 'Poder comunicarme con mis alumnos sordos sin intérprete presente todo el tiempo',
    senas_dificiles: null,
    fecha: "2026-07-12 11:30:00",
  },
  {
    email: "ignacio.reyes@gmail.com",
    resolucion: "Alta resolución (HD/Full HD)",
    iluminacion: "Buena y constante",
    distancia: "A una distancia cómoda (50 cm a 1 metro)",
    p4_uso_frecuente: 5, p5_complicado: 1, p6_facil_interactuar: 4, p7_necesita_ayuda: 4, p8_traduccion_natural: 5,
    voz_satisfaccion: 5,
    esfuerzo_mental: "Fue muy fácil, no requirió esfuerzo.",
    dispositivo: "Laptop", navegador: "Google Chrome", experiencia_previa: "No",
    problemas: 'Al principio no entendía bien las preguntas escritas del formulario. Pero el intérprete me ayudó explicándome en señas cada pregunta.',
    sugerencias: 'Sería bueno que las instrucciones y preguntas de la plataforma también estén en LSM, con videos o animaciones.',
    experiencia_general: 5, recomendaria: "Sí", facil_aprender: 4, util_educativo: 5,
    funcion_mas_util: 'La función de hablar por mí, puedo comunicar lo que quiero decir sin escribir.',
    senas_dificiles: 'Las preguntas del sistema deberían estar también en LSM.',
    fecha: "2026-07-12 14:45:00",
  },
  // =============================================
  // COHORTE B: INTERLOCUTORES DIRECTOS
  // =============================================
  {
    email: "jessica.ortiz@gmail.com",
    resolucion: "Alta resolución (HD/Full HD)",
    iluminacion: "Buena y constante",
    distancia: "A una distancia cómoda (50 cm a 1 metro)",
    p4_uso_frecuente: 5, p5_complicado: 2, p6_facil_interactuar: 4, p7_necesita_ayuda: 2, p8_traduccion_natural: 4,
    voz_satisfaccion: 5,
    esfuerzo_mental: "Requirió un poco de atención, pero fue fluido.",
    dispositivo: "Laptop", navegador: "Google Chrome", experiencia_previa: "No",
    problemas: null,
    sugerencias: 'Poder entender lo que mi hermana me quiere decir sin intérprete es algo que siempre soñé.',
    experiencia_general: 5, recomendaria: "Sí", facil_aprender: 3, util_educativo: 5,
    funcion_mas_util: 'Poder comunicarme con mi hermana en conversaciones cotidianas',
    senas_dificiles: null,
    fecha: "2026-07-09 15:45:00",
  },
  {
    email: "kevin.torres@gmail.com",
    resolucion: "Resolución estándar",
    iluminacion: "Buena y constante",
    distancia: "A una distancia cómoda (50 cm a 1 metro)",
    p4_uso_frecuente: 4, p5_complicado: 3, p6_facil_interactuar: 4, p7_necesita_ayuda: 1, p8_traduccion_natural: 3,
    voz_satisfaccion: 4,
    esfuerzo_mental: "Requirió un poco de atención, pero fue fluido.",
    dispositivo: "Laptop", navegador: "Google Chrome", experiencia_previa: "No",
    problemas: 'A veces el audio se escuchaba entrecortado, como que se cortaba a media palabra.',
    sugerencias: 'Podrían añadir un historial de lo que se ha traducido en la sesión.',
    experiencia_general: 4, recomendaria: "Sí", facil_aprender: 3, util_educativo: 4,
    funcion_mas_util: 'El reconocimiento del abecedario en tiempo real',
    senas_dificiles: null,
    fecha: "2026-07-09 16:15:00",
  },
  {
    email: "laura.gonzalez@gmail.com",
    resolucion: "Alta resolución (HD/Full HD)",
    iluminacion: "Buena y constante",
    distancia: "A una distancia cómoda (50 cm a 1 metro)",
    p4_uso_frecuente: 3, p5_complicado: 4, p6_facil_interactuar: 3, p7_necesita_ayuda: 3, p8_traduccion_natural: 2,
    voz_satisfaccion: 2,
    esfuerzo_mental: "Tuve que concentrarme mucho y hacer mucho esfuerzo mental.",
    dispositivo: "Laptop", navegador: "Safari", experiencia_previa: "No",
    problemas: 'El audio tardaba muchísimo en salir, como 15 segundos. Usaba Safari y no funcionaba. Cuando cambié a Chrome mejoró.',
    sugerencias: 'Sugiero que indiquen claramente qué navegadores son compatibles antes de empezar.',
    experiencia_general: 3, recomendaria: "Sí", facil_aprender: 2, util_educativo: 4,
    funcion_mas_util: 'La idea es muy buena para inclusión en el aula',
    senas_dificiles: null,
    fecha: "2026-07-09 10:30:00",
  },
  {
    email: "marco.delgado@gmail.com",
    resolucion: "Alta resolución (HD/Full HD)",
    iluminacion: "Buena y constante",
    distancia: "A una distancia cómoda (50 cm a 1 metro)",
    p4_uso_frecuente: 4, p5_complicado: 2, p6_facil_interactuar: 5, p7_necesita_ayuda: 1, p8_traduccion_natural: 4,
    voz_satisfaccion: 4,
    esfuerzo_mental: "Fue muy fácil, no requirió esfuerzo.",
    dispositivo: "PC de escritorio", navegador: "Google Chrome", experiencia_previa: "No",
    problemas: null,
    sugerencias: 'Mi sobrino que es sordo lo usó para decirme que tenía hambre y pude entenderlo inmediatamente.',
    experiencia_general: 4, recomendaria: "Sí", facil_aprender: 3, util_educativo: 4,
    funcion_mas_util: 'Poder comunicarme con mi sobrino en tiempo real sin intermediarios',
    senas_dificiles: null,
    fecha: "2026-07-10 14:30:00",
  },
  {
    email: "nancy.flores@gmail.com",
    resolucion: "Alta resolución (HD/Full HD)",
    iluminacion: "Buena y constante",
    distancia: "A una distancia cómoda (50 cm a 1 metro)",
    p4_uso_frecuente: 5, p5_complicado: 2, p6_facil_interactuar: 5, p7_necesita_ayuda: 2, p8_traduccion_natural: 5,
    voz_satisfaccion: 5,
    esfuerzo_mental: "Fue muy fácil, no requirió esfuerzo.",
    dispositivo: "Laptop", navegador: "Google Chrome", experiencia_previa: "No",
    problemas: null,
    sugerencias: 'Como docente de la UTD, veo un potencial enorme para incluir a estudiantes sordos en mis clases.',
    experiencia_general: 5, recomendaria: "Sí", facil_aprender: 4, util_educativo: 5,
    funcion_mas_util: 'La accesibilidad para incluir a estudiantes sordos en el salón de clases',
    senas_dificiles: null,
    fecha: "2026-07-11 10:30:00",
  },
  {
    email: "oscar.mendez@gmail.com",
    resolucion: "Resolución estándar",
    iluminacion: "Un poco oscura o con luz variable",
    distancia: "A una distancia cómoda (50 cm a 1 metro)",
    p4_uso_frecuente: 4, p5_complicado: 2, p6_facil_interactuar: 4, p7_necesita_ayuda: 3, p8_traduccion_natural: 3,
    voz_satisfaccion: 3,
    esfuerzo_mental: "Requirió un poco de atención, pero fue fluido.",
    dispositivo: "Laptop", navegador: "Firefox", experiencia_previa: "No",
    problemas: 'En Firefox sentí que el sistema era más lento, como que tardaba en procesar las señas.',
    sugerencias: 'Sugiero que optimicen el sistema para funcionar bien en diferentes navegadores.',
    experiencia_general: 3, recomendaria: "Tal vez", facil_aprender: 2, util_educativo: 4,
    funcion_mas_util: 'La función de traducción de letras deletreadas',
    senas_dificiles: 'La letra "Y" y la "V" las confunde cuando las hago rápido.',
    fecha: "2026-07-13 15:30:00",
  },
  // =============================================
  // COHORTE C: APRENDICES DE LSM
  // =============================================
  {
    email: "paulina.dominguez@gmail.com",
    resolucion: "Alta resolución (HD/Full HD)",
    iluminacion: "Buena y constante",
    distancia: "A una distancia cómoda (50 cm a 1 metro)",
    p4_uso_frecuente: 5, p5_complicado: 3, p6_facil_interactuar: 4, p7_necesita_ayuda: 2, p8_traduccion_natural: 4,
    voz_satisfaccion: 4,
    esfuerzo_mental: "Requirió un poco de atención, pero fue fluido.",
    dispositivo: "Laptop", navegador: "Google Chrome", experiencia_previa: "No",
    problemas: null,
    sugerencias: 'Me gustaría que tuviera un modo de aprendizaje con lecciones graduales.',
    experiencia_general: 4, recomendaria: "Sí", facil_aprender: 4, util_educativo: 5,
    funcion_mas_util: 'Practicar el abecedario en LSM porque me da retroalimentación inmediata',
    senas_dificiles: 'La letra "R" me costó trabajo. La "J" también fue complicada al principio.',
    fecha: "2026-07-10 09:30:00",
  },
  {
    email: "ricardo.herrera@gmail.com",
    resolucion: "Alta resolución (HD/Full HD)",
    iluminacion: "Buena y constante",
    distancia: "A una distancia cómoda (50 cm a 1 metro)",
    p4_uso_frecuente: 4, p5_complicado: 2, p6_facil_interactuar: 5, p7_necesita_ayuda: 2, p8_traduccion_natural: 3,
    voz_satisfaccion: 3,
    esfuerzo_mental: "Requirió un poco de atención, pero fue fluido.",
    dispositivo: "Laptop", navegador: "Google Chrome", experiencia_previa: "No",
    problemas: null,
    sugerencias: 'Agregaría una función de repetición de la última seña para practicar las que salieron mal.',
    experiencia_general: 4, recomendaria: "Sí", facil_aprender: 3, util_educativo: 4,
    funcion_mas_util: 'La retroalimentación visual que te dice qué seña detectó',
    senas_dificiles: 'Las letras con movimiento como J y Z requieren práctica.',
    fecha: "2026-07-10 10:00:00",
  },
  {
    email: "samantha.rangel@gmail.com",
    resolucion: "Resolución estándar",
    iluminacion: "Buena y constante",
    distancia: "A una distancia cómoda (50 cm a 1 metro)",
    p4_uso_frecuente: 4, p5_complicado: 3, p6_facil_interactuar: 3, p7_necesita_ayuda: 3, p8_traduccion_natural: 2,
    voz_satisfaccion: 3,
    esfuerzo_mental: "Tuve que concentrarme mucho y hacer mucho esfuerzo mental.",
    dispositivo: "Laptop", navegador: "Google Chrome", experiencia_previa: "No",
    problemas: 'Las letras J y Z no las reconoce bien en mi laptop. Creo que es porque mi cámara es de baja resolución.',
    sugerencias: 'Si pudieran hacer que funcione mejor en equipos más modestos sería genial.',
    experiencia_general: 3, recomendaria: "Sí", facil_aprender: 3, util_educativo: 4,
    funcion_mas_util: 'El abecedario dactilológico',
    senas_dificiles: 'J y Z definitivamente. También la "Ñ" a veces no la detectaba bien.',
    fecha: "2026-07-11 10:30:00",
  },
  {
    email: "tomas.trejo@gmail.com",
    resolucion: "Resolución estándar",
    iluminacion: "Buena y constante",
    distancia: "A una distancia cómoda (50 cm a 1 metro)",
    p4_uso_frecuente: 4, p5_complicado: 2, p6_facil_interactuar: 4, p7_necesita_ayuda: 2, p8_traduccion_natural: 4,
    voz_satisfaccion: 4,
    esfuerzo_mental: "Requirió un poco de atención, pero fue fluido.",
    dispositivo: "Laptop", navegador: "Google Chrome", experiencia_previa: "No",
    problemas: null,
    sugerencias: 'La retroalimentación visual de las manos en la pantalla ayuda a saber si estás en la posición correcta.',
    experiencia_general: 4, recomendaria: "Sí", facil_aprender: 4, util_educativo: 5,
    funcion_mas_util: 'Ver en pantalla el esqueleto de mi mano mientras hago la seña',
    senas_dificiles: null,
    fecha: "2026-07-12 12:00:00",
  },
  {
    email: "valeria.acosta@gmail.com",
    resolucion: "Alta resolución (HD/Full HD)",
    iluminacion: "Buena y constante",
    distancia: "A una distancia cómoda (50 cm a 1 metro)",
    p4_uso_frecuente: 5, p5_complicado: 1, p6_facil_interactuar: 5, p7_necesita_ayuda: 1, p8_traduccion_natural: 5,
    voz_satisfaccion: 5,
    esfuerzo_mental: "Fue muy fácil, no requirió esfuerzo.",
    dispositivo: "Laptop", navegador: "Google Chrome", experiencia_previa: "No",
    problemas: null,
    sugerencias: 'Estoy aprendiendo LSM por mi cuenta y esto es como tener un tutor que te corrige al instante.',
    experiencia_general: 5, recomendaria: "Sí", facil_aprender: 5, util_educativo: 5,
    funcion_mas_util: 'La retroalimentación inmediata al hacer las señas',
    senas_dificiles: null,
    fecha: "2026-07-13 09:30:00",
  },
  {
    email: "william.fuentes@gmail.com",
    resolucion: "Resolución estándar",
    iluminacion: "Buena y constante",
    distancia: "Lejos (más de 1 metro)",
    p4_uso_frecuente: 3, p5_complicado: 4, p6_facil_interactuar: 3, p7_necesita_ayuda: 4, p8_traduccion_natural: 3,
    voz_satisfaccion: 3,
    esfuerzo_mental: "Requirió un poco de atención, pero fue fluido.",
    dispositivo: "PC de escritorio", navegador: "Microsoft Edge", experiencia_previa: "No",
    problemas: 'Estaba un poco lejos de la cámara y no siempre detectaba bien mis manos.',
    sugerencias: 'Una guía o tutorial interactivo dentro de la aplicación para aprender la posición correcta de las manos.',
    experiencia_general: 3, recomendaria: "Tal vez", facil_aprender: 3, util_educativo: 4,
    funcion_mas_util: 'El abecedario',
    senas_dificiles: 'Casi todas las letras me costaron al principio porque no sabía la distancia correcta.',
    fecha: "2026-07-14 11:00:00",
  },
];

async function seed() {
  console.log("=== SIGNUM - Seed de 20 Usuarios Evaluadores ===\n");

  // Crear traducciones para cada usuario después del registro
  const translations = [
    { email: "ana.lopez@gmail.com", id_tipo: 1, texto_original: "Hola, ¿cómo estás?", texto_traducido: "Hello, how are you?", precision: 0.95, fecha_hora: "2026-07-07 10:00:00" },
    { email: "ana.lopez@gmail.com", id_tipo: 1, texto_original: "Gracias", texto_traducido: "Gracias", precision: 0.98, fecha_hora: "2026-07-07 10:01:00" },
    { email: "ana.lopez@gmail.com", id_tipo: 2, texto_original: "Hello", texto_traducido: "Hola", precision: 0.90, fecha_hora: "2026-07-13 10:05:00" },
    { email: "carlos.garcia@gmail.com", id_tipo: 1, texto_original: "Necesito ayuda", texto_traducido: "I need help", precision: 0.94, fecha_hora: "2026-07-08 10:30:00" },
    { email: "eduardo.sanchez@gmail.com", id_tipo: 1, texto_original: "¿Puedes escucharme?", texto_traducido: "Can you hear me?", precision: 0.75, fecha_hora: "2026-07-07 10:20:00" },
    { email: "eduardo.sanchez@gmail.com", id_tipo: 1, texto_original: "Ahora funciona mejor", texto_traducido: "Ahora funciona mejor", precision: 0.91, fecha_hora: "2026-07-09 10:45:00" },
    { email: "fernanda.cruz@gmail.com", id_tipo: 1, texto_original: "Me gusta este sistema", texto_traducido: "I like this system", precision: 0.96, fecha_hora: "2026-07-10 12:00:00" },
    { email: "nancy.flores@gmail.com", id_tipo: 2, texto_original: "Bienvenido a la clase", texto_traducido: "Welcome to the class", precision: 0.91, fecha_hora: "2026-07-11 16:30:00" },
    { email: "samantha.rangel@gmail.com", id_tipo: 1, texto_original: "J", texto_traducido: "J", precision: 0.35, fecha_hora: "2026-07-11 11:25:00" },
    { email: "samantha.rangel@gmail.com", id_tipo: 1, texto_original: "Z", texto_traducido: "Z", precision: 0.30, fecha_hora: "2026-07-11 11:26:00" },
    { email: "samantha.rangel@gmail.com", id_tipo: 1, texto_original: "J", texto_traducido: "J", precision: 0.55, fecha_hora: "2026-07-14 10:15:00" },
    { email: "valeria.acosta@gmail.com", id_tipo: 1, texto_original: "Mi nombre es Valeria", texto_traducido: "My name is Valeria", precision: 0.92, fecha_hora: "2026-07-13 09:00:00" },
  ];

  const avances = [
    { email: "ana.lopez@gmail.com", traducciones_realizadas: 12, tiempo_uso_minutos: 45, precision_promedio: 0.93, fecha: "2026-07-07" },
    { email: "carlos.garcia@gmail.com", traducciones_realizadas: 10, tiempo_uso_minutos: 40, precision_promedio: 0.91, fecha: "2026-07-07" },
    { email: "eduardo.sanchez@gmail.com", traducciones_realizadas: 15, tiempo_uso_minutos: 60, precision_promedio: 0.68, fecha: "2026-07-07" },
    { email: "fernanda.cruz@gmail.com", traducciones_realizadas: 14, tiempo_uso_minutos: 50, precision_promedio: 0.96, fecha: "2026-07-10" },
    { email: "samantha.rangel@gmail.com", traducciones_realizadas: 12, tiempo_uso_minutos: 50, precision_promedio: 0.42, fecha: "2026-07-11" },
    { email: "valeria.acosta@gmail.com", traducciones_realizadas: 14, tiempo_uso_minutos: 55, precision_promedio: 0.93, fecha: "2026-07-13" },
  ];

  const createdUsers = {};

  // Paso 1: Crear usuarios via Admin API
  console.log("Creando 20 usuarios...");
  for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: {
        nombre: u.nombre,
        apellido_paterno: u.apellido_paterno,
        apellido_materno: u.apellido_materno,
        id_genero: u.id_genero,
      },
    });
    if (error) {
      console.error(`Error creando ${u.email}:`, error.message);
    } else {
      createdUsers[u.email] = data.user.id;
      console.log(`  ✓ ${u.email} (${u.id} | Cohorte ${u.cohort})`);
    }
  }

  // Paso 2: Insertar evaluaciones
  console.log("\nInsertando evaluaciones...");
  for (const ev of evaluaciones) {
    const userId = createdUsers[ev.email];
    if (!userId) {
      console.warn(`  ✗ No se encontró userId para ${ev.email}`);
      continue;
    }
    const { error } = await supabase.from("evaluaciones").insert({
      id_usuario: userId,
      resolucion: ev.resolucion,
      iluminacion: ev.iluminacion,
      distancia: ev.distancia,
      p4_uso_frecuente: ev.p4_uso_frecuente,
      p5_complicado: ev.p5_complicado,
      p6_facil_interactuar: ev.p6_facil_interactuar,
      p7_necesita_ayuda: ev.p7_necesita_ayuda,
      p8_traduccion_natural: ev.p8_traduccion_natural,
      voz_satisfaccion: ev.voz_satisfaccion,
      esfuerzo_mental: ev.esfuerzo_mental,
      dispositivo: ev.dispositivo,
      navegador: ev.navegador,
      experiencia_previa: ev.experiencia_previa,
      problemas: ev.problemas,
      sugerencias: ev.sugerencias,
      experiencia_general: ev.experiencia_general,
      recomendaria: ev.recomendaria,
      facil_aprender: ev.facil_aprender,
      util_educativo: ev.util_educativo,
      funcion_mas_util: ev.funcion_mas_util,
      senas_dificiles: ev.senas_dificiles,
      fecha: ev.fecha,
    });
    if (error) console.error(`  ✗ Evaluación ${ev.email}:`, error.message);
    else console.log(`  ✓ Evaluación de ${ev.email}`);
  }

  // Paso 3: Insertar traducciones
  console.log("\nInsertando traducciones de ejemplo...");
  for (const t of translations) {
    const userId = createdUsers[t.email];
    if (!userId) continue;
    const { error } = await supabase.from("traducciones").insert({
      id_usuario: userId,
      id_tipo: t.id_tipo,
      texto_original: t.texto_original,
      texto_traducido: t.texto_traducido,
      precision: t.precision,
      fecha_hora: t.fecha_hora,
    });
    if (error) console.error(`  ✗ Traducción ${t.email}:`, error.message);
  }
  console.log("  ✓ Traducciones insertadas");

  // Paso 4: Insertar avances
  console.log("\nInsertando avances...");
  for (const a of avances) {
    const userId = createdUsers[a.email];
    if (!userId) continue;
    const { error } = await supabase.from("avances").insert({
      id_usuario: userId,
      traducciones_realizadas: a.traducciones_realizadas,
      tiempo_uso_minutos: a.tiempo_uso_minutos,
      precision_promedio: a.precision_promedio,
      fecha: a.fecha,
    });
    if (error) console.error(`  ✗ Avance ${a.email}:`, error.message);
  }
  console.log("  ✓ Avances insertados");

  // Paso 5: Insertar logins
  console.log("\nInsertando registros de login...");
  const logins = [
    { email: "ana.lopez@gmail.com", fecha_hora: "2026-07-07 09:30:00", direccion_ip: "192.168.1.101" },
    { email: "eduardo.sanchez@gmail.com", fecha_hora: "2026-07-07 10:15:00", direccion_ip: "192.168.1.104" },
    { email: "laura.gonzalez@gmail.com", fecha_hora: "2026-07-10 14:42:00", direccion_ip: "192.168.1.203" },
    { email: "nancy.flores@gmail.com", fecha_hora: "2026-07-11 16:00:00", direccion_ip: "192.168.1.205" },
    { email: "samantha.rangel@gmail.com", fecha_hora: "2026-07-11 11:20:00", direccion_ip: "192.168.1.303" },
    { email: "valeria.acosta@gmail.com", fecha_hora: "2026-07-16 09:00:00", direccion_ip: "192.168.1.305" },
  ];
  for (const l of logins) {
    const userId = createdUsers[l.email];
    if (!userId) continue;
    await supabase.from("login").insert({
      id_usuario: userId,
      fecha_hora: l.fecha_hora,
      direccion_ip: l.direccion_ip,
    });
  }
  console.log("  ✓ Logins insertados");

  // Resumen
  const totalCreated = Object.keys(createdUsers).length;
  console.log(`\n========================================`);
  console.log(`Resumen:`);
  console.log(`  Usuarios creados: ${totalCreated}/20`);
  console.log(`  Evaluaciones:     ${evaluaciones.length}`);
  console.log(`  Contraseña:       Signum2026!`);
  console.log(`========================================\n`);
}

seed().catch(console.error);
