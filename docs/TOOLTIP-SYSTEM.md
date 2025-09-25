# 🌸 FloresYa Advanced Tooltip System Documentation

## Overview

FloresYa implements a comprehensive, accessible tooltip system that provides contextual help and information across all components. The system uses modern CSS animations, JavaScript utilities, and follows accessibility best practices.

## Architecture

### Core Files

1. **`/public/css/tooltips.css`** - Advanced CSS tooltip system with animations
2. **`/public/js/tooltip-utils.js`** - JavaScript utility for dynamic tooltip management
3. **Integration in HTML pages** - Tooltip system included in all major pages

### Features

- ✅ **Multiple Positioning Options**: Top, bottom, left, right tooltips
- ✅ **Color Variations**: Success, warning, error, info, primary themes
- ✅ **Smooth Animations**: CSS-based fade-in animations
- ✅ **Accessibility Compliant**: ARIA labels, keyboard navigation
- ✅ **Mobile Responsive**: Adaptive sizing for mobile devices
- ✅ **Dynamic Management**: JavaScript utilities for runtime tooltip handling
- ✅ **Context Awareness**: Tooltips adapt based on user state
- ✅ **Performance Optimized**: Debounced operations and efficient DOM handling

## CSS Tooltip Classes

### Basic Usage

```html
<!-- Simple tooltip -->
<button data-tooltip="This is a helpful tooltip">Hover me</button>

<!-- Add tooltip-trigger class for styling -->
<button class="tooltip-trigger" data-tooltip="Enhanced tooltip">Button</button>
```

### Positioning Options

```html
<!-- Top tooltip (default) -->
<button data-tooltip="Top tooltip">Top</button>

<!-- Bottom tooltip -->
<button data-tooltip-bottom="Bottom tooltip">Bottom</button>

<!-- Left tooltip -->
<button data-tooltip-left="Left tooltip">Left</button>

<!-- Right tooltip -->
<button data-tooltip-right="Right tooltip">Right</button>
```

### Color Variations

```html
<!-- Success tooltip (green) -->
<button class="tooltip-trigger tooltip-success" data-tooltip="Success message">Success</button>

<!-- Warning tooltip (yellow) -->
<button class="tooltip-trigger tooltip-warning" data-tooltip="Warning message">Warning</button>

<!-- Error tooltip (red) -->
<button class="tooltip-trigger tooltip-error" data-tooltip="Error message">Error</button>

<!-- Info tooltip (blue) -->
<button class="tooltip-trigger tooltip-info" data-tooltip="Information">Info</button>

<!-- Primary tooltip (pink/brand color) -->
<button class="tooltip-trigger tooltip-primary" data-tooltip="Primary action">Primary</button>
```

### Long Content Tooltips

```html
<!-- For longer descriptions -->
<button data-tooltip-long="This is a longer tooltip that can contain multiple lines and more detailed information">
    Detailed Help
</button>
```

## JavaScript Tooltip Manager

### Initialization

The tooltip system automatically initializes when the DOM is ready:

```javascript
// Automatically initialized
const tooltipManager = new TooltipManager();
```

### Dynamic Tooltip Management

```javascript
// Add tooltip to elements
tooltipManager.addTooltip('#myButton', 'Dynamic tooltip text', {
    position: 'bottom',
    type: 'success',
    long: false
});

// Update existing tooltip
tooltipManager.updateTooltip('#myButton', 'Updated tooltip text');

// Remove tooltip
tooltipManager.removeTooltip('#myButton');

// Show tooltip programmatically
tooltipManager.showTooltip('#myButton', 3000); // Show for 3 seconds
```

### Contextual Tooltips

The system automatically updates tooltips based on application state:

```javascript
// Cart count updates tooltip automatically
document.addEventListener('cartUpdated', () => {
    tooltipManager.updateContextualTooltips();
});

// User login/logout updates tooltip context
window.addEventListener('storage', () => {
    tooltipManager.updateContextualTooltips();
});
```

## Component-Specific Tooltips

### Navigation Components

