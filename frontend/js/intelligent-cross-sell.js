// Intelligent Cross-Sell Recommendations System
// Advanced product recommendation engine with AI-like behavior

class IntelligentCrossSell {
    constructor() {
        this.recommendations = [];
        this.currentProduct = null;
        this.crossSellProducts = [
            {
                id: 1,
                name: "Chocolates Premium Artesanales",
                image: "/images/products/chocolates-premium.jpg",
                price: 15.00,
                originalPrice: 22.00,
                category: "complementos",
                matchScore: 95,
                reasons: ["Complemento perfecto", "Combo romántico", "Más pedido junto"],
                discount: 32,
                tags: ["premium", "artesanal", "romántico"],
                urgency: "Solo quedan 8 unidades",
                socialProof: "127 personas lo compraron con flores esta semana"
            },
            {
                id: 2,
                name: "Globo Corazón Gigante Metalizado",
                image: "/images/products/globo-corazon.jpg",
                price: 8.00,
                originalPrice: 12.00,
                category: "decoracion",
                matchScore: 88,
                reasons: ["Hace el regalo más especial", "Muy popular", "Foto perfecta"],
                discount: 33,
                tags: ["romántico", "llamativo", "redes sociales"],
                urgency: "¡Oferta por tiempo limitado!",
                socialProof: "El 89% lo califica como 'increíble'"
            },
            {
                id: 3,
                name: "Tarjeta Personalizada de Lujo",
                image: "/images/products/tarjeta-lujo.jpg",
                price: 5.00,
                originalPrice: 8.00,
                category: "personalización",
                matchScore: 82,
                reasons: ["Mensaje personalizado", "Toque elegante", "Recuerdo duradero"],
                discount: 38,
                tags: ["personalizado", "elegante", "premium"],
                urgency: "Personalización gratis hoy",
                socialProof: "4.9/5 estrellas en personalización"
            },
            {
                id: 4,
                name: "Vela Aromática Relajante",
                image: "/images/products/vela-aromatica.jpg",
                price: 12.00,
                originalPrice: 18.00,
                category: "ambiente",
                matchScore: 76,
                reasons: ["Ambiente romántico", "Aroma duradero", "Regalo completo"],
                discount: 33,
                tags: ["romántico", "relajante", "aromático"],
                urgency: "Edición limitada",
                socialProof: "Aroma favorito del 92% de clientes"
            },
            {
                id: 5,
                name: "Mini Peluche Osito Abrazo",
                image: "/images/products/osito-abrazo.jpg",
                price: 18.00,
                originalPrice: 25.00,
                category: "peluches",
                matchScore: 71,
                reasons: ["Súper tierno", "Abrazo eterno", "Combinación adorable"],
                discount: 28,
                tags: ["tierno", "abrazo", "adorable"],
                urgency: "Diseño exclusivo",
                socialProof: "El regalo más tierno según nuestras clientas"
            },
            {
                id: 6,
                name: "Botella de Vino Personalizada",
                image: "/images/products/vino-personalizado.jpg",
                price: 45.00,
                originalPrice: 65.00,
                category: "bebidas",
                matchScore: 68,
                reasons: ["Celebración especial", "Personalizado", "Momento único"],
                discount: 31,
                tags: ["celebración", "personalizado", "premium"],
                urgency: "Solo para mayores de edad",
                socialProof: "El toque perfecto para ocasiones especiales"
            }
        ];
        
        this.bundles = [
            {
                id: "romantic",
                name: "🌹💝 Pack Romántico Completo",
                description: "Todo lo que necesitas para sorprender",
                products: [1, 2, 3], // chocolates, globo, tarjeta
                originalPrice: 35.00,
                bundlePrice: 25.00,
                savings: 10.00,
                popularity: 94,
                urgency: "¡El más pedido esta semana!"
            },
            {
                id: "premium",
                name: "✨🎁 Experiencia Premium",
                description: "El regalo más completo y elegante",
                products: [1, 3, 4], // chocolates, tarjeta, vela
                originalPrice: 40.00,
                bundlePrice: 28.00,
                savings: 12.00,
                popularity: 87,
                urgency: "Solo 5 packs disponibles hoy"
            },
            {
                id: "celebration",
                name: "🎉🥂 Celebración Especial",
                description: "Para momentos que merecen ser celebrados",
                products: [1, 6, 2], // chocolates, vino, globo
                originalPrice: 68.00,
                bundlePrice: 55.00,
                savings: 13.00,
                popularity: 78,
                urgency: "Edición limitada"
            }
        ];
        
        this.init();
    }

