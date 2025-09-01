// Payment processing functionality for FloresYa

class PaymentManager {
    constructor() {
        this.orderId = null;
        this.order = null;
        this.paymentMethods = [];
        this.bcvRate = 0;
        this.shippingCost = 7.00; // Fixed shipping cost in USD
        this.init();
    }

    async init() {
        this.orderId = this.getOrderIdFromURL();
        
        if (!this.orderId) {
            this.redirectToHome();
            return;
        }

        await this.loadOrderInfo();
        await this.loadPaymentMethods();
        this.initCalculator();
        this.bindCustomerForm();
    }

    // Get order ID from URL parameters
    getOrderIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return parseInt(urlParams.get('order_id')) || null;
    }

    // Redirect to home if no order ID
    redirectToHome() {
        api.showNotification('No se especificó una orden válida', 'warning');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    }

    // Load order information
    async loadOrderInfo() {
        try {
            const response = await api.getOrder(this.orderId);
            
            if (response.success) {
                this.order = response.data.order;
                this.renderOrderInfo();
            } else {
                throw new Error(response.message);
            }

        } catch (error) {
            api.handleError(error);
            this.redirectToHome();
        }
    }

    // Load payment methods
    async loadPaymentMethods() {
        try {
            const response = await api.getPaymentMethods();
            
            if (response.success) {
                this.paymentMethods = response.data.payment_methods;
                this.renderPaymentMethods();
            }

        } catch (error) {
            api.handleError(error);
        }
    }

    // Render order information
    renderOrderInfo() {
        const container = document.getElementById('orderInfo');
        if (!container || !this.order) return;

        const itemsHtml = this.order.items.map(item => `
            <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>${api.formatCurrency(item.unit_price)}</td>
                <td>${api.formatCurrency(item.total_price)}</td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Detalles del Pedido</h6>
                    <p><strong>Número de Orden:</strong> ${this.order.order_number}</p>
                    <p><strong>Estado:</strong> <span class="badge bg-warning">Pendiente de Pago</span></p>
                    <p><strong>Total a Pagar:</strong> <span class="text-success fs-5 fw-bold">${api.formatCurrency(this.order.total_amount)}</span></p>
                    <p><strong>Fecha del Pedido:</strong> ${api.formatDate(this.order.created_at)}</p>
                </div>
                <div class="col-md-6">
                    <h6>Dirección de Entrega</h6>
                    <p>
                        ${this.order.shipping_address.first_name} ${this.order.shipping_address.last_name}<br>
                        ${this.order.shipping_address.address_line_1}<br>
                        ${this.order.shipping_address.address_line_2 ? this.order.shipping_address.address_line_2 + '<br>' : ''}
                        ${this.order.shipping_address.city}, ${this.order.shipping_address.state}<br>
                        Tel: ${this.order.shipping_address.phone}
                    </p>
                </div>
            </div>
            
            <h6 class="mt-4">Productos Pedidos</h6>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr class="table-success">
                            <th colspan="3" class="text-end">Total del Pedido:</th>
                            <th>${api.formatCurrency(this.order.total_amount)}</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }

    // Render payment methods
    renderPaymentMethods() {
        const container = document.getElementById('paymentMethodsContainer');
        if (!container) return;

        if (this.paymentMethods.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle"></i>
                        No hay métodos de pago disponibles en este momento.
                    </div>
                </div>
            `;
            return;
        }

        const methodsHtml = this.paymentMethods.map(method => {
            const icon = this.getPaymentMethodIcon(method.type);
            const description = this.getPaymentMethodDescription(method.type);
            
            return `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card payment-method-card h-100" data-method-id="${method.id}" style="cursor: pointer; transition: all 0.3s ease;">
                        <div class="card-body text-center">
                            <i class="bi ${icon} text-success mb-3" style="font-size: 3rem;"></i>
                            <h5 class="card-title">${method.name}</h5>
                            <p class="card-text text-muted">${description}</p>
                            <button class="btn btn-outline-success w-100" onclick="paymentManager.selectPaymentMethod(${method.id})">
                                Seleccionar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = methodsHtml;

        // Add hover effects
        document.querySelectorAll('.payment-method-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
                card.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '';
            });
        });
    }

    // Get icon for payment method type
    getPaymentMethodIcon(type) {
        const icons = {
            'pago_movil': 'bi-phone',
            'bank_transfer': 'bi-bank',
            'zelle': 'bi-currency-dollar',
            'binance_pay': 'bi-coin',
            'cash': 'bi-cash'
        };
        return icons[type] || 'bi-credit-card';
    }

    // Get description for payment method type
    getPaymentMethodDescription(type) {
        const descriptions = {
            'pago_movil': 'Pago rápido desde tu teléfono',
            'bank_transfer': 'Transferencia bancaria tradicional',
            'zelle': 'Pago internacional en USD',
            'binance_pay': 'Pago con criptomonedas',
            'cash': 'Pago en efectivo contra entrega'
        };
        return descriptions[type] || 'Método de pago';
    }

    // Select payment method
    selectPaymentMethod(methodId) {
        const method = this.paymentMethods.find(m => m.id === methodId);
        if (!method) return;

        this.showPaymentModal(method);
    }

    // Show payment modal
    showPaymentModal(method) {
        const modal = document.getElementById('paymentModal');
        const title = document.getElementById('paymentModalTitle');
        const body = document.getElementById('paymentModalBody');

        if (!modal || !title || !body) return;

        title.textContent = `Pagar con ${method.name}`;
        body.innerHTML = this.getPaymentForm(method);

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        // Bind form events
        this.bindPaymentForm(method);
    }

    // Get payment form HTML based on method type
    getPaymentForm(method) {
        switch (method.type) {
            case 'pago_movil':
                return this.getPagoMovilForm(method);
            case 'bank_transfer':
                return this.getBankTransferForm(method);
            case 'zelle':
                return this.getZelleForm(method);
            case 'binance_pay':
                return this.getBinancePayForm(method);
            default:
                return this.getGenericPaymentForm(method);
        }
    }

    // Pago Móvil form
    getPagoMovilForm(method) {
        const banks = method.configuration?.banks || [];
        const bankOptions = banks.map(bank => `<option value="${bank}">${bank}</option>`).join('');

        return `
            <form id="paymentForm" enctype="multipart/form-data">
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i>
                    <strong>Instrucciones:</strong> ${method.instructions}
                </div>

                <div class="mb-3">
                    <label class="form-label">Monto a Pagar</label>
                    <input type="text" class="form-control" value="${api.formatCurrency(this.order.total_amount)}" readonly>
                    <input type="hidden" name="amount" value="${this.order.total_amount}">
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="bank" class="form-label">Banco</label>
                            <select class="form-select" id="bank" name="bank" required>
                                <option value="">Seleccionar banco</option>
                                ${bankOptions}
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="cedula" class="form-label">Cédula</label>
                            <input type="text" class="form-control" id="cedula" name="cedula" placeholder="V-12345678" required>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="phone" class="form-label">Teléfono</label>
                            <input type="tel" class="form-control" id="phone" name="phone" placeholder="04XX-1234567" required>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="reference" class="form-label">Número de Referencia</label>
                            <input type="text" class="form-control" id="reference" name="reference" placeholder="123456789" required>
                        </div>
                    </div>
                </div>

                <div class="mb-3">
                    <label for="proof" class="form-label">Comprobante de Pago</label>
                    <input type="file" class="form-control" id="proof" name="proof" accept="image/*" required>
                    <div class="form-text">Sube una foto clara del comprobante de tu pago móvil</div>
                </div>

                <div class="d-flex justify-content-between">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-success">Enviar Pago</button>
                </div>
            </form>
        `;
    }

    // Bank Transfer form
    getBankTransferForm(method) {
        const config = method.configuration;
        
        return `
            <form id="paymentForm" enctype="multipart/form-data">
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i>
                    <strong>Instrucciones:</strong> ${method.instructions}
                </div>

                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">Datos de la Cuenta</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>Banco:</strong> ${config?.bank || 'N/A'}</p>
                        <p><strong>Titular:</strong> ${config?.account_holder || 'N/A'}</p>
                        <p><strong>Número de Cuenta:</strong> ${config?.account_number || 'N/A'}</p>
                        <p><strong>RIF:</strong> ${config?.rif || 'N/A'}</p>
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label">Monto a Transferir</label>
                    <input type="text" class="form-control" value="${api.formatCurrency(this.order.total_amount)}" readonly>
                    <input type="hidden" name="amount" value="${this.order.total_amount}">
                </div>

                <div class="mb-3">
                    <label for="reference" class="form-label">Número de Referencia</label>
                    <input type="text" class="form-control" id="reference" name="reference" placeholder="Número de referencia de la transferencia" required>
                </div>

                <div class="mb-3">
                    <label for="date" class="form-label">Fecha de la Transferencia</label>
                    <input type="date" class="form-control" id="date" name="date" value="${new Date().toISOString().split('T')[0]}" required>
                </div>

                <div class="mb-3">
                    <label for="proof" class="form-label">Comprobante de Transferencia</label>
                    <input type="file" class="form-control" id="proof" name="proof" accept="image/*" required>
                    <div class="form-text">Sube una foto clara del comprobante de transferencia</div>
                </div>

                <div class="d-flex justify-content-between">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-success">Enviar Pago</button>
                </div>
            </form>
        `;
    }

    // Zelle form
    getZelleForm(method) {
        const config = method.configuration;
        
        return `
            <form id="paymentForm">
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i>
                    <strong>Instrucciones:</strong> ${method.instructions}
                </div>

                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">Datos para el Pago</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>Email de Zelle:</strong> ${config?.email || 'N/A'}</p>
                        <p><strong>Monto a Enviar:</strong> <span class="text-success fs-5">${api.formatCurrency(this.order.total_amount)}</span></p>
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label">Monto Pagado</label>
                    <input type="text" class="form-control" value="${api.formatCurrency(this.order.total_amount)}" readonly>
                    <input type="hidden" name="amount" value="${this.order.total_amount}">
                </div>

                <div class="mb-3">
                    <label for="confirmation" class="form-label">ID de Confirmación de Zelle</label>
                    <input type="text" class="form-control" id="confirmation" name="confirmation" placeholder="Ejemplo: ZEL123456789" required>
                    <div class="form-text">Ingresa el ID de confirmación que recibiste de Zelle</div>
                </div>

                <div class="mb-3">
                    <label for="sender_email" class="form-label">Email del Remitente</label>
                    <input type="email" class="form-control" id="sender_email" name="sender_email" placeholder="tu@email.com" required>
                </div>

                <div class="d-flex justify-content-between">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-success">Confirmar Pago</button>
                </div>
            </form>
        `;
    }

    // Binance Pay form
    getBinancePayForm(method) {
        const config = method.configuration;
        
        return `
            <form id="paymentForm">
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i>
                    <strong>Instrucciones:</strong> ${method.instructions}
                </div>

                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">Datos para el Pago</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>Usuario de Binance:</strong> ${config?.user_id || 'N/A'}</p>
                        <p><strong>Monto a Enviar:</strong> <span class="text-success fs-5">${api.formatCurrency(this.order.total_amount)} USD</span></p>
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label">Monto Pagado</label>
                    <input type="text" class="form-control" value="${api.formatCurrency(this.order.total_amount)} USD" readonly>
                    <input type="hidden" name="amount" value="${this.order.total_amount}">
                </div>

                <div class="mb-3">
                    <label for="transaction_id" class="form-label">ID de Transacción</label>
                    <input type="text" class="form-control" id="transaction_id" name="transaction_id" placeholder="ID de la transacción de Binance Pay" required>
                </div>

                <div class="mb-3">
                    <label for="sender_user" class="form-label">Tu Usuario de Binance</label>
                    <input type="text" class="form-control" id="sender_user" name="sender_user" placeholder="Tu usuario en Binance" required>
                </div>

                <div class="d-flex justify-content-between">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-success">Confirmar Pago</button>
                </div>
            </form>
        `;
    }

    // Generic payment form
    getGenericPaymentForm(method) {
        return `
            <form id="paymentForm" enctype="multipart/form-data">
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i>
                    <strong>Instrucciones:</strong> ${method.instructions || 'Sigue las instrucciones del método de pago seleccionado.'}
                </div>

                <div class="mb-3">
                    <label class="form-label">Monto a Pagar</label>
                    <input type="text" class="form-control" value="${api.formatCurrency(this.order.total_amount)}" readonly>
                    <input type="hidden" name="amount" value="${this.order.total_amount}">
                </div>

                <div class="mb-3">
                    <label for="reference" class="form-label">Número de Referencia</label>
                    <input type="text" class="form-control" id="reference" name="reference" placeholder="Número de referencia del pago">
                </div>

                <div class="mb-3">
                    <label for="proof" class="form-label">Comprobante de Pago (opcional)</label>
                    <input type="file" class="form-control" id="proof" name="proof" accept="image/*">
                    <div class="form-text">Sube una foto del comprobante si está disponible</div>
                </div>

                <div class="d-flex justify-content-between">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-success">Confirmar Pago</button>
                </div>
            </form>
        `;
    }

    // Bind payment form events
    bindPaymentForm(method) {
        const form = document.getElementById('paymentForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.processPayment(method);
        });
    }

    // Process payment submission
    async processPayment(method) {
        const form = document.getElementById('paymentForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Validate customer form first
        if (!this.validateCustomerForm()) {
            return;
        }

        try {
            api.showLoading();

            const formData = new FormData(form);
            
            // Add required fields
            formData.append('order_id', this.orderId);
            formData.append('payment_method_id', method.id);

            // Collect payment details based on method type
            const paymentDetails = this.collectPaymentDetails(method.type, formData);
            formData.append('payment_details', JSON.stringify(paymentDetails));

            // Add customer data
            const customerData = this.getCustomerData();
            if (customerData) {
                formData.append('customer_data', JSON.stringify(customerData));
            }

            // Add reference number if available
            const referenceNumber = formData.get('reference') || formData.get('confirmation') || formData.get('transaction_id');
            if (referenceNumber) {
                formData.append('reference_number', referenceNumber);
            }

            // Submit payment
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: {
                    ...(api.token && { 'Authorization': `Bearer ${api.token}` })
                },
                body: formData
            });

            const data = await api.handleResponse(response);

            if (data.success) {
                // Hide payment modal
                const paymentModal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
                if (paymentModal) {
                    paymentModal.hide();
                }

                // Show success modal
                this.showSuccessModal();
            }

        } catch (error) {
            api.handleError(error);
        } finally {
            api.hideLoading();
        }
    }

    // Collect payment details based on method type
    collectPaymentDetails(methodType, formData) {
        const details = {};
        
        switch (methodType) {
            case 'pago_movil':
                details.bank = formData.get('bank');
                details.cedula = formData.get('cedula');
                details.phone = formData.get('phone');
                break;
                
            case 'bank_transfer':
                details.date = formData.get('date');
                break;
                
            case 'zelle':
                details.sender_email = formData.get('sender_email');
                break;
                
            case 'binance_pay':
                details.sender_user = formData.get('sender_user');
                break;
        }
        
        return details;
    }

    // Show success modal
    showSuccessModal() {
        const modal = document.getElementById('successModal');
        const orderNumber = document.getElementById('successOrderNumber');
        
        if (orderNumber && this.order) {
            orderNumber.textContent = this.order.order_number;
        }
        
        const bsModal = new bootstrap.Modal(modal, {
            backdrop: 'static',
            keyboard: false
        });
        bsModal.show();
    }

    // Initialize currency calculator
    initCalculator() {
        const bcvRateInput = document.getElementById('bcvRate');
        if (bcvRateInput) {
            bcvRateInput.addEventListener('input', () => {
                this.updateCalculator();
            });

            // Load stored BCV rate from localStorage
            const storedRate = localStorage.getItem('bcvRate');
            if (storedRate) {
                bcvRateInput.value = storedRate;
            }

            this.updateCalculator();
        }
    }

    // Update currency calculator
    updateCalculator() {
        const bcvRateInput = document.getElementById('bcvRate');
        const subtotalUSD = document.getElementById('subtotalUSD');
        const totalUSD = document.getElementById('totalUSD');
        const finalTotalUSD = document.getElementById('finalTotalUSD');
        const totalBs = document.getElementById('totalBs');
        const orderBreakdown = document.getElementById('orderBreakdown');

        if (!bcvRateInput || !this.order) return;

        const rate = parseFloat(bcvRateInput.value) || 0;
        this.bcvRate = rate;

        // Store rate in localStorage
        if (rate > 0) {
            localStorage.setItem('bcvRate', rate.toString());
        }

        const subtotal = this.order.total_amount - this.shippingCost;
        const totalWithShipping = this.order.total_amount;
        const totalBolivares = totalWithShipping * rate;

        // Update display elements
        if (subtotalUSD) subtotalUSD.textContent = api.formatCurrency(subtotal);
        if (totalUSD) totalUSD.textContent = api.formatCurrency(totalWithShipping);
        if (finalTotalUSD) finalTotalUSD.textContent = api.formatCurrency(totalWithShipping);
        
        if (totalBs) {
            totalBs.textContent = rate > 0 ? this.formatBolivares(totalBolivares) : 'Bs 0.00';
        }

        // Update order breakdown
        if (orderBreakdown && this.order.items) {
            const breakdownHtml = this.order.items.map(item => `
                <div class="d-flex justify-content-between small">
                    <span>${item.product_name} (x${item.quantity})</span>
                    <span>${api.formatCurrency(item.total_price)}</span>
                </div>
            `).join('');
            orderBreakdown.innerHTML = breakdownHtml;
        }
    }

    // Format bolivares currency
    formatBolivares(amount) {
        return new Intl.NumberFormat('es-VE', {
            style: 'currency',
            currency: 'VES',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount).replace('VES', 'Bs');
    }

    // Bind customer form events
    bindCustomerForm() {
        const form = document.getElementById('customerForm');
        if (!form) return;

        // Validate form on input
        const requiredFields = form.querySelectorAll('input[required], textarea[required]');
        requiredFields.forEach(field => {
            field.addEventListener('blur', () => {
                this.validateField(field);
            });
        });

        // Auto-format phone numbers
        const phoneFields = form.querySelectorAll('input[type="tel"]');
        phoneFields.forEach(field => {
            field.addEventListener('input', (e) => {
                this.formatPhoneNumber(e.target);
            });
        });
    }

    // Validate individual field
    validateField(field) {
        const isValid = field.checkValidity();
        
        if (isValid) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        } else {
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
        }
        
        return isValid;
    }

    // Format phone number input
    formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, ''); // Remove non-digits
        
        if (value.startsWith('58')) {
            value = '+' + value;
        } else if (value.startsWith('4') && value.length >= 7) {
            value = '+58' + value;
        } else if (value.startsWith('2') && value.length >= 7) {
            value = '+58' + value;
        }
        
        // Format as +58XXX-XXXXXXX
        if (value.startsWith('+58') && value.length > 6) {
            value = value.replace(/(\+58)(\d{3})(\d{7})/, '$1$2-$3');
        }
        
        input.value = value;
    }

    // Validate customer form before payment
    validateCustomerForm() {
        const form = document.getElementById('customerForm');
        if (!form) return true;

        const requiredFields = form.querySelectorAll('input[required], textarea[required]');
        let allValid = true;

        requiredFields.forEach(field => {
            const isValid = this.validateField(field);
            if (!isValid) allValid = false;
        });

        if (!allValid) {
            api.showNotification('Por favor completa todos los campos requeridos del formulario', 'warning');
            form.scrollIntoView({ behavior: 'smooth' });
        }

        return allValid;
    }

    // Collect customer data
    getCustomerData() {
        const form = document.getElementById('customerForm');
        if (!form) return null;

        return {
            sender: {
                name: document.getElementById('senderName')?.value || '',
                lastName: document.getElementById('senderLastName')?.value || '',
                phone: document.getElementById('senderPhone')?.value || ''
            },
            recipient: {
                name: document.getElementById('recipientName')?.value || '',
                phone: document.getElementById('recipientPhone')?.value || ''
            },
            delivery: {
                address: document.getElementById('deliveryAddress')?.value || '',
                message: document.getElementById('personalMessage')?.value || ''
            },
            calculator: {
                bcvRate: this.bcvRate,
                totalUSD: this.order?.total_amount || 0,
                totalBs: (this.order?.total_amount || 0) * this.bcvRate
            }
        };
    }
}

// Initialize payment manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.paymentManager = new PaymentManager();
});