```html
<!-- Logo and branding -->
<a href="/" data-tooltip="Ir a la página principal de FloresYa">
    <img src="/images/logoFloresYa.jpeg" alt="FloresYa Logo" data-tooltip="Logo de FloresYa - Floristería online">
    <span>FloresYa</span>
</a>

<!-- Mobile menu toggle -->
<button id="mobile-menu-button" data-tooltip="Abrir menú de navegación">
    <i data-lucide="menu"></i>
</button>

<!-- Cart icon with dynamic count -->
<a id="cartToggle" data-tooltip="Ver carrito de compras - 0 productos">
    <i data-lucide="heart" data-tooltip="Corazón representa productos favoritos"></i>
    <span id="cartCount" data-tooltip="Número de productos en el carrito">0</span>
</a>
```

### Authentication Components

```html
<!-- Login/Register buttons -->
<a id="loginBtn" data-tooltip="Iniciar sesión en tu cuenta">Iniciar Sesión</a>
<a id="registerBtn" data-tooltip="Crear una cuenta nueva">Registrarse</a>

<!-- User menu -->
<button id="user-menu-button" data-tooltip="Abrir menú de usuario">
    <i data-lucide="user-circle" data-tooltip="Icono de perfil de usuario"></i>
</button>

<!-- User menu items -->
<a id="viewProfile" data-tooltip="Ver y editar información personal">Mi Perfil</a>
<a id="viewOrders" data-tooltip="Ver historial de pedidos realizados">Mis Pedidos</a>
<a id="adminPanel" data-tooltip="Acceder al panel de administración">Panel de Administrador</a>
<a id="logoutBtn" data-tooltip="Cerrar sesión actual">Cerrar Sesión</a>
```

### Search and Filter Components

```html
<!-- Search input -->
<input id="searchInput" data-tooltip="Buscar productos por nombre, descripción o categoría"
       placeholder="Buscar productos...">

<!-- Search button -->
<button id="searchBtn" data-tooltip="Realizar búsqueda">
    <i data-lucide="search"></i>
</button>

<!-- Filter dropdowns -->
<select id="occasionFilter" data-tooltip="Filtrar productos por ocasión especial">
    <option value="">Todas las ocasiones</option>
</select>

<select id="sortFilter" data-tooltip="Ordenar productos por criterio seleccionado">
    <option value="created_at:desc">Más recientes</option>
</select>
```

### Carousel and Media Components

```html
<!-- Carousel controls -->
<button id="carousel-prev" data-tooltip="Ver producto anterior">
    <i data-lucide="chevron-left"></i>
</button>

<button id="carousel-next" data-tooltip="Ver siguiente producto">
    <i data-lucide="chevron-right"></i>
</button>

<!-- Floating action button -->
<button class="fab" data-tooltip-left="Ver catálogo de productos">
    <i data-lucide="flower" data-tooltip="Ir a productos"></i>
</button>
```

### Cart and Shopping Components

```html
<!-- Back to shopping -->
<button id="backBtn" data-tooltip="Volver al catálogo de productos">
    <i data-lucide="arrow-left" data-tooltip="Flecha hacia atrás"></i>
    <span>Continuar comprando</span>
</button>

<!-- Product quantity controls -->
<button class="quantity-decrease" data-tooltip="Disminuir cantidad">-</button>
<button class="quantity-increase" data-tooltip="Aumentar cantidad">+</button>

<!-- Remove item from cart -->
<button class="remove-item" data-tooltip="Eliminar producto del carrito">
    <i data-lucide="trash-2"></i>
</button>
```

## Common Tooltip Patterns

### Form Validation

```html
<!-- Required field indicators -->
<input type="email" required data-tooltip="Este campo es obligatorio">

<!-- Help text for complex fields -->
<input type="tel" data-tooltip="Formato: +58 414 123 4567">

<!-- Password requirements -->
<input type="password" data-tooltip-long="La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula y un número">
```

### Status Indicators

```html
<!-- Success states -->
<div class="tooltip-trigger tooltip-success" data-tooltip="Operación completada exitosamente">
    <i data-lucide="check-circle"></i>
</div>

<!-- Error states -->
<div class="tooltip-trigger tooltip-error" data-tooltip="Error al procesar la solicitud">
    <i data-lucide="x-circle"></i>
</div>

<!-- Loading states -->
<div class="tooltip-trigger" data-tooltip="Cargando datos...">
    <div class="spinner"></div>
</div>
```

### Interactive Elements

