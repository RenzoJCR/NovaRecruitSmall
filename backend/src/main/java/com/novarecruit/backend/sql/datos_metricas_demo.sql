/*
============================================================
NOVARECRUIT SMALL
PARTE B - DATOS DEMO COMPLETOS

Base de datos:
novarecruitsmall_db

El script crea:
- Áreas tecnológicas.
- Vacantes realistas.
- Evaluaciones.
- Preguntas.
- Usuarios postulantes.
- Postulaciones históricas.
- Notas técnicas.
- Respuestas normalizadas.

Es reutilizable:
antes de insertar elimina exclusivamente sus datos demo.
============================================================
*/

USE novarecruitsmall_db;

SET @SQL_SAFE_UPDATES_ANTERIOR = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

SET @MARCADOR_DEMO = 'SCRIPT_DEMO_COMPLETO';
SET @CORREO_ADMIN = 'admin@novarecruit.com';

/*
------------------------------------------------------------
OBTENER ADMINISTRADOR Y CONTRASEÑA BASE
------------------------------------------------------------

Las vacantes requieren un administrador real.

Para los usuarios demo copiamos únicamente un hash BCrypt
existente, porque su propósito principal es poblar métricas.
No necesitamos conocer ni modificar la contraseña original.
*/

SET @ADMIN_ID = (
    SELECT id
    FROM usuarios
    WHERE correo = @CORREO_ADMIN
    LIMIT 1
);

SET @PASSWORD_DEMO = COALESCE(
    (
        SELECT password
        FROM usuarios
        WHERE rol = 'POSTULANTE'
        ORDER BY id
        LIMIT 1
    ),
    (
        SELECT password
        FROM usuarios
        WHERE id = @ADMIN_ID
        LIMIT 1
    )
);

/*
Verificación previa.

Debe mostrar:
- administrador_id con un número.
- password_demo_disponible = SI.
*/

SELECT
    @ADMIN_ID AS administrador_id,
    CASE
        WHEN @PASSWORD_DEMO IS NOT NULL
        THEN 'SI'
        ELSE 'NO'
    END AS password_demo_disponible;

/*
============================================================
TABLAS TEMPORALES
============================================================
*/

DROP TEMPORARY TABLE IF EXISTS tmp_demo_areas;
DROP TEMPORARY TABLE IF EXISTS tmp_demo_vacantes;
DROP TEMPORARY TABLE IF EXISTS tmp_demo_evaluaciones;
DROP TEMPORARY TABLE IF EXISTS tmp_demo_preguntas;
DROP TEMPORARY TABLE IF EXISTS tmp_demo_postulaciones;

/*
------------------------------------------------------------
ÁREAS
------------------------------------------------------------
*/

CREATE TEMPORARY TABLE tmp_demo_areas (
    numero INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NULL
);

INSERT INTO tmp_demo_areas (
    numero,
    nombre,
    descripcion
)
VALUES
    (
        1,
        'Desarrollo de Software',
        'Área encargada del diseño, desarrollo y mantenimiento de soluciones de software empresariales.'
    ),
    (
        2,
        'Datos e Inteligencia Artificial',
        'Área orientada al análisis de información, automatización, inteligencia artificial y toma de decisiones basada en datos.'
    ),
    (
        3,
        'Ciberseguridad',
        'Área responsable de proteger aplicaciones, infraestructura, usuarios e información empresarial.'
    ),
    (
        4,
        'Cloud y DevOps',
        'Área enfocada en infraestructura en la nube, automatización, integración continua y despliegues.'
    ),
    (
        5,
        'Calidad de Software',
        'Área encargada del aseguramiento de calidad, pruebas funcionales, automatización y mejora continua.'
    ),
    (
        6,
        'Diseño UX/UI',
        'Área orientada a la investigación, experiencia de usuario y diseño visual de productos digitales.'
    );

/*
------------------------------------------------------------
VACANTES
------------------------------------------------------------
*/

CREATE TEMPORARY TABLE tmp_demo_vacantes (
    numero INT PRIMARY KEY,
    area_nombre VARCHAR(100) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    modalidad VARCHAR(50) NOT NULL,
    salario DECIMAL(10, 2) NOT NULL,
    estado VARCHAR(50) NOT NULL
);

