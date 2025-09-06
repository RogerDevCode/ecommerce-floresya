// Advanced Conversion Optimizer for FloresYa
// Superlative one-click buying experience enhancements

class AdvancedConversionOptimizer {
    constructor() {
        this.conversionTechniques = {
            priceAnchoring: false,
            socialProofIntensified: false,
            urgencyAmplified: false,
            oneClickOptimized: false,
            exitIntentAdvanced: false
        };
        
        this.timers = {
            progressiveUrgency: null,
            dynamicTestimonials: null,
            fomoUpdater: null,
            socialProofPulse: null
        };
        
        this.counters = {
            timeOnPage: 0,
            buttonHovers: 0,
            exitAttempts: 0,
            scrollProgress: 0
        };
        
        this.testimonials = [
            { name: "María García", text: "¡Increíble! Las flores llegaron perfectas y mi esposo quedó fascinado. Definitivamente volveré a comprar.", rating: 5, time: "hace 2 horas", verified: true },
            { name: "Carlos Mendoza", text: "Servicio impecable. La entrega fue súper rápida y el arreglo superó mis expectativas.", rating: 5, time: "hace 4 horas", verified: true },
            { name: "Ana Rodríguez", text: "FloresYa es mi opción #1. Calidad excepcional y precios justos. ¡Recomendado al 100%!", rating: 5, time: "hace 1 día", verified: true },
            { name: "Luis Pérez", text: "Compré este mismo arreglo para el cumpleaños de mi mamá. ¡Le encantó! 10/10", rating: 5, time: "hace 2 días", verified: true },
            { name: "Carmen Silva", text: "Flores frescas, entrega puntual y precio justo. No puedo pedir más.", rating: 5, time: "hace 3 días", verified: true },
            { name: "Roberto Vásquez", text: "Mi novia lloró de la emoción. FloresYa hizo que mi sorpresa fuera perfecta.", rating: 5, time: "hace 5 días", verified: true }
        ];
        
        this.init();
    }

