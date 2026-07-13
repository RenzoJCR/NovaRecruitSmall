# NovaRecruit 🚀 — Portal Inteligente de Reclutamiento TI

**NovaRecruit** es una plataforma web inteligente de selección y evaluación para perfiles tecnológicos. Está diseñada bajo un enfoque de arquitectura limpia estructurada en **6 tablas relacionales puras (Zero Padding)**, optimizando la persistencia mediante cadenas JSON y ofreciendo métricas de rendimiento en tiempo real y notificaciones asíncronas mediante el protocolo **STOMP (WebSockets)**.

---

## 📋 Resumen del Alcance y Reglas de Negocio
* **Roles Exclusivos:** Únicamente maneja dos roles con accesos perimetrales estrictos: `ADMINISTRADOR` y `POSTULANTE`.
* **Proceso de Negocio 1 (Atracción):** El postulante aplica a ofertas en vivo; el sistema notifica en tiempo real al pool administrativo y alimenta gráficos vectoriales de series de tiempo.
* **Proceso de Negocio 2 (Evaluación Vigesimal Autónoma):** El postulante rinde pruebas técnicas dinámicas (Múltiple opción y Verdadero/Falso). El backend procesa el string JSON de respuestas, compara llaves contra MySQL y calcula automáticamente la nota bajo el **sistema vigesimal puro (Base 20)**.
* **Directriz de Control:** Se evitan porcentajes abstractos en los reportes; todas las métricas operan bajo conteos directos e índices promedio puros sobre 20.00.
* **Trazabilidad:** Implementación estricta de *Custom Logs* dinámicos mediante SLF4J en la consola para una auditoría transparente durante la sustentación.

---

## 📂 Arquitectura del Proyecto y Estructura de Carpetas

El repositorio está organizado bajo una estructura unificada de **Monorepo** que aísla de forma modular la lógica de negocio del servidor y la interfaz reactiva del cliente:

```text
NovaRecruit/
├── backend/                        # NÚCLEO DEL SERVIDOR (Spring Boot 3.x)
│   ├── src/main/java/com/novarecruit/backend/
│   │   ├── config/                 # Infraestructura y Seguridad Perimetral
│   │   ├── controller/             # Controladores REST expuestos con Custom Logs
│   │   ├── dto/                    # Records inmutables para el traspaso de datos
│   │   ├── entity/                 # Entidades JPA mapeadas a las 6 tablas puras
│   │   ├── mapper/                 # Transformación limpia de Entidades a DTOs
│   │   ├── repository/             # Consultas nativas y agregaciones en MySQL
│   │   └── service/                # Lógica transaccional y orquestación WebSocket
│   └── pom.xml                     # Dependencias Core (Starter Web, Security, JPA, Jackson)
│
├── src/                            # CAPA DEL CLIENTE (Vite + React 19 + Tailwind CSS)
│   ├── assets/                     # Recursos visuales estáticos y vectoriales
│   ├── components/
│   │   ├── layouts/                # DashboardLayout y Sidebar dinámicos por rol
│   │   └── ui/                     # Componentes reutilizables de UI (SectionHeader)
│   ├── context/                    # Estado global de sesión y tokens (AuthContext)
│   ├── pages/                      # Las 9 Vistas Core del Sistema
│   │   ├── admin/                  # Dashboard (Gráficos lineales SVG), Áreas, Vacantes, Usuarios, Postulaciones
│   │   ├── applicant/              # Historial del Candidato, Cuestionario Técnico Reactivo
│   │   ├── auth/                   # Autenticación segura (Login y Registro)
│   │   └── public/                 # Landing comercial (Home) y Detalle de Ofertas
│   ├── routes/                     # Enrutador perimetral protegido (ProtectedRoute)
│   ├── services/                   # Clientes de API estructurados (Axios Interceptors)
│   ├── App.css                     # Estilos globales complementarios
│   ├── App.jsx                     # Punto de anclaje de componentes de navegación
│   ├── index.css                   # Inyección de directivas Tailwind CSS
│   └── main.jsx                    # Inicializador de la aplicación en React 19
└── .gitignore                      # Filtro de exclusión para control de versiones