INSERT INTO tmp_demo_vacantes (
    numero,
    area_nombre,
    titulo,
    descripcion,
    modalidad,
    salario,
    estado
)
VALUES
    (
        1,
        'Desarrollo de Software',
        'Desarrollador Backend Java',
        'Responsable del desarrollo de APIs REST con Java y Spring Boot, integración con MySQL, aplicación de seguridad JWT y mantenimiento de servicios empresariales.',
        'HIBRIDO',
        4500.00,
        'ACTIVA'
    ),
    (
        2,
        'Desarrollo de Software',
        'Desarrollador Frontend React',
        'Encargado de construir interfaces modernas con React, JavaScript, Vite y Tailwind CSS, consumiendo servicios REST y aplicando buenas prácticas de experiencia de usuario.',
        'REMOTO',
        4000.00,
        'ACTIVA'
    ),
    (
        3,
        'Datos e Inteligencia Artificial',
        'Analista de Datos Junior',
        'Responsable de preparar información, construir consultas SQL, elaborar indicadores y apoyar el desarrollo de modelos analíticos para la toma de decisiones.',
        'HIBRIDO',
        4200.00,
        'ACTIVA'
    ),
    (
        4,
        'Ciberseguridad',
        'Analista de Ciberseguridad',
        'Encargado de identificar vulnerabilidades, revisar controles de acceso, apoyar pruebas DAST y proponer acciones para reducir riesgos tecnológicos.',
        'PRESENCIAL',
        5200.00,
        'ACTIVA'
    ),
    (
        5,
        'Cloud y DevOps',
        'Ingeniero DevOps Cloud',
        'Responsable de automatizar despliegues, administrar contenedores Docker, configurar pipelines y mantener aplicaciones disponibles en infraestructura cloud.',
        'REMOTO',
        5500.00,
        'ACTIVA'
    ),
    (
        6,
        'Calidad de Software',
        'QA Automation Engineer',
        'Encargado de diseñar casos de prueba, automatizar flujos con Selenium, registrar evidencias y colaborar en la prevención de defectos del sistema.',
        'HIBRIDO',
        3800.00,
        'ACTIVA'
    ),
    (
        7,
        'Diseño UX/UI',
        'Diseñador UX/UI Junior',
        'Responsable de diseñar interfaces, crear prototipos, evaluar la usabilidad y proponer mejoras en la experiencia de usuarios de plataformas digitales.',
        'REMOTO',
        3500.00,
        'CERRADA'
    );

/*
------------------------------------------------------------
EVALUACIONES
------------------------------------------------------------
*/

CREATE TEMPORARY TABLE tmp_demo_evaluaciones (
    numero INT PRIMARY KEY,
    vacante_titulo VARCHAR(150) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NULL
);

INSERT INTO tmp_demo_evaluaciones (
    numero,
    vacante_titulo,
    titulo,
    descripcion
)
VALUES
    (
        1,
        'Desarrollador Backend Java',
        'Evaluación Técnica de Java y Spring Boot',
        'Evaluación de conocimientos esenciales sobre Java, APIs REST, Spring Boot, seguridad y persistencia.'
    ),
    (
        2,
        'Desarrollador Frontend React',
        'Evaluación Técnica de React',
        'Evaluación de conocimientos sobre React, componentes, hooks, renderizado y desarrollo frontend.'
    ),
    (
        3,
        'Analista de Datos Junior',
        'Evaluación Técnica de Datos',
        'Evaluación de fundamentos de SQL, análisis de información, métricas y preparación de datos.'
    ),
    (
        4,
        'Analista de Ciberseguridad',
        'Evaluación Técnica de Ciberseguridad',
        'Evaluación de conceptos básicos de seguridad, autenticación, protección de información y vulnerabilidades.'
    ),
    (
        5,
        'Ingeniero DevOps Cloud',
        'Evaluación Técnica de DevOps',
        'Evaluación de conocimientos sobre Docker, integración continua, despliegue y monitoreo.'
    ),
    (
        6,
        'QA Automation Engineer',
        'Evaluación Técnica de Calidad de Software',
        'Evaluación de conocimientos sobre pruebas funcionales, automatización, regresión y calidad.'
    );

/*
------------------------------------------------------------
PREGUNTAS

Cada examen tiene cuatro preguntas.
Cada pregunta representa cinco puntos.
------------------------------------------------------------
*/

CREATE TEMPORARY TABLE tmp_demo_preguntas (
    numero INT PRIMARY KEY,
    vacante_titulo VARCHAR(150) NOT NULL,
    enunciado TEXT NOT NULL,
    opcion_a VARCHAR(255) NULL,
    opcion_b VARCHAR(255) NULL,
    opcion_c VARCHAR(255) NULL,
    opcion_d VARCHAR(255) NULL,
    respuesta_correcta VARCHAR(10) NOT NULL,
    tipo_pregunta VARCHAR(50) NOT NULL
);

