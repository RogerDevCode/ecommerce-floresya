// Strategic Buy Buttons System
// Multiple strategically placed buy buttons for maximum conversion
// Enhanced with comprehensive logging system

class StrategicBuyButtons {
    constructor() {
        this.buttonPositions = [];
        this.interactionData = {
            scrollDepth: 0,
            timeOnPage: 0,
            buttonInteractions: {},
            heatmapData: [],
            conversionFunnel: {
                pageLoad: 0,
                buttonSeen: 0,
                buttonHover: 0,
                buttonClick: 0,
                checkoutStarted: 0
            }
        };
        
        this.logLevel = 'debug'; // debug, info, warn, error
        this.startTime = Date.now();
        
        this.init();
    }

    // ============================================
    // LOGGING SYSTEM
    // ============================================
    
    log(level, category, message, data = null) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        const currentLevel = levels[this.logLevel] || 0;
        
        if (levels[level] >= currentLevel) {
            const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
            const timeOnPage = ((Date.now() - this.startTime) / 1000).toFixed(1);
            
            const prefix = this.getLogPrefix(level, category);
            const logMessage = `${prefix} [${timestamp}|${timeOnPage}s] ${message}`;
            
            switch (level) {
                case 'error':
                    console.error(logMessage, data);
                    break;
                case 'warn':
                    console.warn(logMessage, data);
                    break;
                case 'info':
                    console.info(logMessage, data);
                    break;
                default:
                    console.log(logMessage, data);
            }
            
            // Track analytics
            this.trackEvent(level, category, message, data);
        }
    }
    
    getLogPrefix(level, category) {
        const prefixes = {
            debug: '🔍',
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌'
        };
        
        const categoryPrefixes = {
            init: '🚀',
            button: '🔘',
            scroll: '📜',
            interaction: '👆',
            conversion: '💰',
            performance: '⚡',
            ui: '🎨',
            analytics: '📊'
        };
        
        return `${prefixes[level]} [${categoryPrefixes[category] || '🔧'}-${category.toUpperCase()}]`;
    }
    
    trackEvent(level, category, message, data) {
        const event = {
            timestamp: Date.now(),
            timeOnPage: Date.now() - this.startTime,
            level,
            category,
            message,
            data,
            url: window.location.href,
            userAgent: navigator.userAgent.substring(0, 100),
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            scroll: {
                x: window.scrollX,
                y: window.scrollY,
                depth: this.interactionData.scrollDepth
            }
        };
        
        // Store in memory for analytics (in production, send to server)
        if (!window.strategicBuyButtonsAnalytics) {
            window.strategicBuyButtonsAnalytics = [];
        }
        window.strategicBuyButtonsAnalytics.push(event);
        
        // Keep only last 1000 events to prevent memory issues
        if (window.strategicBuyButtonsAnalytics.length > 1000) {
            window.strategicBuyButtonsAnalytics = window.strategicBuyButtonsAnalytics.slice(-1000);
        }
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    init() {
        this.log('info', 'init', 'Initializing Strategic Buy Buttons System...');
        
        this.interactionData.conversionFunnel.pageLoad = Date.now();
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.startInitialization();
            });
        } else {
            setTimeout(() => {
                this.startInitialization();
            }, 500);
        }
    }
    
    startInitialization() {
        this.log('debug', 'init', 'DOM ready, starting button creation process');
        
        try {
            this.createCenteredLayout();
            this.createStrategicButtons();
            this.setupScrollTracking();
            this.setupHeatmapTracking();
            this.setupPerformanceMonitoring();
            this.startAnalyticsTracking();
            
            this.log('info', 'init', 'Strategic Buy Buttons System initialized successfully', {
                buttonsCreated: this.buttonPositions.length,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            });
            
        } catch (error) {
            this.log('error', 'init', 'Failed to initialize Strategic Buy Buttons System', {
                error: error.message,
                stack: error.stack
            });
        }
    }

    // ============================================
    // CENTERED LAYOUT SYSTEM
    // ============================================
    
    createCenteredLayout() {
        this.log('debug', 'ui', 'Creating centered layout system');
        
        // Add centered layout styles
        const centeredStyles = document.createElement('style');
        centeredStyles.id = 'strategic-centered-layout';
        centeredStyles.textContent = `
            /* Strategic Centered Layout */
            .strategic-centered-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
                position: relative;
            }
            
            .strategic-content-wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 24px;
                width: 100%;
            }
            
            .strategic-main-content {
                width: 100%;
                max-width: 800px;
                margin: 0 auto;
            }
            
            .strategic-product-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                padding: 24px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                margin-bottom: 32px;
            }
            
            .strategic-gallery-centered {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 100%;
                max-width: 600px;
                margin: 0 auto 32px auto;
            }
            
            .strategic-info-centered {
                width: 100%;
                max-width: 700px;
                margin: 0 auto;
                text-align: center;
            }
            
            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .strategic-centered-container {
                    padding: 0 16px;
                }
                
                .strategic-content-wrapper {
                    gap: 16px;
                }
                
                .strategic-product-section {
                    padding: 20px;
                    margin-bottom: 24px;
                }
            }
        `;
        document.head.appendChild(centeredStyles);
        
        this.applyCenteredLayout();
        
        this.log('info', 'ui', 'Centered layout system created and applied');
    }
    
    applyCenteredLayout() {
        this.log('debug', 'ui', 'Applying centered layout to existing elements');
        
        // Find main container and center it
        const container = document.querySelector('.container');
        if (container && !container.classList.contains('strategic-centered-container')) {
            container.classList.add('strategic-centered-container');
            this.log('debug', 'ui', 'Added centered class to main container');
        }
        
        // Center product content
        const productContent = document.getElementById('product-content');
        if (productContent) {
            if (!productContent.classList.contains('strategic-content-wrapper')) {
                productContent.classList.add('strategic-content-wrapper');
                this.log('debug', 'ui', 'Added wrapper class to product content');
            }
            
            // Center individual sections
            const productSections = productContent.querySelectorAll('.col-lg-6');
            productSections.forEach((section, index) => {
                if (index === 0) {
                    section.classList.add('strategic-gallery-centered');
                    this.log('debug', 'ui', 'Centered product gallery');
                } else if (index === 1) {
                    section.classList.add('strategic-info-centered');
                    this.log('debug', 'ui', 'Centered product info');
                }
            });
        }
        
        // Center cross-sell section if it exists
        const crossSellContainer = document.querySelector('.intelligent-cross-sell-container');
        if (crossSellContainer) {
            crossSellContainer.style.maxWidth = '1000px';
            crossSellContainer.style.margin = '40px auto';
            this.log('debug', 'ui', 'Centered cross-sell section');
        }
    }

    // ============================================
    // STRATEGIC BUTTON CREATION
    // ============================================
    
    createStrategicButtons() {
        this.log('info', 'button', 'Creating strategic buy buttons');
        
        const buttonConfigs = [
            {
                id: 'strategic-btn-header',
                position: 'header',
                text: '🚀 Comprar Express',
                style: 'compact',
                trigger: 'immediate',
                priority: 'high'
            },
            {
                id: 'strategic-btn-after-images',
                position: 'after-gallery',
                text: '💝 ¡Me Encanta, Lo Quiero!',
                style: 'prominent',
                trigger: 'gallery-viewed',
                priority: 'highest'
            },
            {
                id: 'strategic-btn-mid-info',
                position: 'mid-info',
                text: '⚡ Compra Rápida - 2 Clicks',
                style: 'animated',
                trigger: 'info-scroll',
                priority: 'high'
            },
            {
                id: 'strategic-btn-after-price',
                position: 'after-price',
                text: '🎯 ¡Perfecto! Comprarlo Ahora',
                style: 'urgent',
                trigger: 'price-seen',
                priority: 'highest'
            },
            {
                id: 'strategic-btn-floating-right',
                position: 'floating-right',
                text: '💸 Comprar',
                style: 'floating',
                trigger: 'scroll-50',
                priority: 'medium'
            },
            {
                id: 'strategic-btn-before-cross-sell',
                position: 'before-cross-sell',
                text: '🔥 ¡Último Momento! Comprarlo',
                style: 'last-chance',
                trigger: 'scroll-75',
                priority: 'high'
            }
        ];
        
        buttonConfigs.forEach(config => {
            this.createStrategicButton(config);
        });
        
        this.log('info', 'button', `Created ${buttonConfigs.length} strategic buy buttons`, {
            positions: buttonConfigs.map(c => c.position),
            priorities: buttonConfigs.map(c => c.priority)
        });
    }
    
    createStrategicButton(config) {
        this.log('debug', 'button', `Creating strategic button: ${config.id}`, config);
        
        const button = document.createElement('button');
        button.id = config.id;
        button.className = `strategic-buy-btn strategic-${config.style} strategic-priority-${config.priority}`;
        button.innerHTML = this.getButtonHTML(config);
        button.onclick = (e) => this.handleButtonClick(e, config);
        
        // Add base styles
        this.addButtonStyles(config);
        
        // Position the button
        this.positionButton(button, config);
        
        // Setup tracking
        this.setupButtonTracking(button, config);
        
        // Store reference
        this.buttonPositions.push({
            config,
            element: button,
            interactions: {
                seen: false,
                hovered: false,
                clicked: false,
                clickCount: 0,
                firstSeen: null,
                firstHover: null,
                firstClick: null
            }
        });
        
        this.log('debug', 'button', `Strategic button created and positioned: ${config.id}`);
    }
    
    getButtonHTML(config) {
        const buttonLayouts = {
            compact: `
                <span class="btn-icon">${config.text.split(' ')[0]}</span>
                <span class="btn-text">${config.text.substring(config.text.indexOf(' ') + 1)}</span>
            `,
            prominent: `
                <div class="btn-content-prominent">
                    <div class="btn-main-text">${config.text}</div>
                    <div class="btn-sub-text">Entrega Express • Envío Gratis</div>
                </div>
            `,
            animated: `
                <div class="btn-content-animated">
                    <div class="btn-pulse-ring"></div>
                    <span class="btn-text">${config.text}</span>
                    <div class="btn-shine"></div>
                </div>
            `,
            urgent: `
                <div class="btn-content-urgent">
                    <div class="btn-urgency-indicator">¡OFERTA LIMITADA!</div>
                    <div class="btn-main-urgent">${config.text}</div>
                    <div class="btn-timer">⏰ Quedan <span class="timer">12:34</span></div>
                </div>
            `,
            floating: `
                <div class="btn-floating-content">
                    <span class="floating-icon">${config.text.split(' ')[0]}</span>
                    <span class="floating-text">${config.text.substring(config.text.indexOf(' ') + 1)}</span>
                </div>
            `,
            'last-chance': `
                <div class="btn-last-chance-content">
                    <div class="last-chance-header">🚨 ÚLTIMA OPORTUNIDAD</div>
                    <div class="last-chance-main">${config.text}</div>
                    <div class="last-chance-benefit">¡Solo quedan 3 unidades!</div>
                </div>
            `
        };
        
        return buttonLayouts[config.style] || config.text;
    }
    
    addButtonStyles(config) {
        if (document.getElementById(`style-${config.id}`)) return;
        
        const style = document.createElement('style');
        style.id = `style-${config.id}`;
        
        const baseStyles = `
            .strategic-buy-btn {
                border: none;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-weight: 700;
                position: relative;
                overflow: hidden;
                z-index: 100;
                outline: none;
                box-sizing: border-box;
            }
            
            .strategic-buy-btn:hover {
                transform: translateY(-2px);
            }
            
            .strategic-buy-btn:active {
                transform: translateY(0px) scale(0.98);
            }
            
            .strategic-buy-btn:focus {
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
            }
        `;
        
        const specificStyles = this.getSpecificButtonStyles(config);
        
        style.textContent = baseStyles + specificStyles;
        document.head.appendChild(style);
        
        this.log('debug', 'ui', `Styles added for button: ${config.id}`);
    }
    
    getSpecificButtonStyles(config) {
        const styleMap = {
            compact: `
                .strategic-compact {
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    color: white;
                    padding: 12px 20px;
                    font-size: 14px;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    margin: 0 auto;
                }
                .strategic-compact:hover {
                    background: linear-gradient(135deg, #2563eb, #1e40af);
                    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
                }
            `,
            prominent: `
                .strategic-prominent {
                    background: linear-gradient(135deg, #10b981, #047857);
                    color: white;
                    padding: 20px 32px;
                    font-size: 18px;
                    width: 100%;
                    max-width: 400px;
                    margin: 24px auto;
                    display: block;
                    text-align: center;
                    box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
                }
                .btn-content-prominent {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .btn-main-text {
                    font-size: 18px;
                    font-weight: 700;
                }
                .btn-sub-text {
                    font-size: 13px;
                    opacity: 0.9;
                    font-weight: 500;
                }
                .strategic-prominent:hover {
                    background: linear-gradient(135deg, #059669, #065f46);
                    box-shadow: 0 12px 40px rgba(16, 185, 129, 0.5);
                }
            `,
            animated: `
                .strategic-animated {
                    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                    color: white;
                    padding: 18px 28px;
                    font-size: 16px;
                    position: relative;
                    margin: 20px auto;
                    display: block;
                    max-width: 350px;
                    animation: strategicPulse 2s infinite;
                }
                .btn-content-animated {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                }
                .btn-pulse-ring {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 100%;
                    height: 100%;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 12px;
                    animation: pulseRing 2s infinite;
                }
                .btn-shine {
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    animation: buttonShine 3s infinite;
                }
                @keyframes strategicPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }
                @keyframes pulseRing {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
                    100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
                }
                @keyframes buttonShine {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }
            `,
            urgent: `
                .strategic-urgent {
                    background: linear-gradient(135deg, #dc2626, #b91c1c);
                    color: white;
                    padding: 16px 24px;
                    font-size: 15px;
                    width: 100%;
                    max-width: 380px;
                    margin: 20px auto;
                    display: block;
                    text-align: center;
                    animation: urgentPulse 1.5s infinite;
                    box-shadow: 0 8px 32px rgba(220, 38, 38, 0.4);
                }
                .btn-content-urgent {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .btn-urgency-indicator {
                    font-size: 11px;
                    font-weight: 600;
                    opacity: 0.9;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .btn-main-urgent {
                    font-size: 16px;
                    font-weight: 700;
                    margin: 4px 0;
                }
                .btn-timer {
                    font-size: 12px;
                    opacity: 0.9;
                }
                .timer {
                    font-family: monospace;
                    font-weight: 700;
                }
                @keyframes urgentPulse {
                    0%, 100% { 
                        background: linear-gradient(135deg, #dc2626, #b91c1c);
                        box-shadow: 0 8px 32px rgba(220, 38, 38, 0.4);
                    }
                    50% { 
                        background: linear-gradient(135deg, #ef4444, #dc2626);
                        box-shadow: 0 12px 40px rgba(220, 38, 38, 0.7);
                    }
                }
            `,
            floating: `
                .strategic-floating {
                    position: fixed;
                    top: 50%;
                    right: 20px;
                    transform: translateY(-50%);
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: white;
                    padding: 16px;
                    border-radius: 50px;
                    font-size: 14px;
                    z-index: 1000;
                    box-shadow: 0 8px 32px rgba(245, 158, 11, 0.4);
                    animation: floatingBob 3s ease-in-out infinite;
                }
                .btn-floating-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    min-width: 60px;
                }
                .floating-icon {
                    font-size: 20px;
                }
                .floating-text {
                    font-size: 11px;
                    font-weight: 600;
                    text-align: center;
                    line-height: 1.2;
                }
                @keyframes floatingBob {
                    0%, 100% { transform: translateY(-50%); }
                    50% { transform: translateY(-60px); }
                }
                .strategic-floating:hover {
                    animation: floatingHover 0.3s ease forwards;
                }
                @keyframes floatingHover {
                    to { 
                        transform: translateY(-50%) scale(1.1);
                        box-shadow: 0 12px 40px rgba(245, 158, 11, 0.6);
                    }
                }
            `,
            'last-chance': `
                .strategic-last-chance {
                    background: linear-gradient(135deg, #7c2d12, #dc2626);
                    color: white;
                    padding: 20px 24px;
                    font-size: 14px;
                    width: 100%;
                    max-width: 400px;
                    margin: 24px auto;
                    display: block;
                    text-align: center;
                    border: 3px solid #fbbf24;
                    animation: lastChancePulse 2s infinite;
                    box-shadow: 0 8px 32px rgba(124, 45, 18, 0.5);
                }
                .btn-last-chance-content {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .last-chance-header {
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #fbbf24;
                }
                .last-chance-main {
                    font-size: 16px;
                    font-weight: 700;
                    margin: 4px 0;
                }
                .last-chance-benefit {
                    font-size: 12px;
                    opacity: 0.9;
                    font-weight: 600;
                }
                @keyframes lastChancePulse {
                    0%, 100% { 
                        border-color: #fbbf24;
                        box-shadow: 0 8px 32px rgba(124, 45, 18, 0.5);
                    }
                    50% { 
                        border-color: #f59e0b;
                        box-shadow: 0 12px 48px rgba(124, 45, 18, 0.8);
                        transform: scale(1.01);
                    }
                }
            `
        };
        
        return styleMap[config.style] || '';
    }
    
    positionButton(button, config) {
        this.log('debug', 'button', `Positioning button: ${config.position}`, config);
        
        const positions = {
            'header': () => {
                const navbar = document.querySelector('.navbar .container');
                if (navbar) {
                    const buttonContainer = document.createElement('div');
                    buttonContainer.style.display = 'flex';
                    buttonContainer.style.alignItems = 'center';
                    buttonContainer.style.marginLeft = '16px';
                    buttonContainer.appendChild(button);
                    navbar.appendChild(buttonContainer);
                } else {
                    document.body.appendChild(button);
                }
            },
            'after-gallery': () => {
                const gallery = document.querySelector('.product-gallery-enhanced');
                if (gallery) {
                    const container = document.createElement('div');
                    container.style.textAlign = 'center';
                    container.style.margin = '24px 0';
                    container.appendChild(button);
                    gallery.parentNode.insertBefore(container, gallery.nextSibling);
                } else {
                    this.fallbackPosition(button);
                }
            },
            'mid-info': () => {
                const priceSection = document.querySelector('.price-section-enhanced');
                if (priceSection) {
                    const container = document.createElement('div');
                    container.style.textAlign = 'center';
                    container.style.margin = '20px 0';
                    container.appendChild(button);
                    priceSection.parentNode.insertBefore(container, priceSection);
                } else {
                    this.fallbackPosition(button);
                }
            },
            'after-price': () => {
                const priceSection = document.querySelector('.price-section-enhanced');
                if (priceSection) {
                    const container = document.createElement('div');
                    container.style.textAlign = 'center';
                    container.style.margin = '24px 0';
                    container.appendChild(button);
                    priceSection.parentNode.insertBefore(container, priceSection.nextSibling);
                } else {
                    this.fallbackPosition(button);
                }
            },
            'floating-right': () => {
                document.body.appendChild(button);
            },
            'before-cross-sell': () => {
                const crossSell = document.querySelector('.intelligent-cross-sell-container');
                if (crossSell) {
                    const container = document.createElement('div');
                    container.style.textAlign = 'center';
                    container.style.margin = '32px 0';
                    container.appendChild(button);
                    crossSell.parentNode.insertBefore(container, crossSell);
                } else {
                    this.fallbackPosition(button);
                }
            }
        };
        
        const positionFunc = positions[config.position];
        if (positionFunc) {
            positionFunc();
            this.log('debug', 'button', `Button positioned successfully: ${config.position}`);
        } else {
            this.log('warn', 'button', `Unknown position: ${config.position}, using fallback`);
            this.fallbackPosition(button);
        }
    }
    
    fallbackPosition(button) {
        const productContent = document.getElementById('product-content');
        if (productContent) {
            const container = document.createElement('div');
            container.style.textAlign = 'center';
            container.style.margin = '24px 0';
            container.appendChild(button);
            productContent.appendChild(container);
        } else {
            document.body.appendChild(button);
        }
        this.log('debug', 'button', 'Used fallback position for button');
    }

    // ============================================
    // BUTTON INTERACTION TRACKING
    // ============================================
    
    setupButtonTracking(button, config) {
        const buttonData = this.buttonPositions.find(bp => bp.config.id === config.id) || 
                          { interactions: {} };
        
        // Visibility tracking
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !buttonData.interactions.seen) {
                    buttonData.interactions.seen = true;
                    buttonData.interactions.firstSeen = Date.now();
                    this.interactionData.conversionFunnel.buttonSeen++;
                    
                    this.log('info', 'interaction', `Button first seen: ${config.id}`, {
                        position: config.position,
                        timeOnPage: Date.now() - this.startTime,
                        scrollDepth: this.interactionData.scrollDepth
                    });
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(button);
        
        // Hover tracking
        button.addEventListener('mouseenter', () => {
            if (!buttonData.interactions.hovered) {
                buttonData.interactions.hovered = true;
                buttonData.interactions.firstHover = Date.now();
                this.interactionData.conversionFunnel.buttonHover++;
                
                this.log('info', 'interaction', `Button first hovered: ${config.id}`, {
                    timeToHover: buttonData.interactions.firstSeen ? 
                        Date.now() - buttonData.interactions.firstSeen : null
                });
            }
        });
        
        // Click tracking
        button.addEventListener('click', () => {
            if (!buttonData.interactions.clicked) {
                buttonData.interactions.clicked = true;
                buttonData.interactions.firstClick = Date.now();
                this.interactionData.conversionFunnel.buttonClick++;
                
                this.log('info', 'conversion', `Button first clicked: ${config.id}`, {
                    timeToClick: buttonData.interactions.firstSeen ? 
                        Date.now() - buttonData.interactions.firstSeen : null,
                    position: config.position,
                    priority: config.priority
                });
            }
            
            buttonData.interactions.clickCount++;
        });
        
        this.log('debug', 'interaction', `Tracking setup complete for button: ${config.id}`);
    }
    
    handleButtonClick(event, config) {
        this.log('info', 'conversion', `Strategic button clicked: ${config.id}`, {
            config,
            timestamp: Date.now(),
            pageX: event.pageX,
            pageY: event.pageY,
            clientX: event.clientX,
            clientY: event.clientY
        });
        
        // Track heatmap data
        this.interactionData.heatmapData.push({
            x: event.clientX,
            y: event.clientY,
            timestamp: Date.now(),
            buttonId: config.id,
            type: 'click'
        });
        
        // Trigger the actual purchase flow
        this.triggerPurchaseFlow(config);
    }
    
    triggerPurchaseFlow(config) {
        this.log('info', 'conversion', `Triggering purchase flow from button: ${config.id}`);
        
        // Check if one-click checkout is available
        if (window.oneClickExpressCheckout && typeof window.oneClickExpressCheckout.startExpressCheckout === 'function') {
            this.interactionData.conversionFunnel.checkoutStarted++;
            this.log('info', 'conversion', 'Starting one-click express checkout', {
                triggerButton: config.id,
                checkoutType: 'express'
            });
            
            window.oneClickExpressCheckout.startExpressCheckout();
        } else {
            // Fallback to traditional flow
            this.log('warn', 'conversion', 'One-click checkout not available, using fallback');
            
            const floresyaBtn = document.getElementById('floresya-btn');
            if (floresyaBtn) {
                floresyaBtn.click();
            } else {
                this.log('error', 'conversion', 'No purchase flow available');
                alert('¡Excelente elección! El sistema de compra se está cargando...');
            }
        }
    }

    // ============================================
    // SCROLL AND PERFORMANCE TRACKING
    // ============================================
    
    setupScrollTracking() {
        let ticking = false;
        
        const updateScrollData = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const documentHeight = document.documentElement.scrollHeight;
            const windowHeight = window.innerHeight;
            const scrollDepth = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);
            
            if (scrollDepth > this.interactionData.scrollDepth) {
                this.interactionData.scrollDepth = scrollDepth;
                
                // Log major scroll milestones
                if (scrollDepth % 25 === 0 && scrollDepth > 0) {
                    this.log('info', 'scroll', `Scroll milestone: ${scrollDepth}%`, {
                        scrollTop,
                        documentHeight,
                        windowHeight,
                        timeOnPage: Date.now() - this.startTime
                    });
                }
                
                // Trigger button visibility based on scroll depth
                this.triggerScrollBasedButtons(scrollDepth);
            }
            
            ticking = false;
        };
        
        const scrollHandler = () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollData);
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', scrollHandler, { passive: true });
        
        this.log('debug', 'scroll', 'Scroll tracking initialized');
    }
    
    triggerScrollBasedButtons(scrollDepth) {
        const triggers = {
            50: 'scroll-50',
            75: 'scroll-75'
        };
        
        Object.entries(triggers).forEach(([depth, trigger]) => {
            if (scrollDepth >= parseInt(depth)) {
                this.buttonPositions.forEach(bp => {
                    if (bp.config.trigger === trigger && !bp.triggered) {
                        bp.triggered = true;
                        bp.element.style.display = 'block';
                        
                        this.log('info', 'interaction', `Scroll-triggered button shown: ${bp.config.id}`, {
                            trigger,
                            scrollDepth,
                            timeOnPage: Date.now() - this.startTime
                        });
                    }
                });
            }
        });
    }
    
    setupHeatmapTracking() {
        // Track mouse movements for heatmap data
        let mouseTrackingTimeout;
        
        document.addEventListener('mousemove', (event) => {
            clearTimeout(mouseTrackingTimeout);
            mouseTrackingTimeout = setTimeout(() => {
                this.interactionData.heatmapData.push({
                    x: event.clientX,
                    y: event.clientY,
                    timestamp: Date.now(),
                    type: 'move'
                });
                
                // Keep only recent data to prevent memory bloat
                if (this.interactionData.heatmapData.length > 1000) {
                    this.interactionData.heatmapData = this.interactionData.heatmapData.slice(-500);
                }
            }, 100);
        }, { passive: true });
        
        this.log('debug', 'analytics', 'Heatmap tracking initialized');
    }
    
    setupPerformanceMonitoring() {
        // Monitor page performance
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            
            if (navigation) {
                this.log('info', 'performance', 'Page performance metrics', {
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                    totalTime: navigation.loadEventEnd - navigation.fetchStart
                });
            }
            
            // Monitor FCP, LCP if supported
            if ('PerformanceObserver' in window) {
                try {
                    new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            this.log('info', 'performance', `${entry.entryType}: ${entry.name}`, {
                                startTime: entry.startTime,
                                duration: entry.duration
                            });
                        }
                    }).observe({entryTypes: ['measure', 'navigation']});
                } catch (e) {
                    this.log('warn', 'performance', 'Performance observer not fully supported');
                }
            }
        }
        
        this.log('debug', 'performance', 'Performance monitoring initialized');
    }
    
    startAnalyticsTracking() {
        // Update time on page every second
        setInterval(() => {
            this.interactionData.timeOnPage = Date.now() - this.startTime;
        }, 1000);
        
        // Log analytics summary every 30 seconds
        setInterval(() => {
            this.logAnalyticsSummary();
        }, 30000);
        
        // Log final analytics on page unload
        window.addEventListener('beforeunload', () => {
            this.logFinalAnalytics();
        });
        
        this.log('info', 'analytics', 'Analytics tracking started');
    }
    
    logAnalyticsSummary() {
        const activeButtons = this.buttonPositions.filter(bp => bp.interactions.seen).length;
        const hoveredButtons = this.buttonPositions.filter(bp => bp.interactions.hovered).length;
        const clickedButtons = this.buttonPositions.filter(bp => bp.interactions.clicked).length;
        
        this.log('info', 'analytics', 'Analytics Summary', {
            timeOnPage: (Date.now() - this.startTime) / 1000,
            scrollDepth: this.interactionData.scrollDepth,
            buttonsCreated: this.buttonPositions.length,
            buttonsVisible: activeButtons,
            buttonsHovered: hoveredButtons,
            buttonsClicked: clickedButtons,
            heatmapPoints: this.interactionData.heatmapData.length,
            conversionFunnel: this.interactionData.conversionFunnel
        });
    }
    
    logFinalAnalytics() {
        this.log('info', 'analytics', 'Final Analytics Report', {
            sessionDuration: (Date.now() - this.startTime) / 1000,
            maxScrollDepth: this.interactionData.scrollDepth,
            buttonInteractions: this.buttonPositions.map(bp => ({
                id: bp.config.id,
                position: bp.config.position,
                priority: bp.config.priority,
                seen: bp.interactions.seen,
                hovered: bp.interactions.hovered,
                clicked: bp.interactions.clicked,
                clickCount: bp.interactions.clickCount
            })),
            conversionFunnel: this.interactionData.conversionFunnel,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            userAgent: navigator.userAgent.substring(0, 100)
        });
    }

    // ============================================
    // PUBLIC API METHODS
    // ============================================
    
    getAnalytics() {
        return {
            interactionData: this.interactionData,
            buttonPositions: this.buttonPositions.map(bp => ({
                config: bp.config,
                interactions: bp.interactions
            })),
            logs: window.strategicBuyButtonsAnalytics || []
        };
    }
    
    setLogLevel(level) {
        this.logLevel = level;
        this.log('info', 'init', `Log level changed to: ${level}`);
    }
    
    exportAnalytics() {
        const analytics = this.getAnalytics();
        const blob = new Blob([JSON.stringify(analytics, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `strategic-buttons-analytics-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.log('info', 'analytics', 'Analytics exported');
    }
}

// Initialize Strategic Buy Buttons System
let strategicBuyButtons;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        strategicBuyButtons = new StrategicBuyButtons();
    });
} else {
    strategicBuyButtons = new StrategicBuyButtons();
}

// Global exposure for debugging and analytics
window.strategicBuyButtons = strategicBuyButtons;