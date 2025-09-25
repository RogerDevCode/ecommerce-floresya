# 🌸 FloresYa Component Utilities Guide

## Overview

This guide documents all the utility components, their purposes, and how they work together to create the FloresYa user experience. Each component is designed for specific functionality while maintaining consistency across the platform.

## Navigation Components

### Header Navigation (`#navbar`)

**Purpose**: Main site navigation with responsive design

**Key Features**:
- Sticky positioning for persistent access
- Mobile hamburger menu
- User authentication states
- Cart integration with live count
- Admin panel access for authorized users

**Utility Classes**:
```css
.navbar { /* Sticky navigation with gradient background */ }
.mobile-menu-button { /* Hamburger menu toggle */ }
.cart-badge { /* Live cart count indicator */ }
.cart-pulse { /* Animation for cart updates */ }
```

**JavaScript Integration**:
```javascript
// Mobile menu toggle
document.getElementById('mobile-menu-button').addEventListener('click', toggleMobileMenu);

// Cart count updates
updateCartCount(itemCount);

// User state management
updateUserNavigation(isLoggedIn, userRole);
```

**Tooltips**:
- Logo: "Ir a la página principal de FloresYa"
- Cart: "Ver carrito de compras - X productos" (dynamic count)
- User menu: "Abrir menú de usuario"
- Admin panel: "Acceder al panel de administración"

---

### Mobile Navigation (`#mobile-menu`)

**Purpose**: Collapsible navigation menu for mobile devices

**Key Features**:
- Responsive toggle visibility
- Touch-friendly tap targets
- Same functionality as desktop navigation
- Smooth slide animations

**Utility Classes**:
```css
.mobile-menu { /* Hidden by default, shown on toggle */ }
.mobile-menu-item { /* Touch-optimized menu items */ }
```

---

## Search and Filter Components

### Search Bar (`#searchInput`, `#searchBtn`)

**Purpose**: Product search functionality with real-time suggestions

**Key Features**:
- Real-time search as you type
- Product name and description matching
- Search suggestions dropdown
- Search history (logged-in users)

**Utility Classes**:
```css
.search-container { /* Relative positioning for icons */ }
.search-input { /* Styled input with padding for icons */ }
.search-suggestions { /* Dropdown for search suggestions */ }
```

**JavaScript Functionality**:
```javascript
// Real-time search
searchInput.addEventListener('input', debounce(performSearch, 300));

// Search execution
searchBtn.addEventListener('click', executeSearch);

// Search suggestions
displaySearchSuggestions(suggestions);
```

**Tooltips**:
- Search input: "Buscar productos por nombre, descripción o categoría"
- Search button: "Realizar búsqueda"
- Clear search: "Limpiar búsqueda"

---

### Filter Controls

#### Occasion Filter (`#occasionFilter`)

**Purpose**: Filter products by special occasions

**Key Features**:
- Dropdown selection of occasions
- "All occasions" default option
- Dynamic loading from database
- URL parameter integration

**Tooltips**: "Filtrar productos por ocasión especial"

#### Sort Filter (`#sortFilter`)

**Purpose**: Sort products by various criteria

**Available Options**:
- Most recent (`created_at:desc`)
- Price: Low to high (`price_usd:asc`)
- Price: High to low (`price_usd:desc`)
- Name: A-Z (`name:asc`)

**Tooltips**: "Ordenar productos por criterio seleccionado"

---

## Product Display Components

### Featured Carousel (`#featuredCarousel`)

**Purpose**: Showcase featured products with premium layout

**Key Features**:
- Auto-rotating slides
- Manual navigation controls
- Touch/swipe support on mobile
- Smooth transitions
- Indicators for current slide

**Utility Classes**:
```css
.carousel-container { /* Overflow hidden container */ }
.carousel-slide { /* Individual slide styling */ }
.carousel-indicators { /* Dot indicators */ }
.carousel-controls { /* Previous/next buttons */ }
```

**JavaScript Functionality**:
```javascript
// Auto rotation
setInterval(nextSlide, 5000);

// Manual controls
prevBtn.addEventListener('click', previousSlide);
nextBtn.addEventListener('click', nextSlide);

// Touch support
carousel.addEventListener('touchstart', handleTouchStart);
carousel.addEventListener('touchmove', handleTouchMove);
```