INSERT INTO tmp_demo_preguntas (
    numero,
    vacante_titulo,
    enunciado,
    opcion_a,
    opcion_b,
    opcion_c,
    opcion_d,
    respuesta_correcta,
    tipo_pregunta
)
VALUES
    /*
    BACKEND JAVA
    */
    (
        1,
        'Desarrollador Backend Java',
        '¿Qué anotación se utiliza normalmente para definir un controlador REST en Spring Boot?',
        '@RestController',
        '@Entity',
        '@Repository',
        '@ConfigurationProperties',
        'A',
        'MULTIPLE'
    ),
    (
        2,
        'Desarrollador Backend Java',
        '¿Cuál es la función principal de un token JWT dentro de una aplicación?',
        'Diseñar la interfaz',
        'Transportar información de autenticación y autorización',
        'Crear tablas en MySQL',
        'Compilar el frontend',
        'B',
        'MULTIPLE'
    ),
    (
        3,
        'Desarrollador Backend Java',
        'Las consultas parametrizadas ayudan a reducir el riesgo de SQL Injection.',
        'Verdadero',
        'Falso',
        NULL,
        NULL,
        'A',
        'VERDADERO_FALSO'
    ),
    (
        4,
        'Desarrollador Backend Java',
        '¿Qué método HTTP se utiliza normalmente para crear un nuevo recurso?',
        'GET',
        'POST',
        'DELETE',
        'HEAD',
        'B',
        'MULTIPLE'
    ),

    /*
    FRONTEND REACT
    */
    (
        5,
        'Desarrollador Frontend React',
        '¿Qué hook se utiliza para manejar estado local en un componente funcional?',
        'useState',
        'useRoute',
        'useDatabase',
        'useServer',
        'A',
        'MULTIPLE'
    ),
    (
        6,
        'Desarrollador Frontend React',
        '¿Cuál es el propósito principal de Vite?',
        'Administrar la base de datos',
        'Proporcionar un entorno rápido de desarrollo y construcción frontend',
        'Generar tokens JWT',
        'Reemplazar React',
        'B',
        'MULTIPLE'
    ),
    (
        7,
        'Desarrollador Frontend React',
        'La propiedad key permite identificar elementos dentro de listas renderizadas.',
        'Verdadero',
        'Falso',
        NULL,
        NULL,
        'A',
        'VERDADERO_FALSO'
    ),
    (
        8,
        'Desarrollador Frontend React',
        '¿Qué herramienta permite navegar entre rutas en una aplicación React?',
        'React Router',
        'Hibernate',
        'Maven',
        'MySQL Workbench',
        'A',
        'MULTIPLE'
    ),

    /*
    DATOS
    */
    (
        9,
        'Analista de Datos Junior',
        '¿Qué función SQL se utiliza para obtener un promedio?',
        'AVG',
        'COUNT',
        'DELETE',
        'DROP',
        'A',
        'MULTIPLE'
    ),
    (
        10,
        'Analista de Datos Junior',
        '¿Qué elemento necesita normalmente un modelo de aprendizaje supervisado?',
        'Datos con etiquetas',
        'Únicamente imágenes',
        'Ninguna variable objetivo',
        'Solo archivos PDF',
        'A',
        'MULTIPLE'
    ),
    (
        11,
        'Analista de Datos Junior',
        'Los valores nulos deben revisarse durante la preparación de datos.',
        'Verdadero',
        'Falso',
        NULL,
        NULL,
        'A',
        'VERDADERO_FALSO'
    ),
    (
        12,
        'Analista de Datos Junior',
        '¿Cuál es el propósito de un KPI?',
        'Eliminar automáticamente registros',
        'Medir el rendimiento de un objetivo o proceso',
        'Cambiar contraseñas',
        'Crear usuarios',
        'B',
        'MULTIPLE'
    ),

    /*
    CIBERSEGURIDAD
    */
    (
        13,
        'Analista de Ciberseguridad',
        '¿Qué vulnerabilidad permite ejecutar scripts maliciosos en el navegador de un usuario?',
        'XSS',
        'Normalización',
        'Backup',
        'Compresión',
        'A',
        'MULTIPLE'
    ),
    (
        14,
        'Analista de Ciberseguridad',
        '¿Cómo deben almacenarse normalmente las contraseñas?',
        'Mediante un hash seguro',
        'Como texto plano',
        'En archivos públicos',
        'Dentro del frontend',
        'A',
        'MULTIPLE'
    ),
    (
        15,
        'Analista de Ciberseguridad',
        'El principio de mínimo privilegio limita el acceso a lo estrictamente necesario.',
        'Verdadero',
        'Falso',
        NULL,
        NULL,
        'A',
        'VERDADERO_FALSO'
    ),
    (
        16,
        'Analista de Ciberseguridad',
        '¿Qué protocolo protege la información enviada entre navegador y servidor?',
        'HTTPS',
        'FTP sin cifrado',
        'HTTP',
        'Telnet',
        'A',
        'MULTIPLE'
    ),

    /*
    DEVOPS
    */
    (
        17,
        'Ingeniero DevOps Cloud',
        '¿Qué contiene una imagen de Docker?',
        'Los elementos necesarios para ejecutar una aplicación',
        'Únicamente registros de auditoría',
        'Solo contraseñas',
        'Un navegador completo obligatoriamente',
        'A',
        'MULTIPLE'
    ),
    (
        18,
        'Ingeniero DevOps Cloud',
        '¿Qué significa CI dentro de un pipeline de software?',
        'Integración continua',
        'Interfaz cerrada',
        'Instalación crítica',
        'Información comercial',
        'A',
        'MULTIPLE'
    ),
    (
        19,
        'Ingeniero DevOps Cloud',
        'Las variables de entorno pueden utilizarse para separar configuración del código.',
        'Verdadero',
        'Falso',
        NULL,
        NULL,
        'A',
        'VERDADERO_FALSO'
    ),
    (
        20,
        'Ingeniero DevOps Cloud',
        '¿Para qué sirve un health check?',
        'Verificar si un servicio se encuentra disponible',
        'Crear candidatos',
        'Diseñar interfaces',
        'Modificar salarios',
        'A',
        'MULTIPLE'
    ),

    /*
    QA
    */
    (
        21,
        'QA Automation Engineer',
        '¿Qué herramienta se utiliza para automatizar pruebas en navegadores web?',
        'Selenium',
        'Hibernate',
        'Maven Central',
        'MySQL',
        'A',
        'MULTIPLE'
    ),
    (
        22,
        'QA Automation Engineer',
        '¿Qué prueba verifica que una funcionalidad existente no se haya dañado después de un cambio?',
        'Prueba de regresión',
        'Prueba de diseño gráfico',
        'Prueba de contratación',
        'Prueba contable',
        'A',
        'MULTIPLE'
    ),
    (
        23,
        'QA Automation Engineer',
        'Un caso de prueba debe comparar el resultado esperado con el resultado obtenido.',
        'Verdadero',
        'Falso',
        NULL,
        NULL,
        'A',
        'VERDADERO_FALSO'
    ),
    (
        24,
        'QA Automation Engineer',
        'Las pruebas automatizadas eliminan completamente la necesidad de realizar pruebas manuales.',
        'Verdadero',
        'Falso',
        NULL,
        NULL,
        'B',
        'VERDADERO_FALSO'
    );

