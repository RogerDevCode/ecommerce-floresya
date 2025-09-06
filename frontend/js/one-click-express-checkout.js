// One-Click Express Checkout System
// Optimized for maximum conversion with minimal friction

class OneClickExpressCheckout {
    constructor() {
        this.isProcessing = false;
        this.selectedProduct = null;
        this.expressOptions = {
            autoFillEnabled: true,
            quickPaymentMethods: ['pago-movil', 'zelle', 'transferencia'],
            skipConfirmation: false,
            enableLocationDetection: true
        };
        
        this.userPreferences = this.loadUserPreferences();
        this.checkoutFlow = [];
        
        this.init();
    }

    init() {
        console.log('⚡ One-Click Express Checkout: Initializing...');
        
        // Wait for other systems to load
        setTimeout(() => {
            this.enhanceFloresYaButton();
            this.preloadCheckoutAssets();
            this.detectUserLocation();
            this.setupSmartDefaults();
            this.initializePaymentMethods();
        }, 1000);
    }

    enhanceFloresYaButton() {
        const floresyaBtn = document.getElementById('floresya-btn');
        if (floresyaBtn) {
            // Remove existing onclick and add our enhanced version
            floresyaBtn.removeAttribute('onclick');
            floresyaBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.startExpressCheckout();
            });
            
            // Add express checkout indicator
            const expressIndicator = document.createElement('div');
            expressIndicator.className = 'express-checkout-indicator';
            expressIndicator.innerHTML = `
                <div class="express-badge">
                    <i class="bi bi-lightning-charge-fill"></i>
                    <span>EXPRESS</span>
                </div>
            `;
            
