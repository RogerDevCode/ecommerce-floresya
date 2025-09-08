E-COMMERCE: OPTIMIZACIÓN AVANZADA DE CONVERSIÓN
Contexto del Proyecto: Esta plataforma e-commerce busca maximizar conversiones a través de una experiencia de usuario pulida y técnicas avanzadas de marketing psicológico, priorizando una interfaz limpia y efectiva que facilite la compra inmediata.

🎯 OBJETIVO PRINCIPAL
Transformar la página de detalle del producto en una experiencia excepcional para el cliente que genere confianza, satisfacción y promueva la acción de compra inmediata ("click buy") sin provocar distracciones ni engaños.

ÁREAS DE ALTA PRIORIDAD
Refinamiento Visual Profesional

Mejorar espaciado, tipografía y jerarquías visuales para garantizar elegancia y claridad

Optimizar diseño responsive para todos los dispositivos (móviles, tabletas, desktop)

Usar una estética premium coherente con la marca

Optimización de Conversión

Analítica avanzada para medir efectividad de mensajes y elementos psicológicos aplicados

Seguimiento de métricas de engagement, tiempo de permanencia y tasa de conversión

Mejorar llamadas a la acción (CTAs) con diseños y textos persuasivos pero honestos

Performance y Experiencia de Usuario (UX)

Implementar logging exhaustivo en consola para confirmar ejecución y salud de procesos críticos en desarrollo

Optimizar carga de recursos (imágenes, CSS, scripts) para mejorar velocidad y First Contentful Paint

Realizar pruebas cross-browser y en dispositivos variados para asegurar compatibilidad

🛠️ ARQUITECTURA TÉCNICA
Stack Tecnológico
Backend y frontend acordes al proyecto específico (Node.js, PHP, Django, React, Vue o Vanilla JS, entre otros), usa javascript ES6 para estabilidad y univers

Utilización de frameworks y librerías modernos para rendimiento y escalabilidad

Métodos de despliegue utilizados (Vercel, Netlify, AWS, etc.)

Archivos o Componentes Clave
Ruta y descripción breve de archivos front y back relevantes

Módulos de estilos y scripts esenciales a optimizar

Comandos o Scripts de Desarrollo
Detalles sobre cómo levantar el entorno de prueba, testeo o desarrollo rápido

🎨 DISEÑO VISUAL PREMIUM
Principios y Técnicas Visuales
Uso de efectos modernos (glassmorphism, gradients, hardware-accelerated animations)

Micro-interacciones para feedback instantáneo

Psicología del color adecuada al público objetivo (ej. colores que impulsen confianza o compra)

Responsive Breakpoints Sugeridos
Desktop: +1200px

Tablet: 768px a 1199px

Mobile: <768px (optimizado para touch)

🔥 PROMPT PARA LA IA
"Soy desarrollador de un e-commerce. Necesito que analices y optimices todas las páginas de la aplicacion, para transformar la experiencia del usuario en una que sea altamente persuasiva y agradable, generando confianza y promoviendo la compra inmediata.

Prioriza: refinamiento visual (tipografía, espaciado, jerarquías), optimización de conversión con métricas claras, y mejora del rendimiento (carga y experiencia UX). Aplica técnicas de marketing psicológico ya implementadas y sugiere mejoras honestas, sin usar trucos ni distracciones molestas.

Asegúrate de incluir logging detallado en consola para procesos críticos durante desarrollo para verificar la correcta ejecución y salud del sistema.

Conoce el contexto técnico y accede a los archivos y scripts indicados para desarrollo y testing. Prioriza resultados que impacten positivamente las ventas reales y la satisfacción del cliente.

Realiza testing continuos una vez modificada alguna funcionalibidad, al guna caracteristica

Queda explicitamente prohibido el uso de imagenes locales para los productos u otras entidades de la base de datos, solo son aceptables imagenes locales para la interface/paginal html y para los placeholders. En el caso especial de los placeholders, si despues de solicitar a supabase una imagen y esta no existe, es null, la api backend, devolvera la imagen placeholder local por defecto, es decir que el frontend siempre recibira una imagen.

queda explicitamente prohibido el uso de otra base de datos que no sea supabase postgres.

queda explicitamente prohibido guardar imagenes en local, a menos que sean las imagenes que seran cargadas a supabase, y una vez cargada sera eliminadas

queda explicitamente prohibido usar trucos u atajos para acceder a la bases de datos, toda interacion, contacto, acceso, debe realizarce a travez de la API Backend, que sera la misma en produccion.

usa intensivamente los logs, usando la ayuda de /home/manager/Sync/ecommerce-floresya/backend/src/utils/logger.js

Exlusivamente prohibido usar versiones hidridas, locales, sqlite, o de otra indole, prohibido usar la aplicacion sin superbase, y sin conexiones a supabase, el proyecto se debe ejecutar exlusivamente con la base de datos supabase, spy categorico con esto.
"