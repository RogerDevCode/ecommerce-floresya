// 🎨 FloresYa Surreal Loading Animation - Inspired by Salvador Dalí
// Gamification technique to retain users while Supabase images load
// Logging exhaustivo para confirmar ejecución y errores

class DaliFlowerLoader {
    constructor() {
        this.isActive = false;
        this.imagesLoaded = 0;
        this.totalImages = 0;
        this.loadingStartTime = Date.now();
        this.minimumShowTime = 2000; // Minimum 2 seconds to appreciate the animation
        
        // Initialize with logging
        if (window.logger) {
            window.logger.info('DALI-LOADER', '✅ DaliFlowerLoader initialized');
        } else {
            console.log('🎨 Dalí Flower Loader: Iniciado - Las flores están por llegar...');
        }
        
        this.init();
    }

    log(message, data = null, level = 'info') {
        // Use window.logger if available
        if (window.logger) {
            window.logger[level]('DALI-LOADER', message, data);
        } else {
            const prefix = '[🎨 Dalí Flower Loader]';
            const timestamp = new Date().toISOString();
            const output = `${prefix} [${level.toUpperCase()}] ${timestamp} — ${message}`;
            
            switch (level) {
                case 'error':
                    console.error(output, data);
                    break;
                case 'warn':
                    console.warn(output, data);
                    break;
                default:
                    console.log(output, data);
                    break;
            }
        }
    }

    init() {
        this.log('🔄 Inicializando DaliFlowerLoader', {}, 'info');
        
        try {
            this.createLoaderHTML();
            this.show();
            this.log('✅ DaliFlowerLoader inicializado correctamente', {}, 'success');
        } catch (error) {
            this.log('❌ Error al inicializar DaliFlowerLoader', { error: error.message }, 'error');
        }
    }