/*
------------------------------------------------------------
PLAN HISTÓRICO DE POSTULACIONES

Distribución:
- Hace cinco meses: 3 postulaciones.
- Hace cuatro meses: 4 postulaciones.
- Hace tres meses: 5 postulaciones.
- Hace dos meses: 5 postulaciones.
- Hace un mes: 6 postulaciones.
- Mes actual: 7 postulaciones.

Total: 30 postulaciones.
Evaluaciones completadas: 24.
------------------------------------------------------------
*/

CREATE TEMPORARY TABLE tmp_demo_postulaciones (
    numero INT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    mes_atras INT NOT NULL,
    dia_mes INT NOT NULL,
    vacante_titulo VARCHAR(150) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    puntaje_tecnico INT NULL
);

INSERT INTO tmp_demo_postulaciones (
    numero,
    nombres,
    apellidos,
    mes_atras,
    dia_mes,
    vacante_titulo,
    estado,
    puntaje_tecnico
)
VALUES
    /*
    HACE CINCO MESES
    */
    (1,  'Lucía',     'Torres Vargas',      5, 3,  'Desarrollador Backend Java',  'EVALUADO',   10),
    (2,  'Mateo',     'Rojas Castillo',     5, 11, 'Desarrollador Frontend React','CONTRATADO', 15),
    (3,  'Valeria',   'Mendoza Ruiz',       5, 19, 'Diseñador UX/UI Junior',      'POSTULADO',  NULL),

    /*
    HACE CUATRO MESES
    */
    (4,  'Sebastián', 'Paredes Salazar',    4, 2,  'Analista de Datos Junior',    'EVALUADO',   10),
    (5,  'Camila',    'Flores Medina',      4, 8,  'Analista de Ciberseguridad',  'RECHAZADO',  20),
    (6,  'Diego',     'Ramírez Soto',       4, 15, 'Ingeniero DevOps Cloud',      'CONTRATADO', 15),
    (7,  'Andrea',    'Chávez López',       4, 22, 'QA Automation Engineer',      'POSTULADO',  NULL),

    /*
    HACE TRES MESES
    */
    (8,  'Nicolás',   'Herrera Díaz',       3, 4,  'Desarrollador Backend Java',  'EVALUADO',   5),
    (9,  'Mariana',   'García Ramos',       3, 9,  'Desarrollador Frontend React','EVALUADO',   10),
    (10, 'Joaquín',   'Navarro Peña',       3, 14, 'Analista de Datos Junior',    'RECHAZADO',  15),
    (11, 'Fernanda',  'Cruz Cárdenas',      3, 19, 'Analista de Ciberseguridad',  'CONTRATADO', 20),
    (12, 'Alejandro', 'Silva Campos',       3, 24, 'Ingeniero DevOps Cloud',      'POSTULADO',  NULL),

    /*
    HACE DOS MESES
    */
    (13, 'Daniela',   'Vega Romero',        2, 3,  'Ingeniero DevOps Cloud',      'EVALUADO',   10),
    (14, 'Rodrigo',   'Fuentes León',       2, 8,  'QA Automation Engineer',      'EVALUADO',   15),
    (15, 'Paula',     'Reyes Espinoza',     2, 13, 'Desarrollador Backend Java',  'RECHAZADO',  15),
    (16, 'Gabriel',   'Sánchez Molina',     2, 18, 'Analista de Datos Junior',    'CONTRATADO', 20),
    (17, 'Sofía',     'Aguilar Núñez',      2, 25, 'Desarrollador Frontend React','POSTULADO',  NULL),

    /*
    HACE UN MES
    */
    (18, 'Martín',    'Castro Cabrera',     1, 3,  'Analista de Ciberseguridad',  'EVALUADO',   5),
    (19, 'Natalia',   'Ortiz Guerrero',     1, 7,  'Desarrollador Frontend React','EVALUADO',   10),
    (20, 'Álvaro',    'Morales Jiménez',    1, 11, 'Analista de Datos Junior',    'RECHAZADO',  15),
    (21, 'Carolina',  'Delgado Acosta',     1, 15, 'QA Automation Engineer',      'EVALUADO',   15),
    (22, 'Emilio',    'Vásquez Palomino',   1, 20, 'Ingeniero DevOps Cloud',      'CONTRATADO', 20),
    (23, 'Renata',    'Miranda Valdez',     1, 26, 'Diseñador UX/UI Junior',      'POSTULADO',  NULL),

    /*
    MES ACTUAL
    */
    (24, 'Bruno',     'Mendoza Bravo',      0, 1,  'Desarrollador Backend Java',  'EVALUADO',   10),
    (25, 'Julieta',   'Ponce Villanueva',   0, 3,  'Desarrollador Frontend React','EVALUADO',   15),
    (26, 'Franco',    'Alvarado Luna',      0, 5,  'Analista de Datos Junior',    'RECHAZADO',  15),
    (27, 'Mía',       'Rivas Zamora',       0, 7,  'Analista de Ciberseguridad',  'CONTRATADO', 20),
    (28, 'Thiago',    'Mejía Calderón',     0, 9,  'Ingeniero DevOps Cloud',      'EVALUADO',   20),
    (29, 'Antonella', 'Salinas Cabrera',    0, 11, 'QA Automation Engineer',      'CONTRATADO', 20),
    (30, 'Facundo',   'Lozano Pacheco',     0, 13, 'Diseñador UX/UI Junior',      'POSTULADO',  NULL);

