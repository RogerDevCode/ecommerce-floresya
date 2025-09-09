***

Entorno: Xubuntu 24+, desarrollo con scripts bash, configuraciones, instalación de software y herramientas en este entorno. Proyecto en GitHub, desplegado en Vercel, base de datos Supabase Postgres.

E-COMMERCE: OPTIMIZACIÓN AVANZADA DE CONVERSIÓN  
Objetivo: Maximizar conversiones con experiencia de usuario limpia, confiable y sin distracciones o trucos engañosos (no usar pop-ups falsos o mensajes molestos). Interfaz enfocada en producto y acción de compra inmediata.

Áreas clave:  
- Diseño profesional: mejorar espaciado, tipografía, jerarquía visual y responsive (móvil, tablet, desktop), estética coherente con marca.  
- Optimización de conversión: analítica avanzada, CTAs persuasivas y honestas.  
- Rendimiento y UX: logging en consola para procesos críticos, carga óptima de recursos, interfaz responsive y compatible.

Arquitectura técnica:  
- Backend y frontend según proyecto (Node.js, PHP, Django, React, Vue, Vanilla JS)  
- JavaScript ES5 obligatorio; convertir ES6 a ES5, módulos que exporten/importen sin problemas  
- Uso de frameworks/librerías modernas para rendimiento/escala  
- Despliegue en Vercel u otras plataformas

Diseño visual:  
- Efectos modernos básicos, micro-interacciones  
- Psicología del color según público y marca  
- Breakpoints: desktop >1200px, tablet 768–1199px, móvil <768px optimizado touch

Instrucciones para IA:  
Analiza y optimiza todas las páginas para mejorar UX, confianza y ventas. Prioriza refinamiento visual, métricas de conversión claras, y rendimiento. Evita trucos o distracciones molestas.  

Usa logging detallado con /home/manager/Sync/ecommerce-floresya/backend/src/utils/logger.js para procesos críticos.  

Garantiza testing continuo tras cada cambio, con un archivo de test por API backend, validando datos de Supabase Postgres rigurosamente.  

Prohibido uso de imágenes locales para productos u otras entidades, salvo logos, ayudas visuales y placeholders. Backend debe devolver imagen placeholder local si Supabase responde null.  

Solo usar base de datos Supabase Postgres; ningún acceso directo o atajo fuera de la API backend.  

Prohibido guardar imágenes locales salvo temporalmente para subirlas a Supabase, luego eliminar.  

No usar versiones híbridas, locales, SQLite u otras bases; solo Supabase oficial.  

Antes de tareas largas (actualizaciones o tests masivos), crea un archivo todo.md con la planificación, marcando avances y pendientes, con resumen inicial para facilitar continuidad entre sesiones y plataformas IA.
  