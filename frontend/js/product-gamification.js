// Enhanced Product Detail Gamification
// Implements advanced UX techniques for maximum conversion

class ProductGamification {
    constructor() {
        this.achievements = {
            imageExplorer: { unlocked: false, progress: 0, target: 3 },
            customizer: { unlocked: false, progress: 0, target: 1 },
            reviewer: { unlocked: false, progress: 0, target: 1 }
        };
        
        this.timers = {
            countdown: null,
            liveViewers: null,
            viewCount: null
        };
        
        this.counters = {
            imageViews: 0,
            liveViewers: 12 + Math.floor(Math.random() * 8), // 12-20 random viewers
            viewsToday: 1247 + Math.floor(Math.random() * 100), // Random daily views
            recentPurchases: 23 + Math.floor(Math.random() * 15) // 23-38 recent purchases
        };
        
        this.init();
    }

    init() {
        this.setupCountdownTimer();
        this.setupLiveViewers();
        this.setupImageTracking();
        this.setupCustomizationTracking();
        this.setupInteractiveElements();
        this.setupNotifications();
        this.startViewCountAnimation();
        this.setupImpulseTriggers();
        this.setupAdvancedPsychology();
        this.enhanceQuantitySelector();
        
        console.log('🎮 Product Gamification: Initialized with Advanced Psychology');
    }

    // ============================================
    // COUNTDOWN TIMER SYSTEM
    // ============================================
    
    setupCountdownTimer() {
        // Start with 24 hours countdown
        let timeLeft = 24 * 60 * 60 - 1; // 23:59:59
        
        this.timers.countdown = setInterval(() => {
            const hours = Math.floor(timeLeft / 3600);
            const minutes = Math.floor((timeLeft % 3600) / 60);
            const seconds = timeLeft % 60;
            
            const hoursEl = document.getElementById('hours');
            const minutesEl = document.getElementById('minutes');
            const secondsEl = document.getElementById('seconds');
            
            if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
            if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
            if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
            
            timeLeft--;
            
            // Reset when reaches 0
            if (timeLeft < 0) {
                timeLeft = 24 * 60 * 60 - 1;
                this.showAchievement('⏰ ¡Nueva oferta disponible!', 'Tiempo extendido por demanda popular');
            }
        }, 1000);
    }

    // ============================================
    // LIVE VIEWERS SIMULATION
    // ============================================
    
    setupLiveViewers() {
        this.updateLiveViewers();
        
        this.timers.liveViewers = setInterval(() => {
            // Simulate realistic viewer fluctuations
            const change = Math.random() < 0.6 ? 
                Math.floor(Math.random() * 3) + 1 : 
                -(Math.floor(Math.random() * 2) + 1);
            
            this.counters.liveViewers = Math.max(8, Math.min(25, this.counters.liveViewers + change));
            this.updateLiveViewers();
        }, 8000 + Math.random() * 7000); // 8-15 seconds
    }
    
    updateLiveViewers() {
        const element = document.getElementById('live-viewers');
        if (element) {
            element.textContent = this.counters.liveViewers;
            element.parentElement.classList.add('success-animation');
            
            setTimeout(() => {
                element.parentElement.classList.remove('success-animation');
            }, 600);
        }
    }

    // ============================================
    // IMAGE TRACKING SYSTEM
    // ============================================
    