**Tooltips**:
- Previous button: "Ver producto anterior"
- Next button: "Ver siguiente producto"
- Indicators: "Ir al producto X"

---

### Product Grid (`#productGrid`)

**Purpose**: Display products in responsive grid layout

**Key Features**:
- Responsive columns (1-4 based on screen size)
- Product cards with consistent layout
- Lazy loading for images
- Hover effects and animations
- Quick add-to-cart functionality

**Utility Classes**:
```css
.product-grid { /* CSS Grid responsive layout */ }
.product-card { /* Individual product styling */ }
.product-image { /* Image container with aspect ratio */ }
.product-info { /* Product details section */ }
.hover-lift { /* Subtle lift animation on hover */ }
```

---

## Shopping Cart Components

### Cart Toggle (`#cartToggle`)

**Purpose**: Open/close shopping cart sidebar

**Key Features**:
- Heart icon representing favorite products
- Live count badge
- Pulse animation on updates
- Different states for empty/filled cart

**Utility Classes**:
```css
.cart-badge { /* Count indicator styling */ }
.cart-pulse { /* Animation for updates */ }
```

**Tooltips**: "Ver carrito de compras - X productos" (updates dynamically)

---

### Cart Sidebar (`#cartSidebar`)

**Purpose**: Sliding cart panel with item management

**Key Features**:
- Slide-in from right animation
- Item quantity controls
- Remove item functionality
- Total calculation
- Checkout buttons
- Empty cart state

**Utility Classes**:
```css
.cart-sidebar { /* Fixed positioning and transitions */ }
.cart-item { /* Individual cart item layout */ }
.quantity-controls { /* Plus/minus buttons */ }
.cart-summary { /* Totals and checkout area */ }
```

**JavaScript Functionality**:
```javascript
// Add item to cart
addToCart(productId, quantity);

// Update quantity
updateQuantity(itemId, newQuantity);

// Remove item
removeFromCart(itemId);

// Calculate totals
calculateCartTotals();
```

**Tooltips**:
- Close cart: "Cerrar carrito"
- Remove item: "Eliminar producto del carrito"
- Quantity controls: "Aumentar/Disminuir cantidad"
- Clear cart: "Vaciar todo el carrito"
- Checkout: "Proceder al pago"

---

## User Authentication Components

### Login Modal (`#loginModal`)

**Purpose**: User authentication interface

**Key Features**:
- Modal overlay with form
- Email/password validation
- "Remember me" option
- Social login integration (future)
- Development quick-login buttons

**Utility Classes**:
```css
.modal-overlay { /* Full screen overlay */ }
.modal-content { /* Centered modal container */ }
.form-group { /* Form field grouping */ }
.auth-buttons { /* Authentication button styling */ }
```

**Tooltips**:
- Email field: "Ingresa tu dirección de correo electrónico"
- Password field: "Ingresa tu contraseña"
- Login button: "Iniciar sesión en tu cuenta"
- Close button: "Cerrar ventana de inicio de sesión"

---

### Registration Modal (`#registerModal`)

**Purpose**: New user account creation

**Key Features**:
- Extended form with validation
- Password strength indicator
- Terms and conditions checkbox
- Email verification flow

**Tooltips**:
- Name field: "Ingresa tu nombre completo"
- Phone field: "Ingresa tu número de teléfono"
- Password confirm: "Confirma tu contraseña"

---

### User Dropdown (`#userDropdown`)

**Purpose**: User account management when logged in

**Key Features**:
- Profile access
- Order history
- Admin panel (if authorized)
- Logout functionality

**Tooltips**:
- Profile: "Ver y editar información personal"
- Orders: "Ver historial de pedidos realizados"
- Admin: "Acceder al panel de administración"
- Logout: "Cerrar sesión actual"

---

## Feedback and Status Components

### Loading States (`#loading`)

**Purpose**: Provide visual feedback during operations

**Key Features**:
- Full screen overlay
- Spinning animation
- Context-specific messaging
- Prevents user interaction during loading

**Utility Classes**:
```css
.loading-overlay { /* Full screen with high z-index */ }
.spinner { /* Rotating animation */ }
.loading-message { /* Descriptive text */ }
```