    init() {
        console.log('🎯 Intelligent Cross-Sell: Initializing recommendation engine...');
        
        // Wait for DOM and existing scripts
        setTimeout(() => {
            this.createCrossSellSection();
            this.startIntelligentRecommendations();
            this.setupBehaviorTracking();
        }, 2000);
    }

    createCrossSellSection() {
        // Create main cross-sell container
        const crossSellContainer = document.createElement('div');
        crossSellContainer.className = 'intelligent-cross-sell-container';
        crossSellContainer.innerHTML = `
            <div class="cross-sell-header">
                <div class="header-content">
                    <h3><i class="bi bi-lightbulb"></i> Recomendaciones Inteligentes Para Ti</h3>
                    <div class="ai-badge">
                        <span class="ai-icon">🤖</span>
                        <span class="ai-text">IA Personalizada</span>
                    </div>
                </div>
                <div class="header-stats">
                    <span class="stat-item">
                        <i class="bi bi-graph-up"></i>
                        <span>95% de satisfacción</span>
                    </span>
                    <span class="stat-item">
                        <i class="bi bi-heart-fill"></i>
                        <span>+2,847 combos vendidos</span>
                    </span>
                </div>
            </div>

            <!-- Smart Bundle Recommendations -->
            <div class="smart-bundles-section">
                <h4>🎁 Combos Inteligentes - Ahorra Más</h4>
                <div class="bundles-grid" id="bundles-grid">
                    <!-- Bundles will be populated here -->
                </div>
            </div>

            <!-- Individual Product Recommendations -->
            <div class="individual-recommendations-section">
                <h4>💡 Productos Que Te Pueden Gustar</h4>
                <div class="recommendations-carousel" id="recommendations-carousel">
                    <!-- Individual recommendations will be populated here -->
                </div>
            </div>

            <!-- Smart Shopping Assistant -->
            <div class="smart-shopping-assistant">
                <div class="assistant-avatar">🛍️</div>
                <div class="assistant-content">
                    <div class="assistant-message" id="assistant-message">
                        ¡Hola! Basándome en tu selección, creo que estos productos te encantarán. 
                        <strong>¡Ahorra hasta 40% comprando en combo!</strong>
                    </div>
                    <div class="assistant-actions">
                        <button class="assistant-btn" onclick="intelligentCrossSell.showPersonalizedRecommendations()">
                            Ver recomendaciones personalizadas
                        </button>
                    </div>
                </div>
            </div>

            <!-- Social Proof Section -->
            <div class="cross-sell-social-proof">
                <div class="social-proof-header">
                    <i class="bi bi-people-fill"></i>
                    <span>Lo que están comprando otros clientes</span>
                </div>
                <div class="social-proof-items" id="social-proof-items">
                    <!-- Social proof will be populated -->
                </div>
            </div>

            <!-- Urgency & Scarcity for Cross-sell -->
            <div class="cross-sell-urgency">
                <div class="urgency-content">
                    <div class="urgency-icon">⚡</div>
                    <div class="urgency-text">
                        <strong>¡Oferta especial activa!</strong>
                        <small>Los próximos 10 clientes que compren combo obtienen envío express gratis</small>
                    </div>
                </div>
                <div class="urgency-timer">
                    <span id="cross-sell-timer">12:45</span>
                </div>
            </div>
        `;

        // Add comprehensive cross-sell styles
        if (!document.getElementById('intelligent-cross-sell-styles')) {
            const style = document.createElement('style');
            style.id = 'intelligent-cross-sell-styles';
            style.textContent = `
                .intelligent-cross-sell-container {
                    margin: 40px 0;
                    padding: 32px;
                    background: linear-gradient(135deg, #f8f9ff, #fff8f0);
                    border-radius: 20px;
                    border: 2px solid #e3f2fd;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
                    position: relative;
                    overflow: hidden;
                }

                .intelligent-cross-sell-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 4px;
                    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
                    background-size: 300% 300%;
                    animation: crossSellGradient 3s ease infinite;
                }

                @keyframes crossSellGradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                .cross-sell-header {
                    margin-bottom: 24px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #e0e7ff;
                }

                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .cross-sell-header h3 {
                    color: #1a365d;
                    font-size: 22px;
                    font-weight: 700;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .ai-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    animation: aiBadgePulse 3s infinite;
                }

                @keyframes aiBadgePulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); }
                    50% { transform: scale(1.05); box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5); }
                }

                .ai-icon {
                    font-size: 14px;
                    animation: aiIconSpin 4s linear infinite;
                }

                @keyframes aiIconSpin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .header-stats {
                    display: flex;
                    gap: 20px;
                    align-items: center;
                }

                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    color: #4a5568;
                    font-weight: 600;
                }

                .stat-item i {
                    color: #667eea;
                }

                /* Smart Bundles Section */
                .smart-bundles-section {
                    margin-bottom: 32px;
                }

                .smart-bundles-section h4 {
                    color: #2d3748;
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .bundles-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                    gap: 20px;
                }

                .bundle-card {
                    background: white;
                    border-radius: 16px;
                    padding: 24px;
                    border: 2px solid #e2e8f0;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                }

                .bundle-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 15px 50px rgba(102, 126, 234, 0.2);
                    border-color: #667eea;
                }

                .bundle-card.popular::before {
                    content: '🏆 MÁS POPULAR';
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: linear-gradient(135deg, #f093fb, #f5576c);
                    color: white;
                    padding: 6px 16px;
                    font-size: 10px;
                    font-weight: 700;
                    transform: rotate(12deg) translate(25%, -50%);
                    border-radius: 4px;
                }

                .bundle-header {
                    margin-bottom: 16px;
                }

                .bundle-name {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1a365d;
                    margin-bottom: 4px;
                }

                .bundle-description {
                    font-size: 14px;
                    color: #4a5568;
                    margin-bottom: 12px;
                }

                .bundle-popularity {
                    display: inline-block;
                    background: #e6fffa;
                    color: #047857;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                }

                .bundle-products {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 16px;
                    flex-wrap: wrap;
                }

                .bundle-product-mini {
                    flex: 1;
                    min-width: 60px;
                    height: 60px;
                    background: #f7fafc;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    position: relative;
                    overflow: hidden;
                }

                .bundle-product-mini::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(45deg, rgba(102, 126, 234, 0.1), rgba(240, 147, 251, 0.1));
                }

                .bundle-pricing {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .bundle-prices {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .bundle-original-price {
                    font-size: 14px;
                    color: #a0aec0;
                    text-decoration: line-through;
                }

                .bundle-current-price {
                    font-size: 20px;
                    font-weight: 700;
                    color: #047857;
                }

                .bundle-savings {
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 700;
                    text-align: center;
                }

                .bundle-urgency {
                    font-size: 12px;
                    color: #dc2626;
                    font-weight: 600;
                    margin-bottom: 12px;
                    animation: bundleUrgencyPulse 2s infinite;
                }

                @keyframes bundleUrgencyPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }

                .bundle-action {
                    width: 100%;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    border: none;
                    padding: 14px;
                    border-radius: 10px;
                    font-weight: 700;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .bundle-action:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
                }

                /* Individual Recommendations */
                .individual-recommendations-section {
                    margin-bottom: 32px;
                }

                .individual-recommendations-section h4 {
                    color: #2d3748;
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 16px;
                }

                .recommendations-carousel {
                    display: flex;
                    gap: 16px;
                    overflow-x: auto;
                    padding: 8px;
                    scroll-behavior: smooth;
                }

                .recommendations-carousel::-webkit-scrollbar {
                    height: 6px;
                }

                .recommendations-carousel::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 3px;
                }

                .recommendations-carousel::-webkit-scrollbar-thumb {
                    background: #667eea;
                    border-radius: 3px;
                }

                .recommendation-card {
                    flex: 0 0 280px;
                    background: white;
                    border-radius: 12px;
                    padding: 16px;
                    border: 1px solid #e2e8f0;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                }

                .recommendation-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border-color: #667eea;
                }

                .recommendation-card.featured::before {
                    content: '⭐ RECOMENDADO';
                    position: absolute;
                    top: 8px;
                    right: -30px;
                    background: linear-gradient(135deg, #f093fb, #f5576c);
                    color: white;
                    padding: 4px 40px;
                    font-size: 9px;
                    font-weight: 700;
                    transform: rotate(45deg);
                }

                .recommendation-image {
                    width: 100%;
                    height: 120px;
                    background: #f7fafc;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 48px;
                    margin-bottom: 12px;
                    position: relative;
                    overflow: hidden;
                }

                .recommendation-image::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(45deg, rgba(102, 126, 234, 0.05), rgba(240, 147, 251, 0.05));
                }

                .recommendation-content {
                    flex: 1;
                }

                .recommendation-name {
                    font-size: 14px;
                    font-weight: 700;
                    color: #1a365d;
                    margin-bottom: 8px;
                    line-height: 1.3;
                }

                .recommendation-reasons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px;
                    margin-bottom: 8px;
                }

                .reason-tag {
                    background: #e6fffa;
                    color: #047857;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 600;
                }

                .recommendation-pricing {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .recommendation-price {
                    font-size: 16px;
                    font-weight: 700;
                    color: #047857;
                }

                .recommendation-original-price {
                    font-size: 12px;
                    color: #a0aec0;
                    text-decoration: line-through;
                    margin-left: 8px;
                }

                .recommendation-discount {
                    background: #dc2626;
                    color: white;
                    padding: 4px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 700;
                }

                .recommendation-social-proof {
                    font-size: 11px;
                    color: #4a5568;
                    margin-bottom: 8px;
                    font-style: italic;
                }

                .recommendation-urgency {
                    font-size: 11px;
                    color: #dc2626;
                    font-weight: 600;
                    margin-bottom: 12px;
                    animation: recommendationUrgency 3s infinite;
                }

                @keyframes recommendationUrgency {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }

                .recommendation-action {
                    width: 100%;
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                    border: none;
                    padding: 10px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .recommendation-action:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
                }

                /* Smart Shopping Assistant */
                .smart-shopping-assistant {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 24px;
                    display: flex;
                    gap: 16px;
                    align-items: center;
                    color: white;
                    position: relative;
                    overflow: hidden;
                }

                .smart-shopping-assistant::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
                    animation: assistantShine 3s infinite;
                }

                @keyframes assistantShine {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }

                .assistant-avatar {
                    font-size: 48px;
                    animation: assistantBob 2s ease-in-out infinite;
                }

                @keyframes assistantBob {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }

                .assistant-content {
                    flex: 1;
                }

                .assistant-message {
                    font-size: 16px;
                    line-height: 1.5;
                    margin-bottom: 12px;
                    font-weight: 500;
                }

                .assistant-btn {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    padding: 10px 16px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 14px;
                }

                .assistant-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: translateY(-2px);
                }

                /* Cross-sell Social Proof */
                .cross-sell-social-proof {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid #e2e8f0;
                    margin-bottom: 24px;
                }

                .social-proof-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 700;
                    color: #1a365d;
                    margin-bottom: 16px;
                    font-size: 16px;
                }

                .social-proof-items {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 12px;
                }

                .social-proof-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px;
                    background: #f8fafc;
                    border-radius: 8px;
                    font-size: 13px;
                    color: #4a5568;
                }

                .social-proof-icon {
                    font-size: 16px;
                }

                /* Cross-sell Urgency */
                .cross-sell-urgency {
                    background: linear-gradient(135deg, #f093fb, #f5576c);
                    color: white;
                    padding: 20px;
                    border-radius: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    animation: crossSellUrgencyPulse 3s infinite;
                }

                @keyframes crossSellUrgencyPulse {
                    0%, 100% { 
                        box-shadow: 0 8px 32px rgba(240, 147, 251, 0.3);
                        transform: scale(1);
                    }
                    50% { 
                        box-shadow: 0 12px 48px rgba(240, 147, 251, 0.5);
                        transform: scale(1.01);
                    }
                }

                .urgency-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .urgency-icon {
                    font-size: 32px;
                    animation: urgencyIconSpin 4s linear infinite;
                }

                @keyframes urgencyIconSpin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .urgency-text strong {
                    display: block;
                    font-size: 16px;
                    margin-bottom: 4px;
                }

                .urgency-text small {
                    font-size: 13px;
                    opacity: 0.9;
                }

                .urgency-timer {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 12px 16px;
                    border-radius: 8px;
                    font-size: 20px;
                    font-weight: 700;
                    font-family: 'Courier New', monospace;
                    animation: timerBlink 1s infinite;
                }

                @keyframes timerBlink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0.8; }
                }

                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .intelligent-cross-sell-container {
                        padding: 20px;
                        margin: 20px 0;
                    }

                    .header-content {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 12px;
                    }

                    .header-stats {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 8px;
                    }

                    .bundles-grid {
                        grid-template-columns: 1fr;
                    }

                    .recommendations-carousel {
                        gap: 12px;
                    }

                    .recommendation-card {
                        flex: 0 0 260px;
                    }

                    .smart-shopping-assistant {
                        flex-direction: column;
                        text-align: center;
                        gap: 12px;
                    }

                    .cross-sell-urgency {
                        flex-direction: column;
                        gap: 16px;
                        text-align: center;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Insert into the page
        const productContent = document.getElementById('product-content');
        if (productContent) {
            productContent.parentNode.insertBefore(crossSellContainer, productContent.nextSibling);
        }

        // Populate content
        this.populateBundles();
        this.populateRecommendations();
        this.populateSocialProof();
        this.startCrossSellTimer();
    }

    populateBundles() {
        const bundlesGrid = document.getElementById('bundles-grid');
        if (!bundlesGrid) return;

        // Sort bundles by popularity
        const sortedBundles = this.bundles.sort((a, b) => b.popularity - a.popularity);

        bundlesGrid.innerHTML = sortedBundles.map((bundle, index) => `
            <div class="bundle-card ${index === 0 ? 'popular' : ''}" onclick="intelligentCrossSell.selectBundle('${bundle.id}')">
                <div class="bundle-header">
                    <div class="bundle-name">${bundle.name}</div>
                    <div class="bundle-description">${bundle.description}</div>
                    <div class="bundle-popularity">${bundle.popularity}% de clientes lo califican como "perfecto"</div>
                </div>
                
                <div class="bundle-products">
                    ${bundle.products.map(productId => {
                        const product = this.crossSellProducts.find(p => p.id === productId);
                        return `<div class="bundle-product-mini" title="${product?.name}">${this.getProductEmoji(product?.category)}</div>`;
                    }).join('')}
                </div>
                
                <div class="bundle-pricing">
                    <div class="bundle-prices">
                        <div class="bundle-original-price">$${bundle.originalPrice.toFixed(2)}</div>
                        <div class="bundle-current-price">$${bundle.bundlePrice.toFixed(2)}</div>
                    </div>
                    <div class="bundle-savings">
                        ¡Ahorras<br>$${bundle.savings.toFixed(2)}!
                    </div>
                </div>
                
                <div class="bundle-urgency">${bundle.urgency}</div>
                
                <button class="bundle-action" onclick="intelligentCrossSell.addBundleToCart('${bundle.id}')">
                    🛒 Agregar Combo Completo
                </button>
            </div>
        `).join('');
    }

    populateRecommendations() {
        const carousel = document.getElementById('recommendations-carousel');
        if (!carousel) return;

        // Sort recommendations by match score
        const sortedRecommendations = this.crossSellProducts
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 6); // Show top 6

        carousel.innerHTML = sortedRecommendations.map((product, index) => `
            <div class="recommendation-card ${index === 0 ? 'featured' : ''}" onclick="intelligentCrossSell.viewProduct(${product.id})">
                <div class="recommendation-image">${this.getProductEmoji(product.category)}</div>
                
                <div class="recommendation-content">
                    <div class="recommendation-name">${product.name}</div>
                    
                    <div class="recommendation-reasons">
                        ${product.reasons.slice(0, 2).map(reason => 
                            `<span class="reason-tag">${reason}</span>`
                        ).join('')}
                    </div>
                    
                    <div class="recommendation-pricing">
                        <div>
                            <span class="recommendation-price">$${product.price.toFixed(2)}</span>
                            <span class="recommendation-original-price">$${product.originalPrice.toFixed(2)}</span>
                        </div>
                        <div class="recommendation-discount">-${product.discount}%</div>
                    </div>
                    
                    <div class="recommendation-social-proof">${product.socialProof}</div>
                    <div class="recommendation-urgency">${product.urgency}</div>
                    
                    <button class="recommendation-action" onclick="intelligentCrossSell.addToCart(${product.id})">
                        ➕ Agregar al Carrito
                    </button>
                </div>
            </div>
        `).join('');
    }

    populateSocialProof() {
        const socialProofItems = document.getElementById('social-proof-items');
        if (!socialProofItems) return;

        const proofItems = [
            { icon: '🔥', text: '89% compran chocolates con flores' },
            { icon: '💝', text: 'Globos aumentan satisfacción en 94%' },
            { icon: '✨', text: 'Tarjeta personalizada: lo más valorado' },
            { icon: '🎯', text: 'Combos completos = mayor impacto' }
        ];

        socialProofItems.innerHTML = proofItems.map(item => `
            <div class="social-proof-item">
                <span class="social-proof-icon">${item.icon}</span>
                <span>${item.text}</span>
            </div>
        `).join('');
    }

    getProductEmoji(category) {
        const emojis = {
            'complementos': '🍫',
            'decoracion': '🎈',
            'personalización': '💌',
            'ambiente': '🕯️',
            'peluches': '🧸',
            'bebidas': '🍷'
        };
        return emojis[category] || '🎁';
    }

    startCrossSellTimer() {
        let timeLeft = 12 * 60 + 45; // 12:45

        const timer = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            
            const timerEl = document.getElementById('cross-sell-timer');
            if (timerEl) {
                timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }

            timeLeft--;

            if (timeLeft < 0) {
                timeLeft = 15 * 60; // Reset to 15 minutes
                this.showTimerResetMessage();
            }
        }, 1000);
    }

    showTimerResetMessage() {
        // Show notification when timer resets
        this.showNotification('🎉 ¡Nueva ronda de ofertas especiales activada!', 'success');
    }

    // ============================================
    // INTERACTION METHODS
    // ============================================

    selectBundle(bundleId) {
        const bundle = this.bundles.find(b => b.id === bundleId);
        if (bundle) {
            console.log(`🎁 Bundle selected: ${bundle.name}`);
            
            // Show bundle details modal or expand view
            this.showBundleDetails(bundle);
            
            // Track analytics
            this.trackInteraction('bundle_viewed', { bundleId, bundleName: bundle.name });
        }
    }

    showBundleDetails(bundle) {
        // Create detailed view modal
        const modal = document.createElement('div');
        modal.className = 'bundle-details-modal';
        modal.innerHTML = `
            <div class="bundle-details-content">
                <div class="bundle-details-header">
                    <h3>${bundle.name}</h3>
                    <button class="close-bundle-details" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="bundle-details-body">
                    <div class="bundle-complete-description">
                        <p>${bundle.description}</p>
                        <div class="bundle-includes">
                            <h4>🎁 Este combo incluye:</h4>
                            <div class="bundle-product-list">
                                ${bundle.products.map(productId => {
                                    const product = this.crossSellProducts.find(p => p.id === productId);
                                    return `
                                        <div class="bundle-product-item">
                                            <span class="product-emoji">${this.getProductEmoji(product?.category)}</span>
                                            <div class="product-details">
                                                <div class="product-name">${product?.name}</div>
                                                <div class="product-value">Valor individual: $${product?.originalPrice.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                        
                        <div class="bundle-value-proposition">
                            <div class="value-row">
                                <span>Precio individual total:</span>
                                <span class="original-total">$${bundle.originalPrice.toFixed(2)}</span>
                            </div>
                            <div class="value-row bundle-price-row">
                                <span>Precio del combo:</span>
                                <span class="bundle-total">$${bundle.bundlePrice.toFixed(2)}</span>
                            </div>
                            <div class="value-row savings-row">
                                <span>Tu ahorro:</span>
                                <span class="savings-amount">$${bundle.savings.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <div class="bundle-benefits">
                            <h4>✨ Beneficios adicionales:</h4>
                            <ul>
                                <li>🚚 Envío gratis para todo el combo</li>
                                <li>🎀 Empaque especial sin costo adicional</li>
                                <li>💝 Tarjeta de felicitación personalizada gratis</li>
                                <li>⚡ Proceso de entrega optimizado</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="bundle-details-actions">
                    <button class="add-bundle-btn" onclick="intelligentCrossSell.addBundleToCart('${bundle.id}')">
                        🛒 Agregar Combo Completo - $${bundle.bundlePrice.toFixed(2)}
                    </button>
                    <button class="customize-bundle-btn" onclick="intelligentCrossSell.customizeBundle('${bundle.id}')">
                        ⚙️ Personalizar Combo
                    </button>
                </div>
            </div>
        `;

        // Add modal styles
        if (!document.getElementById('bundle-details-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'bundle-details-modal-styles';
            style.textContent = `
                .bundle-details-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    z-index: 9999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    animation: modalFadeIn 0.3s ease;
                }

                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .bundle-details-content {
                    background: white;
                    border-radius: 16px;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow-y: auto;
                    margin: 20px;
                    animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                @keyframes modalSlideIn {
                    from { transform: translateY(-50px) scale(0.9); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }

                .bundle-details-header {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    padding: 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .bundle-details-header h3 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 700;
                }

                .close-bundle-details {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    font-size: 24px;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .bundle-details-body {
                    padding: 24px;
                }

                .bundle-product-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin: 16px 0;
                }

                .bundle-product-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: #f8fafc;
                    border-radius: 8px;
                }

                .product-emoji {
                    font-size: 24px;
                    width: 40px;
                    text-align: center;
                }

                .product-details {
                    flex: 1;
                }

                .product-name {
                    font-weight: 600;
                    color: #1a365d;
                }

                .product-value {
                    font-size: 12px;
                    color: #4a5568;
                }

                .bundle-value-proposition {
                    background: linear-gradient(135deg, #e6fffa, #f0fff4);
                    padding: 20px;
                    border-radius: 12px;
                    margin: 20px 0;
                    border-left: 4px solid #10b981;
                }

                .value-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .value-row:last-child {
                    margin-bottom: 0;
                }

                .original-total {
                    text-decoration: line-through;
                    color: #a0aec0;
                }

                .bundle-price-row {
                    font-size: 18px;
                    font-weight: 700;
                    color: #047857;
                }

                .savings-row {
                    font-size: 16px;
                    font-weight: 700;
                    color: #dc2626;
                    padding-top: 8px;
                    border-top: 1px solid #d1fae5;
                }

                .bundle-benefits {
                    margin: 20px 0;
                }

                .bundle-benefits h4 {
                    color: #1a365d;
                    margin-bottom: 12px;
                }

                .bundle-benefits ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .bundle-benefits li {
                    padding: 8px 0;
                    color: #4a5568;
                    font-size: 14px;
                }

                .bundle-details-actions {
                    padding: 24px;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .add-bundle-btn {
                    background: linear-gradient(135deg, #10b981, #047857);
                    color: white;
                    border: none;
                    padding: 16px;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .add-bundle-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
                }

                .customize-bundle-btn {
                    background: white;
                    color: #667eea;
                    border: 2px solid #667eea;
                    padding: 14px;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .customize-bundle-btn:hover {
                    background: #667eea;
                    color: white;
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(modal);
    }

    addBundleToCart(bundleId) {
        const bundle = this.bundles.find(b => b.id === bundleId);
        if (bundle) {
            console.log(`🛒 Adding bundle to cart: ${bundle.name}`);
            
            // Show success message
            this.showNotification(`🎉 ¡${bundle.name} agregado al carrito! Ahorras $${bundle.savings.toFixed(2)}`, 'success');
            
            // Close any open modals
            document.querySelectorAll('.bundle-details-modal').forEach(modal => modal.remove());
            
            // Track conversion
            this.trackInteraction('bundle_added_to_cart', { 
                bundleId, 
                bundleName: bundle.name, 
                price: bundle.bundlePrice,
                savings: bundle.savings 
            });
            
            // Update cart (integrate with existing cart system)
            this.updateCartWithBundle(bundle);
        }
    }

    addToCart(productId) {
        const product = this.crossSellProducts.find(p => p.id === productId);
        if (product) {
            console.log(`➕ Adding product to cart: ${product.name}`);
            
            this.showNotification(`✅ ${product.name} agregado al carrito!`, 'success');
            
            this.trackInteraction('individual_product_added', { 
                productId, 
                productName: product.name, 
                price: product.price 
            });
        }
    }

    viewProduct(productId) {
        const product = this.crossSellProducts.find(p => p.id === productId);
        if (product) {
            console.log(`👁️ Viewing product: ${product.name}`);
            
            // Show detailed product view
            this.showProductQuickView(product);
            
            this.trackInteraction('product_viewed', { 
                productId, 
                productName: product.name,
                matchScore: product.matchScore 
            });
        }
    }

    showProductQuickView(product) {
        // Implementation for product quick view modal
        // Similar to bundle details but for individual products
    }

    showPersonalizedRecommendations() {
        console.log('🤖 Showing personalized recommendations...');
        
        // Enhanced personalization based on user behavior
        this.showNotification('🎯 Analizando tus preferencias para recomendaciones perfectas...', 'info');
        
        // Simulate AI analysis
        setTimeout(() => {
            this.showNotification('✨ ¡Listo! Hemos encontrado combinaciones perfectas para ti', 'success');
            // Highlight recommended items
            this.highlightPersonalizedItems();
        }, 2000);
    }

    highlightPersonalizedItems() {
        // Add special highlighting to top recommendations
        const recommendationCards = document.querySelectorAll('.recommendation-card');
        recommendationCards.forEach((card, index) => {
            if (index < 2) { // Highlight first 2 as personalized
                card.classList.add('personalized-highlight');
                
                // Add personalized badge
                const badge = document.createElement('div');
                badge.className = 'personalized-badge';
                badge.innerHTML = '🎯 Para Ti';
                card.appendChild(badge);
            }
        });
        
        // Add personalized highlight styles
        if (!document.getElementById('personalized-highlight-styles')) {
            const style = document.createElement('style');
            style.id = 'personalized-highlight-styles';
            style.textContent = `
                .personalized-highlight {
                    border: 2px solid #f093fb !important;
                    box-shadow: 0 8px 32px rgba(240, 147, 251, 0.3) !important;
                    animation: personalizedGlow 2s infinite;
                    position: relative;
                }
                
                @keyframes personalizedGlow {
                    0%, 100% { box-shadow: 0 8px 32px rgba(240, 147, 251, 0.3); }
                    50% { box-shadow: 0 12px 40px rgba(240, 147, 251, 0.6); }
                }
                
                .personalized-badge {
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    background: linear-gradient(135deg, #f093fb, #f5576c);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 700;
                    z-index: 10;
                    animation: personalizedBadgeBounce 2s infinite;
                }
                
                @keyframes personalizedBadgeBounce {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    updateCartWithBundle(bundle) {
        // Integration with existing cart system
        // This would need to interface with the existing cart.js
        
        // For now, just log the bundle addition
        console.log('Cart updated with bundle:', bundle);
        
        // Update cart counter if it exists
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const currentCount = parseInt(cartCount.textContent) || 0;
            cartCount.textContent = currentCount + bundle.products.length;
            cartCount.style.display = 'inline-block';
        }
    }

    trackInteraction(eventType, data) {
        // Analytics tracking for cross-sell interactions
        const timestamp = new Date().toISOString();
        const interaction = {
            type: eventType,
            timestamp,
            data,
            source: 'intelligent-cross-sell'
        };
        
        console.log('📊 Cross-sell Interaction Tracked:', interaction);
        
        // Here you would send to your analytics service
        // Example: analyticsService.track(interaction);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `cross-sell-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add notification styles if not exists
        if (!document.getElementById('cross-sell-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'cross-sell-notification-styles';
            style.textContent = `
                .cross-sell-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    max-width: 400px;
                    padding: 16px 20px;
                    border-radius: 12px;
                    color: white;
                    font-weight: 600;
                    animation: notificationSlideIn 0.5s ease;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                }
                
                .cross-sell-notification.success {
                    background: linear-gradient(135deg, #10b981, #047857);
                }
                
                .cross-sell-notification.info {
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                }
                
                .cross-sell-notification.warning {
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                }
                
                @keyframes notificationSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                .notification-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                }
                
                .notification-close {
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
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'notificationSlideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    startIntelligentRecommendations() {
        // AI-like behavior for dynamic recommendations
        setInterval(() => {
            this.updateRecommendationScores();
            this.rotateRecommendations();
        }, 30000); // Every 30 seconds

        // Behavior tracking
        this.setupBehaviorTracking();
    }

    updateRecommendationScores() {
        // Simulate AI learning and score adjustment
        this.crossSellProducts.forEach(product => {
            // Slight random adjustment to simulate learning
            const adjustment = (Math.random() - 0.5) * 2;
            product.matchScore = Math.max(50, Math.min(100, product.matchScore + adjustment));
        });
    }

    rotateRecommendations() {
        // Occasionally refresh recommendations to show variety
        if (Math.random() < 0.3) { // 30% chance
            this.populateRecommendations();
            console.log('🔄 Cross-sell recommendations rotated');
        }
    }

    setupBehaviorTracking() {
        // Track user behavior for better recommendations
        let scrollDepth = 0;
        let timeOnCrossSell = 0;
        
        // Track time spent on cross-sell section
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const startTime = Date.now();
                    const stopTracking = () => {
                        const timeSpent = Date.now() - startTime;
                        timeOnCrossSell += timeSpent;
                        console.log(`⏱️ Time on cross-sell section: ${timeSpent}ms`);
                    };
                    
                    // Stop tracking when user leaves section
                    const leaveObserver = new IntersectionObserver((leaveEntries) => {
                        leaveEntries.forEach(leaveEntry => {
                            if (!leaveEntry.isIntersecting) {
                                stopTracking();
                                leaveObserver.disconnect();
                            }
                        });
                    });
                    
                    leaveObserver.observe(entry.target);
                }
            });
        });
        
        const crossSellContainer = document.querySelector('.intelligent-cross-sell-container');
        if (crossSellContainer) {
            observer.observe(crossSellContainer);
        }
    }
}

// Initialize the Intelligent Cross-Sell System
let intelligentCrossSell;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        intelligentCrossSell = new IntelligentCrossSell();
    });
} else {
    intelligentCrossSell = new IntelligentCrossSell();
}

// Global exposure for interaction
window.intelligentCrossSell = intelligentCrossSell;