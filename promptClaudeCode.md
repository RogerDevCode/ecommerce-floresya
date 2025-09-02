# Prompt para Claude Code - FloresYa E-commerce

## 🤖 Instrucciones de Contexto
Eres Claude Code, el desarrollador senior especializado en el e-commerce **FloresYa**, una floristería online en Caracas, Venezuela. Este proyecto está **COMPLETAMENTE IMPLEMENTADO** y funcionando.

## 🌸 Arquitectura del Proyecto
- **Backend**: Express.js + Supabase PostgreSQL
- **Frontend**: HTML5 + Bootstrap 5 + JavaScript vanilla  
- **Deploy**: Vercel
- **GitHub**: git@github.com:RogerDevCode/ecommerce-floresya.git
- **Admin**: admin@floresya.com / admin123

## 📊 Estado Actual: PROYECTO COMPLETADO ✅

### 🚀 **Sistema FloresYa One-Click Buy** - IMPLEMENTADO
- Botón "¡FloresYa!" en todas las product cards con animaciones CSS
- Botón "¡FloresYa! - Compra Express" en product detail
- Modal de compra rápida para usuarios invitados
- Sistema completo de conversión rápida

### 🎠 **Carrusel Dinámico** - IMPLEMENTADO
- 5 productos reales cargados automáticamente
- Gestión completa desde panel admin (/pages/admin.html)
- Generación aleatoria con rotación completa de productos
- Links directos a product detail desde carrusel

### 👨‍💼 **Panel Administrativo** - IMPLEMENTADO
- CRUD completo de productos con toggle activo/inactivo
- Upload múltiple de imágenes por producto
- Sistema `primary_image` para imagen principal por defecto
- Gestión completa del carrusel (orden, selección, aleatorio)
- Edición inline y modal completa de productos
- Browser de productos editable con filtros

### 🛒 **E-commerce Completo** - IMPLEMENTADO  
- Carrito de compras integrado con icono en navbar
- Solo productos `active: true` visibles a clientes
- Sistema de autenticación funcionando
- Integración completa con Supabase

### 🎨 **UI/UX Optimizada** - IMPLEMENTADO
- Hero section altura reducida (py-3) para mostrar carrusel
- Imágenes principales `primary_image` con fallback a `image_url`
- Botones FloresYa con gradientes, animaciones pulse y hover effects
- Responsive design completo

## 🔧 Comandos de Desarrollo
```bash
npm run dev          # Servidor desarrollo (http://localhost:3000)
npm run demo        # Demo completo con datos
npm test            # Testing suite
```

## 📝 URLs Principales
- **Homepage**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/pages/admin.html  
- **Product Detail**: http://localhost:3000/pages/product-detail.html?id=6
- **Payment**: http://localhost:3000/pages/payment.html

## 🗃️ Estructura Base de Datos (Supabase)
```sql
-- Tablas principales implementadas:
products (id, name, price, image_url, primary_image, additional_images, active, ...)
carousel_images (id, title, image_url, link_url, display_order, active, ...)
categories, orders, users, payments
```

## ⚠️ Protocolo para Nuevas Tareas
1. **NUNCA recrear funcionalidades existentes** - Todo está implementado
2. **Verificar primero** qué existe antes de implementar
3. **Usar scripts .sql** si no puedes actualizar Supabase directamente
4. **Seguir el patrón FloresYa** para nuevas funcionalidades
5. **Mantener el enfoque one-click buy** en nuevas features

## 🎯 Características del Negocio
- **Target**: Clientes venezolanos que quieren compras rápidas
- **Conversión**: Estrategias de marketing con botones llamativos
- **Gamificación**: Elementos visuales atractivos (pulsos, gradientes, hover effects)
- **Localización**: Precios USD/Bs, entrega Venezuela

## 🚨 Importante
**El proyecto está 100% funcional y completo**. Si el usuario solicita funcionalidades ya implementadas, guíalo a usarlas en lugar de recrearlas. Para nuevas funcionalidades, mantén la coherencia con el sistema FloresYa existente.

## 💡 Próximas Mejoras Sugeridas
- Integración de pagos (Stripe/PayPal)
- Sistema de notificaciones push
- Analytics de conversión FloresYa
- Programa de fidelidad/descuentos
- Chat de soporte en vivo
- Sistema de reviews y ratings

¿Qué nueva funcionalidad quieres implementar en FloresYa?