    setupImageTracking() {
        // Track main image views
        const mainImage = document.getElementById('main-image');
        if (mainImage) {
            mainImage.addEventListener('load', () => {
                this.trackImageView();
            });
        }
        
        // Track thumbnail interactions
        const thumbnailsContainer = document.getElementById('thumbnails');
        if (thumbnailsContainer) {
            thumbnailsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('thumbnail')) {
                    this.trackImageView();
                    this.updateImageCounter();
                }
            });
        }
    }
    
    trackImageView() {
        this.counters.imageViews++;
        this.updateAchievementProgress('imageExplorer', this.counters.imageViews);
        
        // Update image progress bar
        const progressBar = document.getElementById('image-progress');
        if (progressBar) {
            const progress = Math.min(100, (this.counters.imageViews / 3) * 100);
            progressBar.style.width = progress + '%';
        }
        
        if (this.counters.imageViews >= 3 && !this.achievements.imageExplorer.unlocked) {
            this.unlockAchievement('imageExplorer', '🎨 ¡Explorador Visual!', 'Has visto todas las fotos del producto');
        }
    }
    
    updateImageCounter() {
        const currentEl = document.getElementById('current-image');
        const totalEl = document.getElementById('total-images');
        
        if (currentEl && totalEl) {
            // This will be updated by the main product-detail.js
            // Just add visual feedback
            currentEl.parentElement.classList.add('success-animation');
            setTimeout(() => {
                currentEl.parentElement.classList.remove('success-animation');
            }, 300);
        }
    }

    // ============================================
    // CUSTOMIZATION TRACKING
    // ============================================
    
    setupCustomizationTracking() {
        // Track color selection
        const colorSelectors = document.querySelectorAll('input[name="ribbon-color"]');
        colorSelectors.forEach(radio => {
            radio.addEventListener('change', () => {
                this.trackCustomization();
                this.showMiniNotification('🎨 Color seleccionado: ' + radio.nextElementSibling.textContent);
            });
        });
        
        // Track paper selection
        const paperOptions = document.querySelectorAll('.paper-option');
        paperOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove previous selection
                paperOptions.forEach(p => p.classList.remove('selected'));
                option.classList.add('selected');
                
                this.trackCustomization();
                const paperName = option.querySelector('.paper-name').textContent;
                this.showMiniNotification('📦 Papel seleccionado: ' + paperName);
            });
        });
        
        // Track message input
        const messageInput = document.getElementById('personal-message');
        if (messageInput) {
            messageInput.addEventListener('input', () => {
                this.updateCharacterCount();
                if (messageInput.value.length > 0 && !this.achievements.customizer.unlocked) {
                    this.trackCustomization();
                }
            });
        }
    }
    
    trackCustomization() {
        if (!this.achievements.customizer.unlocked) {
            this.updateAchievementProgress('customizer', 1);
            this.unlockAchievement('customizer', '🎨 ¡Personalizador!', 'Has personalizado tu arreglo');
        }
    }
    
    updateCharacterCount() {
        const messageInput = document.getElementById('personal-message');
        const charCount = document.getElementById('char-count');
        
        if (messageInput && charCount) {
            charCount.textContent = messageInput.value.length;
            
            // Visual feedback for character count
            if (messageInput.value.length > 80) {
                charCount.style.color = '#dc3545';
            } else if (messageInput.value.length > 60) {
                charCount.style.color = '#ffc107';
            } else {
                charCount.style.color = '#28a745';
            }
        }
    }

    // ============================================
    // INTERACTIVE ELEMENTS
    // ============================================
    
    setupInteractiveElements() {
        // Favorite button functionality
        window.toggleFavorite = () => {
            const loveBtn = document.getElementById('love-btn');
            const loveIcon = loveBtn.querySelector('i');
            const loveCount = loveBtn.querySelector('.love-count');
            
            if (loveBtn.classList.contains('loved')) {
                loveBtn.classList.remove('loved');
                loveIcon.classList.replace('bi-heart-fill', 'bi-heart');
                loveCount.textContent = parseInt(loveCount.textContent) - 1;
                this.showMiniNotification('💔 Removido de favoritos');
            } else {
                loveBtn.classList.add('loved');
                loveIcon.classList.replace('bi-heart', 'bi-heart-fill');
                loveCount.textContent = parseInt(loveCount.textContent) + 1;
                this.showMiniNotification('❤️ Agregado a favoritos');
                this.createHeartAnimation(loveBtn);
            }
        };
        
        // Share button functionality
        window.shareProduct = () => {
            if (navigator.share) {
                navigator.share({
                    title: document.getElementById('product-title').textContent,
                    text: 'Mira estas hermosas flores en FloresYa',
                    url: window.location.href
                });
            } else {
                navigator.clipboard.writeText(window.location.href);
                this.showMiniNotification('🔗 Enlace copiado al portapapeles');
            }
        };
        
        // Wishlist functionality
        window.addToWishlist = () => {
            this.showMiniNotification('💝 Agregado a lista de deseos');
            this.createWishlistAnimation();
        };
        
        // Compare functionality
        window.addToCompare = () => {
            this.showMiniNotification('⚖️ Agregado para comparar');
        };
        
        // Question functionality
        window.askQuestion = () => {
            this.showMiniNotification('💬 Formulario de preguntas próximamente');
        };
    }

    // ============================================
    // VISUAL EFFECTS AND ANIMATIONS
    // ============================================
    
    createHeartAnimation(button) {
        const hearts = ['💖', '💕', '💗', '💓', '💝'];
        
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
                heart.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    font-size: 1.5rem;
                    pointer-events: none;
                    z-index: 1000;
                    animation: heart-float 2s ease-out forwards;
                    transform: translate(-50%, -50%);
                `;
                
                button.appendChild(heart);
                
                setTimeout(() => heart.remove(), 2000);
            }, i * 100);
        }
        
        // Add heart-float animation if not exists
        if (!document.getElementById('heart-animation-style')) {
            const style = document.createElement('style');
            style.id = 'heart-animation-style';
            style.textContent = `
                @keyframes heart-float {
                    0% { 
                        transform: translate(-50%, -50%) scale(0) rotate(0deg); 
                        opacity: 1; 
                    }
                    100% { 
                        transform: translate(-50%, -200%) scale(1.5) rotate(360deg); 
                        opacity: 0; 
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    createWishlistAnimation() {
        const wishlistBtn = document.querySelector('.btn-wishlist');
        if (wishlistBtn) {
            wishlistBtn.style.transform = 'scale(1.1)';
            wishlistBtn.style.background = '#FF69B4';
            wishlistBtn.style.color = 'white';
            
            setTimeout(() => {
                wishlistBtn.style.transform = '';
                wishlistBtn.style.background = '';
                wishlistBtn.style.color = '';
            }, 300);
        }
    }

    // ============================================
    // ACHIEVEMENT SYSTEM
    // ============================================
    
    updateAchievementProgress(type, progress) {
        if (this.achievements[type]) {
            this.achievements[type].progress = Math.min(progress, this.achievements[type].target);
        }
    }
    
    unlockAchievement(type, title, description) {
        if (this.achievements[type] && !this.achievements[type].unlocked) {
            this.achievements[type].unlocked = true;
            this.showAchievement(title, description);
            
            // Save to localStorage for persistence
            const savedAchievements = JSON.parse(localStorage.getItem('floresya_achievements') || '{}');
            savedAchievements[type] = true;
            localStorage.setItem('floresya_achievements', JSON.stringify(savedAchievements));
        }
    }
    
    showAchievement(title, description) {
        const toast = document.getElementById('achievement-toast');
        if (toast) {
            const titleEl = toast.querySelector('strong');
            const descEl = toast.querySelector('small');
            
            if (titleEl) titleEl.textContent = title;
            if (descEl) descEl.textContent = description;
            
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 4000);
        }
    }

    // ============================================
    // NOTIFICATION SYSTEM
    // ============================================
    
    setupNotifications() {
        // Create notification container if it doesn't exist
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 300px;
            `;
            document.body.appendChild(container);
        }
    }
    
    showMiniNotification(message, type = 'success') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(320px);
            transition: all 0.3s ease;
            font-size: 0.9rem;
        `;
        
        container.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(320px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // ============================================
    // VIEW COUNT ANIMATION
    // ============================================
    
    startViewCountAnimation() {
        const viewCountEl = document.getElementById('view-count');
        if (viewCountEl) {
            // Animate view count increase
            this.timers.viewCount = setInterval(() => {
                if (Math.random() < 0.3) { // 30% chance every interval
                    this.counters.viewsToday += Math.floor(Math.random() * 3) + 1;
                    viewCountEl.textContent = this.counters.viewsToday.toLocaleString();
                    
                    // Add visual feedback
                    viewCountEl.style.color = '#28a745';
                    viewCountEl.style.transform = 'scale(1.1)';
                    
                    setTimeout(() => {
                        viewCountEl.style.color = '';
                        viewCountEl.style.transform = '';
                    }, 500);
                }
            }, 12000); // Check every 12 seconds
        }
    }

    // ============================================
    // QUANTITY ENHANCEMENTS
    // ============================================
    
    enhanceQuantitySelector() {
        const quantityInput = document.getElementById('quantity');
        const decreaseBtn = document.querySelector('.quantity-decrease');
        const increaseBtn = document.querySelector('.quantity-increase');
        const benefitsEl = document.querySelector('.quantity-benefits small');
        
        if (quantityInput) {
            quantityInput.addEventListener('change', () => {
                this.updateQuantityBenefits(parseInt(quantityInput.value));
            });
        }
        
        if (decreaseBtn && increaseBtn) {
            [decreaseBtn, increaseBtn].forEach(btn => {
                btn.addEventListener('click', () => {
                    setTimeout(() => {
                        this.updateQuantityBenefits(parseInt(quantityInput.value));
                    }, 10);
                });
            });
        }
    }
    
    updateQuantityBenefits(quantity) {
        const benefitsEl = document.querySelector('.quantity-benefits small');
        if (benefitsEl) {
            let message = '';
            let className = '';
            
            if (quantity >= 2) {
                message = '🎉 ¡10% de descuento aplicado!';
                className = 'text-success';
            } else if (quantity >= 3) {
                message = '🔥 ¡15% de descuento + envío express!';
                className = 'text-success';
            } else {
                message = 'Compra 2 y obtén 10% de descuento';
                className = 'text-muted';
            }
            
            benefitsEl.innerHTML = `<i class="bi bi-gift"></i> ${message}`;
            benefitsEl.className = className;
        }
    }

    // ============================================
    // ADVANCED MARKETING PSYCHOLOGY
    // ============================================
    
    setupImpulseTriggers() {
        // Animate recent purchases counter
        this.startRecentPurchasesAnimation();
        
        // Setup exit-intent detection
        this.setupExitIntent();
        
        // Setup scroll-based triggers
        this.setupScrollTriggers();
        
        // Setup time-based pressure
        this.setupTimePressure();
        
        // Setup enhanced navigation
        this.setupEnhancedNavigation();
    }
    
    startRecentPurchasesAnimation() {
        const recentPurchasesEl = document.getElementById('recent-purchases');
        if (recentPurchasesEl) {
            setInterval(() => {
                if (Math.random() < 0.4) { // 40% chance every interval
                    this.counters.recentPurchases += Math.floor(Math.random() * 2) + 1;
                    recentPurchasesEl.textContent = this.counters.recentPurchases;
                    
                    // Visual feedback
                    recentPurchasesEl.style.color = '#28a745';
                    recentPurchasesEl.style.transform = 'scale(1.1)';
                    recentPurchasesEl.parentElement.parentElement.style.animation = 'trigger-glow 0.5s ease';
                    
                    setTimeout(() => {
                        recentPurchasesEl.style.color = '';
                        recentPurchasesEl.style.transform = '';
                    }, 800);
                    
                    // Show mini notification
                    this.showMiniNotification('🎉 ¡Otra persona acaba de comprar este producto!', 'info');
                }
            }, 15000); // Every 15 seconds
        }
    }
    
    setupExitIntent() {
        let exitIntentShown = false;
        
        document.addEventListener('mouseleave', (e) => {
            if (e.clientY <= 0 && !exitIntentShown) {
                exitIntentShown = true;
                this.showExitIntentOffer();
            }
        });
    }
    
    showExitIntentOffer() {
        // Create exit intent modal
        const modal = document.createElement('div');
        modal.className = 'exit-intent-modal';
        modal.innerHTML = `
            <div class="exit-intent-content">
                <div class="exit-intent-header">
                    <h4>¡Espera! 🛑</h4>
                    <button class="exit-intent-close" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
                </div>
                <div class="exit-intent-body">
                    <p><strong>¡No te vayas sin tu descuento especial!</strong></p>
                    <p>Usa el código <strong class="coupon-code">QUÉDATE10</strong> y obtén 10% de descuento adicional</p>
                    <div class="exit-intent-actions">
                        <button class="btn btn-floresya-enhanced" onclick="this.parentElement.parentElement.parentElement.parentElement.remove(); document.getElementById('floresya-btn').click();">
                            ¡Comprar Ahora con Descuento!
                        </button>
                        <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">
                            Quizás más tarde
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: modal-fade-in 0.3s ease;
        `;
        
        document.body.appendChild(modal);
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 30000);
    }
    
    setupScrollTriggers() {
        let scrollTrigger50 = false;
        let scrollTrigger80 = false;
        
        window.addEventListener('scroll', () => {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            
            if (scrollPercent > 50 && !scrollTrigger50) {
                scrollTrigger50 = true;
                this.showMiniNotification('👀 Más de 1,200 personas vieron este producto hoy', 'info');
            }
            
            if (scrollPercent > 80 && !scrollTrigger80) {
                scrollTrigger80 = true;
                this.showAchievement('🏆 ¡Explorador Completo!', 'Has revisado todos los detalles del producto');
            }
        });
    }
    
    setupTimePressure() {
        // Show progressive urgency messages
        const urgencyMessages = [
            { time: 30000, message: '⏰ Solo quedan pocas unidades disponibles' },
            { time: 60000, message: '🔥 ¡Últimas 3 unidades en stock!' },
            { time: 90000, message: '⚡ ¡Oferta termina en menos de 24 horas!' },
            { time: 120000, message: '🎆 ¡No dejes que otro se lleve tu arreglo ideal!' }
        ];
        
        urgencyMessages.forEach((trigger) => {
            setTimeout(() => {
                this.showMiniNotification(trigger.message, 'warning');
                this.pulseCallToAction();
            }, trigger.time);
        });
    }
    
    setupAdvancedPsychology() {
        // Add hover effects to main CTA
        const floresyaBtn = document.getElementById('floresya-btn');
        if (floresyaBtn) {
            let hoverCount = 0;
            
            floresyaBtn.addEventListener('mouseenter', () => {
                hoverCount++;
                if (hoverCount === 3) {
                    this.showMiniNotification('💖 ¡Te encanta este producto! ¿Listo para llevarlo?', 'info');
                } else if (hoverCount === 5) {
                    this.showAchievement('🤔 ¡Decisor Analítico!', 'Has considerado cuidadosamente tu compra');
                }
            });
            
            // Pulse effect when user hesitates
            let mouseLeaveTimeout;
            floresyaBtn.addEventListener('mouseleave', () => {
                mouseLeaveTimeout = setTimeout(() => {
                    this.pulseCallToAction();
                    this.showMiniNotification('👉 ¡Solo un click para hacer feliz a esa persona especial!', 'info');
                }, 5000);
            });
            
            floresyaBtn.addEventListener('mouseenter', () => {
                if (mouseLeaveTimeout) {
                    clearTimeout(mouseLeaveTimeout);
                }
            });
        }
        
        // Add social proof animations
        this.setupSocialProof();
        
        // Add scarcity indicators
        this.updateScarcityIndicators();
    }
    
    setupSocialProof() {
        // Animate star ratings occasionally
        const stars = document.querySelectorAll('.rating-stars i');
        if (stars.length > 0) {
            setInterval(() => {
                if (Math.random() < 0.2) { // 20% chance
                    stars.forEach((star, index) => {
                        setTimeout(() => {
                            star.style.animation = 'star-twinkle 0.5s ease';
                            setTimeout(() => {
                                star.style.animation = '';
                            }, 500);
                        }, index * 100);
                    });
                }
            }, 20000); // Every 20 seconds
        }
        
        // Add star twinkle animation if not exists
        if (!document.getElementById('star-twinkle-style')) {
            const style = document.createElement('style');
            style.id = 'star-twinkle-style';
            style.textContent = `
                @keyframes star-twinkle {
                    0%, 100% { transform: scale(1) rotate(0deg); }
                    50% { transform: scale(1.2) rotate(10deg); filter: brightness(1.5); }
                }
                
                @keyframes modal-fade-in {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
                
                .exit-intent-modal .exit-intent-content {
                    background: white;
                    border-radius: 16px;
                    padding: 0;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                
                .exit-intent-header {
                    background: linear-gradient(135deg, #FF69B4, #FF1493);
                    color: white;
                    padding: 20px;
                    border-radius: 16px 16px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .exit-intent-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                }
                
                .exit-intent-body {
                    padding: 24px;
                    text-align: center;
                }
                
                .coupon-code {
                    background: #ffc107;
                    color: #333;
                    padding: 4px 12px;
                    border-radius: 6px;
                    font-family: monospace;
                    font-size: 1.1rem;
                }
                
                .exit-intent-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 20px;
                    justify-content: center;
                    flex-wrap: wrap;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    updateScarcityIndicators() {
        // Update stock bar dynamically
        const stockFill = document.querySelector('.stock-fill');
        if (stockFill) {
            let currentStock = 25; // Start at 25%
            
            setInterval(() => {
                if (Math.random() < 0.3 && currentStock > 10) { // 30% chance, minimum 10%
                    currentStock -= Math.floor(Math.random() * 3) + 1;
                    stockFill.style.width = currentStock + '%';
                    
                    // Update text
                    const stockText = document.querySelector('.stock-text strong');
                    if (stockText) {
                        const remaining = Math.max(1, Math.floor(currentStock / 10));
                        stockText.textContent = `¡Solo ${remaining} disponibles!`;
                        
                        if (remaining <= 2) {
                            stockText.style.color = '#dc3545';
                            stockText.style.animation = 'urgent-pulse 1s infinite';
                        }
                    }
                    
                    if (currentStock <= 15) {
                        this.showMiniNotification('🚨 ¡STOCK CRÍTICO! Solo quedan pocas unidades', 'error');
                    }
                }
            }, 25000); // Every 25 seconds
        }
        
        // Add urgent pulse animation
        if (!document.getElementById('urgent-pulse-style')) {
            const style = document.createElement('style');
            style.id = 'urgent-pulse-style';
            style.textContent = `
                @keyframes urgent-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    pulseCallToAction() {
        const floresyaBtn = document.getElementById('floresya-btn');
        if (floresyaBtn) {
            floresyaBtn.style.animation = 'cta-pulse 1s ease-in-out';
            setTimeout(() => {
                floresyaBtn.style.animation = '';
            }, 1000);
        }
        
        // Add CTA pulse animation if not exists
        if (!document.getElementById('cta-pulse-style')) {
            const style = document.createElement('style');
            style.id = 'cta-pulse-style';
            style.textContent = `
                @keyframes cta-pulse {
                    0% { transform: scale(1); box-shadow: 0 8px 25px rgba(255, 105, 180, 0.3); }
                    50% { transform: scale(1.05); box-shadow: 0 12px 40px rgba(255, 105, 180, 0.6); }
                    100% { transform: scale(1); box-shadow: 0 8px 25px rgba(255, 105, 180, 0.3); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Enhanced navigation functionality
    setupEnhancedNavigation() {
        window.viewSimilar = () => {
            this.showMiniNotification('🌸 Cargando productos similares...', 'info');
            // In a real implementation, this would filter products by category
            setTimeout(() => {
                window.location.href = '/#productos';
            }, 1000);
        };
    }

    // ============================================
    // CLEANUP
    // ============================================
    
    destroy() {
        Object.values(this.timers).forEach(timer => {
            if (timer) clearInterval(timer);
        });
        
        // Remove any modals
        const modals = document.querySelectorAll('.exit-intent-modal');
        modals.forEach(modal => modal.remove());
        
        console.log('🎮 Product Gamification: Cleaned up');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.productGamification = new ProductGamification();
    });
} else {
    window.productGamification = new ProductGamification();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.productGamification) {
        window.productGamification.destroy();
    }
});