            // Add styles for express indicator
            if (!document.getElementById('express-indicator-styles')) {
                const style = document.createElement('style');
                style.id = 'express-indicator-styles';
                style.textContent = `
                    .express-checkout-indicator {
                        position: absolute;
                        top: -8px;
                        right: -8px;
                        z-index: 10;
                    }
                    
                    .express-badge {
                        background: linear-gradient(135deg, #ff4757, #ffa502);
                        color: white;
                        padding: 4px 8px;
                        border-radius: 12px;
                        font-size: 10px;
                        font-weight: 700;
                        display: flex;
                        align-items: center;
                        gap: 3px;
                        animation: expressBadgePulse 2s infinite;
                        box-shadow: 0 2px 8px rgba(255, 71, 87, 0.4);
                    }
                    
                    @keyframes expressBadgePulse {
                        0%, 100% { 
                            transform: scale(1);
                            box-shadow: 0 2px 8px rgba(255, 71, 87, 0.4);
                        }
                        50% { 
                            transform: scale(1.1);
                            box-shadow: 0 4px 16px rgba(255, 71, 87, 0.7);
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Make button position relative for absolute positioning of indicator
            floresyaBtn.style.position = 'relative';
            floresyaBtn.appendChild(expressIndicator);
        }
    }

    startExpressCheckout() {
        if (this.isProcessing) return;
        
        console.log('🚀 Starting Express Checkout...');
        
        // Get current product info
        this.selectedProduct = this.getCurrentProduct();
        
        // Show processing feedback immediately
        this.showProcessingFeedback();
        
        // Start the express flow
        this.showExpressCheckoutModal();
    }

    getCurrentProduct() {
        // Extract current product information from the page
        const productTitle = document.getElementById('product-title')?.textContent || 'Producto seleccionado';
        const productPrice = document.getElementById('price-usd')?.textContent?.replace('$', '') || '0';
        const productQuantity = document.getElementById('quantity')?.value || 1;
        const productImage = document.getElementById('main-image')?.src || '';
        
        // Get customization options
        const ribbonColor = document.querySelector('input[name="ribbon-color"]:checked')?.value || 'pink';
        const personalMessage = document.getElementById('personal-message')?.value || '';
        
        return {
            title: productTitle,
            price: parseFloat(productPrice),
            quantity: parseInt(productQuantity),
            image: productImage,
            customization: {
                ribbonColor,
                personalMessage
            },
            timestamp: Date.now()
        };
    }

    showProcessingFeedback() {
        const feedback = document.createElement('div');
        feedback.className = 'express-processing-feedback';
        feedback.innerHTML = `
            <div class="processing-content">
                <div class="processing-icon">
                    <i class="bi bi-lightning-charge-fill"></i>
                </div>
                <div class="processing-text">
                    <div class="processing-title">Iniciando Express Checkout...</div>
                    <div class="processing-subtitle">Preparando tu compra rápida</div>
                </div>
                <div class="processing-spinner"></div>
            </div>
        `;
        
        // Add processing feedback styles
        if (!document.getElementById('express-processing-styles')) {
            const style = document.createElement('style');
            style.id = 'express-processing-styles';
            style.textContent = `
                .express-processing-feedback {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    padding: 24px 32px;
                    border-radius: 16px;
                    z-index: 99999;
                    box-shadow: 0 20px 60px rgba(102, 126, 234, 0.4);
                    animation: processingFeedbackEntry 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                
                @keyframes processingFeedbackEntry {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
                
                .processing-content {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                
                .processing-icon {
                    font-size: 32px;
                    animation: processingIconSpin 1s linear infinite;
                }
                
                @keyframes processingIconSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .processing-text {
                    flex: 1;
                }
                
                .processing-title {
                    font-size: 16px;
                    font-weight: 700;
                    margin-bottom: 4px;
                }
                
                .processing-subtitle {
                    font-size: 13px;
                    opacity: 0.9;
                }
                
                .processing-spinner {
                    width: 24px;
                    height: 24px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: processingSpinnerSpin 0.8s linear infinite;
                }
                
                @keyframes processingSpinnerSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(feedback);
        
        // Remove after 2 seconds
        setTimeout(() => {
            feedback.remove();
        }, 2000);
    }

    showExpressCheckoutModal() {
        // Wait for processing feedback, then show modal
        setTimeout(() => {
            this.createExpressCheckoutModal();
        }, 2200);
    }

    createExpressCheckoutModal() {
        const modal = document.createElement('div');
        modal.className = 'express-checkout-modal';
        modal.innerHTML = `
            <div class="express-checkout-content">
                <!-- Header -->
                <div class="express-header">
                    <div class="express-header-content">
                        <div class="express-logo">
                            <i class="bi bi-lightning-charge-fill"></i>
                            <span>FloresYa Express</span>
                        </div>
                        <div class="express-promise">
                            <span class="promise-text">✅ Compra en menos de 60 segundos</span>
                        </div>
                    </div>
                    <button class="express-close" onclick="oneClickExpressCheckout.closeModal()">×</button>
                </div>

                <!-- Progress Bar -->
                <div class="express-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="express-progress-fill"></div>
                    </div>
                    <div class="progress-text">
                        <span id="progress-step">Paso 1 de 3</span>
                        <span id="progress-description">Confirmar producto</span>
                    </div>
                </div>

                <!-- Steps Container -->
                <div class="express-steps-container" id="express-steps">
                    <!-- Steps will be populated dynamically -->
                </div>

                <!-- Navigation -->
                <div class="express-navigation">
                    <button class="express-btn-secondary" id="express-back-btn" onclick="oneClickExpressCheckout.previousStep()" style="display: none;">
                        ← Anterior
                    </button>
                    <button class="express-btn-primary" id="express-next-btn" onclick="oneClickExpressCheckout.nextStep()">
                        Siguiente →
                    </button>
                </div>

                <!-- Security Footer -->
                <div class="express-security-footer">
                    <div class="security-badges">
                        <span class="security-badge">
                            <i class="bi bi-shield-lock-fill"></i>
                            <small>SSL Seguro</small>
                        </span>
                        <span class="security-badge">
                            <i class="bi bi-clock"></i>
                            <small>Express</small>
                        </span>
                        <span class="security-badge">
                            <i class="bi bi-heart-fill"></i>
                            <small>Garantizado</small>
                        </span>
                    </div>
                    <div class="express-timer">
                        <small>⏱️ Tiempo transcurrido: <span id="express-timer">00:00</span></small>
                    </div>
                </div>
            </div>
        `;

        // Add comprehensive modal styles
        if (!document.getElementById('express-checkout-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'express-checkout-modal-styles';
            style.textContent = `
                .express-checkout-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.85);
                    z-index: 999999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    animation: expressModalFadeIn 0.4s ease;
                }
                
                @keyframes expressModalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .express-checkout-content {
                    background: white;
                    border-radius: 20px;
                    width: 95%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow: hidden;
                    box-shadow: 0 25px 100px rgba(0, 0, 0, 0.5);
                    animation: expressModalSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                
                @keyframes expressModalSlideIn {
                    from {
                        transform: scale(0.8) translateY(-50px);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1) translateY(0);
                        opacity: 1;
                    }
                }
                
                .express-header {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    padding: 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: relative;
                }
                
                .express-header::before {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #ff4757, #ffa502, #2ed573, #1e90ff);
                    animation: expressHeaderGradient 3s linear infinite;
                    background-size: 200% 200%;
                }
                
                @keyframes expressHeaderGradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                
                .express-header-content {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .express-logo {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 20px;
                    font-weight: 700;
                }
                
                .express-logo i {
                    font-size: 24px;
                    animation: expressLogoSpin 3s linear infinite;
                }
                
                @keyframes expressLogoSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .promise-text {
                    font-size: 13px;
                    opacity: 0.9;
                    font-weight: 600;
                }
                
                .express-close {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    font-size: 20px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }
                
                .express-close:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.1);
                }
                
                .express-progress {
                    padding: 20px 24px;
                    border-bottom: 1px solid #f0f0f0;
                }
                
                .progress-bar {
                    width: 100%;
                    height: 6px;
                    background: #e2e8f0;
                    border-radius: 3px;
                    overflow: hidden;
                    margin-bottom: 12px;
                }
                
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #667eea, #764ba2);
                    border-radius: 3px;
                    transition: width 0.5s ease;
                    width: 33.33%;
                }
                
                .progress-text {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 14px;
                    color: #4a5568;
                }
                
                #progress-step {
                    font-weight: 600;
                    color: #667eea;
                }
                
                .express-steps-container {
                    padding: 24px;
                    min-height: 300px;
                    max-height: 400px;
                    overflow-y: auto;
                }
                
                .express-step {
                    display: none;
                    animation: expressStepFadeIn 0.4s ease;
                }
                
                .express-step.active {
                    display: block;
                }
                
                @keyframes expressStepFadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .express-navigation {
                    padding: 20px 24px;
                    border-top: 1px solid #f0f0f0;
                    display: flex;
                    justify-content: space-between;
                    gap: 16px;
                }
                
                .express-btn-primary {
                    flex: 1;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    border: none;
                    padding: 16px 24px;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .express-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
                }
                
                .express-btn-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .express-btn-secondary {
                    background: #f8f9fa;
                    color: #4a5568;
                    border: 1px solid #e2e8f0;
                    padding: 16px 24px;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .express-btn-secondary:hover {
                    background: #e2e8f0;
                }
                
                .express-security-footer {
                    background: #f8f9fa;
                    padding: 16px 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1px solid #e2e8f0;
                }
                
                .security-badges {
                    display: flex;
                    gap: 16px;
                }
                
                .security-badge {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    color: #4a5568;
                    font-weight: 600;
                }
                
                .security-badge i {
                    color: #10b981;
                }
                
                .express-timer {
                    font-size: 11px;
                    color: #666;
                }
                
                #express-timer {
                    font-weight: 600;
                    color: #667eea;
                }
                
                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .express-checkout-content {
                        width: 98%;
                        max-height: 95vh;
                    }
                    
                    .express-header {
                        padding: 20px;
                    }
                    
                    .express-logo {
                        font-size: 18px;
                    }
                    
                    .express-steps-container {
                        padding: 20px;
                        min-height: 250px;
                        max-height: 350px;
                    }
                    
                    .express-navigation {
                        flex-direction: column;
                    }
                    
                    .express-btn-primary,
                    .express-btn-secondary {
                        width: 100%;
                    }
                    
                    .security-badges {
                        flex-direction: column;
                        gap: 8px;
                    }
                    
                    .express-security-footer {
                        flex-direction: column;
                        gap: 12px;
                        text-align: center;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(modal);
        
        // Initialize the checkout flow
        this.initializeCheckoutFlow();
        this.startCheckoutTimer();
    }

    initializeCheckoutFlow() {
        this.currentStep = 0;
        this.checkoutFlow = [
            {
                title: 'Confirmar Producto',
                description: 'Verifica tu selección',
                component: 'productConfirmation'
            },
            {
                title: 'Información de Entrega',
                description: 'Datos de entrega express',
                component: 'deliveryInfo'
            },
            {
                title: 'Método de Pago',
                description: 'Pago rápido y seguro',
                component: 'paymentMethod'
            }
        ];
        
        this.renderCurrentStep();
    }

    renderCurrentStep() {
        const stepsContainer = document.getElementById('express-steps');
        const progressFill = document.getElementById('express-progress-fill');
        const progressStep = document.getElementById('progress-step');
        const progressDescription = document.getElementById('progress-description');
        
        if (!stepsContainer) return;
        
        const currentStepData = this.checkoutFlow[this.currentStep];
        const progressPercent = ((this.currentStep + 1) / this.checkoutFlow.length) * 100;
        
        // Update progress
        if (progressFill) progressFill.style.width = progressPercent + '%';
        if (progressStep) progressStep.textContent = `Paso ${this.currentStep + 1} de ${this.checkoutFlow.length}`;
        if (progressDescription) progressDescription.textContent = currentStepData.description;
        
        // Render step content
        stepsContainer.innerHTML = this.renderStepComponent(currentStepData.component);
        
        // Update navigation buttons
        this.updateNavigationButtons();
    }

    renderStepComponent(componentType) {
        switch (componentType) {
            case 'productConfirmation':
                return this.renderProductConfirmation();
            case 'deliveryInfo':
                return this.renderDeliveryInfo();
            case 'paymentMethod':
                return this.renderPaymentMethod();
            default:
                return '<div>Paso no encontrado</div>';
        }
    }

    renderProductConfirmation() {
        return `
            <div class="express-step active">
                <div class="step-header">
                    <h3>🌸 Confirma tu Producto</h3>
                    <p>Revisa los detalles de tu selección antes de continuar</p>
                </div>
                
                <div class="product-summary-card">
                    <div class="product-image">
                        <img src="${this.selectedProduct.image}" alt="${this.selectedProduct.title}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                    </div>
                    <div class="product-details">
                        <h4>${this.selectedProduct.title}</h4>
                        <div class="product-customization">
                            <span class="customization-item">
                                <i class="bi bi-palette"></i>
                                Cinta: ${this.selectedProduct.customization.ribbonColor}
                            </span>
                            ${this.selectedProduct.customization.personalMessage ? 
                                `<span class="customization-item">
                                    <i class="bi bi-card-text"></i>
                                    Con mensaje personalizado
                                </span>` : ''
                            }
                        </div>
                        <div class="product-pricing">
                            <span class="quantity">Cantidad: ${this.selectedProduct.quantity}</span>
                            <span class="price">$${(this.selectedProduct.price * this.selectedProduct.quantity).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="express-benefits">
                    <h4>✨ Beneficios Express</h4>
                    <div class="benefits-grid">
                        <div class="benefit-item">
                            <i class="bi bi-lightning-charge"></i>
                            <span>Entrega en 2-4 horas</span>
                        </div>
                        <div class="benefit-item">
                            <i class="bi bi-truck"></i>
                            <span>Envío GRATIS</span>
                        </div>
                        <div class="benefit-item">
                            <i class="bi bi-shield-check"></i>
                            <span>Frescura garantizada</span>
                        </div>
                        <div class="benefit-item">
                            <i class="bi bi-heart"></i>
                            <span>Satisfacción 100%</span>
                        </div>
                    </div>
                </div>
                
                <div class="express-urgency-banner">
                    <i class="bi bi-clock"></i>
                    <span><strong>¡Últimas ${3 + Math.floor(Math.random() * 5)} unidades!</strong> Otros clientes también están viendo este producto</span>
                </div>
            </div>
        `;
    }

    renderDeliveryInfo() {
        const savedAddress = this.userPreferences.address || {};
        
        return `
            <div class="express-step active">
                <div class="step-header">
                    <h3>🚚 Información de Entrega Express</h3>
                    <p>Datos necesarios para la entrega rápida</p>
                </div>
                
                <div class="delivery-form">
                    <div class="form-group">
                        <label for="recipient-name">Nombre del destinatario *</label>
                        <input type="text" 
                               id="recipient-name" 
                               class="express-input" 
                               placeholder="Ej: María García"
                               value="${savedAddress.name || ''}"
                               required>
                    </div>
                    
                    <div class="form-group">
                        <label for="recipient-phone">Teléfono de contacto *</label>
                        <input type="tel" 
                               id="recipient-phone" 
                               class="express-input" 
                               placeholder="Ej: 0412-123-4567"
                               value="${savedAddress.phone || ''}"
                               required>
                    </div>
                    
                    <div class="form-group">
                        <label for="delivery-address">Dirección completa *</label>
                        <textarea id="delivery-address" 
                                  class="express-textarea" 
                                  placeholder="Calle, número, edificio, piso, apartamento, urbanización..."
                                  required>${savedAddress.street || ''}</textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="delivery-city">Ciudad *</label>
                            <select id="delivery-city" class="express-select" required>
                                <option value="">Seleccionar ciudad</option>
                                <option value="caracas" ${savedAddress.city === 'caracas' ? 'selected' : ''}>Caracas</option>
                                <option value="valencia">Valencia</option>
                                <option value="maracaibo">Maracaibo</option>
                                <option value="barquisimeto">Barquisimeto</option>
                                <option value="maracay">Maracay</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="delivery-time">Hora preferida</label>
                            <select id="delivery-time" class="express-select">
                                <option value="any">Cualquier hora</option>
                                <option value="morning">Mañana (8am-12pm)</option>
                                <option value="afternoon">Tarde (12pm-6pm)</option>
                                <option value="evening">Noche (6pm-9pm)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="delivery-options">
                        <h4>🎯 Opciones de Entrega</h4>
                        <div class="option-cards">
                            <div class="option-card selected" data-option="express">
                                <div class="option-icon">⚡</div>
                                <div class="option-content">
                                    <div class="option-title">Express (2-4 horas)</div>
                                    <div class="option-subtitle">GRATIS - El más popular</div>
                                </div>
                                <div class="option-radio">
                                    <input type="radio" name="delivery-option" value="express" checked>
                                </div>
                            </div>
                            
                            <div class="option-card" data-option="scheduled">
                                <div class="option-icon">📅</div>
                                <div class="option-content">
                                    <div class="option-title">Programada</div>
                                    <div class="option-subtitle">Elige fecha y hora específica</div>
                                </div>
                                <div class="option-radio">
                                    <input type="radio" name="delivery-option" value="scheduled">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="smart-suggestions" id="address-suggestions">
                        <!-- Address suggestions will appear here -->
                    </div>
                </div>
            </div>
        `;
    }

    renderPaymentMethod() {
        return `
            <div class="express-step active">
                <div class="step-header">
                    <h3>💳 Método de Pago Express</h3>
                    <p>Pago rápido y 100% seguro</p>
                </div>
                
                <div class="payment-methods">
                    <div class="payment-method-card selected" data-method="pago-movil">
                        <div class="payment-icon">📱</div>
                        <div class="payment-content">
                            <div class="payment-title">Pago Móvil</div>
                            <div class="payment-subtitle">Transferencia instantánea</div>
                        </div>
                        <div class="payment-radio">
                            <input type="radio" name="payment-method" value="pago-movil" checked>
                        </div>
                    </div>
                    
                    <div class="payment-method-card" data-method="zelle">
                        <div class="payment-icon">💸</div>
                        <div class="payment-content">
                            <div class="payment-title">Zelle</div>
                            <div class="payment-subtitle">Pago en dólares</div>
                        </div>
                        <div class="payment-radio">
                            <input type="radio" name="payment-method" value="zelle">
                        </div>
                    </div>
                    
                    <div class="payment-method-card" data-method="transferencia">
                        <div class="payment-icon">🏦</div>
                        <div class="payment-content">
                            <div class="payment-title">Transferencia Bancaria</div>
                            <div class="payment-subtitle">Tradicional y confiable</div>
                        </div>
                        <div class="payment-radio">
                            <input type="radio" name="payment-method" value="transferencia">
                        </div>
                    </div>
                </div>
                
                <div class="order-summary">
                    <h4>📋 Resumen del Pedido</h4>
                    <div class="summary-details">
                        <div class="summary-row">
                            <span>Producto</span>
                            <span>$${this.selectedProduct.price.toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Cantidad (${this.selectedProduct.quantity})</span>
                            <span>$${(this.selectedProduct.price * this.selectedProduct.quantity).toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Envío Express</span>
                            <span class="free">GRATIS</span>
                        </div>
                        <div class="summary-row total">
                            <span><strong>Total a Pagar</strong></span>
                            <span class="total-amount"><strong>$${(this.selectedProduct.price * this.selectedProduct.quantity).toFixed(2)}</strong></span>
                        </div>
                    </div>
                </div>
                
                <div class="payment-security">
                    <div class="security-items">
                        <div class="security-item">
                            <i class="bi bi-shield-lock-fill"></i>
                            <span>Transacción SSL segura</span>
                        </div>
                        <div class="security-item">
                            <i class="bi bi-check-circle-fill"></i>
                            <span>Verificación automática</span>
                        </div>
                        <div class="security-item">
                            <i class="bi bi-clock-fill"></i>
                            <span>Confirmación inmediata</span>
                        </div>
                    </div>
                </div>
                
                <div class="express-final-cta">
                    <div class="cta-content">
                        <div class="cta-text">
                            <strong>🎉 ¡Todo listo para finalizar!</strong>
                            <small>Tu pedido será confirmado instantáneamente</small>
                        </div>
                        <div class="cta-time">
                            <small>⏱️ Entrega estimada: ${this.getEstimatedDeliveryTime()}</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getEstimatedDeliveryTime() {
        const now = new Date();
        const deliveryTime = new Date(now.getTime() + (3 * 60 * 60 * 1000)); // +3 hours
        return deliveryTime.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
        });
    }

    updateNavigationButtons() {
        const backBtn = document.getElementById('express-back-btn');
        const nextBtn = document.getElementById('express-next-btn');
        
        if (!backBtn || !nextBtn) return;
        
        // Show/hide back button
        if (this.currentStep === 0) {
            backBtn.style.display = 'none';
        } else {
            backBtn.style.display = 'block';
        }
        
        // Update next button text and functionality
        if (this.currentStep === this.checkoutFlow.length - 1) {
            nextBtn.textContent = '🚀 Finalizar Compra Express';
            nextBtn.className = 'express-btn-primary final-step';
        } else {
            nextBtn.textContent = 'Siguiente →';
            nextBtn.className = 'express-btn-primary';
        }
    }

    nextStep() {
        if (this.isProcessing) return;
        
        // Validate current step
        if (!this.validateCurrentStep()) {
            return;
        }
        
        if (this.currentStep < this.checkoutFlow.length - 1) {
            this.currentStep++;
            this.renderCurrentStep();
        } else {
            // Final step - process order
            this.processExpressOrder();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.renderCurrentStep();
        }
    }

    validateCurrentStep() {
        switch (this.currentStep) {
            case 0: // Product confirmation
                return true; // Always valid
            case 1: // Delivery info
                return this.validateDeliveryInfo();
            case 2: // Payment method
                return this.validatePaymentMethod();
            default:
                return false;
        }
    }

    validateDeliveryInfo() {
        const name = document.getElementById('recipient-name')?.value?.trim();
        const phone = document.getElementById('recipient-phone')?.value?.trim();
        const address = document.getElementById('delivery-address')?.value?.trim();
        const city = document.getElementById('delivery-city')?.value;
        
        if (!name || !phone || !address || !city) {
            this.showValidationError('Por favor completa todos los campos obligatorios');
            return false;
        }
        
        return true;
    }

    validatePaymentMethod() {
        const selectedMethod = document.querySelector('input[name="payment-method"]:checked');
        
        if (!selectedMethod) {
            this.showValidationError('Por favor selecciona un método de pago');
            return false;
        }
        
        return true;
    }

    showValidationError(message) {
        // Show validation error notification
        this.showNotification(message, 'error');
        
        // Add shake animation to modal
        const modal = document.querySelector('.express-checkout-content');
        if (modal) {
            modal.style.animation = 'expressShake 0.5s ease-in-out';
            setTimeout(() => {
                modal.style.animation = '';
            }, 500);
        }
        
        // Add shake animation styles
        if (!document.getElementById('express-shake-styles')) {
            const style = document.createElement('style');
            style.id = 'express-shake-styles';
            style.textContent = `
                @keyframes expressShake {
                    0%, 100% { transform: scale(1) translateX(0); }
                    25% { transform: scale(1) translateX(-5px); }
                    75% { transform: scale(1) translateX(5px); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    async processExpressOrder() {
        this.isProcessing = true;
        
        // Show processing state
        const nextBtn = document.getElementById('express-next-btn');
        if (nextBtn) {
            nextBtn.textContent = '🔄 Procesando...';
            nextBtn.disabled = true;
        }
        
        try {
            // Collect all order data
            const orderData = this.collectOrderData();
            
            // Simulate API call
            await this.submitOrder(orderData);
            
            // Show success
            this.showOrderSuccess();
            
        } catch (error) {
            console.error('Error processing express order:', error);
            this.showOrderError();
        } finally {
            this.isProcessing = false;
            if (nextBtn) {
                nextBtn.disabled = false;
            }
        }
    }

    collectOrderData() {
        const deliveryInfo = {
            recipientName: document.getElementById('recipient-name')?.value?.trim(),
            phone: document.getElementById('recipient-phone')?.value?.trim(),
            address: document.getElementById('delivery-address')?.value?.trim(),
            city: document.getElementById('delivery-city')?.value,
            deliveryTime: document.getElementById('delivery-time')?.value,
            deliveryOption: document.querySelector('input[name="delivery-option"]:checked')?.value
        };
        
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;
        
        return {
            product: this.selectedProduct,
            delivery: deliveryInfo,
            payment: {
                method: paymentMethod,
                amount: this.selectedProduct.price * this.selectedProduct.quantity
            },
            orderType: 'express',
            timestamp: Date.now()
        };
    }

    async submitOrder(orderData) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('📦 Express Order Submitted:', orderData);
        
        // Save user preferences for next time
        this.saveUserPreferences({
            address: orderData.delivery,
            paymentMethod: orderData.payment.method
        });
        
        // Here you would normally send to your API
        // const response = await fetch('/api/orders/express', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(orderData)
        // });
        
        // return response.json();
        
        // For now, simulate success
        return { success: true, orderId: 'FY-' + Date.now() };
    }

    showOrderSuccess() {
        const modal = document.querySelector('.express-checkout-modal');
        if (modal) {
            modal.innerHTML = `
                <div class="express-checkout-content">
                    <div class="success-header">
                        <div class="success-icon">🎉</div>
                        <h2>¡Pedido Express Confirmado!</h2>
                        <p>Tu compra fue procesada exitosamente</p>
                    </div>
                    
                    <div class="success-details">
                        <div class="success-item">
                            <i class="bi bi-check-circle-fill"></i>
                            <span>Pedido confirmado instantáneamente</span>
                        </div>
                        <div class="success-item">
                            <i class="bi bi-truck"></i>
                            <span>Entrega express programada</span>
                        </div>
                        <div class="success-item">
                            <i class="bi bi-clock"></i>
                            <span>Llegará en 2-4 horas aproximadamente</span>
                        </div>
                        <div class="success-item">
                            <i class="bi bi-phone"></i>
                            <span>Te contactaremos para coordinar entrega</span>
                        </div>
                    </div>
                    
                    <div class="success-actions">
                        <button class="success-btn-primary" onclick="oneClickExpressCheckout.closeModal()">
                            ✅ ¡Perfecto!
                        </button>
                        <button class="success-btn-secondary" onclick="oneClickExpressCheckout.viewOrderStatus()">
                            📋 Ver Estado del Pedido
                        </button>
                    </div>
                    
                    <div class="success-footer">
                        <p>🏆 <strong>¡Gracias por elegir FloresYa Express!</strong></p>
                        <small>Recibirás una confirmación por WhatsApp y email</small>
                    </div>
                </div>
            `;
            
            // Add confetti effect
            this.showConfetti();
        }
    }

    showOrderError() {
        this.showNotification('❌ Error al procesar el pedido. Por favor intenta nuevamente.', 'error');
        
        const nextBtn = document.getElementById('express-next-btn');
        if (nextBtn) {
            nextBtn.textContent = '🔄 Reintentar';
        }
    }

    showConfetti() {
        // Simple confetti effect
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: hsl(${Math.random() * 360}, 70%, 60%);
                left: ${Math.random() * 100}vw;
                top: -10px;
                z-index: 9999999;
                animation: confettiFall ${2 + Math.random() * 3}s linear forwards;
            `;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 5000);
        }
        
        // Add confetti animation
        if (!document.getElementById('confetti-styles')) {
            const style = document.createElement('style');
            style.id = 'confetti-styles';
            style.textContent = `
                @keyframes confettiFall {
                    to {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    closeModal() {
        const modal = document.querySelector('.express-checkout-modal');
        if (modal) {
            modal.style.animation = 'expressModalFadeOut 0.3s ease';
            setTimeout(() => modal.remove(), 300);
        }
        
        // Add fade out animation
        if (!document.getElementById('express-fadeout-styles')) {
            const style = document.createElement('style');
            style.id = 'express-fadeout-styles';
            style.textContent = `
                @keyframes expressModalFadeOut {
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    viewOrderStatus() {
        // Redirect to order status page
        window.location.href = '/pages/order-status.html';
    }

    startCheckoutTimer() {
        const startTime = Date.now();
        
        const updateTimer = () => {
            const elapsed = Date.now() - startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            const timerEl = document.getElementById('express-timer');
            if (timerEl) {
                timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        };
        
        updateTimer();
        this.timerInterval = setInterval(updateTimer, 1000);
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('floresya-express-preferences');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            return {};
        }
    }

    saveUserPreferences(preferences) {
        try {
            localStorage.setItem('floresya-express-preferences', JSON.stringify(preferences));
        } catch (error) {
            console.warn('Could not save user preferences:', error);
        }
    }

    preloadCheckoutAssets() {
        // Preload any assets needed for checkout
        console.log('📦 Preloading express checkout assets...');
    }

    detectUserLocation() {
        // Optional: detect user location for better defaults
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('📍 Location detected:', position.coords);
                    // Use location to suggest delivery options
                },
                (error) => {
                    console.log('📍 Location detection declined or failed');
                }
            );
        }
    }

    setupSmartDefaults() {
        // Setup intelligent defaults based on user history
        console.log('🧠 Setting up smart defaults...');
    }

    initializePaymentMethods() {
        // Initialize payment method handlers
        console.log('💳 Initializing payment methods...');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `express-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add notification styles if needed
        if (!document.getElementById('express-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'express-notification-styles';
            style.textContent = `
                .express-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 999999;
                    padding: 16px 20px;
                    border-radius: 8px;
                    color: white;
                    font-weight: 600;
                    max-width: 400px;
                    animation: expressNotificationIn 0.3s ease;
                }
                
                .express-notification.success {
                    background: linear-gradient(135deg, #10b981, #047857);
                }
                
                .express-notification.error {
                    background: linear-gradient(135deg, #dc2626, #b91c1c);
                }
                
                .express-notification.info {
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                }
                
                @keyframes expressNotificationIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                .notification-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                }
                
                .notification-content button {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    cursor: pointer;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 5000);
    }
}

// Initialize One-Click Express Checkout
let oneClickExpressCheckout;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        oneClickExpressCheckout = new OneClickExpressCheckout();
    });
} else {
    oneClickExpressCheckout = new OneClickExpressCheckout();
}

// Global exposure
window.oneClickExpressCheckout = oneClickExpressCheckout;