    createLoaderHTML() {
        this.log('🔄 Creando HTML del loader', {}, 'info');
        
        try {
            const loader = document.createElement('div');
            loader.id = 'dali-flower-loader';
            loader.innerHTML = `
                <div class="dali-landscape">
                    <!-- Surreal sky with melting elements -->
                    <div class="melting-sky">
                        <div class="melting-cloud melting-cloud-1"></div>
                        <div class="melting-cloud melting-cloud-2"></div>
                        <div class="surreal-sun"></div>
                    </div>
                    
                    <!-- Ground with distorted perspective -->
                    <div class="dali-ground">
                        <div class="perspective-lines"></div>
                    </div>
                    
                    <!-- Pickup truck with flowers -->
                    <div class="pickup-container">
                        <div class="pickup-truck">
                            <div class="truck-body"></div>
                            <div class="truck-cabin"></div>
                            <div class="truck-wheel truck-wheel-front"></div>
                            <div class="truck-wheel truck-wheel-rear"></div>
                            <div class="floresya-logo">🌸</div>
                        </div>
                        
                        <!-- Bouncing flowers in truck bed -->
                        <div class="flower-bed">
                            <div class="flower flower-1">🌹</div>
                            <div class="flower flower-2">🌻</div>
                            <div class="flower flower-3">🌷</div>
                            <div class="flower flower-4">🌺</div>
                            <div class="flower flower-5">🌼</div>
                        </div>
                    </div>
                    
                    <!-- Surreal destination shop -->
                    <div class="dali-shop">
                        <div class="shop-base"></div>
                        <div class="shop-roof"></div>
                        <div class="shop-door"></div>
                        <div class="shop-sign">FloresYa</div>
                    </div>
                    
                    <!-- Persuasive message -->
                    <div class="loading-message">
                        <div class="message-text" id="dali-message">🌸 Las flores están por llegar...</div>
                        <div class="loading-dots">
                            <span class="dot dot-1">•</span>
                            <span class="dot dot-2">•</span>
                            <span class="dot dot-3">•</span>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(loader);
            this.addDaliStyles();
            this.log('✅ HTML del loader creado correctamente', {}, 'success');
        } catch (error) {
            this.log('❌ Error al crear HTML del loader', { error: error.message }, 'error');
        }
    }

    addDaliStyles() {
        this.log('🔄 Añadiendo estilos CSS', {}, 'info');
        
        try {
            const style = document.createElement('style');
            style.textContent = `
                #dali-flower-loader {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: linear-gradient(180deg, #87CEEB 0%, #F0E68C 50%, #DEB887 100%);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Arial', sans-serif;
                    overflow: hidden;
                }

                .dali-landscape {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }

                /* Melting sky elements - Dalí style */
                .melting-sky {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 60%;
                }

                .melting-cloud {
                    position: absolute;
                    background: white;
                    border-radius: 50px;
                    opacity: 0.8;
                    animation: melt-and-float 8s infinite ease-in-out;
                }

                .melting-cloud-1 {
                    width: 120px;
                    height: 60px;
                    top: 10%;
                    left: 20%;
                    animation-delay: 0s;
                }

                .melting-cloud-2 {
                    width: 80px;
                    height: 40px;
                    top: 15%;
                    right: 25%;
                    animation-delay: 2s;
                }

                @keyframes melt-and-float {
                    0% { transform: translateY(0) scaleY(1); }
                    50% { transform: translateY(-20px) scaleY(1.3); }
                    100% { transform: translateY(0) scaleY(1); }
                }

                .surreal-sun {
                    position: absolute;
                    top: 20%;
                    right: 15%;
                    width: 80px;
                    height: 80px;
                    background: radial-gradient(circle, #FFD700, #FFA500);
                    border-radius: 50%;
                    animation: surreal-pulse 3s infinite ease-in-out;
                }

                @keyframes surreal-pulse {
                    0%, 100% { transform: scale(1) rotate(0deg); }
                    50% { transform: scale(1.2) rotate(180deg); }
                }

                /* Distorted ground */
                .dali-ground {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 40%;
                    background: linear-gradient(180deg, #DEB887 0%, #CD853F 100%);
                    transform: perspective(500px) rotateX(45deg);
                    transform-origin: bottom;
                }

                .perspective-lines {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: repeating-linear-gradient(
                        90deg,
                        transparent,
                        transparent 98px,
                        rgba(139,69,19,0.3) 100px
                    );
                    animation: perspective-move 4s linear infinite;
                }

                @keyframes perspective-move {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-100px); }
                }

                /* Pickup truck animation */
                .pickup-container {
                    position: absolute;
                    left: -200px;
                    top: 50%;
                    transform: translateY(-50%);
                    animation: drive-across 6s linear infinite;
                }

                @keyframes drive-across {
                    0% { left: -200px; }
                    70% { left: calc(100vw - 400px); }
                    100% { left: calc(100vw - 400px); }
                }

                .pickup-truck {
                    position: relative;
                    width: 120px;
                    height: 60px;
                    animation: truck-bounce 0.5s infinite alternate;
                }

                @keyframes truck-bounce {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-5px); }
                }

                .truck-body {
                    position: absolute;
                    bottom: 15px;
                    left: 0;
                    width: 80px;
                    height: 25px;
                    background: #ff6b9d;
                    border-radius: 5px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                }

                .truck-cabin {
                    position: absolute;
                    bottom: 30px;
                    right: 0;
                    width: 40px;
                    height: 30px;
                    background: #ff6b9d;
                    border-radius: 5px 5px 0 0;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                }

                .truck-wheel {
                    position: absolute;
                    width: 15px;
                    height: 15px;
                    background: #333;
                    border-radius: 50%;
                    bottom: 8px;
                    animation: wheel-spin 0.3s linear infinite;
                }

                @keyframes wheel-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .truck-wheel-front {
                    right: 8px;
                }

                .truck-wheel-rear {
                    left: 15px;
                }

                .floresya-logo {
                    position: absolute;
                    right: 45px;
                    bottom: 20px;
                    font-size: 14px;
                    color: white;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                }

                /* Bouncing flowers */
                .flower-bed {
                    position: absolute;
                    bottom: 40px;
                    left: 10px;
                    width: 70px;
                    height: 20px;
                }

                .flower {
                    position: absolute;
                    font-size: 16px;
                    animation: flower-bounce 0.8s infinite ease-in-out;
                }

                .flower-1 { left: 5px; animation-delay: 0s; }
                .flower-2 { left: 20px; animation-delay: 0.1s; }
                .flower-3 { left: 35px; animation-delay: 0.2s; }
                .flower-4 { left: 50px; animation-delay: 0.3s; }
                .flower-5 { left: 15px; top: -10px; animation-delay: 0.4s; }

                @keyframes flower-bounce {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-8px) rotate(10deg); }
                }

                /* Surreal shop destination */
                .dali-shop {
                    position: absolute;
                    right: 50px;
                    bottom: 120px;
                    animation: shop-materialize 8s infinite ease-in-out;
                }

                @keyframes shop-materialize {
                    0% { opacity: 0.3; transform: scale(0.8) skew(5deg); }
                    50% { opacity: 1; transform: scale(1.1) skew(-2deg); }
                    100% { opacity: 0.3; transform: scale(0.8) skew(5deg); }
                }

                .shop-base {
                    width: 80px;
                    height: 50px;
                    background: #8B4513;
                    border-radius: 5px;
                    position: relative;
                }

                .shop-roof {
                    width: 90px;
                    height: 0;
                    border-left: 45px solid transparent;
                    border-right: 45px solid transparent;
                    border-bottom: 30px solid #A0522D;
                    position: relative;
                    left: -5px;
                    top: -5px;
                }

                .shop-door {
                    position: absolute;
                    bottom: 5px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 20px;
                    height: 30px;
                    background: #654321;
                    border-radius: 3px;
                }

                .shop-sign {
                    position: absolute;
                    top: -40px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: white;
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 12px;
                    font-weight: bold;
                    color: #ff6b9d;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }

                /* Loading message */
                .loading-message {
                    position: absolute;
                    bottom: 15%;
                    left: 50%;
                    transform: translateX(-50%);
                    text-align: center;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
                }

                .message-text {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    animation: message-glow 2s infinite alternate;
                }

                @keyframes message-glow {
                    0% { text-shadow: 2px 2px 4px rgba(0,0,0,0.7); }
                    100% { text-shadow: 2px 2px 20px rgba(255,107,157,0.8); }
                }

                .loading-dots {
                    font-size: 30px;
                    color: #ff6b9d;
                }

                .dot {
                    animation: dot-bounce 1.4s infinite ease-in-out both;
                }

                .dot-1 { animation-delay: -0.32s; }
                .dot-2 { animation-delay: -0.16s; }
                .dot-3 { animation-delay: 0s; }

                @keyframes dot-bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1.2); }
                }

                /* Fade out animation */
                .fade-out {
                    animation: fade-out 0.8s ease-out forwards;
                }

                @keyframes fade-out {
                    0% { opacity: 1; }
                    100% { opacity: 0; visibility: hidden; }
                }

                /* Mobile responsiveness */
                @media (max-width: 768px) {
                    .message-text { font-size: 18px; }
                    .pickup-truck { transform: scale(0.8); }
                    .dali-shop { transform: scale(0.8); }
                }
            `;

            document.head.appendChild(style);
            this.log('✅ Estilos CSS añadidos correctamente', {}, 'success');
        } catch (error) {
            this.log('❌ Error al añadir estilos CSS', { error: error.message }, 'error');
        }
    }

    // Track image loading progress
    trackImageLoading() {
        this.log('🔄 Iniciando seguimiento de carga de imágenes', {}, 'info');
        
        try {
            // Find all images in the page
            const images = document.querySelectorAll('img[src*="supabase"], img[data-src*="supabase"]');
            this.totalImages = images.length;
            
            this.log('📊 Estadísticas de imágenes', { 
                totalImages: this.totalImages,
                imagesLoaded: this.imagesLoaded 
            }, 'info');
            
            if (this.totalImages === 0) {
                this.log('ℹ️ Carga dinámica detectada, usando tiempo estándar de visualización', {}, 'info');
                // No static Supabase images to load, hide after minimum time (normal for dynamic loading)
                setTimeout(() => this.hide(), this.minimumShowTime);
                return;
            }

            images.forEach((img, index) => {
                if (img.complete && img.naturalHeight > 0) {
                    this.imagesLoaded++;
                    this.log('✅ Imagen ya cargada', { 
                        index: index + 1,
                        src: img.src,
                        imagesLoaded: this.imagesLoaded,
                        totalImages: this.totalImages
                    }, 'success');
                } else {
                    img.addEventListener('load', () => {
                        this.imagesLoaded++;
                        this.log('✅ Imagen cargada', { 
                            index: index + 1,
                            src: img.src,
                            imagesLoaded: this.imagesLoaded,
                            totalImages: this.totalImages
                        }, 'success');
                        this.checkLoadingComplete();
                    });
                    
                    img.addEventListener('error', (error) => {
                        this.imagesLoaded++;
                        this.log('❌ Error al cargar imagen', { 
                            index: index + 1,
                            src: img.src,
                            error: error.message,
                            imagesLoaded: this.imagesLoaded,
                            totalImages: this.totalImages
                        }, 'error');
                        this.checkLoadingComplete();
                    });
                }
            });

            this.checkLoadingComplete();
        } catch (error) {
            this.log('❌ Error al iniciar seguimiento de carga de imágenes', { error: error.message }, 'error');
        }
    }

    checkLoadingComplete() {
        const elapsedTime = Date.now() - this.loadingStartTime;
        const allImagesLoaded = this.imagesLoaded >= this.totalImages;
        const minimumTimeReached = elapsedTime >= this.minimumShowTime;
        const maximumTimeReached = elapsedTime > 8000;

        this.log('🔍 Verificando condiciones de finalización', { 
            elapsedTime,
            allImagesLoaded,
            minimumTimeReached,
            maximumTimeReached,
            imagesLoaded: this.imagesLoaded,
            totalImages: this.totalImages
        }, 'info');

        if (allImagesLoaded && minimumTimeReached) {
            this.log('✅ Todas las imágenes cargadas y tiempo mínimo alcanzado, ocultando loader', {}, 'success');
            this.hide();
        } else if (allImagesLoaded && !minimumTimeReached) {
            // Images loaded but minimum time not reached - wait for minimum time
            const remainingTime = this.minimumShowTime - elapsedTime;
            this.log('⏳ Todas las imágenes cargadas, esperando tiempo mínimo restante', { remainingTime }, 'info');
            setTimeout(() => this.hide(), remainingTime);
        } else if (maximumTimeReached) {
            this.log('⚠️ Tiempo máximo alcanzado, ocultando loader', {}, 'warn');
            this.hide();
        }
    }

    show() {
        this.log('🔄 Mostrando loader', {}, 'info');
        
        try {
            this.isActive = true;
            const loader = document.getElementById('dali-flower-loader');
            if (loader) {
                loader.style.display = 'flex';
                this.log('✅ Loader mostrado correctamente', {}, 'success');
            }
            
            // Start tracking image loading after a brief delay
            setTimeout(() => this.trackImageLoading(), 500);
            
            // Rotate messages for engagement
            this.rotateMessages();
        } catch (error) {
            this.log('❌ Error al mostrar loader', { error: error.message }, 'error');
        }
    }

    hide() {
        if (!this.isActive) {
            this.log('⚠️ Intento de ocultar loader ya inactivo', {}, 'warn');
            return;
        }
        
        this.log('🔄 Ocultando loader', {}, 'info');
        
        try {
            this.isActive = false;
            const loader = document.getElementById('dali-flower-loader');
            if (loader) {
                loader.classList.add('fade-out');
                setTimeout(() => {
                    if (loader.parentElement) {
                        loader.parentElement.removeChild(loader);
                        this.log('✅ Loader eliminado del DOM', {}, 'success');
                    }
                }, 800);
            }
            
            if (window.logger) {
                window.logger.success('DALI-LOADER', '✅ ¡Flores entregadas con éxito!');
            } else {
                console.log('🎨 Dalí Flower Loader: ¡Flores entregadas con éxito!');
            }
        } catch (error) {
            this.log('❌ Error al ocultar loader', { error: error.message }, 'error');
        }
    }

    rotateMessages() {
        this.log('🔄 Iniciando rotación de mensajes', {}, 'info');
        
        try {
            const messages = [
                '🌸 Las flores están por llegar...',
                '🚛 Transportando belleza natural...',
                '🌺 Preparando tu experiencia FloresYa...',
                '🌹 Seleccionando las mejores flores...',
                '🌻 Un momento de paciencia vale la pena...'
            ];
            
            let messageIndex = 0;
            const messageElement = document.getElementById('dali-message');
            
            const messageInterval = setInterval(() => {
                if (!this.isActive) {
                    this.log('ℹ️ Deteniendo rotación de mensajes', {}, 'info');
                    clearInterval(messageInterval);
                    return;
                }
                
                messageIndex = (messageIndex + 1) % messages.length;
                if (messageElement) {
                    messageElement.textContent = messages[messageIndex];
                    this.log('🔄 Mensaje rotado', { 
                        message: messages[messageIndex],
                        index: messageIndex + 1,
                        total: messages.length
                    }, 'info');
                }
            }, 2000);
        } catch (error) {
            this.log('❌ Error al rotar mensajes', { error: error.message }, 'error');
        }
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.logger) {
            window.logger.info('DALI-LOADER', '🔄 Inicializando DaliFlowerLoader después de DOMContentLoaded');
        }
        new DaliFlowerLoader();
    });
} else {
    if (window.logger) {
        window.logger.info('DALI-LOADER', '🔄 Inicializando DaliFlowerLoader inmediatamente');
    }
    new DaliFlowerLoader();
}