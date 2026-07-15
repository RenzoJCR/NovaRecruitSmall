-- =============================================================
-- NovaRecruit Small - Inicializacion de MySQL
-- Compatible con MySQL 8.4
--
-- IMPORTANTE:
-- 1. Docker ejecuta este archivo solo cuando el volumen de MySQL
--    se crea por primera vez y se encuentra vacio.
-- 2. Si se ejecuta manualmente, elimina y vuelve a crear las tablas
--    de la base de datos indicada.
-- 3. Las contrasenas incluidas estan cifradas con BCrypt.
-- =============================================================

SET NAMES utf8mb4;
SET TIME_ZONE = '-05:00';

CREATE DATABASE IF NOT EXISTS novarecruitsmall_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;

USE novarecruitsmall_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS respuestas_postulantes;
DROP TABLE IF EXISTS postulaciones;
DROP TABLE IF EXISTS preguntas;
DROP TABLE IF EXISTS evaluaciones;
DROP TABLE IF EXISTS vacantes;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS areas;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================
-- TABLAS
-- =============================================================

CREATE TABLE areas (
    id BIGINT NOT NULL AUTO_INCREMENT,
    activo BIT(1) NOT NULL DEFAULT b'1',
    creado_por VARCHAR(255) NOT NULL,
    descripcion TEXT NULL,
    fecha_creacion DATETIME(6) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE usuarios (
    id BIGINT NOT NULL AUTO_INCREMENT,
    activo BIT(1) NOT NULL DEFAULT b'1',
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(120) NOT NULL,
    creado_por VARCHAR(255) NOT NULL,
    cv_url VARCHAR(255) NULL,
    fecha_creacion DATETIME(6) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_usuarios_correo UNIQUE (correo)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE vacantes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    creado_por VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    estado VARCHAR(50) NOT NULL,
    fecha_creacion DATETIME(6) NOT NULL,
    fecha_modificacion DATETIME(6) NULL,
    modalidad VARCHAR(50) NOT NULL,
    modificado_por VARCHAR(255) NULL,
    salario DECIMAL(10,2) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    administrador_id BIGINT NOT NULL,
    area_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_vacantes_administrador (administrador_id),
    KEY idx_vacantes_area (area_id),
    CONSTRAINT fk_vacantes_administrador
        FOREIGN KEY (administrador_id) REFERENCES usuarios (id),
    CONSTRAINT fk_vacantes_area
        FOREIGN KEY (area_id) REFERENCES areas (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE evaluaciones (
    id BIGINT NOT NULL AUTO_INCREMENT,
    creado_por VARCHAR(255) NOT NULL,
    descripcion TEXT NULL,
    fecha_creacion DATETIME(6) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    vacante_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_evaluaciones_vacante UNIQUE (vacante_id),
    CONSTRAINT fk_evaluaciones_vacante
        FOREIGN KEY (vacante_id) REFERENCES vacantes (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE preguntas (
    id BIGINT NOT NULL AUTO_INCREMENT,
    enunciado TEXT NOT NULL,
    opcion_a VARCHAR(255) NULL,
    opcion_b VARCHAR(255) NULL,
    opcion_c VARCHAR(255) NULL,
    opcion_d VARCHAR(255) NULL,
    respuesta_correcta VARCHAR(10) NOT NULL,
    tipo_pregunta VARCHAR(50) NOT NULL,
    evaluacion_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_preguntas_evaluacion (evaluacion_id),
    CONSTRAINT fk_preguntas_evaluacion
        FOREIGN KEY (evaluacion_id) REFERENCES evaluaciones (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE postulaciones (
    id BIGINT NOT NULL AUTO_INCREMENT,
    comentarios_internos TEXT NULL,
    estado VARCHAR(50) NOT NULL,
    fecha_evaluacion DATETIME(6) NULL,
    fecha_postulacion DATETIME(6) NOT NULL,
    puntaje_tecnico INT NULL,
    respuestas_postulante TEXT NULL,
    usuario_id BIGINT NOT NULL,
    vacante_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_postulaciones_usuario_vacante
        UNIQUE (usuario_id, vacante_id),
    KEY idx_postulaciones_vacante (vacante_id),
    CONSTRAINT fk_postulaciones_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    CONSTRAINT fk_postulaciones_vacante
        FOREIGN KEY (vacante_id) REFERENCES vacantes (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE respuestas_postulantes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    es_correcta BIT(1) NOT NULL,
    fecha_respuesta DATETIME(6) NOT NULL,
    puntaje_asignado INT NOT NULL,
    puntaje_obtenido INT NOT NULL,
    respuesta_seleccionada VARCHAR(10) NOT NULL,
    postulacion_id BIGINT NOT NULL,
    pregunta_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_respuesta_postulacion_pregunta
        UNIQUE (postulacion_id, pregunta_id),
    KEY idx_respuesta_postulacion (postulacion_id),
    KEY idx_respuesta_pregunta (pregunta_id),
    CONSTRAINT fk_respuestas_postulacion
        FOREIGN KEY (postulacion_id) REFERENCES postulaciones (id),
    CONSTRAINT fk_respuestas_pregunta
        FOREIGN KEY (pregunta_id) REFERENCES preguntas (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- FECHAS DINAMICAS PARA LAS METRICAS DE LOS ULTIMOS SEIS MESES
-- =============================================================

SET @mes_5 = DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 5 MONTH);
SET @mes_4 = DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 4 MONTH);
SET @mes_3 = DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 3 MONTH);
SET @mes_2 = DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 2 MONTH);
SET @mes_1 = DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH);
SET @mes_0 = DATE_FORMAT(CURDATE(), '%Y-%m-01');

-- =============================================================
-- AREAS
-- =============================================================

INSERT INTO areas
    (id, activo, creado_por, descripcion, fecha_creacion, nombre)
VALUES
    (1, b'1', 'SISTEMA',
     'Puestos relacionados con Spring Boot, Java, APIs REST, bases de datos y arquitectura de servicios.',
     DATE_ADD(@mes_5, INTERVAL 1 DAY), 'Desarrollo Backend'),
    (2, b'1', 'SISTEMA',
     'Puestos enfocados en interfaces web con React, experiencia de usuario y consumo de APIs.',
     DATE_ADD(@mes_5, INTERVAL 1 DAY), 'Desarrollo Frontend'),
    (3, b'1', 'admin@novarecruit.com',
     'Pruebas funcionales, automatizacion, aseguramiento de calidad y pruebas de seguridad.',
     DATE_ADD(@mes_4, INTERVAL 2 DAY), 'Calidad de Software'),
    (4, b'1', 'admin@novarecruit.com',
     'Analisis de datos, indicadores, inteligencia de negocios y elaboracion de reportes.',
     DATE_ADD(@mes_3, INTERVAL 2 DAY), 'Datos y Analitica'),
    (5, b'1', 'admin@novarecruit.com',
     'Diseno de interfaces, investigacion de usuarios, prototipado y experiencia digital.',
     DATE_ADD(@mes_2, INTERVAL 3 DAY), 'Diseno UX/UI'),
    (6, b'0', 'admin@novarecruit.com',
     'Area historica desactivada para demostrar el control de areas activas e inactivas.',
     DATE_ADD(@mes_5, INTERVAL 3 DAY), 'Soporte TI');

-- =============================================================
-- USUARIOS
--
-- Administrador:
--   correo: admin@novarecruit.com
--   clave:  admin123
--
-- Postulantes de demostracion:
--   clave comun: postulante123
-- =============================================================

INSERT INTO usuarios
    (id, activo, apellidos, correo, creado_por, cv_url,
     fecha_creacion, nombres, password, rol)
VALUES
    (1, b'1', 'NovaRecruit', 'admin@novarecruit.com', 'SISTEMA', NULL,
     DATE_ADD(@mes_5, INTERVAL 1 DAY), 'Admin',
     '$2a$10$waESaI4/Bk6mkTP0nsKxje3Ss4Uge9dQEQMUAviQ8x/C6Vsy0vJ02',
     'ADMINISTRADOR'),
    (2, b'1', 'Torres Salazar', 'ana.torres@demo.com', 'AUTOREGISTRO',
     'https://example.com/cv/ana-torres.pdf',
     DATE_ADD(@mes_5, INTERVAL 3 DAY), 'Ana',
     '$2a$10$BhSXw4Ouw/FMd5VSqJrsUetivsCjMzGXjz4Hf5SZiVWgZqGPmTK5.',
     'POSTULANTE'),
    (3, b'1', 'Mendoza Rojas', 'carlos.mendoza@demo.com', 'AUTOREGISTRO',
     'https://example.com/cv/carlos-mendoza.pdf',
     DATE_ADD(@mes_4, INTERVAL 2 DAY), 'Carlos',
     '$2a$10$BhSXw4Ouw/FMd5VSqJrsUetivsCjMzGXjz4Hf5SZiVWgZqGPmTK5.',
     'POSTULANTE'),
    (4, b'1', 'Ramos Vega', 'lucia.ramos@demo.com', 'AUTOREGISTRO',
     'https://example.com/cv/lucia-ramos.pdf',
     DATE_ADD(@mes_3, INTERVAL 2 DAY), 'Lucia',
     '$2a$10$BhSXw4Ouw/FMd5VSqJrsUetivsCjMzGXjz4Hf5SZiVWgZqGPmTK5.',
     'POSTULANTE'),
    (5, b'1', 'Silva Castro', 'diego.silva@demo.com', 'AUTOREGISTRO',
     'https://example.com/cv/diego-silva.pdf',
     DATE_ADD(@mes_2, INTERVAL 2 DAY), 'Diego',
     '$2a$10$BhSXw4Ouw/FMd5VSqJrsUetivsCjMzGXjz4Hf5SZiVWgZqGPmTK5.',
     'POSTULANTE'),
    (6, b'1', 'Quispe Leon', 'valeria.quispe@demo.com', 'AUTOREGISTRO',
     'https://example.com/cv/valeria-quispe.pdf',
     DATE_ADD(@mes_1, INTERVAL 2 DAY), 'Valeria',
     '$2a$10$BhSXw4Ouw/FMd5VSqJrsUetivsCjMzGXjz4Hf5SZiVWgZqGPmTK5.',
     'POSTULANTE'),
    (7, b'1', 'Paredes Flores', 'jose.paredes@demo.com', 'AUTOREGISTRO',
     'https://example.com/cv/jose-paredes.pdf',
     DATE_ADD(@mes_1, INTERVAL 4 DAY), 'Jose',
     '$2a$10$BhSXw4Ouw/FMd5VSqJrsUetivsCjMzGXjz4Hf5SZiVWgZqGPmTK5.',
     'POSTULANTE'),
    (8, b'1', 'Campos Ruiz', 'mariana.campos@demo.com', 'AUTOREGISTRO',
     'https://example.com/cv/mariana-campos.pdf',
     DATE_ADD(@mes_0, INTERVAL 1 DAY), 'Mariana',
     '$2a$10$BhSXw4Ouw/FMd5VSqJrsUetivsCjMzGXjz4Hf5SZiVWgZqGPmTK5.',
     'POSTULANTE');

-- =============================================================
-- VACANTES
-- =============================================================

INSERT INTO vacantes
    (id, creado_por, descripcion, estado, fecha_creacion,
     fecha_modificacion, modalidad, modificado_por, salario,
     titulo, administrador_id, area_id)
VALUES
    (1, 'admin@novarecruit.com',
     'Desarrollo de APIs REST con Java 21, Spring Boot, JPA, MySQL, JWT y Docker.',
     'ACTIVA', DATE_ADD(@mes_5, INTERVAL 4 DAY),
     DATE_ADD(@mes_5, INTERVAL 4 DAY), 'HIBRIDA', NULL, 4800.00,
     'Desarrollador Backend Java', 1, 1),
    (2, 'admin@novarecruit.com',
     'Construccion de interfaces con React, Vite, Tailwind CSS y consumo de servicios REST.',
     'ACTIVA', DATE_ADD(@mes_4, INTERVAL 5 DAY),
     DATE_ADD(@mes_4, INTERVAL 5 DAY), 'REMOTA', NULL, 4200.00,
     'Desarrollador Frontend React', 1, 2),
    (3, 'admin@novarecruit.com',
     'Diseno y automatizacion de pruebas funcionales, API, regresion y seguridad basica.',
     'ACTIVA', DATE_ADD(@mes_3, INTERVAL 4 DAY),
     DATE_ADD(@mes_3, INTERVAL 4 DAY), 'HIBRIDA', NULL, 3900.00,
     'Analista QA Automation', 1, 3),
    (4, 'admin@novarecruit.com',
     'Analisis de informacion, SQL, indicadores de gestion y visualizacion de datos.',
     'CERRADA', DATE_ADD(@mes_3, INTERVAL 7 DAY),
     DATE_ADD(@mes_1, INTERVAL 20 DAY), 'PRESENCIAL',
     'admin@novarecruit.com', 4500.00,
     'Analista de Datos Junior', 1, 4),
    (5, 'admin@novarecruit.com',
     'Diseno de flujos, prototipos, sistemas visuales y pruebas de usabilidad.',
     'ACTIVA', DATE_ADD(@mes_1, INTERVAL 5 DAY),
     DATE_ADD(@mes_1, INTERVAL 5 DAY), 'REMOTA', NULL, 3800.00,
     'Disenador UX/UI', 1, 5),
    (6, 'admin@novarecruit.com',
     'Vacante historica asociada a un area actualmente inactiva.',
     'CERRADA', DATE_ADD(@mes_5, INTERVAL 8 DAY),
     DATE_ADD(@mes_4, INTERVAL 18 DAY), 'PRESENCIAL',
     'admin@novarecruit.com', 3000.00,
     'Tecnico de Soporte TI', 1, 6);

-- =============================================================
-- EVALUACIONES
--
-- Evaluacion 1: bloqueada porque tiene respuestas.
-- Evaluacion 2: editable porque aun no tiene respuestas.
-- Evaluacion 3: bloqueada porque tiene respuestas.
-- Evaluacion 4: bloqueada porque tiene respuestas.
-- =============================================================

INSERT INTO evaluaciones
    (id, creado_por, descripcion, fecha_creacion, titulo, vacante_id)
VALUES
    (1, 'admin@novarecruit.com',
     'Evaluacion de fundamentos de Java, Spring Boot, REST y bases de datos.',
     DATE_ADD(@mes_5, INTERVAL 5 DAY), 'Evaluacion Backend Java', 1),
    (2, 'admin@novarecruit.com',
     'Evaluacion de React, componentes, hooks y consumo de APIs.',
     DATE_ADD(@mes_4, INTERVAL 6 DAY), 'Evaluacion Frontend React', 2),
    (3, 'admin@novarecruit.com',
     'Evaluacion de automatizacion, casos de prueba y calidad de software.',
     DATE_ADD(@mes_3, INTERVAL 5 DAY), 'Evaluacion QA Automation', 3),
    (4, 'admin@novarecruit.com',
     'Evaluacion de SQL, indicadores y analisis de informacion.',
     DATE_ADD(@mes_3, INTERVAL 8 DAY), 'Evaluacion Analista de Datos', 4);

-- =============================================================
-- PREGUNTAS
-- =============================================================

INSERT INTO preguntas
    (id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d,
     respuesta_correcta, tipo_pregunta, evaluacion_id)
VALUES
    -- Evaluacion 1: cinco preguntas, cuatro puntos cada una.
    (1, '¿Que anotacion marca una clase como controlador REST en Spring?',
     '@RestController', '@Service', '@Repository', '@Entity',
     'A', 'MULTIPLE', 1),
    (2, '¿Que capa se utiliza normalmente para acceder a la base de datos con Spring Data JPA?',
     'Controller', 'Repository', 'DTO', 'SecurityFilter',
     'B', 'MULTIPLE', 1),
    (3, '¿Que codigo HTTP representa una creacion exitosa?',
     '200', '204', '201', '404',
     'C', 'MULTIPLE', 1),
    (4, 'Una clave foranea mantiene la integridad entre tablas relacionadas.',
     'VERDADERO', 'FALSO', 'N/A', 'N/A',
     'A', 'VERDADERO_FALSO', 1),
    (5, 'JWT puede utilizarse para autenticar solicitudes sin mantener una sesion en el servidor.',
     'VERDADERO', 'FALSO', 'N/A', 'N/A',
     'A', 'VERDADERO_FALSO', 1),

    -- Evaluacion 2: cuatro preguntas, cinco puntos cada una. Sin respuestas.
    (6, '¿Que hook permite manejar estado local en un componente funcional?',
     'useState', 'useRoute', 'useClass', 'useTemplate',
     'A', 'MULTIPLE', 2),
    (7, '¿Que herramienta se utiliza para construir este frontend?',
     'Maven', 'Vite', 'Hibernate', 'Tomcat Manager',
     'B', 'MULTIPLE', 2),
    (8, 'Los componentes de React pueden recibir datos mediante props.',
     'VERDADERO', 'FALSO', 'N/A', 'N/A',
     'A', 'VERDADERO_FALSO', 2),
    (9, 'Axios se utiliza para realizar solicitudes HTTP desde el frontend.',
     'VERDADERO', 'FALSO', 'N/A', 'N/A',
     'A', 'VERDADERO_FALSO', 2),

    -- Evaluacion 3: cuatro preguntas, cinco puntos cada una.
    (10, '¿Que tipo de prueba comprueba que una funcionalidad cumple lo esperado?',
     'Funcional', 'Estetica', 'Financiera', 'Contable',
     'A', 'MULTIPLE', 3),
    (11, '¿Que herramienta puede automatizar navegadores web?',
     'MySQL', 'Selenium', 'Maven Central', 'Nginx',
     'B', 'MULTIPLE', 3),
    (12, 'Una prueba de regresion ayuda a detectar fallos introducidos por cambios recientes.',
     'VERDADERO', 'FALSO', 'N/A', 'N/A',
     'A', 'VERDADERO_FALSO', 3),
    (13, 'OWASP ZAP puede apoyar pruebas dinamicas de seguridad web.',
     'VERDADERO', 'FALSO', 'N/A', 'N/A',
     'A', 'VERDADERO_FALSO', 3),

    -- Evaluacion 4: cuatro preguntas, cinco puntos cada una.
    (14, '¿Que sentencia se utiliza para consultar datos en SQL?',
     'INSERT', 'SELECT', 'DROP', 'ALTER',
     'B', 'MULTIPLE', 4),
    (15, '¿Que funcion SQL calcula el promedio?',
     'COUNT', 'SUM', 'AVG', 'MAX',
     'C', 'MULTIPLE', 4),
    (16, 'GROUP BY permite agrupar filas para aplicar funciones de agregacion.',
     'VERDADERO', 'FALSO', 'N/A', 'N/A',
     'A', 'VERDADERO_FALSO', 4),
    (17, 'Una clave primaria puede repetirse dentro de la misma tabla.',
     'VERDADERO', 'FALSO', 'N/A', 'N/A',
     'B', 'VERDADERO_FALSO', 4);

-- =============================================================
-- POSTULACIONES
-- =============================================================

INSERT INTO postulaciones
    (id, comentarios_internos, estado, fecha_evaluacion,
     fecha_postulacion, puntaje_tecnico, respuestas_postulante,
     usuario_id, vacante_id)
VALUES
    (1, NULL, 'EVALUADO', DATE_ADD(@mes_5, INTERVAL 12 DAY),
     DATE_ADD(@mes_5, INTERVAL 8 DAY), 16, NULL, 2, 1),
    (2, 'Candidato seleccionado por buen resultado tecnico.',
     'CONTRATADO', DATE_ADD(@mes_4, INTERVAL 13 DAY),
     DATE_ADD(@mes_4, INTERVAL 8 DAY), 20, NULL, 3, 1),
    (3, 'Segundo candidato contratado para demostrar la advertencia de multiples contratados.',
     'CONTRATADO', DATE_ADD(@mes_3, INTERVAL 14 DAY),
     DATE_ADD(@mes_3, INTERVAL 9 DAY), 12, NULL, 4, 1),
    (4, 'No alcanzo el perfil tecnico requerido.',
     'RECHAZADO', DATE_ADD(@mes_2, INTERVAL 13 DAY),
     DATE_ADD(@mes_2, INTERVAL 8 DAY), 8, NULL, 5, 1),
    (5, NULL, 'POSTULADO', NULL,
     DATE_ADD(@mes_0, INTERVAL 4 DAY), NULL, NULL, 6, 1),
    (6, NULL, 'POSTULADO', NULL,
     DATE_ADD(@mes_1, INTERVAL 7 DAY), NULL, NULL, 7, 2),
    (7, NULL, 'EVALUADO', DATE_ADD(@mes_1, INTERVAL 16 DAY),
     DATE_ADD(@mes_1, INTERVAL 10 DAY), 15, NULL, 8, 3),
    (8, 'Resultado tecnico insuficiente.',
     'RECHAZADO', DATE_ADD(@mes_2, INTERVAL 18 DAY),
     DATE_ADD(@mes_2, INTERVAL 11 DAY), 10, NULL, 2, 3),
    (9, 'Seleccionado para el equipo de analitica.',
     'CONTRATADO', DATE_ADD(@mes_1, INTERVAL 18 DAY),
     DATE_ADD(@mes_1, INTERVAL 12 DAY), 15, NULL, 3, 4),
    (10, NULL, 'EVALUADO', DATE_ADD(@mes_0, INTERVAL 8 DAY),
     DATE_ADD(@mes_0, INTERVAL 3 DAY), 20, NULL, 4, 3),
    (11, NULL, 'POSTULADO', NULL,
     DATE_ADD(@mes_0, INTERVAL 6 DAY), NULL, NULL, 5, 2),
    (12, NULL, 'POSTULADO', NULL,
     DATE_ADD(@mes_3, INTERVAL 15 DAY), NULL, NULL, 6, 5);

-- =============================================================
-- RESPUESTAS NORMALIZADAS
--
-- Evaluacion 1: 5 preguntas x 4 puntos.
-- Evaluaciones 3 y 4: 4 preguntas x 5 puntos.
-- =============================================================

INSERT INTO respuestas_postulantes
    (id, es_correcta, fecha_respuesta, puntaje_asignado,
     puntaje_obtenido, respuesta_seleccionada,
     postulacion_id, pregunta_id)
VALUES
    -- Postulacion 1: 16/20.
    (1,  b'1', DATE_ADD(@mes_5, INTERVAL 12 DAY), 4, 4, 'A', 1, 1),
    (2,  b'1', DATE_ADD(@mes_5, INTERVAL 12 DAY), 4, 4, 'B', 1, 2),
    (3,  b'1', DATE_ADD(@mes_5, INTERVAL 12 DAY), 4, 4, 'C', 1, 3),
    (4,  b'0', DATE_ADD(@mes_5, INTERVAL 12 DAY), 4, 0, 'B', 1, 4),
    (5,  b'1', DATE_ADD(@mes_5, INTERVAL 12 DAY), 4, 4, 'A', 1, 5),

    -- Postulacion 2: 20/20.
    (6,  b'1', DATE_ADD(@mes_4, INTERVAL 13 DAY), 4, 4, 'A', 2, 1),
    (7,  b'1', DATE_ADD(@mes_4, INTERVAL 13 DAY), 4, 4, 'B', 2, 2),
    (8,  b'1', DATE_ADD(@mes_4, INTERVAL 13 DAY), 4, 4, 'C', 2, 3),
    (9,  b'1', DATE_ADD(@mes_4, INTERVAL 13 DAY), 4, 4, 'A', 2, 4),
    (10, b'1', DATE_ADD(@mes_4, INTERVAL 13 DAY), 4, 4, 'A', 2, 5),

    -- Postulacion 3: 12/20.
    (11, b'1', DATE_ADD(@mes_3, INTERVAL 14 DAY), 4, 4, 'A', 3, 1),
    (12, b'1', DATE_ADD(@mes_3, INTERVAL 14 DAY), 4, 4, 'B', 3, 2),
    (13, b'1', DATE_ADD(@mes_3, INTERVAL 14 DAY), 4, 4, 'C', 3, 3),
    (14, b'0', DATE_ADD(@mes_3, INTERVAL 14 DAY), 4, 0, 'B', 3, 4),
    (15, b'0', DATE_ADD(@mes_3, INTERVAL 14 DAY), 4, 0, 'B', 3, 5),

    -- Postulacion 4: 8/20.
    (16, b'1', DATE_ADD(@mes_2, INTERVAL 13 DAY), 4, 4, 'A', 4, 1),
    (17, b'1', DATE_ADD(@mes_2, INTERVAL 13 DAY), 4, 4, 'B', 4, 2),
    (18, b'0', DATE_ADD(@mes_2, INTERVAL 13 DAY), 4, 0, 'A', 4, 3),
    (19, b'0', DATE_ADD(@mes_2, INTERVAL 13 DAY), 4, 0, 'B', 4, 4),
    (20, b'0', DATE_ADD(@mes_2, INTERVAL 13 DAY), 4, 0, 'B', 4, 5),

    -- Postulacion 7: 15/20, evaluacion 3.
    (21, b'1', DATE_ADD(@mes_1, INTERVAL 16 DAY), 5, 5, 'A', 7, 10),
    (22, b'1', DATE_ADD(@mes_1, INTERVAL 16 DAY), 5, 5, 'B', 7, 11),
    (23, b'1', DATE_ADD(@mes_1, INTERVAL 16 DAY), 5, 5, 'A', 7, 12),
    (24, b'0', DATE_ADD(@mes_1, INTERVAL 16 DAY), 5, 0, 'B', 7, 13),

    -- Postulacion 8: 10/20, evaluacion 3.
    (25, b'1', DATE_ADD(@mes_2, INTERVAL 18 DAY), 5, 5, 'A', 8, 10),
    (26, b'1', DATE_ADD(@mes_2, INTERVAL 18 DAY), 5, 5, 'B', 8, 11),
    (27, b'0', DATE_ADD(@mes_2, INTERVAL 18 DAY), 5, 0, 'B', 8, 12),
    (28, b'0', DATE_ADD(@mes_2, INTERVAL 18 DAY), 5, 0, 'B', 8, 13),

    -- Postulacion 9: 15/20, evaluacion 4.
    (29, b'1', DATE_ADD(@mes_1, INTERVAL 18 DAY), 5, 5, 'B', 9, 14),
    (30, b'1', DATE_ADD(@mes_1, INTERVAL 18 DAY), 5, 5, 'C', 9, 15),
    (31, b'1', DATE_ADD(@mes_1, INTERVAL 18 DAY), 5, 5, 'A', 9, 16),
    (32, b'0', DATE_ADD(@mes_1, INTERVAL 18 DAY), 5, 0, 'A', 9, 17),

    -- Postulacion 10: 20/20, evaluacion 3.
    (33, b'1', DATE_ADD(@mes_0, INTERVAL 8 DAY), 5, 5, 'A', 10, 10),
    (34, b'1', DATE_ADD(@mes_0, INTERVAL 8 DAY), 5, 5, 'B', 10, 11),
    (35, b'1', DATE_ADD(@mes_0, INTERVAL 8 DAY), 5, 5, 'A', 10, 12),
    (36, b'1', DATE_ADD(@mes_0, INTERVAL 8 DAY), 5, 5, 'A', 10, 13);

-- =============================================================
-- AJUSTE DE AUTO_INCREMENT
-- =============================================================

ALTER TABLE areas AUTO_INCREMENT = 7;
ALTER TABLE usuarios AUTO_INCREMENT = 9;
ALTER TABLE vacantes AUTO_INCREMENT = 7;
ALTER TABLE evaluaciones AUTO_INCREMENT = 5;
ALTER TABLE preguntas AUTO_INCREMENT = 18;
ALTER TABLE postulaciones AUTO_INCREMENT = 13;
ALTER TABLE respuestas_postulantes AUTO_INCREMENT = 37;

-- =============================================================
-- COMPROBACIONES INTERNAS
-- Estas consultas aparecen en el log de inicializacion de MySQL.
-- =============================================================

SELECT 'areas' AS tabla, COUNT(*) AS registros FROM areas
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'vacantes', COUNT(*) FROM vacantes
UNION ALL
SELECT 'evaluaciones', COUNT(*) FROM evaluaciones
UNION ALL
SELECT 'preguntas', COUNT(*) FROM preguntas
UNION ALL
SELECT 'postulaciones', COUNT(*) FROM postulaciones
UNION ALL
SELECT 'respuestas_postulantes', COUNT(*) FROM respuestas_postulantes;