/*
============================================================
INICIO DE LA TRANSACCIÓN
============================================================
*/

START TRANSACTION;

/*
------------------------------------------------------------
LIMPIEZA CONTROLADA DE DEMOSTRACIONES ANTERIORES
------------------------------------------------------------

Se eliminan:
- Datos de este script.
- Usuarios del primer script anterior, si llegó a ejecutarse.
*/

DELETE rp
FROM respuestas_postulantes rp
INNER JOIN postulaciones po
    ON po.id = rp.postulacion_id
INNER JOIN usuarios u
    ON u.id = po.usuario_id
WHERE u.creado_por = @MARCADOR_DEMO
   OR u.correo LIKE 'demo.talento%@novarecruit.test'
   OR u.correo LIKE 'demo.metricas%@novarecruit.test';

DELETE po
FROM postulaciones po
INNER JOIN usuarios u
    ON u.id = po.usuario_id
WHERE u.creado_por = @MARCADOR_DEMO
   OR u.correo LIKE 'demo.talento%@novarecruit.test'
   OR u.correo LIKE 'demo.metricas%@novarecruit.test';

DELETE FROM usuarios
WHERE creado_por = @MARCADOR_DEMO
   OR correo LIKE 'demo.talento%@novarecruit.test'
   OR correo LIKE 'demo.metricas%@novarecruit.test';

DELETE p
FROM preguntas p
INNER JOIN evaluaciones e
    ON e.id = p.evaluacion_id
WHERE e.creado_por = @MARCADOR_DEMO;

DELETE FROM evaluaciones
WHERE creado_por = @MARCADOR_DEMO;

DELETE FROM vacantes
WHERE creado_por = @MARCADOR_DEMO;

DELETE FROM areas
WHERE creado_por = @MARCADOR_DEMO;