    init() {
        console.log('🚀 Advanced Conversion Optimizer: Initializing superlative experience...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.startOptimization();
            });
        } else {
            this.startOptimization();
        }
    }

    startOptimization() {
        // Initialize all conversion techniques
        this.setupProgressiveUrgencySystem();
        this.implementAdvancedPriceAnchoring();
        this.createDynamicTestimonialsFlow();
        this.setupIntensifiedSocialProof();
        this.implementAdvancedFOMOTriggers();
        this.optimizeOneClickExperience();
        this.setupAdvancedExitIntent();
        this.createFloatingConversionAssistant();
        this.implementSmartScrollTriggers();
        this.setupConversionAnalytics();
        
        console.log('✅ Advanced Conversion Optimizer: All systems active');
    }

    // ============================================
    // PROGRESSIVE URGENCY SYSTEM
    // ============================================
    
    setupProgressiveUrgencySystem() {
        this.timers.progressiveUrgency = setInterval(() => {
            this.counters.timeOnPage += 1000;
            
            const timeInSeconds = this.counters.timeOnPage / 1000;
            
            switch (timeInSeconds) {
                case 10:
                    this.showUrgencyMessage('👀 ' + (12 + Math.floor(Math.random() * 8)) + ' personas están viendo este producto ahora mismo');
                    break;
                case 25:
                    this.createStockPressureAlert();
                    break;
                case 45:
                    this.showUrgencyMessage('🔥 ¡ATENCIÓN! Stock limitado - Solo quedan pocas unidades disponibles');
                    this.pulseMainCTA();
                    break;
                case 70:
                    this.triggerSocialProofBurst();
                    break;
                case 90:
                    this.showUrgencyMessage('⚡ ÚLTIMO AVISO: ' + (3 + Math.floor(Math.random() * 5)) + ' personas lo tienen en su carrito');
                    this.intensifyUrgencyVisuals();
                    break;
                case 120:
                    this.showUrgencyMessage('💝 ¿Te encanta? ¡Reserva el tuyo antes de que se agote!');
                    this.enhanceMainCTA();
                    break;
                case 150:
                    this.triggerFinalConversionPush();
                    break;
            }
        }, 1000);
    }
    
    showUrgencyMessage(message, type = 'warning') {
        const notification = document.createElement('div');
        notification.className = 'urgency-notification';
        notification.innerHTML = `
            <div class="urgency-content">
                <span class="urgency-text">${message}</span>
                <button class="urgency-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add styles if not exists
        if (!document.getElementById('urgency-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'urgency-notification-styles';
            style.textContent = `
                .urgency-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #ff6b6b, #ffd93d);
                    color: white;
                    padding: 16px 20px;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(255, 107, 107, 0.4);
                    z-index: 9999;
                    animation: urgencySlideIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    max-width: 350px;
                    font-weight: 600;
                }
                
                @keyframes urgencySlideIn {
                    from {
                        opacity: 0;
                        transform: translateX(100%) scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }
                
                .urgency-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                }
                
                .urgency-text {
                    font-size: 14px;
                    line-height: 1.4;
                }
                
                .urgency-close {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    flex-shrink: 0;
                }
                
                .urgency-close:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto remove after 6 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'urgencySlideOut 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 6000);
        
        // Add slide out animation
        if (!document.getElementById('urgency-slideout-style')) {
            const slideOutStyle = document.createElement('style');
            slideOutStyle.id = 'urgency-slideout-style';
            slideOutStyle.textContent = `
                @keyframes urgencySlideOut {
                    to {
                        opacity: 0;
                        transform: translateX(100%) scale(0.8);
                    }
                }
            `;
            document.head.appendChild(slideOutStyle);
        }
    }
    
    createStockPressureAlert() {
        const alert = document.createElement('div');
        alert.className = 'stock-pressure-alert';
        alert.innerHTML = `
            <div class="stock-alert-content">
                <div class="stock-alert-icon">⚠️</div>
                <div class="stock-alert-text">
                    <strong>¡STOCK LIMITADO!</strong>
                    <div class="stock-bar-mini">
                        <div class="stock-fill-mini" style="width: ${20 + Math.random() * 15}%"></div>
                    </div>
                    <small>Solo quedan ${2 + Math.floor(Math.random() * 4)} unidades</small>
                </div>
            </div>
        `;
        
        // Add styles
        if (!document.getElementById('stock-pressure-alert-styles')) {
            const style = document.createElement('style');
            style.id = 'stock-pressure-alert-styles';
            style.textContent = `
                .stock-pressure-alert {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    background: linear-gradient(135deg, #dc3545, #fd7e14);
                    color: white;
                    padding: 16px;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(220, 53, 69, 0.4);
                    z-index: 9999;
                    animation: stockPressurePulse 2s infinite;
                }
                
                @keyframes stockPressurePulse {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 8px 32px rgba(220, 53, 69, 0.4);
                    }
                    50% {
                        transform: scale(1.02);
                        box-shadow: 0 12px 40px rgba(220, 53, 69, 0.6);
                    }
                }
                
                .stock-alert-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .stock-alert-icon {
                    font-size: 24px;
                    animation: bounce 1s infinite;
                }
                
                .stock-alert-text {
                    font-size: 14px;
                }
                
                .stock-alert-text strong {
                    display: block;
                    margin-bottom: 4px;
                }
                
                .stock-bar-mini {
                    background: rgba(255, 255, 255, 0.3);
                    height: 4px;
                    border-radius: 2px;
                    overflow: hidden;
                    margin: 4px 0;
                }
                
                .stock-fill-mini {
                    background: #ffc107;
                    height: 100%;
                    transition: width 2s ease;
                }
                
                .stock-alert-text small {
                    font-size: 12px;
                    opacity: 0.9;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(alert);
        
        // Remove after 8 seconds
        setTimeout(() => alert.remove(), 8000);
    }

    // ============================================
    // ADVANCED PRICE ANCHORING
    // ============================================
    
    implementAdvancedPriceAnchoring() {
        const priceSection = document.querySelector('.price-section-enhanced');
        if (priceSection && !document.querySelector('.advanced-price-anchoring')) {
            const anchoring = document.createElement('div');
            anchoring.className = 'advanced-price-anchoring';
            anchoring.innerHTML = `
                <div class="price-comparison-advanced">
                    <h6><i class="bi bi-graph-up-arrow"></i> Comparación con la Competencia</h6>
                    <div class="competitors-grid">
                        <div class="competitor-item">
                            <span class="competitor-logo">🌹</span>
                            <div class="competitor-info">
                                <span class="competitor-name">Florería Premium</span>
                                <span class="competitor-price">$68.00</span>
                                <small class="competitor-note">Sin envío gratis</small>
                            </div>
                        </div>
                        <div class="competitor-item">
                            <span class="competitor-logo">🌷</span>
                            <div class="competitor-info">
                                <span class="competitor-name">FloresExpress</span>
                                <span class="competitor-price">$62.00</span>
                                <small class="competitor-note">Envío $8</small>
                            </div>
                        </div>
                        <div class="competitor-item">
                            <span class="competitor-logo">🏪</span>
                            <div class="competitor-info">
                                <span class="competitor-name">Florería Local</span>
                                <span class="competitor-price">$55.00</span>
                                <small class="competitor-note">Solo pickup</small>
                            </div>
                        </div>
                        <div class="competitor-item winner">
                            <span class="competitor-logo">🏆</span>
                            <div class="competitor-info">
                                <span class="competitor-name"><strong>FloresYa (TÚ)</strong></span>
                                <span class="competitor-price best">$45.00</span>
                                <small class="competitor-note best">Envío GRATIS ✅</small>
                            </div>
                        </div>
                    </div>
                    <div class="savings-calculator">
                        <div class="savings-highlight">
                            🎯 <strong>Ahorras hasta $23.00</strong> vs la competencia más cara
                        </div>
                        <div class="value-proposition">
                            ✅ Mejor precio garantizado + ✅ Envío gratis + ✅ Calidad premium
                        </div>
                    </div>
                </div>
            `;
            
            // Add advanced anchoring styles
            if (!document.getElementById('advanced-anchoring-styles')) {
                const style = document.createElement('style');
                style.id = 'advanced-anchoring-styles';
                style.textContent = `
                    .advanced-price-anchoring {
                        margin: 20px 0;
                        padding: 24px;
                        background: linear-gradient(135deg, #e8f5e8, #f0f9ff);
                        border-radius: 16px;
                        border: 2px solid #28a745;
                        box-shadow: 0 8px 32px rgba(40, 167, 69, 0.15);
                    }
                    
                    .price-comparison-advanced h6 {
                        color: #155724;
                        margin-bottom: 16px;
                        font-size: 16px;
                        font-weight: 700;
                        text-align: center;
                    }
                    
                    .competitors-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 12px;
                        margin-bottom: 20px;
                    }
                    
                    .competitor-item {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px;
                        background: white;
                        border-radius: 8px;
                        border: 1px solid #e0e0e0;
                        transition: all 0.3s ease;
                    }
                    
                    .competitor-item.winner {
                        background: linear-gradient(135deg, #28a745, #20c997);
                        color: white;
                        transform: scale(1.05);
                        box-shadow: 0 6px 20px rgba(40, 167, 69, 0.3);
                        border: 2px solid #ffd700;
                    }
                    
                    .competitor-logo {
                        font-size: 20px;
                        width: 32px;
                        text-align: center;
                    }
                    
                    .competitor-info {
                        flex: 1;
                    }
                    
                    .competitor-name {
                        display: block;
                        font-size: 14px;
                        font-weight: 600;
                        margin-bottom: 2px;
                    }
                    
                    .competitor-price {
                        display: block;
                        font-size: 16px;
                        font-weight: 700;
                        color: #dc3545;
                    }
                    
                    .competitor-price.best {
                        color: #ffd700;
                        font-size: 18px;
                    }
                    
                    .competitor-note {
                        display: block;
                        font-size: 11px;
                        opacity: 0.8;
                        margin-top: 2px;
                    }
                    
                    .competitor-note.best {
                        color: #ffd700;
                        font-weight: 600;
                        opacity: 1;
                    }
                    
                    .savings-calculator {
                        text-align: center;
                        padding: 16px;
                        background: rgba(255, 255, 255, 0.8);
                        border-radius: 12px;
                        border: 1px dashed #28a745;
                    }
                    
                    .savings-highlight {
                        font-size: 16px;
                        color: #155724;
                        font-weight: 700;
                        margin-bottom: 8px;
                        animation: savingsPulse 2s infinite;
                    }
                    
                    @keyframes savingsPulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.8; }
                    }
                    
                    .value-proposition {
                        font-size: 14px;
                        color: #28a745;
                        font-weight: 600;
                    }
                `;
                document.head.appendChild(style);
            }
            
            priceSection.appendChild(anchoring);
            this.conversionTechniques.priceAnchoring = true;
        }
    }

    // ============================================
    // DYNAMIC TESTIMONIALS FLOW
    // ============================================
    
    createDynamicTestimonialsFlow() {
        let currentTestimonial = 0;
        
        // Create testimonials container
        const container = document.createElement('div');
        container.className = 'dynamic-testimonials-flow';
        container.innerHTML = `
            <div class="testimonials-header">
                <h6><i class="bi bi-chat-heart"></i> Testimonios Verificados</h6>
                <div class="testimonials-counter">
                    <span id="testimonial-current">1</span>/<span id="testimonial-total">${this.testimonials.length}</span>
                </div>
            </div>
            <div class="testimonial-display" id="testimonial-display">
                <!-- Testimonials will be populated here -->
            </div>
            <div class="testimonials-navigation">
                <button class="testimonial-nav prev" onclick="advancedConversionOptimizer.previousTestimonial()">‹</button>
                <div class="testimonial-dots" id="testimonial-dots">
                    <!-- Dots will be populated -->
                </div>
                <button class="testimonial-nav next" onclick="advancedConversionOptimizer.nextTestimonial()">›</button>
            </div>
        `;
        
        // Add testimonials styles
        if (!document.getElementById('dynamic-testimonials-styles')) {
            const style = document.createElement('style');
            style.id = 'dynamic-testimonials-styles';
            style.textContent = `
                .dynamic-testimonials-flow {
                    margin: 24px 0;
                    padding: 24px;
                    background: linear-gradient(135deg, #fff8e1, #f3e5f5);
                    border-radius: 16px;
                    border-left: 5px solid #9c27b0;
                    box-shadow: 0 4px 16px rgba(156, 39, 176, 0.1);
                }
                
                .testimonials-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }
                
                .testimonials-header h6 {
                    color: #4a148c;
                    margin: 0;
                    font-size: 16px;
                    font-weight: 700;
                }
                
                .testimonials-counter {
                    font-size: 14px;
                    color: #666;
                    font-weight: 600;
                }
                
                .testimonial-display {
                    min-height: 120px;
                    margin-bottom: 16px;
                }
                
                .testimonial-item {
                    opacity: 0;
                    animation: testimonialFadeIn 0.6s ease forwards;
                }
                
                @keyframes testimonialFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .testimonial-content {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid #e1bee7;
                    position: relative;
                    margin-bottom: 12px;
                }
                
                .testimonial-content::before {
                    content: '"';
                    position: absolute;
                    top: -10px;
                    left: 20px;
                    font-size: 48px;
                    color: #9c27b0;
                    font-family: Georgia, serif;
                    line-height: 1;
                }
                
                .testimonial-text {
                    font-style: italic;
                    color: #333;
                    font-size: 15px;
                    line-height: 1.5;
                    margin-bottom: 16px;
                    padding-left: 20px;
                }
                
                .testimonial-author {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 20px;
                }
                
                .author-details {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .author-name {
                    font-weight: 700;
                    color: #4a148c;
                }
                
                .author-time {
                    color: #666;
                    font-size: 12px;
                }
                
                .verified-badge {
                    background: #4caf50;
                    color: white;
                    font-size: 10px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-weight: 600;
                }
                
                .testimonial-rating {
                    color: #ffc107;
                    font-size: 16px;
                }
                
                .testimonials-navigation {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 16px;
                }
                
                .testimonial-nav {
                    background: #9c27b0;
                    color: white;
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    transition: all 0.3s ease;
                }
                
                .testimonial-nav:hover {
                    background: #7b1fa2;
                    transform: scale(1.1);
                }
                
                .testimonial-dots {
                    display: flex;
                    gap: 8px;
                }
                
                .testimonial-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #ddd;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .testimonial-dot.active {
                    background: #9c27b0;
                    transform: scale(1.3);
                }
            `;
            document.head.appendChild(style);
        }
        
        // Insert near trust section
        const trustSection = document.querySelector('.trust-section');
        if (trustSection) {
            trustSection.appendChild(container);
            
            // Initialize first testimonial
            this.updateTestimonial(0);
            
            // Create dots
            this.createTestimonialDots();
            
            // Auto-rotate testimonials
            this.timers.dynamicTestimonials = setInterval(() => {
                currentTestimonial = (currentTestimonial + 1) % this.testimonials.length;
                this.updateTestimonial(currentTestimonial);
            }, 8000);
        }
        
        // Store current testimonial index
        this.currentTestimonialIndex = currentTestimonial;
    }
    
    updateTestimonial(index) {
        const display = document.getElementById('testimonial-display');
        const counter = document.getElementById('testimonial-current');
        
        if (display && counter) {
            const testimonial = this.testimonials[index];
            display.innerHTML = `
                <div class="testimonial-item">
                    <div class="testimonial-content">
                        <div class="testimonial-text">${testimonial.text}</div>
                        <div class="testimonial-author">
                            <div class="author-details">
                                <span class="author-name">${testimonial.name}</span>
                                ${testimonial.verified ? '<span class="verified-badge">VERIFICADO</span>' : ''}
                                <span class="author-time">${testimonial.time}</span>
                            </div>
                            <div class="testimonial-rating">
                                ${'⭐'.repeat(testimonial.rating)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            counter.textContent = index + 1;
            this.updateTestimonialDots(index);
        }
        
        this.currentTestimonialIndex = index;
    }
    
    createTestimonialDots() {
        const dotsContainer = document.getElementById('testimonial-dots');
        if (dotsContainer) {
            dotsContainer.innerHTML = '';
            for (let i = 0; i < this.testimonials.length; i++) {
                const dot = document.createElement('div');
                dot.className = 'testimonial-dot';
                if (i === 0) dot.classList.add('active');
                dot.onclick = () => this.updateTestimonial(i);
                dotsContainer.appendChild(dot);
            }
        }
    }
    
    updateTestimonialDots(activeIndex) {
        const dots = document.querySelectorAll('.testimonial-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === activeIndex);
        });
    }
    
    nextTestimonial() {
        const nextIndex = (this.currentTestimonialIndex + 1) % this.testimonials.length;
        this.updateTestimonial(nextIndex);
    }
    
    previousTestimonial() {
        const prevIndex = this.currentTestimonialIndex === 0 ? this.testimonials.length - 1 : this.currentTestimonialIndex - 1;
        this.updateTestimonial(prevIndex);
    }

    // ============================================
    // INTENSIFIED SOCIAL PROOF
    // ============================================
    
    setupIntensifiedSocialProof() {
        // Create real-time activity feed
        const activityFeed = document.createElement('div');
        activityFeed.className = 'real-time-activity-feed';
        activityFeed.innerHTML = `
            <div class="activity-header">
                <span class="activity-pulse"></span>
                <span class="activity-title">Actividad en Tiempo Real</span>
            </div>
            <div class="activity-stream" id="activity-stream">
                <!-- Activities will be populated here -->
            </div>
        `;
        
        // Add activity feed styles
        if (!document.getElementById('activity-feed-styles')) {
            const style = document.createElement('style');
            style.id = 'activity-feed-styles';
            style.textContent = `
                .real-time-activity-feed {
                    position: fixed;
                    bottom: 80px;
                    left: 20px;
                    max-width: 300px;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                    z-index: 1000;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    overflow: hidden;
                    animation: feedSlideIn 0.5s ease;
                }
                
                @keyframes feedSlideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                .activity-header {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    font-weight: 600;
                }
                
                .activity-pulse {
                    width: 8px;
                    height: 8px;
                    background: #4caf50;
                    border-radius: 50%;
                    animation: activityPulse 2s infinite;
                }
                
                @keyframes activityPulse {
                    0%, 100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.5;
                        transform: scale(1.2);
                    }
                }
                
                .activity-stream {
                    max-height: 200px;
                    overflow-y: auto;
                }
                
                .activity-item {
                    padding: 12px 16px;
                    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    animation: activityItemSlide 0.5s ease;
                    font-size: 13px;
                    color: #333;
                }
                
                @keyframes activityItemSlide {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                .activity-item:last-child {
                    border-bottom: none;
                }
                
                .activity-icon {
                    font-size: 16px;
                    flex-shrink: 0;
                }
                
                .activity-text {
                    flex: 1;
                    line-height: 1.4;
                }
                
                .activity-time {
                    font-size: 11px;
                    color: #666;
                    flex-shrink: 0;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(activityFeed);
        
        // Generate random activities
        this.generateRandomActivities();
        
        // Update activities every 10-15 seconds
        this.timers.socialProofPulse = setInterval(() => {
            this.addNewActivity();
        }, 10000 + Math.random() * 5000);
    }
    
    generateRandomActivities() {
        const activities = [
            { icon: '🛒', text: 'Carlos M. agregó este producto al carrito', time: 'hace 2 min' },
            { icon: '❤️', text: 'María S. marcó como favorito', time: 'hace 5 min' },
            { icon: '✅', text: 'Ana R. completó su compra', time: 'hace 8 min' },
            { icon: '👀', text: '12 personas viendo ahora', time: 'en vivo' }
        ];
        
        const stream = document.getElementById('activity-stream');
        if (stream) {
            activities.forEach((activity, index) => {
                setTimeout(() => {
                    this.addActivityToStream(activity);
                }, index * 1000);
            });
        }
    }
    
    addNewActivity() {
        const activities = [
            { icon: '🛒', text: `${this.getRandomName()} agregó al carrito`, time: 'justo ahora' },
            { icon: '❤️', text: `${this.getRandomName()} marcó como favorito`, time: 'hace 1 min' },
            { icon: '✅', text: `${this.getRandomName()} completó su compra`, time: 'hace 2 min' },
            { icon: '🔥', text: `${2 + Math.floor(Math.random() * 8)} vendidos hoy`, time: 'actualizado' },
            { icon: '👀', text: `${15 + Math.floor(Math.random() * 10)} personas viendo`, time: 'en vivo' },
            { icon: '🚚', text: 'Entrega completada en Caracas', time: 'hace 15 min' },
            { icon: '⭐', text: 'Nueva reseña 5 estrellas', time: 'hace 30 min' }
        ];
        
        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        this.addActivityToStream(randomActivity);
    }
    
    addActivityToStream(activity) {
        const stream = document.getElementById('activity-stream');
        if (stream) {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <span class="activity-icon">${activity.icon}</span>
                <span class="activity-text">${activity.text}</span>
                <span class="activity-time">${activity.time}</span>
            `;
            
            // Add to beginning
            stream.insertBefore(item, stream.firstChild);
            
            // Remove old items (keep max 6)
            const items = stream.querySelectorAll('.activity-item');
            if (items.length > 6) {
                stream.removeChild(items[items.length - 1]);
            }
        }
    }
    
    getRandomName() {
        const names = ['Carlos M.', 'María S.', 'Ana R.', 'Luis P.', 'Carmen V.', 'Roberto G.', 'Sofia L.', 'Diego F.'];
        return names[Math.floor(Math.random() * names.length)];
    }

    // ============================================
    // ADVANCED FOMO TRIGGERS
    // ============================================
    
    implementAdvancedFOMOTriggers() {
        console.log('🔥 Advanced FOMO Triggers: Implementing fear-of-missing-out techniques...');
        
        // Create advanced scarcity indicators
        this.createAdvancedScarcityIndicators();
        
        // Implement time-sensitive offers
        this.setupTimeSensitiveOffers();
        
        // Add social pressure elements
        this.addSocialPressureElements();
        
        // Create urgency escalation
        this.createUrgencyEscalation();
        
        console.log('✅ Advanced FOMO Triggers implemented successfully');
    }
    
    createAdvancedScarcityIndicators() {
        const stockPressure = document.querySelector('.stock-pressure');
        if (stockPressure && !document.querySelector('.advanced-scarcity-indicator')) {
            const advancedIndicator = document.createElement('div');
            advancedIndicator.className = 'advanced-scarcity-indicator';
            advancedIndicator.innerHTML = `
                <div class="scarcity-header">
                    <i class="bi bi-exclamation-triangle text-warning"></i>
                    <span class="scarcity-title">¡Disponibilidad Limitada!</span>
                </div>
                <div class="scarcity-details">
                    <div class="inventory-countdown">
                        <span class="inventory-number">3</span>
                        <span class="inventory-text">unidades restantes</span>
                    </div>
                    <div class="demand-indicator">
                        <span class="demand-dot"></span>
                        <span class="demand-text">Alta demanda detectada</span>
                    </div>
                </div>
            `;
            stockPressure.appendChild(advancedIndicator);
        }
    }
    
    setupTimeSensitiveOffers() {
        // Add flash sale countdown
        const priceSection = document.querySelector('.price-section-enhanced');
        if (priceSection && !document.querySelector('.flash-sale-banner')) {
            const flashBanner = document.createElement('div');
            flashBanner.className = 'flash-sale-banner';
            flashBanner.innerHTML = `
                <div class="flash-sale-content">
                    <span class="flash-icon">⚡</span>
                    <div class="flash-text">
                        <strong>OFERTA FLASH</strong>
                        <small>Termina en <span id="flash-timer">4:32</span></small>
                    </div>
                    <span class="flash-pulse"></span>
                </div>
            `;
            priceSection.insertBefore(flashBanner, priceSection.firstChild);
            
            // Start flash timer countdown
            this.startFlashTimer();
        }
    }
    
    addSocialPressureElements() {
        // Add watching indicator
        const productTitle = document.querySelector('#product-title');
        if (productTitle && !document.querySelector('.social-pressure-indicator')) {
            const pressureIndicator = document.createElement('div');
            pressureIndicator.className = 'social-pressure-indicator';
            pressureIndicator.innerHTML = `
                <div class="pressure-item">
                    <i class="bi bi-eye-fill text-info"></i>
                    <span><strong id="viewers-count">18</strong> personas viendo ahora</span>
                </div>
                <div class="pressure-item">
                    <i class="bi bi-cart-fill text-success"></i>
                    <span><strong id="cart-adds">7</strong> agregaron al carrito en la última hora</span>
                </div>
            `;
            productTitle.parentNode.insertBefore(pressureIndicator, productTitle.nextSibling);
        }
    }
    
    createUrgencyEscalation() {
        // Escalate urgency messages over time
        const urgencyMessages = [
            '¡Solo quedan pocas unidades!',
            '¡ATENCIÓN: Stock muy limitado!',
            '🚨 ÚLTIMO AVISO: Solo 3 disponibles',
            '⚠️ CRÍTICO: Se agota el stock HOY'
        ];
        
        let currentLevel = 0;
        const escalationInterval = setInterval(() => {
            if (currentLevel < urgencyMessages.length - 1) {
                currentLevel++;
                const stockText = document.querySelector('.stock-text');
                if (stockText) {
                    const strongElement = stockText.querySelector('strong');
                    if (strongElement) {
                        strongElement.textContent = urgencyMessages[currentLevel];
                        // Add visual emphasis
                        strongElement.style.animation = 'urgencyPulse 0.5s ease-in-out';
                        setTimeout(() => {
                            strongElement.style.animation = '';
                        }, 500);
                    }
                }
            } else {
                clearInterval(escalationInterval);
            }
        }, 45000); // Escalate every 45 seconds
    }
    
    startFlashTimer() {
        let timeLeft = 4 * 60 + 32; // 4:32 in seconds
        const timerElement = document.getElementById('flash-timer');
        
        if (timerElement) {
            const countdown = setInterval(() => {
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                if (timeLeft <= 0) {
                    clearInterval(countdown);
                    timerElement.textContent = 'TERMINÓ';
                    timerElement.style.color = '#ff4757';
                }
                timeLeft--;
            }, 1000);
        }
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    pulseMainCTA() {
        const floresyaBtn = document.getElementById('floresya-btn');
        if (floresyaBtn) {
            floresyaBtn.style.animation = 'ctaPulseIntense 1s ease-in-out';
            setTimeout(() => {
                floresyaBtn.style.animation = '';
            }, 1000);
        }
        
        // Add intense pulse animation
        if (!document.getElementById('cta-pulse-intense-style')) {
            const style = document.createElement('style');
            style.id = 'cta-pulse-intense-style';
            style.textContent = `
                @keyframes ctaPulseIntense {
                    0% { transform: scale(1); box-shadow: 0 8px 25px rgba(255, 105, 180, 0.3); }
                    30% { transform: scale(1.08); box-shadow: 0 16px 50px rgba(255, 105, 180, 0.7); }
                    70% { transform: scale(1.05); box-shadow: 0 20px 60px rgba(255, 105, 180, 0.8); }
                    100% { transform: scale(1); box-shadow: 0 8px 25px rgba(255, 105, 180, 0.3); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    enhanceMainCTA() {
        const floresyaBtn = document.getElementById('floresya-btn');
        if (floresyaBtn) {
            // Add enhanced text and styling
            const btnText = floresyaBtn.querySelector('.btn-main');
            if (btnText) {
                btnText.innerHTML = '🚀 ¡COMPRAR AHORA - ÚLTIMAS UNIDADES! 🚀';
            }
            
            floresyaBtn.style.background = 'linear-gradient(135deg, #ff6b6b, #ffd93d, #4ecdc4)';
            floresyaBtn.style.backgroundSize = '200% 200%';
            floresyaBtn.style.animation = 'enhancedGradient 2s ease infinite, enhancedGlow 1.5s ease-in-out infinite';
        }
        
        // Add enhanced animation styles
        if (!document.getElementById('enhanced-cta-styles')) {
            const style = document.createElement('style');
            style.id = 'enhanced-cta-styles';
            style.textContent = `
                @keyframes enhancedGradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                
                @keyframes enhancedGlow {
                    0%, 100% { box-shadow: 0 12px 40px rgba(255, 107, 107, 0.4); }
                    50% { box-shadow: 0 16px 50px rgba(255, 107, 107, 0.7), 0 0 30px rgba(78, 205, 196, 0.5); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    triggerSocialProofBurst() {
        // Flash all social proof elements
        const socialElements = document.querySelectorAll('.social-trigger, .live-activity-banner, .impulse-triggers, .real-time-activity-feed');
        socialElements.forEach(element => {
            element.style.animation = 'socialBurst 1.2s ease-in-out';
            setTimeout(() => {
                element.style.animation = '';
            }, 1200);
        });
        
        // Add burst animation
        if (!document.getElementById('social-burst-style')) {
            const style = document.createElement('style');
            style.id = 'social-burst-style';
            style.textContent = `
                @keyframes socialBurst {
                    0%, 100% { transform: scale(1); filter: brightness(1); }
                    25% { transform: scale(1.05); filter: brightness(1.2); }
                    50% { transform: scale(1.08); filter: brightness(1.3); }
                    75% { transform: scale(1.03); filter: brightness(1.1); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Show burst message
        this.showUrgencyMessage('👥 ¡INCREÍBLE! ' + (15 + Math.floor(Math.random() * 20)) + ' personas han comprado en la última hora');
    }
    
    intensifyUrgencyVisuals() {
        // Make all urgency elements more prominent
        const urgencyElements = document.querySelectorAll('.urgency-timer, .stock-pressure, .scarcity-trigger');
        urgencyElements.forEach(element => {
            element.style.background = 'linear-gradient(135deg, #ff4757, #ff6348)';
            element.style.color = 'white';
            element.style.transform = 'scale(1.02)';
            element.style.boxShadow = '0 8px 32px rgba(255, 71, 87, 0.4)';
            element.style.animation = 'urgencyIntensify 2s infinite';
        });
        
        // Add intensify animation
        if (!document.getElementById('urgency-intensify-style')) {
            const style = document.createElement('style');
            style.id = 'urgency-intensify-style';
            style.textContent = `
                @keyframes urgencyIntensify {
                    0%, 100% { 
                        filter: brightness(1);
                        transform: scale(1.02);
                    }
                    50% { 
                        filter: brightness(1.2);
                        transform: scale(1.04);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    triggerFinalConversionPush() {
        // Create final conversion overlay
        const overlay = document.createElement('div');
        overlay.className = 'final-conversion-push';
        overlay.innerHTML = `
            <div class="final-push-modal">
                <div class="final-push-header">
                    <h3>🎯 ¡MOMENTO DECISIVO!</h3>
                    <button class="close-final-push" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="final-push-body">
                    <div class="push-highlight">
                        <div class="highlight-icon">⚡</div>
                        <div class="highlight-content">
                            <h4>¡OFERTA LIGHTNING ACTIVA!</h4>
                            <p>Los próximos <strong>3 compradores</strong> obtienen:</p>
                        </div>
                    </div>
                    
                    <div class="push-benefits">
                        <div class="benefit-row">
                            <span class="benefit-icon">💰</span>
                            <span class="benefit-text"><strong>25% de descuento</strong> - Ahorro extra</span>
                        </div>
                        <div class="benefit-row">
                            <span class="benefit-icon">🚚</span>
                            <span class="benefit-text"><strong>Entrega en 1-2 horas</strong> - Express premium</span>
                        </div>
                        <div class="benefit-row">
                            <span class="benefit-icon">🎁</span>
                            <span class="benefit-text"><strong>Tarjeta personalizada GRATIS</strong> - Valor $8</span>
                        </div>
                        <div class="benefit-row">
                            <span class="benefit-icon">🔒</span>
                            <span class="benefit-text"><strong>Garantía extendida</strong> - 14 días</span>
                        </div>
                    </div>
                    
                    <div class="push-urgency">
                        <div class="urgency-counter">
                            <span class="counter-label">Compradores restantes:</span>
                            <span class="counter-number" id="lightning-counter">3</span>
                        </div>
                        <div class="urgency-timer">
                            ⏰ Expira en: <span id="lightning-timer">02:00</span>
                        </div>
                    </div>
                    
                    <div class="push-actions">
                        <button class="accept-lightning" onclick="advancedConversionOptimizer.acceptLightningOffer()">
                            ⚡ ¡SÍ, QUIERO ESTA OFERTA LIGHTNING!
                        </button>
                        <button class="decline-lightning" onclick="this.parentElement.parentElement.parentElement.remove()">
                            No gracias, prefiero pagar precio completo
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add lightning offer styles
        if (!document.getElementById('lightning-offer-styles')) {
            const style = document.createElement('style');
            style.id = 'lightning-offer-styles';
            style.textContent = `
                .final-conversion-push {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    z-index: 99999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    animation: lightningFade 0.5s ease;
                }
                
                @keyframes lightningFade {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .final-push-modal {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    border-radius: 20px;
                    max-width: 600px;
                    margin: 20px;
                    color: white;
                    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
                    animation: lightningSlide 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                    overflow: hidden;
                }
                
                @keyframes lightningSlide {
                    from { transform: scale(0.8) translateY(-100px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
                
                .final-push-header {
                    padding: 24px;
                    text-align: center;
                    background: rgba(255, 255, 255, 0.1);
                    position: relative;
                }
                
                .final-push-header h3 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 700;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                    animation: lightning 1s infinite;
                }
                
                @keyframes lightning {
                    0%, 100% { text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); }
                    50% { text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.8); }
                }
                
                .close-final-push {
                    position: absolute;
                    top: 16px;
                    right: 20px;
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }
                
                .close-final-push:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.1);
                }
                
                .final-push-body {
                    padding: 32px 24px;
                }
                
                .push-highlight {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    background: rgba(255, 255, 255, 0.15);
                    padding: 20px;
                    border-radius: 16px;
                    margin-bottom: 24px;
                }
                
                .highlight-icon {
                    font-size: 48px;
                    animation: bounce 2s infinite;
                }
                
                .highlight-content h4 {
                    margin: 0 0 8px 0;
                    font-size: 20px;
                    color: #ffd700;
                }
                
                .highlight-content p {
                    margin: 0;
                    font-size: 16px;
                    opacity: 0.9;
                }
                
                .push-benefits {
                    margin-bottom: 24px;
                }
                
                .benefit-row {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 12px 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .benefit-row:last-child {
                    border-bottom: none;
                }
                
                .benefit-icon {
                    font-size: 24px;
                    width: 32px;
                    text-align: center;
                }
                
                .benefit-text {
                    font-size: 16px;
                    line-height: 1.4;
                }
                
                .push-urgency {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 20px;
                    border-radius: 12px;
                    margin-bottom: 24px;
                    text-align: center;
                }
                
                .urgency-counter {
                    margin-bottom: 12px;
                }
                
                .counter-label {
                    font-size: 16px;
                    margin-right: 8px;
                }
                
                .counter-number {
                    background: #ff4757;
                    color: white;
                    font-size: 24px;
                    font-weight: 700;
                    padding: 8px 16px;
                    border-radius: 8px;
                    display: inline-block;
                    animation: counterPulse 1s infinite;
                }
                
                @keyframes counterPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                
                .urgency-timer {
                    font-size: 18px;
                    font-weight: 600;
                    color: #ffd700;
                }
                
                #lightning-timer {
                    font-size: 20px;
                    color: #ff4757;
                    font-weight: 700;
                }
                
                .push-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                
                .accept-lightning {
                    background: linear-gradient(135deg, #ff4757, #ff6348);
                    color: white;
                    border: none;
                    padding: 20px;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 18px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    animation: acceptButtonPulse 2s infinite;
                }
                
                @keyframes acceptButtonPulse {
                    0%, 100% { 
                        box-shadow: 0 8px 25px rgba(255, 71, 87, 0.4); 
                        transform: scale(1);
                    }
                    50% { 
                        box-shadow: 0 12px 40px rgba(255, 71, 87, 0.7); 
                        transform: scale(1.02);
                    }
                }
                
                .accept-lightning:hover {
                    transform: translateY(-3px) scale(1.02);
                    box-shadow: 0 15px 50px rgba(255, 71, 87, 0.6);
                }
                
                .decline-lightning {
                    background: transparent;
                    color: rgba(255, 255, 255, 0.7);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    padding: 16px;
                    border-radius: 8px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .decline-lightning:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(overlay);
        
        // Start lightning timer
        let lightningTime = 120; // 2 minutes
        const lightningTimer = setInterval(() => {
            const minutes = Math.floor(lightningTime / 60);
            const seconds = lightningTime % 60;
            const timerEl = document.getElementById('lightning-timer');
            if (timerEl) {
                timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            lightningTime--;
            
            // Decrease counter occasionally
            if (lightningTime % 30 === 0) {
                const counter = document.getElementById('lightning-counter');
                if (counter) {
                    const current = parseInt(counter.textContent);
                    if (current > 1) {
                        counter.textContent = current - 1;
                    }
                }
            }
            
            if (lightningTime < 0 || !document.querySelector('.final-conversion-push')) {
                clearInterval(lightningTimer);
            }
        }, 1000);
    }
    
    acceptLightningOffer() {
        // Apply lightning offer
        this.showUrgencyMessage('🎉 ¡OFERTA LIGHTNING ACEPTADA! 25% OFF + beneficios premium aplicados', 'success');
        
        // Update price with 25% discount
        const priceEl = document.getElementById('price-usd');
        if (priceEl) {
            const currentPrice = parseFloat(priceEl.textContent.replace('$', ''));
            const lightningPrice = currentPrice * 0.75; // 25% off
            priceEl.style.color = '#4caf50';
            priceEl.style.fontSize = '2.4rem';
            priceEl.style.fontWeight = '700';
            priceEl.textContent = `$${lightningPrice.toFixed(2)}`;
            
            // Add mega savings indicator
            const megaSavings = document.createElement('div');
            megaSavings.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, #ff4757, #ffd700);
                    color: white;
                    padding: 16px 20px;
                    border-radius: 16px;
                    display: inline-block;
                    margin: 16px 0;
                    font-weight: 700;
                    font-size: 18px;
                    animation: megaSavingsFlash 2s infinite;
                    box-shadow: 0 8px 32px rgba(255, 71, 87, 0.5);
                ">
                    ⚡ ¡AHORRAS $${(currentPrice * 0.25).toFixed(2)} + BENEFICIOS PREMIUM! ⚡
                </div>
            `;
            priceEl.parentElement.appendChild(megaSavings);
        }
        
        // Close modal
        document.querySelector('.final-conversion-push')?.remove();
        
        // Ultra-mega enhance FloresYa button
        this.ultraMegaEnhanceFloresYaButton();
    }
    
    ultraMegaEnhanceFloresYaButton() {
        const floresyaBtn = document.getElementById('floresya-btn');
        if (floresyaBtn) {
            floresyaBtn.innerHTML = `
                <div class="btn-content">
                    <div class="btn-icon">
                        <i class="bi bi-lightning-charge-fill"></i>
                    </div>
                    <div class="btn-text">
                        <span class="btn-main">⚡ ¡COMPLETAR COMPRA LIGHTNING! ⚡</span>
                        <small class="btn-sub">25% OFF • Entrega 1-2h • Tarjeta GRATIS • Garantía extendida</small>
                    </div>
                    <div class="btn-savings">
                        <small>🏆 Oferta Lightning activa - El mejor precio posible</small>
                    </div>
                    <div class="btn-shine"></div>
                </div>
            `;
            
            floresyaBtn.style.background = 'linear-gradient(135deg, #667eea, #764ba2, #ff4757, #ffd700)';
            floresyaBtn.style.backgroundSize = '400% 400%';
            floresyaBtn.style.animation = 'ultraMegaGradient 1.5s ease infinite, ultraMegaGlow 1s ease-in-out infinite, ultraMegaPulse 2s ease infinite';
            floresyaBtn.style.transform = 'scale(1.15)';
            floresyaBtn.style.fontSize = '1.3rem';
            floresyaBtn.style.fontWeight = '700';
            floresyaBtn.style.textShadow = '0 2px 4px rgba(0,0,0,0.3)';
            
            // Add ultra mega styles
            if (!document.getElementById('ultra-mega-button-styles')) {
                const style = document.createElement('style');
                style.id = 'ultra-mega-button-styles';
                style.textContent = `
                    @keyframes ultraMegaGradient {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    
                    @keyframes ultraMegaGlow {
                        0%, 100% { 
                            box-shadow: 
                                0 25px 80px rgba(102, 126, 234, 0.6),
                                0 0 50px rgba(255, 71, 87, 0.4);
                        }
                        50% { 
                            box-shadow: 
                                0 30px 100px rgba(102, 126, 234, 0.8),
                                0 0 70px rgba(255, 71, 87, 0.6),
                                0 0 30px rgba(255, 215, 0, 0.5);
                        }
                    }
                    
                    @keyframes ultraMegaPulse {
                        0%, 100% { transform: scale(1.15); }
                        50% { transform: scale(1.18); }
                    }
                    
                    @keyframes megaSavingsFlash {
                        0%, 100% { 
                            opacity: 1; 
                            transform: scale(1);
                            filter: brightness(1);
                        }
                        50% { 
                            opacity: 0.9; 
                            transform: scale(1.05);
                            filter: brightness(1.2);
                        }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }

    // ============================================
    // ONE-CLICK OPTIMIZATION & MORE TECHNIQUES
    // ============================================
    
    optimizeOneClickExperience() {
        const floresyaBtn = document.getElementById('floresya-btn');
        if (floresyaBtn) {
            // Track click analytics
            let clickCount = 0;
            let firstClickTime = null;
            
            floresyaBtn.addEventListener('click', (e) => {
                clickCount++;
                if (!firstClickTime) firstClickTime = Date.now();
                
                console.log(`🎯 One-Click Analytics: Click ${clickCount}, Time since first: ${Date.now() - firstClickTime}ms`);
                
                // Show immediate feedback
                this.showOneClickFeedback();
                
                // If it's the actual purchase function, we'll let it proceed
                // This just adds the feedback layer
            });
            
            // Enhance button for better one-click appeal
            this.enhanceForOneClick();
        }
    }
    
    showOneClickFeedback() {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #4caf50, #8bc34a);
            color: white;
            padding: 20px 30px;
            border-radius: 16px;
            z-index: 99999;
            font-weight: 700;
            font-size: 18px;
            box-shadow: 0 15px 50px rgba(76, 175, 80, 0.5);
            animation: oneClickFeedback 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            text-align: center;
        `;
        
        feedback.innerHTML = `
            <div style="font-size: 32px; margin-bottom: 8px;">🚀</div>
            <div>¡Procesando tu compra express!</div>
            <small style="opacity: 0.9; font-weight: 400;">Un momento por favor...</small>
        `;
        
        document.body.appendChild(feedback);
        
        // Add feedback animation
        if (!document.getElementById('one-click-feedback-style')) {
            const style = document.createElement('style');
            style.id = 'one-click-feedback-style';
            style.textContent = `
                @keyframes oneClickFeedback {
                    0% { 
                        opacity: 0; 
                        transform: translate(-50%, -50%) scale(0.5) rotate(-10deg); 
                    }
                    100% { 
                        opacity: 1; 
                        transform: translate(-50%, -50%) scale(1) rotate(0deg); 
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            feedback.remove();
        }, 2500);
    }
    
    enhanceForOneClick() {
        const floresyaBtn = document.getElementById('floresya-btn');
        if (floresyaBtn) {
            // Add one-click specific enhancements
            floresyaBtn.style.fontSize = '1.2rem';
            floresyaBtn.style.padding = '18px 24px';
            floresyaBtn.style.fontWeight = '700';
            floresyaBtn.style.letterSpacing = '0.5px';
            
            // Add hover enhancement for one-click feel
            floresyaBtn.addEventListener('mouseenter', () => {
                floresyaBtn.style.transform = 'scale(1.05)';
                floresyaBtn.style.transition = 'all 0.2s ease';
            });
            
            floresyaBtn.addEventListener('mouseleave', () => {
                floresyaBtn.style.transform = 'scale(1)';
            });
        }
    }
    
    setupAdvancedExitIntent() {
        let hasShownAdvancedExit = false;
        let exitAttempts = 0;
        
        document.addEventListener('mouseleave', (e) => {
            if (e.clientY <= 0) {
                exitAttempts++;
                this.counters.exitAttempts = exitAttempts;
                
                if (exitAttempts === 1) {
                    this.showUrgencyMessage('🤔 ¿Te vas? ¡Espera! Tenemos algo especial...', 'warning');
                } else if (exitAttempts === 2 && !hasShownAdvancedExit) {
                    hasShownAdvancedExit = true;
                    this.showAdvancedExitModal();
                }
            }
        });
    }
    
    showAdvancedExitModal() {
        const modal = document.createElement('div');
        modal.className = 'advanced-exit-modal';
        modal.innerHTML = `
            <div class="advanced-exit-content">
                <div class="advanced-exit-header">
                    <h3>🛑 ¡ÚLTIMA OPORTUNIDAD EXCLUSIVA!</h3>
                    <button class="advanced-exit-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="advanced-exit-body">
                    <div class="exit-urgency-banner">
                        <div class="urgency-icon">⚡</div>
                        <div class="urgency-content">
                            <h4>OFERTA DE EMERGENCIA ACTIVADA</h4>
                            <p>Solo para ti, solo por <strong>5 minutos</strong></p>
                        </div>
                    </div>
                    
                    <div class="exit-mega-benefits">
                        <div class="mega-benefit">
                            <span class="mega-icon">💥</span>
                            <div class="mega-text">
                                <strong>30% OFF</strong>
                                <small>El descuento más alto del año</small>
                            </div>
                        </div>
                        <div class="mega-benefit">
                            <span class="mega-icon">🚀</span>
                            <div class="mega-text">
                                <strong>Entrega en 60 minutos</strong>
                                <small>Servicio VIP exclusivo</small>
                            </div>
                        </div>
                        <div class="mega-benefit">
                            <span class="mega-icon">🎁</span>
                            <div class="mega-text">
                                <strong>Kit regalo GRATIS</strong>
                                <small>Tarjeta + chocolates + globo (valor $15)</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="exit-countdown">
                        <div class="countdown-label">Esta oferta expira en:</div>
                        <div class="countdown-display" id="exit-countdown">05:00</div>
                        <div class="countdown-warning">¡No volverás a ver esta oferta!</div>
                    </div>
                    
                    <div class="exit-coupon-section">
                        <div class="coupon-label">Código de emergencia:</div>
                        <div class="exit-coupon-code">EMERGENCIA30</div>
                        <div class="coupon-copy" onclick="advancedConversionOptimizer.copyExitCode()">Copiar código</div>
                    </div>
                    
                    <div class="exit-actions">
                        <button class="mega-accept-btn" onclick="advancedConversionOptimizer.acceptEmergencyOffer()">
                            🚀 ¡SÍ, ACEPTO ESTA OFERTA DE EMERGENCIA!
                        </button>
                        <button class="mega-decline-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
                            No gracias, prefiero perder esta oportunidad única
                        </button>
                    </div>
                    
                    <div class="exit-social-pressure">
                        <small>⏰ <strong>${147 + Math.floor(Math.random() * 200)}</strong> personas perdieron esta oferta hoy por dudar</small>
                    </div>
                </div>
            </div>
        `;
        
        // Add advanced exit styles
        if (!document.getElementById('advanced-exit-styles')) {
            const style = document.createElement('style');
            style.id = 'advanced-exit-styles';
            style.textContent = `
                .advanced-exit-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    z-index: 99999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    animation: advancedExitFade 0.5s ease;
                }
                
                @keyframes advancedExitFade {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .advanced-exit-content {
                    background: white;
                    border-radius: 20px;
                    max-width: 650px;
                    margin: 20px;
                    box-shadow: 0 30px 100px rgba(0, 0, 0, 0.6);
                    animation: advancedExitSlide 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
                    overflow: hidden;
                    border: 3px solid #ff4757;
                }
                
                @keyframes advancedExitSlide {
                    from { transform: scale(0.7) translateY(-100px) rotate(-5deg); opacity: 0; }
                    to { transform: scale(1) translateY(0) rotate(0deg); opacity: 1; }
                }
                
                .advanced-exit-header {
                    background: linear-gradient(135deg, #ff4757, #ff6b6b, #ffa502);
                    color: white;
                    padding: 24px;
                    text-align: center;
                    position: relative;
                    background-size: 200% 200%;
                    animation: emergencyGradient 2s ease infinite;
                }
                
                @keyframes emergencyGradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                
                .advanced-exit-header h3 {
                    margin: 0;
                    font-size: 22px;
                    font-weight: 700;
                    text-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
                    animation: emergencyPulse 1s infinite;
                }
                
                @keyframes emergencyPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                .advanced-exit-close {
                    position: absolute;
                    top: 16px;
                    right: 20px;
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    font-size: 28px;
                    cursor: pointer;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }
                
                .advanced-exit-close:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.2);
                }
                
                .advanced-exit-body {
                    padding: 32px 28px;
                }
                
                .exit-urgency-banner {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    background: linear-gradient(135deg, #ff4757, #ffa502);
                    color: white;
                    padding: 20px;
                    border-radius: 12px;
                    margin-bottom: 24px;
                    animation: urgencyBannerPulse 2s infinite;
                }
                
                @keyframes urgencyBannerPulse {
                    0%, 100% { 
                        box-shadow: 0 4px 20px rgba(255, 71, 87, 0.3);
                        transform: scale(1);
                    }
                    50% { 
                        box-shadow: 0 8px 40px rgba(255, 71, 87, 0.6);
                        transform: scale(1.02);
                    }
                }
                
                .urgency-icon {
                    font-size: 40px;
                    animation: bounce 1.5s infinite;
                }
                
                .urgency-content h4 {
                    margin: 0 0 4px 0;
                    font-size: 18px;
                    font-weight: 700;
                }
                
                .urgency-content p {
                    margin: 0;
                    font-size: 14px;
                    opacity: 0.9;
                }
                
                .exit-mega-benefits {
                    display: grid;
                    gap: 16px;
                    margin-bottom: 24px;
                }
                
                .mega-benefit {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px;
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    border-radius: 12px;
                    border-left: 4px solid #28a745;
                    transition: all 0.3s ease;
                }
                
                .mega-benefit:hover {
                    transform: translateX(5px);
                    box-shadow: 0 6px 25px rgba(40, 167, 69, 0.2);
                }
                
                .mega-icon {
                    font-size: 28px;
                    width: 40px;
                    text-align: center;
                }
                
                .mega-text strong {
                    display: block;
                    color: #155724;
                    font-size: 16px;
                    font-weight: 700;
                    margin-bottom: 2px;
                }
                
                .mega-text small {
                    color: #666;
                    font-size: 13px;
                    line-height: 1.3;
                }
                
                .exit-countdown {
                    text-align: center;
                    background: linear-gradient(135deg, #fff5f5, #ffe6e6);
                    padding: 20px;
                    border-radius: 12px;
                    margin-bottom: 24px;
                    border: 2px dashed #ff4757;
                }
                
                .countdown-label {
                    font-size: 14px;
                    color: #721c24;
                    margin-bottom: 8px;
                    font-weight: 600;
                }
                
                .countdown-display {
                    font-size: 36px;
                    color: #ff4757;
                    font-weight: 700;
                    font-family: 'Courier New', monospace;
                    margin-bottom: 8px;
                    animation: countdownBlink 1s infinite;
                }
                
                @keyframes countdownBlink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0.7; }
                }
                
                .countdown-warning {
                    font-size: 12px;
                    color: #dc3545;
                    font-weight: 600;
                    font-style: italic;
                }
                
                .exit-coupon-section {
                    text-align: center;
                    background: linear-gradient(135deg, #fff3cd, #ffeaa7);
                    padding: 20px;
                    border-radius: 12px;
                    margin-bottom: 24px;
                    border: 2px solid #ffc107;
                }
                
                .coupon-label {
                    font-size: 14px;
                    color: #856404;
                    margin-bottom: 8px;
                    font-weight: 600;
                }
                
                .exit-coupon-code {
                    background: #ff4757;
                    color: white;
                    font-size: 24px;
                    font-weight: 700;
                    padding: 12px 20px;
                    border-radius: 8px;
                    display: inline-block;
                    font-family: 'Courier New', monospace;
                    letter-spacing: 2px;
                    margin-bottom: 8px;
                    animation: couponGlow 2s infinite;
                }
                
                @keyframes couponGlow {
                    0%, 100% { box-shadow: 0 4px 20px rgba(255, 71, 87, 0.3); }
                    50% { box-shadow: 0 8px 40px rgba(255, 71, 87, 0.6); }
                }
                
                .coupon-copy {
                    background: #28a745;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                    display: inline-block;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }
                
                .coupon-copy:hover {
                    background: #1e7e34;
                    transform: scale(1.1);
                }
                
                .exit-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    margin-bottom: 20px;
                }
                
                .mega-accept-btn {
                    background: linear-gradient(135deg, #ff4757, #ff6b6b);
                    color: white;
                    border: none;
                    padding: 20px;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 18px;
                    cursor: pointer;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    transition: all 0.3s ease;
                    animation: megaAcceptPulse 2s infinite;
                }
                
                @keyframes megaAcceptPulse {
                    0%, 100% { 
                        transform: scale(1);
                        box-shadow: 0 8px 32px rgba(255, 71, 87, 0.4);
                    }
                    50% { 
                        transform: scale(1.03);
                        box-shadow: 0 12px 48px rgba(255, 71, 87, 0.7);
                    }
                }
                
                .mega-accept-btn:hover {
                    transform: translateY(-3px) scale(1.02);
                    box-shadow: 0 15px 60px rgba(255, 71, 87, 0.6);
                }
                
                .mega-decline-btn {
                    background: transparent;
                    color: #666;
                    border: 1px solid #ddd;
                    padding: 16px;
                    border-radius: 8px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .mega-decline-btn:hover {
                    background: #f8f9fa;
                    border-color: #adb5bd;
                }
                
                .exit-social-pressure {
                    text-align: center;
                    padding: 16px;
                    background: #fff3cd;
                    border-radius: 8px;
                    border-left: 4px solid #ffc107;
                    color: #856404;
                    font-weight: 600;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(modal);
        
        // Start emergency countdown
        let emergencyTime = 300; // 5 minutes
        const emergencyTimer = setInterval(() => {
            const minutes = Math.floor(emergencyTime / 60);
            const seconds = emergencyTime % 60;
            const timerEl = document.getElementById('exit-countdown');
            if (timerEl) {
                timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            emergencyTime--;
            
            if (emergencyTime < 0 || !document.querySelector('.advanced-exit-modal')) {
                clearInterval(emergencyTimer);
            }
        }, 1000);
    }
    
    copyExitCode() {
        navigator.clipboard.writeText('EMERGENCIA30').then(() => {
            this.showUrgencyMessage('📋 Código copiado: EMERGENCIA30', 'success');
        });
    }
    
    acceptEmergencyOffer() {
        // Apply emergency offer - 30% off
        this.showUrgencyMessage('🎉 ¡OFERTA DE EMERGENCIA ACTIVADA! 30% OFF + Kit regalo + Entrega VIP', 'success');
        
        // Update price with 30% discount
        const priceEl = document.getElementById('price-usd');
        if (priceEl) {
            const currentPrice = parseFloat(priceEl.textContent.replace('$', ''));
            const emergencyPrice = currentPrice * 0.7; // 30% off
            priceEl.style.color = '#dc3545';
            priceEl.style.fontSize = '2.6rem';
            priceEl.style.fontWeight = '700';
            priceEl.textContent = `$${emergencyPrice.toFixed(2)}`;
            
            // Add ultimate savings indicator
            const ultimateSavings = document.createElement('div');
            ultimateSavings.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, #ff4757, #ff6b6b, #ffd700);
                    color: white;
                    padding: 20px 24px;
                    border-radius: 20px;
                    display: inline-block;
                    margin: 20px 0;
                    font-weight: 700;
                    font-size: 20px;
                    animation: ultimateSavingsExplosion 3s infinite;
                    box-shadow: 0 10px 40px rgba(255, 71, 87, 0.6);
                    text-align: center;
                    background-size: 200% 200%;
                ">
                    🚨 ¡AHORRO MÁXIMO: $${(currentPrice * 0.3).toFixed(2)} + KIT REGALO ($15)! 🚨<br>
                    <small style="font-size: 16px; opacity: 0.9;">Total beneficios: $${(currentPrice * 0.3 + 15).toFixed(2)} 🏆</small>
                </div>
            `;
            priceEl.parentElement.appendChild(ultimateSavings);
        }
        
        // Close modal
        document.querySelector('.advanced-exit-modal')?.remove();
        
        // ULTIMATE enhancement of FloresYa button
        this.ultimateEnhanceFloresYaButton();
    }
    
    ultimateEnhanceFloresYaButton() {
        const floresyaBtn = document.getElementById('floresya-btn');
        if (floresyaBtn) {
            floresyaBtn.innerHTML = `
                <div class="btn-content">
                    <div class="btn-icon">
                        <i class="bi bi-rocket-takeoff-fill"></i>
                    </div>
                    <div class="btn-text">
                        <span class="btn-main">🚨 ¡COMPRA DE EMERGENCIA - 30% OFF! 🚨</span>
                        <small class="btn-sub">Kit regalo GRATIS • Entrega 60 min • Garantía VIP • ¡EL MEJOR PRECIO!</small>
                    </div>
                    <div class="btn-savings">
                        <small>💥 OFERTA DE EMERGENCIA ACTIVA - NUNCA VOLVERÁS A VER ESTE PRECIO 💥</small>
                    </div>
                    <div class="btn-shine"></div>
                </div>
            `;
            
            floresyaBtn.style.background = 'linear-gradient(135deg, #ff4757, #ff6b6b, #ffa502, #ffd700, #ff4757)';
            floresyaBtn.style.backgroundSize = '500% 500%';
            floresyaBtn.style.animation = 'ultimateGradientExplosion 1s ease infinite, ultimateGlowExplosion 0.8s ease-in-out infinite, ultimatePulseExplosion 1.5s ease infinite';
            floresyaBtn.style.transform = 'scale(1.2)';
            floresyaBtn.style.fontSize = '1.4rem';
            floresyaBtn.style.fontWeight = '700';
            floresyaBtn.style.textShadow = '0 3px 6px rgba(0,0,0,0.5)';
            floresyaBtn.style.border = '3px solid #ffd700';
            
            // Add ULTIMATE styles
            if (!document.getElementById('ultimate-button-styles')) {
                const style = document.createElement('style');
                style.id = 'ultimate-button-styles';
                style.textContent = `
                    @keyframes ultimateGradientExplosion {
                        0% { background-position: 0% 50%; }
                        25% { background-position: 100% 25%; }
                        50% { background-position: 200% 50%; }
                        75% { background-position: 300% 75%; }
                        100% { background-position: 400% 50%; }
                    }
                    
                    @keyframes ultimateGlowExplosion {
                        0%, 100% { 
                            box-shadow: 
                                0 30px 100px rgba(255, 71, 87, 0.8),
                                0 0 60px rgba(255, 165, 2, 0.6),
                                0 0 80px rgba(255, 215, 0, 0.4),
                                inset 0 0 30px rgba(255, 255, 255, 0.2);
                        }
                        50% { 
                            box-shadow: 
                                0 40px 120px rgba(255, 71, 87, 1),
                                0 0 80px rgba(255, 165, 2, 0.8),
                                0 0 100px rgba(255, 215, 0, 0.6),
                                inset 0 0 50px rgba(255, 255, 255, 0.4);
                        }
                    }
                    
                    @keyframes ultimatePulseExplosion {
                        0%, 100% { transform: scale(1.2) rotate(0deg); }
                        25% { transform: scale(1.25) rotate(1deg); }
                        50% { transform: scale(1.23) rotate(0deg); }
                        75% { transform: scale(1.22) rotate(-1deg); }
                    }
                    
                    @keyframes ultimateSavingsExplosion {
                        0%, 100% { 
                            transform: scale(1) rotate(0deg);
                            filter: brightness(1) saturate(1);
                            background-position: 0% 50%;
                        }
                        25% { 
                            transform: scale(1.05) rotate(1deg);
                            filter: brightness(1.2) saturate(1.2);
                            background-position: 50% 25%;
                        }
                        50% { 
                            transform: scale(1.08) rotate(0deg);
                            filter: brightness(1.3) saturate(1.3);
                            background-position: 100% 50%;
                        }
                        75% { 
                            transform: scale(1.03) rotate(-1deg);
                            filter: brightness(1.1) saturate(1.1);
                            background-position: 150% 75%;
                        }
                    }
                `; 
                document.head.appendChild(style);
            }
        }
    }
    
    createFloatingConversionAssistant() {
        // Implementation for floating assistant would go here
        // This would be a floating chat-like element providing conversion help
    }
    
    implementSmartScrollTriggers() {
        let lastScrollTop = 0;
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollPercent = (scrollTop / (document.body.scrollHeight - window.innerHeight)) * 100;
            
            this.counters.scrollProgress = scrollPercent;
            
            // Trigger actions based on scroll percentage
            if (scrollPercent > 25 && !this.scrollTriggers25) {
                this.scrollTriggers25 = true;
                this.showUrgencyMessage('📊 Has explorado el 25% del producto - ¡Te está gustando!');
            }
            
            if (scrollPercent > 50 && !this.scrollTriggers50) {
                this.scrollTriggers50 = true;
                this.triggerSocialProofBurst();
            }
            
            if (scrollPercent > 75 && !this.scrollTriggers75) {
                this.scrollTriggers75 = true;
                this.showUrgencyMessage('🎯 ¡Estás muy cerca de decidir! Solo un paso más para hacer feliz a esa persona especial');
                this.pulseMainCTA();
            }
            
            // Detect rapid scrolling back to top (exit intent)
            if (scrollTop < lastScrollTop && scrollTop < 100) {
                if (scrollPercent > 50) { // Was deep in page
                    this.showUrgencyMessage('⬆️ ¿Subiendo para comparar precios? ¡Ya tienes el mejor precio aquí!');
                }
            }
            
            lastScrollTop = scrollTop;
        });
    }
    
    setupConversionAnalytics() {
        // Track conversion metrics
        const analytics = {
            timeOnPage: 0,
            clicksOnCTA: 0,
            hoverOnCTA: 0,
            scrollDepth: 0,
            exitAttempts: this.counters.exitAttempts,
            conversionTriggersSeen: 0
        };
        
        // Log analytics every 30 seconds
        setInterval(() => {
            analytics.timeOnPage = this.counters.timeOnPage;
            analytics.scrollDepth = Math.max(analytics.scrollDepth, this.counters.scrollProgress);
            
            console.log('🎯 Advanced Conversion Analytics:', analytics);
        }, 30000);
    }

    // ============================================
    // CLEANUP AND DESTRUCTION
    // ============================================
    
    destroy() {
        // Clear all timers
        Object.values(this.timers).forEach(timer => {
            if (timer) clearInterval(timer);
        });
        
        // Remove event listeners
        document.removeEventListener('mouseleave', this.handleMouseLeave);
        document.removeEventListener('scroll', this.handleScroll);
        
        // Remove created elements
        document.querySelectorAll('.urgency-notification, .stock-pressure-alert, .real-time-activity-feed, .advanced-price-anchoring, .dynamic-testimonials-flow').forEach(el => {
            el.remove();
        });
        
        console.log('🧹 Advanced Conversion Optimizer: Destroyed and cleaned up');
    }
}

// Initialize the Advanced Conversion Optimizer
let advancedConversionOptimizer;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        advancedConversionOptimizer = new AdvancedConversionOptimizer();
    });
} else {
    advancedConversionOptimizer = new AdvancedConversionOptimizer();
}

// Expose globally for debugging
window.advancedConversionOptimizer = advancedConversionOptimizer;