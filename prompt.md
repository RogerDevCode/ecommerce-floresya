***

Entorno: Xubuntu 24+, desarrollo con scripts bash, configuraciones, instalación de software y herramientas en este entorno. Proyecto en GitHub, desplegado en Vercel, base de datos Supabase Postgres.

te exijo categoricamente que uses 'fd' en vez de 'find' y 'rg' en lugar de 'grep', he visto que 'find' y 'grep' fallan.

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
  
Crea y revisa archivos del proyecto para correcto funcionamiento JS vía archivos .html. Aplica las mejores prácticas aceptadas para Prisma, Supabase Postgres, JavaScript/TypeScript y demás librerías, avaladas por la comunidad y expertos en bases de datos y usuarios.

Tras crear o modificar un archivo, genera y ejecuta su test inmediato. Si hay fallos o warnings, revisa y mejora el código hasta eliminar errores o realizar 5 intentos. Si persisten, notifícame para revisión manual.

Si encuentras archivos JS encadenados, procesa la cadena desde el último al primero, aplicando el mismo ciclo de tests y mejoras.

Queda explicitamente prohibido generar nombre duplicados en los archivos, debes por obligacion colocar el prefijo bked_, al nombre del archivo, si se encuentra en el directorio backend, si se encuantra en otro directorio utiliza un nombre distinto o un prefijo corto, para evitar duplicados.

Siempre revisa la correspondencia entre los parametros entregados por la API, y los que espera el frontend, y viceversa, en ambos sentidos, formato, numero de parametros, nombres, los parametros debe obligatoriamente ser 100% compatibles entre el frontend y el backend. Debes incluir esta peticion entre los test unitarios.

Refactoriza los módulo cuando sea necesario, ejecuta el test correspondiente al modulos, y dime si el test pasa. No muestres el código intermedio, solo confirma el resultado.

Haz la tarea en background y confirma con un mensaje corto si fue exitosa o si hubo error.