/*
------------------------------------------------------------
CREAR O REUTILIZAR ÁREAS
------------------------------------------------------------

Si un área con el mismo nombre ya existe,
se reutilizará y no se duplicará.
*/

INSERT INTO areas (
    creado_por,
    descripcion,
    fecha_creacion,
    nombre
)
SELECT
    @MARCADOR_DEMO,
    ta.descripcion,
    DATE_SUB(
        DATE_FORMAT(CURDATE(), '%Y-%m-01'),
        INTERVAL 8 MONTH
    ),
    ta.nombre
FROM tmp_demo_areas ta
WHERE NOT EXISTS (
    SELECT 1
    FROM areas a
    WHERE LOWER(a.nombre) = LOWER(ta.nombre)
);

/*
------------------------------------------------------------
CREAR VACANTES
------------------------------------------------------------
*/

INSERT INTO vacantes (
    creado_por,
    descripcion,
    estado,
    fecha_creacion,
    fecha_modificacion,
    modalidad,
    modificado_por,
    salario,
    titulo,
    administrador_id,
    area_id
)
SELECT
    @MARCADOR_DEMO,
    tv.descripcion,
    tv.estado,

    DATE_ADD(
        DATE_SUB(
            DATE_FORMAT(CURDATE(), '%Y-%m-01'),
            INTERVAL 7 MONTH
        ),
        INTERVAL tv.numero DAY
    ),

    NULL,
    tv.modalidad,
    NULL,
    tv.salario,
    tv.titulo,
    @ADMIN_ID,
    area_seleccionada.id
FROM tmp_demo_vacantes tv
INNER JOIN (
    SELECT
        nombre,
        MIN(id) AS id
    FROM areas
    GROUP BY nombre
) area_seleccionada
    ON LOWER(area_seleccionada.nombre) =
       LOWER(tv.area_nombre);

/*
------------------------------------------------------------
CREAR EVALUACIONES
------------------------------------------------------------
*/

INSERT INTO evaluaciones (
    creado_por,
    descripcion,
    fecha_creacion,
    titulo,
    vacante_id
)
SELECT
    @MARCADOR_DEMO,
    te.descripcion,

    DATE_ADD(
        v.fecha_creacion,
        INTERVAL 1 DAY
    ),

    te.titulo,
    v.id
FROM tmp_demo_evaluaciones te
INNER JOIN vacantes v
    ON v.titulo = te.vacante_titulo
   AND v.creado_por = @MARCADOR_DEMO;

/*
------------------------------------------------------------
CREAR PREGUNTAS
------------------------------------------------------------
*/

INSERT INTO preguntas (
    enunciado,
    opcion_a,
    opcion_b,
    opcion_c,
    opcion_d,
    respuesta_correcta,
    tipo_pregunta,
    evaluacion_id
)
SELECT
    tp.enunciado,
    tp.opcion_a,
    tp.opcion_b,
    tp.opcion_c,
    tp.opcion_d,
    tp.respuesta_correcta,
    tp.tipo_pregunta,
    e.id
FROM tmp_demo_preguntas tp
INNER JOIN vacantes v
    ON v.titulo = tp.vacante_titulo
   AND v.creado_por = @MARCADOR_DEMO
INNER JOIN evaluaciones e
    ON e.vacante_id = v.id
   AND e.creado_por = @MARCADOR_DEMO
ORDER BY tp.numero;

/*
------------------------------------------------------------
CREAR USUARIOS POSTULANTES
------------------------------------------------------------
*/

INSERT INTO usuarios (
    activo,
    apellidos,
    correo,
    creado_por,
    cv_url,
    fecha_creacion,
    nombres,
    password,
    rol
)
SELECT
    b'1',
    tp.apellidos,

    CONCAT(
        'demo.talento',
        LPAD(tp.numero, 2, '0'),
        '@novarecruit.test'
    ),

    @MARCADOR_DEMO,

    CONCAT(
        'https://demo.novarecruit.test/cv/',
        LPAD(tp.numero, 2, '0'),
        '.pdf'
    ),

    DATE_SUB(
        DATE_ADD(
            DATE_ADD(
                DATE_SUB(
                    DATE_FORMAT(CURDATE(), '%Y-%m-01'),
                    INTERVAL tp.mes_atras MONTH
                ),
                INTERVAL (
                    CASE
                        WHEN tp.mes_atras = 0
                        THEN LEAST(
                            tp.dia_mes,
                            DAY(CURDATE())
                        )
                        ELSE tp.dia_mes
                    END - 1
                ) DAY
            ),
            INTERVAL 8 HOUR
        ),
        INTERVAL 7 DAY
    ),

    tp.nombres,
    @PASSWORD_DEMO,
    'POSTULANTE'