---

### Notification System

**Purpose**: User feedback for actions and errors

**Key Features**:
- Success notifications (green)
- Error notifications (red)
- Warning notifications (yellow)
- Info notifications (blue)
- Auto-dismiss or manual close

**Utility Classes**:
```css
.notification { /* Base notification styling */ }
.notification-success { /* Success state */ }
.notification-error { /* Error state */ }
.notification-warning { /* Warning state */ }
.notification-info { /* Info state */ }
```

**JavaScript Functionality**:
```javascript
// Show notification
showNotification('Success!', 'success', 3000);

// Show error
showError('Something went wrong');

// Show warning
showWarning('Please check your input');
```

---

## Specialty Components

### Floating Action Button (`.fab`)

**Purpose**: Mobile-first quick access to products

**Key Features**:
- Fixed positioning on mobile only
- Smooth scroll to products section
- Flower icon for brand consistency
- Hidden on desktop (responsive)

**Utility Classes**:
```css
.fab { /* Fixed bottom-right positioning */ }
.fab:hover { /* Hover state animation */ }
```

**Tooltips**: "Ver catálogo de productos" (positioned left)

---

### Service Features Grid

**Purpose**: Highlight key service benefits

**Key Features**:
- 4-column responsive grid
- Icon and text combinations
- Consistent styling
- Brand color accents

**Components**:
1. **Fresh Flowers** - Flower icon, green accent
2. **Fast Delivery** - Truck icon, green accent
3. **Made with Love** - Heart icon, green accent
4. **Total Guarantee** - Shield icon, green accent

**Utility Classes**:
```css
.feature-grid { /* 4-column responsive layout */ }
.feature-card { /* Individual feature styling */ }
.feature-icon { /* Large icon display */ }
```

---

### Special Services Section

**Purpose**: Promote specialized services

**Key Features**:
- "Flores Ya Novias" wedding service
- Express delivery service
- Modal integration for details
- Call-to-action buttons

**Utility Classes**:
```css
.service-card { /* Special service styling */ }
.service-icon { /* Large branded icons */ }
.cta-button { /* Call-to-action button */ }
```

---

## Footer Components

### Footer Information

**Purpose**: Site information and additional navigation

**Key Features**:
- Brand information and description
- Social media links
- Contact information
- Occasions quick links
- Business hours

**Utility Classes**:
```css
.footer { /* Dark background with proper contrast */ }
.footer-section { /* Grid layout sections */ }
.social-links { /* Social media icon row */ }
.contact-info { /* Contact details with icons */ }
```

**Tooltips**:
- Social links: "Síguenos en [Platform]"
- Contact info: Icons have descriptive tooltips
- Quick links: Navigation tooltips

---

## Modal Components

### Product Modal (`#productModal`)

**Purpose**: Detailed product view without page navigation

**Key Features**:
- Large product images
- Full product description
- Add to cart functionality
- Related products
- Image gallery

**Tooltips**:
- Close button: "Cerrar ventana"
- Add to cart: "Agregar al carrito"
- Image thumbnails: "Ver imagen"

---

### Flores Ya Novias Modal (`#noviasModal`)

**Purpose**: Wedding service information and booking

**Key Features**:
- Service descriptions
- Portfolio gallery
- Contact form integration
- Pricing information

---

## Responsive Design Utilities

### Breakpoint Classes

```css
/* Mobile-first responsive design */
.mobile-only { /* Visible only on mobile */ }
.tablet-up { /* Visible tablet and up */ }
.desktop-up { /* Visible desktop and up */ }
.mobile-menu { /* Mobile navigation */ }
```

### Grid Utilities

```css
.container { /* Max-width container with padding */ }
.grid-2 { /* 2-column grid */ }
.grid-3 { /* 3-column grid */ }
.grid-4 { /* 4-column grid */ }
.responsive-grid { /* Responsive column count */ }
```

---

## Animation and Transition Utilities

### Hover Effects

```css
.hover-lift { /* Subtle lift on hover */ }
.hover-scale { /* Scale transform on hover */ }
.hover-fade { /* Opacity transition on hover */ }
```

### Loading Animations