```html
<!-- Buttons with action descriptions -->
<button class="btn-primary" data-tooltip="Confirmar y proceder al pago">
    Finalizar Compra
</button>

<!-- Icon buttons need descriptive tooltips -->
<button data-tooltip="Editar información">
    <i data-lucide="edit"></i>
</button>

<!-- Social media links -->
<a href="#" data-tooltip="Síguenos en Instagram">
    <i data-lucide="instagram"></i>
</a>
```

## Accessibility Features

### Screen Reader Support

```html
<!-- Tooltips automatically add aria-label -->
<button data-tooltip="Save document">Save</button>
<!-- Becomes: -->
<button data-tooltip="Save document" aria-label="Save document">Save</button>
```

### Keyboard Navigation

- All tooltip elements are focusable via keyboard
- Tab navigation works seamlessly with tooltip display
- Focus indicators are clearly visible

### Mobile Considerations

```css
/* Tooltips hide on touch devices to prevent conflicts */
@media (hover: none) {
    .tooltip-trigger[data-tooltip]:hover::after {
        display: none;
    }
}
```

## Performance Considerations

### Efficient DOM Operations

- Mutation Observer for dynamic content
- Debounced tooltip updates
- Minimal DOM manipulation

### CSS Animations

- Hardware-accelerated animations
- Smooth fade-in effects
- Optimized for 60fps performance

## Integration Checklist

When adding tooltips to new components:

1. **✅ Include CSS and JS files**
   ```html
   <link href="/css/tooltips.css" rel="stylesheet">
   <script src="/js/tooltip-utils.js"></script>
   ```

2. **✅ Add tooltip attributes**
   ```html
   <element data-tooltip="Descriptive text">Content</element>
   ```

3. **✅ Choose appropriate positioning**
   - Use `data-tooltip-bottom` for top navigation
   - Use `data-tooltip-left` for right-side elements
   - Use `data-tooltip-right` for left-side elements

4. **✅ Add semantic meaning**
   ```html
   <button data-tooltip="Delete this item permanently">
       <i data-lucide="trash-2"></i>
   </button>
   ```

5. **✅ Test accessibility**
   - Keyboard navigation works
   - Screen readers announce tooltips
   - Color contrast is sufficient

## Best Practices

### Content Guidelines

1. **Be Concise**: Keep tooltips under 50 characters when possible
2. **Be Descriptive**: Explain what will happen, not just what it is
3. **Use Active Voice**: "Delete item" instead of "Item will be deleted"
4. **Provide Context**: Explain the result or purpose of the action

### Technical Guidelines

1. **Prefer CSS Classes**: Use `.tooltip-trigger` for consistent styling
2. **Use Semantic Positioning**: Choose position based on UI layout
3. **Batch Updates**: Use TooltipManager for multiple changes
4. **Test on Mobile**: Ensure tooltips don't interfere with touch interactions

### Examples of Good vs Bad Tooltips

```html
<!-- ❌ Bad: Not descriptive -->
<button data-tooltip="Click">Submit</button>

<!-- ✅ Good: Descriptive action -->
<button data-tooltip="Submit form and create new user account">Submit</button>

<!-- ❌ Bad: States the obvious -->
<input type="email" data-tooltip="Email field">

<!-- ✅ Good: Provides helpful context -->
<input type="email" data-tooltip="Enter your email address for account notifications">

<!-- ❌ Bad: Too technical -->
<button data-tooltip="Executes DELETE SQL query">Delete</button>

<!-- ✅ Good: User-focused -->
<button data-tooltip="Permanently delete this product from catalog">Delete</button>
```

## Troubleshooting

### Common Issues

1. **Tooltips not appearing**
   - Check if CSS file is loaded
   - Verify `tooltip-trigger` class is present
   - Ensure element is focusable

2. **Positioning problems**
   - Check viewport constraints
   - Try different positioning (`data-tooltip-left`, etc.)
   - Verify parent element positioning

3. **Mobile issues**
   - Tooltips may be disabled on touch devices
   - Consider alternative help mechanisms for mobile

### Debug Mode

```javascript
// Enable tooltip debugging
window.tooltipManager.debug = true;

// Check all tooltip elements
console.log(document.querySelectorAll('[data-tooltip]'));
```

## Future Enhancements

- Rich HTML content in tooltips
- Tooltip templates system
- Analytics integration for tooltip usage
- A/B testing framework for tooltip effectiveness
- Voice activation for accessibility

---

*This documentation is part of the FloresYa comprehensive UI system. For more information, see the main project documentation.*