FROM tmp_demo_postulaciones tp
ORDER BY tp.numero;

/*
------------------------------------------------------------
CREAR POSTULACIONES HISTÓRICAS
------------------------------------------------------------
*/

INSERT INTO postulaciones (
    comentarios_internos,
    estado,
    fecha_evaluacion,
    fecha_postulacion,
    puntaje_tecnico,
    respuestas_postulante,
    usuario_id,
    vacante_id
)
SELECT
    @MARCADOR_DEMO,
    tp.estado,

    CASE
        WHEN tp.puntaje_tecnico IS NULL
        THEN NULL

        ELSE DATE_ADD(
            DATE_ADD(
                DATE_SUB(
                    DATE_FORMAT(CURDATE(), '%Y-%m-01'),
                    INTERVAL tp.mes_atras MONTH
                ),
                INTERVAL (
                    CASE
                        WHEN tp.mes_atras = 0
                        THEN LEAST(
                            tp.dia_mes,
                            DAY(CURDATE())
                        )
                        ELSE tp.dia_mes
                    END - 1
                ) DAY
            ),
            INTERVAL 15 HOUR
        )
    END,

    DATE_ADD(
        DATE_ADD(
            DATE_SUB(
                DATE_FORMAT(CURDATE(), '%Y-%m-01'),
                INTERVAL tp.mes_atras MONTH
            ),
            INTERVAL (
                CASE
                    WHEN tp.mes_atras = 0
                    THEN LEAST(
                        tp.dia_mes,
                        DAY(CURDATE())
                    )
                    ELSE tp.dia_mes
                END - 1
            ) DAY
        ),
        INTERVAL 9 HOUR
    ),

    tp.puntaje_tecnico,
    NULL,
    u.id,
    v.id
FROM tmp_demo_postulaciones tp
INNER JOIN usuarios u
    ON u.correo = CONCAT(
        'demo.talento',
        LPAD(tp.numero, 2, '0'),
        '@novarecruit.test'
    )
INNER JOIN vacantes v
    ON v.titulo = tp.vacante_titulo
   AND v.creado_por = @MARCADOR_DEMO
ORDER BY tp.numero;

/*
------------------------------------------------------------
CREAR RESPUESTAS NORMALIZADAS
------------------------------------------------------------

Todos los exámenes demo tienen cuatro preguntas.

Puntajes:
- 5  = una respuesta correcta.
- 10 = dos respuestas correctas.
- 15 = tres respuestas correctas.
- 20 = cuatro respuestas correctas.
*/

INSERT INTO respuestas_postulantes (
    es_correcta,
    fecha_respuesta,
    puntaje_asignado,
    puntaje_obtenido,
    respuesta_seleccionada,
    postulacion_id,
    pregunta_id
)
SELECT
    CASE
        WHEN preguntas_ordenadas.posicion <=
             FLOOR(po.puntaje_tecnico / 5)
        THEN b'1'
        ELSE b'0'
    END,

    po.fecha_evaluacion,

    5,

    CASE
        WHEN preguntas_ordenadas.posicion <=
             FLOOR(po.puntaje_tecnico / 5)
        THEN 5
        ELSE 0
    END,

    CASE
        WHEN preguntas_ordenadas.posicion <=
             FLOOR(po.puntaje_tecnico / 5)
        THEN UPPER(
            TRIM(
                preguntas_ordenadas.respuesta_correcta
            )
        )

        ELSE CASE
            WHEN UPPER(
                TRIM(
                    preguntas_ordenadas.respuesta_correcta
                )
            ) = 'A'
            THEN 'B'

            ELSE 'A'
        END
    END,

    po.id,
    preguntas_ordenadas.id
FROM postulaciones po
INNER JOIN usuarios u
    ON u.id = po.usuario_id
INNER JOIN vacantes v
    ON v.id = po.vacante_id
INNER JOIN evaluaciones e
    ON e.vacante_id = v.id
INNER JOIN (
    SELECT
        p.id,
        p.evaluacion_id,
        p.respuesta_correcta,

        ROW_NUMBER() OVER (
            PARTITION BY p.evaluacion_id
            ORDER BY p.id
        ) AS posicion
    FROM preguntas p
) preguntas_ordenadas
    ON preguntas_ordenadas.evaluacion_id = e.id
WHERE u.creado_por = @MARCADOR_DEMO
  AND po.puntaje_tecnico IS NOT NULL
  AND po.fecha_evaluacion IS NOT NULL;

/*
============================================================
CONFIRMAR CAMBIOS
============================================================
*/

COMMIT;

/*
============================================================
ELIMINAR TABLAS TEMPORALES
============================================================
*/