```css
.animate-spin { /* Rotation animation */ }
.animate-pulse { /* Pulsing animation */ }
.animate-bounce { /* Bouncing animation */ }
```

### Page Transitions

```css
.fade-in { /* Fade in animation */ }
.slide-in { /* Slide in animation */ }
.scale-in { /* Scale in animation */ }
```

---

## Performance Optimization Utilities

### Image Loading

```css
.lazy-load { /* Lazy loading implementation */ }
.image-placeholder { /* Loading state for images */ }
```

### Critical CSS

```html
<!-- Inline critical CSS for FOUC prevention -->
<style>
html { visibility: hidden; opacity: 0; }
html.loaded { visibility: visible; opacity: 1; }
</style>
```

### Preloading

```html
<!-- Critical resource preloading -->
<link rel="preload" href="/images/logoFloresYa.jpeg" as="image">
<link rel="modulepreload" href="/dist/frontend/main.js">
```

---

## Accessibility Utilities

### Screen Reader Support

```css
.sr-only { /* Screen reader only text */ }
.sr-visible { /* Make content visible to screen readers */ }
```

### Keyboard Navigation

```css
.focusable { /* Custom focus indicators */ }
.skip-link { /* Skip to content link */ }
```

### ARIA Integration

```javascript
// Automatic ARIA label generation
element.setAttribute('aria-label', tooltip);

// State management
element.setAttribute('aria-expanded', isOpen);
element.setAttribute('aria-selected', isSelected);
```

---

## Component Integration Patterns

### Event-Driven Architecture

```javascript
// Cart updates
document.addEventListener('cartUpdated', handleCartUpdate);

// User state changes
document.addEventListener('userStateChanged', handleAuthUpdate);

// Search results
document.addEventListener('searchCompleted', displayResults);
```

### State Management

```javascript
// Application state
const AppState = {
    user: null,
    cart: [],
    currentPage: 'home',
    isLoading: false
};

// State updates
updateAppState('cart', newCartItems);
```

### Component Communication

```javascript
// Component messaging
ComponentMessenger.send('cart', 'addItem', productData);
ComponentMessenger.listen('search', 'resultsReady', handleResults);
```

---

## Testing Utilities

### Component Testing

```javascript
// Test helpers for component functionality
const ComponentTester = {
    clickElement: (selector) => document.querySelector(selector).click(),
    typeText: (selector, text) => { /* ... */ },
    waitForElement: (selector, timeout) => { /* ... */ }
};
```

### Visual Testing

```css
/* Development helper classes */
.debug-grid { /* Visual grid overlay */ }
.debug-spacing { /* Spacing visualization */ }
.debug-responsive { /* Breakpoint indicators */ }
```

---

## Maintenance and Updates

### Component Lifecycle

1. **Planning**: Define component purpose and features
2. **Development**: Create HTML, CSS, and JavaScript
3. **Integration**: Add tooltips and accessibility features
4. **Testing**: Verify functionality across devices
5. **Documentation**: Update this guide
6. **Monitoring**: Track usage and performance

### Update Checklist

When updating components:

- [ ] Update HTML structure if needed
- [ ] Review CSS classes and utilities
- [ ] Test JavaScript functionality
- [ ] Verify tooltip accuracy
- [ ] Check accessibility compliance
- [ ] Update documentation
- [ ] Test responsive behavior
- [ ] Validate performance impact

---

## Troubleshooting Guide

### Common Issues

1. **Component not responding**
   - Check JavaScript console for errors
   - Verify event listeners are attached
   - Confirm DOM elements exist

2. **Styling problems**
   - Check CSS specificity conflicts
   - Verify utility classes are applied
   - Inspect responsive behavior

3. **Accessibility issues**
   - Test keyboard navigation
   - Verify screen reader compatibility
   - Check color contrast ratios

### Debug Tools

```javascript
// Component debugging
window.FloresYaDebug = {
    inspectComponent: (selector) => { /* ... */ },
    listTooltips: () => document.querySelectorAll('[data-tooltip]'),
    checkAccessibility: (element) => { /* ... */ }
};
```

---

*This component utilities guide is maintained as part of the FloresYa development documentation. For specific implementation details, refer to the source code and additional technical documentation.*