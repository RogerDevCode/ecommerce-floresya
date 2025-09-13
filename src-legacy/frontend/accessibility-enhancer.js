class AccessibilityEnhancer {
  constructor(options = {}) {
    this.config = {
      enableKeyboardNavigation: true,
      enableAriaLabels: true,
      enableFocusManagement: true,
      enableScreenReaderSupport: true,
      enableHighContrast: false,
      enableReducedMotion: false,
      announceChanges: true,
      skipLinks: true,
      ...options
    };

    this.state = {
      keyboardUser: false,
      highContrastMode: false,
      reducedMotionMode: false,
      currentFocus: null,
      announceRegion: null
    };

    this.keyboardHandlers = new Map();
    this.focusableElements = [];
    
    this.init();
  }

  init() {
    if (this.config.enableKeyboardNavigation) {
      this.setupKeyboardNavigation();
    }

    if (this.config.enableAriaLabels) {
      this.enhanceAriaLabels();
    }

    if (this.config.enableFocusManagement) {
      this.setupFocusManagement();
    }

    if (this.config.enableScreenReaderSupport) {
      this.setupScreenReaderSupport();
    }

    if (this.config.skipLinks) {
      this.addSkipLinks();
    }

    this.setupUserPreferences();
    this.addAccessibilityCSS();
    this.bindEvents();

    if (window.logger) {
      window.logger.info('ACCESSIBILITY', 'Accessibility enhancer initialized', this.config);
    }

    this.announceToScreenReader('Funciones de accesibilidad activadas');
  }

  setupKeyboardNavigation() {
    this.detectKeyboardUser();
    this.setupGlobalKeyboardHandlers();
    this.enhanceCustomElements();
    this.createKeyboardShortcuts();
  }

  detectKeyboardUser() {
    let hadKeyboardEvent = false;
    let hadMouseEvent = false;

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        hadKeyboardEvent = true;
        this.state.keyboardUser = true;
        document.body.classList.add('keyboard-user');
        
        if (!hadMouseEvent) {
          this.showKeyboardHints();
        }
      }
    });

    document.addEventListener('mousedown', () => {
      hadMouseEvent = true;
      this.state.keyboardUser = false;
      document.body.classList.remove('keyboard-user');
      this.hideKeyboardHints();
    });
  }

  setupGlobalKeyboardHandlers() {
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Escape':
          this.handleEscapeKey(e);
          break;
        case 'Enter':
        case ' ':
          this.handleActivationKeys(e);
          break;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          this.handleArrowKeys(e);
          break;
        case 'Tab':
          this.handleTabKey(e);
          break;
      }

      if (e.altKey) {
        this.handleAltKeyShortcuts(e);
      }

      if (e.ctrlKey || e.metaKey) {
        this.handleCtrlKeyShortcuts(e);
      }
    });
  }

  handleEscapeKey(e) {
    const openModal = document.querySelector('.modal.show');
    if (openModal) {
      const closeButton = openModal.querySelector('[data-bs-dismiss="modal"]');
      if (closeButton) {
        closeButton.click();
        e.preventDefault();
      }
    }

    const openDropdown = document.querySelector('.dropdown-menu.show');
    if (openDropdown) {
      const toggle = document.querySelector('[data-bs-toggle="dropdown"][aria-expanded="true"]');
      if (toggle) {
        toggle.click();
        e.preventDefault();
      }
    }

    const focusedElement = document.activeElement;
    if (focusedElement && focusedElement.classList.contains('btn')) {
      focusedElement.blur();
    }
  }

  handleActivationKeys(e) {
    const target = e.target;
    
    if (target.hasAttribute('role') && 
        (target.getAttribute('role') === 'button' || 
         target.getAttribute('role') === 'tab' ||
         target.getAttribute('role') === 'menuitem')) {
      
      if (target.tagName !== 'BUTTON' && target.tagName !== 'A') {
        target.click();
        e.preventDefault();
      }
    }

    if (target.classList.contains('card') && target.hasAttribute('tabindex')) {
      const link = target.querySelector('a') || target.querySelector('button');
      if (link) {
        link.click();
        e.preventDefault();
      }
    }
  }

  handleArrowKeys(e) {
    const target = e.target;
    const parent = target.closest('[role="tablist"], [role="menu"], [role="listbox"], .product-grid');
    
    if (!parent) return;

    const items = Array.from(parent.querySelectorAll('[role="tab"], [role="menuitem"], [role="option"], .product-card[tabindex]'));
    const currentIndex = items.indexOf(target);
    
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    
    if (parent.classList.contains('product-grid')) {
        // ✅ Calcular columnas dinámicamente
        const itemWidth = 300; // Ancho base
        const containerWidth = parent.offsetWidth;
        const columns = Math.max(1, Math.floor(containerWidth / itemWidth));
        
        switch (e.key) {
            case 'ArrowRight':
                nextIndex = Math.min(currentIndex + 1, items.length - 1);
                break;
            case 'ArrowLeft':
                nextIndex = Math.max(currentIndex - 1, 0);
                break;
            case 'ArrowDown':
                nextIndex = Math.min(currentIndex + columns, items.length - 1);
                break;
            case 'ArrowUp':
                nextIndex = Math.max(currentIndex - columns, 0);
                break;
        }
    } else {
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                nextIndex = (currentIndex + 1) % items.length;
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
                break;
        }
    }

    if (nextIndex !== currentIndex) {
        items[nextIndex].focus();
        e.preventDefault();
    }
  }

  handleTabKey(e) {
    this.updateFocusableElements();
    
    if (this.focusableElements.length === 0) return;

    const currentIndex = this.focusableElements.indexOf(document.activeElement);
    
    if (e.shiftKey) {
      if (currentIndex <= 0) {
        this.focusableElements[this.focusableElements.length - 1].focus();
        e.preventDefault();
      }
    } else {
      if (currentIndex >= this.focusableElements.length - 1) {
        this.focusableElements[0].focus();
        e.preventDefault();
      }
    }
  }

  handleAltKeyShortcuts(e) {
    switch (e.key.toLowerCase()) {
      case 'm':
        this.focusMainContent();
        e.preventDefault();
        break;
      case 'n':
        this.focusNavigation();
        e.preventDefault();
        break;
      case 's':
        this.focusSearch();
        e.preventDefault();
        break;
      case 'c':
        this.focusCart();
        e.preventDefault();
        break;
    }
  }

  handleCtrlKeyShortcuts(e) {
    switch (e.key.toLowerCase()) {
      case '/':
        this.focusSearch();
        e.preventDefault();
        break;
      case 'h':
        this.showKeyboardHelp();
        e.preventDefault();
        break;
    }
  }

  enhanceCustomElements() {
    const productCards = document.querySelectorAll('.product-card, .card');
    productCards.forEach((card, index) => {
      if (!card.hasAttribute('tabindex')) {
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        
        const title = card.querySelector('.product-title, .card-title, h3, h4, h5, h6');
        if (title) {
          card.setAttribute('aria-label', `Producto: ${title.textContent.trim()}`);
        }
      }
    });

    const buttons = document.querySelectorAll('.btn:not([aria-label])');
    buttons.forEach(button => {
      if (!button.getAttribute('aria-label')) {
        const text = button.textContent.trim() || button.getAttribute('title') || 'Botón';
        button.setAttribute('aria-label', text);
      }
    });

    const icons = document.querySelectorAll('i[class*="bi-"]:not([aria-hidden])');
    icons.forEach(icon => {
      if (icon.textContent.trim() === '') {
        icon.setAttribute('aria-hidden', 'true');
      }
    });
  }

  createKeyboardShortcuts() {
    const shortcutsInfo = document.createElement('div');
    shortcutsInfo.id = 'keyboard-shortcuts-info';
    shortcutsInfo.className = 'sr-only keyboard-shortcuts-panel';
    shortcutsInfo.setAttribute('role', 'complementary');
    shortcutsInfo.setAttribute('aria-label', 'Atajos de teclado disponibles');
    
    shortcutsInfo.innerHTML = `
      <h3>Atajos de teclado:</h3>
      <ul>
        <li>Alt + M: Ir al contenido principal</li>
        <li>Alt + N: Ir a la navegación</li>
        <li>Alt + S: Ir a la búsqueda</li>
        <li>Alt + C: Ir al carrito</li>
        <li>Ctrl + /: Buscar productos</li>
        <li>Ctrl + H: Mostrar ayuda de teclado</li>
        <li>Esc: Cerrar modales y menús</li>
        <li>Tab: Navegar entre elementos</li>
        <li>Flechas: Navegar en grillas y menús</li>
      </ul>
    `;
    
    document.body.appendChild(shortcutsInfo);
  }

  enhanceAriaLabels() {
    this.enhanceFormLabels();
    this.enhanceNavigationLabels();
    this.enhanceContentLabels();
    this.enhanceInteractiveLabels();
  }

  enhanceFormLabels() {
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    inputs.forEach(input => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (!label && input.placeholder) {
        input.setAttribute('aria-label', input.placeholder);
      }
      
      if (input.required) {
        const currentLabel = input.getAttribute('aria-label') || label?.textContent || input.placeholder;
        input.setAttribute('aria-label', `${currentLabel} (requerido)`);
      }
    });

    const selects = document.querySelectorAll('select:not([aria-label])');
    selects.forEach(select => {
      if (!select.getAttribute('aria-label')) {
        const label = document.querySelector(`label[for="${select.id}"]`);
        if (label) {
          select.setAttribute('aria-label', label.textContent);
        }
      }
    });
  }

  enhanceNavigationLabels() {
    const nav = document.querySelector('nav');
    if (nav && !nav.getAttribute('aria-label')) {
      nav.setAttribute('aria-label', 'Navegación principal');
    }

    const navLinks = document.querySelectorAll('nav a:not([aria-label])');
    navLinks.forEach(link => {
      if (!link.getAttribute('aria-label')) {
        link.setAttribute('aria-label', `Ir a ${link.textContent.trim()}`);
      }
    });

    const breadcrumbs = document.querySelector('.breadcrumb');
    if (breadcrumbs) {
      breadcrumbs.setAttribute('aria-label', 'Ruta de navegación');
    }
  }

  enhanceContentLabels() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      const section = heading.closest('section, article, div[class*="section"]');
      if (section && !section.getAttribute('aria-labelledby')) {
        if (!heading.id) {
          heading.id = `heading-${Math.random().toString(36).substr(2, 9)}`;
        }
        section.setAttribute('aria-labelledby', heading.id);
      }
    });

    const images = document.querySelectorAll('img:not([alt])');
    images.forEach(img => {
      img.setAttribute('alt', '');
    });

    const decorativeImages = document.querySelectorAll('img[alt=""], img[role="presentation"]');
    decorativeImages.forEach(img => {
      img.setAttribute('aria-hidden', 'true');
    });
  }

  enhanceInteractiveLabels() {
    const cartButtons = document.querySelectorAll('[onclick*="addToCart"], .add-to-cart');
    cartButtons.forEach(button => {
      if (!button.getAttribute('aria-label')) {
        const productName = button.closest('.product-card, .card')?.querySelector('.product-title, .card-title')?.textContent.trim();
        button.setAttribute('aria-label', `Agregar ${productName || 'producto'} al carrito`);
      }
    });

    const removeButtons = document.querySelectorAll('[onclick*="removeFromCart"], .remove-from-cart');
    removeButtons.forEach(button => {
      if (!button.getAttribute('aria-label')) {
        button.setAttribute('aria-label', 'Eliminar del carrito');
      }
    });

    const quantityControls = document.querySelectorAll('.quantity-btn, [onclick*="Quantity"]');
    quantityControls.forEach(button => {
      if (!button.getAttribute('aria-label')) {
        const isIncrease = button.textContent.includes('+') || button.onclick?.toString().includes('increase');
        button.setAttribute('aria-label', isIncrease ? 'Aumentar cantidad' : 'Disminuir cantidad');
      }
    });
  }

  setupFocusManagement() {
    this.setupFocusTrap();
    this.setupFocusIndicators();
    this.updateFocusableElements();
    this.restoreFocusOnModalClose();
  }

  setupFocusTrap() {
    // ✅ Cambiado a 'shown.bs.modal' para esperar a que el modal esté completamente visible
    document.addEventListener('shown.bs.modal', (e) => {
      const modal = e.target;
      this.state.currentFocus = document.activeElement;
      
      setTimeout(() => {
        const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }, 100);
    });
  }

  restoreFocusOnModalClose() {
    document.addEventListener('hidden.bs.modal', () => {
      if (this.state.currentFocus) {
        this.state.currentFocus.focus();
        this.state.currentFocus = null;
      }
    });
  }

  setupFocusIndicators() {
    const style = document.createElement('style');
    style.textContent = `
      .keyboard-user *:focus {
        outline: 2px solid #007bff !important;
        outline-offset: 2px !important;
      }
      
      .keyboard-user .btn:focus {
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.5) !important;
      }
    `;
    document.head.appendChild(style);
  }

  updateFocusableElements() {
    this.focusableElements = Array.from(document.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(el => {
      return el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden';
    });
  }

  setupScreenReaderSupport() {
    this.createAnnouncementRegion();
    this.enhanceStatusMessages();
    this.addLoadingStates();
  }

  createAnnouncementRegion() {
    this.state.announceRegion = document.createElement('div');
    this.state.announceRegion.id = 'screen-reader-announcements';
    this.state.announceRegion.className = 'sr-only';
    this.state.announceRegion.setAttribute('aria-live', 'polite'); // ← polite por defecto
    this.state.announceRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(this.state.announceRegion);
  }

  announceToScreenReader(message, priority = 'polite') { // ← polite por defecto
    if (!this.state.announceRegion || !this.config.announceChanges) return;

    this.state.announceRegion.setAttribute('aria-live', priority);
    this.state.announceRegion.textContent = message;

    setTimeout(() => {
        this.state.announceRegion.textContent = '';
    }, 1000);

    if (window.logger) {
        window.logger.debug('ACCESSIBILITY', 'Screen reader announcement', { message, priority });
    }
  }

  enhanceStatusMessages() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.classList?.contains('alert') || 
                node.classList?.contains('notification') ||
                node.classList?.contains('toast')) {
              
              const message = node.textContent.trim();
              if (message) {
                this.announceToScreenReader(message, 'assertive');
              }
            }
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  addLoadingStates() {
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      document.body.setAttribute('aria-busy', 'true');
      
      try {
        const response = await originalFetch.apply(this, args);
        return response;
      } finally {
        document.body.setAttribute('aria-busy', 'false');
      }
    };
  }

  addSkipLinks() {
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
        <a href="#main-content" class="skip-link">Saltar al contenido principal</a>
        <a href="#navigation" class="skip-link">Saltar a la navegación</a>
        <a href="#search" class="skip-link">Saltar a la búsqueda</a>
    `;
    
    document.body.insertBefore(skipLinks, document.body.firstChild);

    // ✅ Asegurar que los elementos objetivo existan
    let mainContent = document.querySelector('main, #main, .main-content');
    if (!mainContent) {
        mainContent = document.querySelector('#main-content');
        if (!mainContent) {
            mainContent = document.createElement('main');
            mainContent.id = 'main-content';
            document.body.appendChild(mainContent);
        }
    } else if (!mainContent.id) {
        mainContent.id = 'main-content';
    }

    let navigation = document.querySelector('nav');
    if (navigation && !navigation.id) {
        navigation.id = 'navigation';
    }

    let search = document.querySelector('#search, [type="search"], .search-input');
    if (search && !search.id) {
        search.id = 'search';
    }
  }

  setupUserPreferences() {
    this.detectUserPreferences();
    this.addAccessibilityControls();
  }

  detectUserPreferences() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.enableReducedMotion();
    }

    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.enableHighContrast();
    }

    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      if (e.matches) {
        this.enableReducedMotion();
      } else {
        this.disableReducedMotion();
      }
    });

    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      if (e.matches) {
        this.enableHighContrast();
      } else {
        this.disableHighContrast();
      }
    });
  }

  addAccessibilityControls() {
    const controls = document.createElement('div');
    controls.className = 'accessibility-controls';
    controls.innerHTML = `
      <button class="accessibility-toggle" aria-label="Opciones de accesibilidad" title="Opciones de accesibilidad">
        <i class="bi bi-universal-access" aria-hidden="true"></i>
      </button>
      <div class="accessibility-menu" style="display: none;" role="menu">
        <button role="menuitem" onclick="accessibilityEnhancer.toggleHighContrast()">
          <span>Alto contraste</span>
          <span class="toggle-indicator" aria-hidden="true">○</span>
        </button>
        <button role="menuitem" onclick="accessibilityEnhancer.toggleReducedMotion()">
          <span>Reducir movimiento</span>
          <span class="toggle-indicator" aria-hidden="true">○</span>
        </button>
        <button role="menuitem" onclick="accessibilityEnhancer.increaseFontSize()">
          <span>Aumentar texto</span>
        </button>
        <button role="menuitem" onclick="accessibilityEnhancer.decreaseFontSize()">
          <span>Reducir texto</span>
        </button>
        <button role="menuitem" onclick="accessibilityEnhancer.showKeyboardHelp()">
          <span>Ayuda de teclado</span>
        </button>
      </div>
    `;

    document.body.appendChild(controls);

    const toggle = controls.querySelector('.accessibility-toggle');
    const menu = controls.querySelector('.accessibility-menu');

    toggle.addEventListener('click', () => {
      const isOpen = menu.style.display !== 'none';
      menu.style.display = isOpen ? 'none' : 'block';
      toggle.setAttribute('aria-expanded', !isOpen);
    });
  }

  addAccessibilityCSS() {
    const style = document.createElement('style');
    style.textContent = `
      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }

      .skip-links {
        position: absolute;
        top: -40px;
        left: 0;
        z-index: 1000;
      }

      .skip-link {
        display: inline-block;
        padding: 8px 16px;
        background: #000;
        color: #fff;
        text-decoration: none;
        transition: top 0.3s;
      }

      .skip-link:focus {
        top: 0;
      }

      .accessibility-controls {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
      }

      .accessibility-toggle {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #007bff;
        color: white;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      }

      .accessibility-menu {
        position: absolute;
        top: 60px;
        right: 0;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        min-width: 200px;
      }

      .accessibility-menu button {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 12px 16px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
      }

      .accessibility-menu button:hover {
        background: #f8f9fa;
      }

      .high-contrast {
        filter: contrast(150%) !important;
      }

      .high-contrast * {
        background: white !important;
        color: black !important;
        border-color: black !important;
      }

      .high-contrast .btn-primary {
        background: black !important;
        color: white !important;
      }

      .reduced-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }

      .keyboard-hints {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 15px;
        border-radius: 8px;
        z-index: 1000;
        max-width: 300px;
      }

      .keyboard-shortcuts-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        z-index: 1001;
        max-width: 400px;
        max-height: 80vh;
        overflow-y: auto;
      }
    `;
    
    document.head.appendChild(style);
  }

  bindEvents() {
    document.addEventListener('DOMContentLoaded', () => {
      this.updateFocusableElements();
      this.enhanceAriaLabels();
    });

    window.addEventListener('resize', this.debounce(() => {
      this.updateFocusableElements();
    }, 250));
  }

  focusMainContent() {
    const main = document.querySelector('#main-content, main, .main-content');
    if (main) {
      main.focus();
      main.scrollIntoView({ behavior: 'smooth' });
    }
  }

  focusNavigation() {
    const nav = document.querySelector('#navigation, nav');
    if (nav) {
      const firstLink = nav.querySelector('a, button');
      if (firstLink) {
        firstLink.focus();
      }
    }
  }

  focusSearch() {
    const search = document.querySelector('#search, [type="search"], .search-input');
    if (search) {
      search.focus();
    }
  }

  focusCart() {
    const cart = document.querySelector('#cart, .cart-toggle, [href*="cart"]');
    if (cart) {
      cart.focus();
    }
  }

  toggleHighContrast() {
    this.state.highContrastMode = !this.state.highContrastMode;
    document.body.classList.toggle('high-contrast', this.state.highContrastMode);
    
    const indicator = document.querySelector('.accessibility-menu button:first-child .toggle-indicator');
    if (indicator) {
      indicator.textContent = this.state.highContrastMode ? '●' : '○';
    }
    
    this.announceToScreenReader(
      this.state.highContrastMode ? 'Alto contraste activado' : 'Alto contraste desactivado'
    );
  }

  toggleReducedMotion() {
    this.state.reducedMotionMode = !this.state.reducedMotionMode;
    document.body.classList.toggle('reduced-motion', this.state.reducedMotionMode);
    
    const indicator = document.querySelector('.accessibility-menu button:nth-child(2) .toggle-indicator');
    if (indicator) {
      indicator.textContent = this.state.reducedMotionMode ? '●' : '○';
    }
    
    this.announceToScreenReader(
      this.state.reducedMotionMode ? 'Movimiento reducido activado' : 'Movimiento reducido desactivado'
    );
  }

  increaseFontSize() {
    const currentSize = parseFloat(getComputedStyle(document.body).fontSize);
    document.body.style.fontSize = Math.min(currentSize * 1.2, 24) + 'px';
    this.announceToScreenReader('Tamaño de texto aumentado');
  }

  decreaseFontSize() {
    const currentSize = parseFloat(getComputedStyle(document.body).fontSize);
    document.body.style.fontSize = Math.max(currentSize * 0.8, 12) + 'px';
    this.announceToScreenReader('Tamaño de texto reducido');
  }

  showKeyboardHints() {
    let hints = document.querySelector('.keyboard-hints');
    if (!hints) {
      hints = document.createElement('div');
      hints.className = 'keyboard-hints';
      hints.innerHTML = `
        <strong>Navegación por teclado:</strong><br>
        Tab: Siguiente elemento<br>
        Shift+Tab: Elemento anterior<br>
        Enter/Espacio: Activar<br>
        Esc: Cerrar menús
      `;
      document.body.appendChild(hints);
    }
    hints.style.display = 'block';
    
    setTimeout(() => {
      if (hints) hints.style.display = 'none';
    }, 5000);
  }

  hideKeyboardHints() {
    const hints = document.querySelector('.keyboard-hints');
    if (hints) {
      hints.style.display = 'none';
    }
  }

  showKeyboardHelp() {
    const help = document.getElementById('keyboard-shortcuts-info');
    if (help) {
        help.classList.remove('sr-only');
        help.classList.add('keyboard-shortcuts-panel');
        help.focus();
        
        // ✅ Crear y agregar botón "Cerrar" correctamente
        let closeButton = help.querySelector('.close-help-btn');
        if (!closeButton) {
            closeButton = document.createElement('button');
            closeButton.textContent = 'Cerrar';
            closeButton.className = 'btn btn-primary mt-3 close-help-btn';
            closeButton.onclick = () => {
                help.classList.add('sr-only');
                help.classList.remove('keyboard-shortcuts-panel');
            };
            help.appendChild(closeButton); // ← Insertar dentro del panel
        }
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  getAccessibilityReport() {
    const issues = [];
    
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length} imágenes sin texto alternativo`);
    }
    
    const buttonsWithoutLabels = document.querySelectorAll('button:not([aria-label]):not([title])');
    if (buttonsWithoutLabels.length > 0) {
      issues.push(`${buttonsWithoutLabels.length} botones sin etiquetas`);
    }
    
    const inputsWithoutLabels = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    if (inputsWithoutLabels.length > 0) {
      issues.push(`${inputsWithoutLabels.length} campos sin etiquetas`);
    }

    return {
      timestamp: new Date().toISOString(),
      issues,
      totalIssues: issues.length,
      keyboardUserDetected: this.state.keyboardUser,
      highContrastEnabled: this.state.highContrastMode,
      reducedMotionEnabled: this.state.reducedMotionMode,
      focusableElements: this.focusableElements.length
    };
  }

  destroy() {
    const controls = document.querySelector('.accessibility-controls');
    if (controls) {
      controls.remove();
    }
    
    const announceRegion = this.state.announceRegion;
    if (announceRegion) {
      announceRegion.remove();
    }

    if (window.logger) {
      window.logger.info('ACCESSIBILITY', 'Accessibility enhancer destroyed', this.getAccessibilityReport());
    }
  }
}

if (typeof window !== 'undefined') {
  window.AccessibilityEnhancer = AccessibilityEnhancer;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityEnhancer;
}