DROP TEMPORARY TABLE IF EXISTS tmp_demo_areas;
DROP TEMPORARY TABLE IF EXISTS tmp_demo_vacantes;
DROP TEMPORARY TABLE IF EXISTS tmp_demo_evaluaciones;
DROP TEMPORARY TABLE IF EXISTS tmp_demo_preguntas;
DROP TEMPORARY TABLE IF EXISTS tmp_demo_postulaciones;

SET SQL_SAFE_UPDATES = @SQL_SAFE_UPDATES_ANTERIOR;

/*
============================================================
VERIFICACIONES FINALES
============================================================
*/

/*
Áreas necesarias disponibles.
Esperado: 6.
*/

SELECT
    COUNT(*) AS areas_disponibles
FROM areas
WHERE nombre IN (
    'Desarrollo de Software',
    'Datos e Inteligencia Artificial',
    'Ciberseguridad',
    'Cloud y DevOps',
    'Calidad de Software',
    'Diseño UX/UI'
);

/*
Vacantes demo.
Esperado: 7.
*/

SELECT
    COUNT(*) AS vacantes_demo
FROM vacantes
WHERE creado_por = @MARCADOR_DEMO;

/*
Evaluaciones demo.
Esperado: 6.
*/

SELECT
    COUNT(*) AS evaluaciones_demo
FROM evaluaciones
WHERE creado_por = @MARCADOR_DEMO;

/*
Preguntas demo.
Esperado: 24.
*/

SELECT
    COUNT(*) AS preguntas_demo
FROM preguntas p
INNER JOIN evaluaciones e
    ON e.id = p.evaluacion_id
WHERE e.creado_por = @MARCADOR_DEMO;

/*
Usuarios demo.
Esperado: 30.
*/

SELECT
    COUNT(*) AS usuarios_demo
FROM usuarios
WHERE creado_por = @MARCADOR_DEMO;

/*
Postulaciones demo.
Esperado: 30.
*/

SELECT
    COUNT(*) AS postulaciones_demo
FROM postulaciones
WHERE comentarios_internos = @MARCADOR_DEMO;

/*
Evaluaciones procesadas.
Esperado: 24.
*/

SELECT
    COUNT(*) AS examenes_procesados_demo
FROM postulaciones
WHERE comentarios_internos = @MARCADOR_DEMO
  AND fecha_evaluacion IS NOT NULL
  AND puntaje_tecnico IS NOT NULL;

/*
Respuestas demo.
Esperado: 96.
*/

SELECT
    COUNT(*) AS respuestas_demo
FROM respuestas_postulantes rp
INNER JOIN postulaciones po
    ON po.id = rp.postulacion_id
WHERE po.comentarios_internos = @MARCADOR_DEMO;

/*
Distribución de postulaciones por mes.
*/

SELECT
    DATE_FORMAT(
        fecha_postulacion,
        '%Y-%m'
    ) AS periodo,

    COUNT(*) AS postulaciones
FROM postulaciones
WHERE comentarios_internos = @MARCADOR_DEMO
GROUP BY
    DATE_FORMAT(
        fecha_postulacion,
        '%Y-%m'
    )
ORDER BY periodo;

/*
Promedio técnico mensual.
*/

SELECT
    DATE_FORMAT(
        fecha_evaluacion,
        '%Y-%m'
    ) AS periodo,

    COUNT(*) AS evaluaciones,

    ROUND(
        AVG(puntaje_tecnico),
        2
    ) AS promedio_tecnico
FROM postulaciones
WHERE comentarios_internos = @MARCADOR_DEMO
  AND fecha_evaluacion IS NOT NULL
  AND puntaje_tecnico IS NOT NULL
GROUP BY
    DATE_FORMAT(
        fecha_evaluacion,
        '%Y-%m'
    )
ORDER BY periodo;

/*
Listado resumido de vacantes demo.
*/

SELECT
    v.id,
    a.nombre AS area,
    v.titulo,
    v.modalidad,
    v.salario,
    v.estado
FROM vacantes v
INNER JOIN areas a
    ON a.id = v.area_id
WHERE v.creado_por = @MARCADOR_DEMO
ORDER BY v.id;

/*
Listado resumido de postulantes demo.
*/

SELECT
    po.id AS postulacion_id,
    CONCAT(
        u.nombres,
        ' ',
        u.apellidos
    ) AS candidato,

    u.correo,
    a.nombre AS area,
    v.titulo AS vacante,
    po.estado,
    po.fecha_postulacion,
    po.fecha_evaluacion,
    po.puntaje_tecnico
FROM postulaciones po
INNER JOIN usuarios u
    ON u.id = po.usuario_id
INNER JOIN vacantes v
    ON v.id = po.vacante_id
INNER JOIN areas a
    ON a.id = v.area_id
WHERE po.comentarios_internos = @MARCADOR_DEMO
ORDER BY
    po.fecha_postulacion,
    po.id;