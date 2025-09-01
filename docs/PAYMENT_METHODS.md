# Métodos de Pago - FloresYa

## 💳 Métodos de Pago Soportados

La plataforma FloresYa está optimizada para el mercado venezolano e internacional, ofreciendo múltiples métodos de pago para facilitar las transacciones.

---

## 📱 Pago Móvil

### Bancos Soportados
- Banesco
- Mercantil
- Banco de Venezuela
- Provincial
- Bicentenario
- Banco del Tesoro
- Y otros bancos principales

### Proceso de Pago
1. **Cliente selecciona Pago Móvil**
2. **Llena formulario con**:
   - Banco emisor
   - Cédula de identidad
   - Teléfono asociado
   - Número de referencia del pago
3. **Sube comprobante** (captura de pantalla)
4. **Sistema registra pago** como "Pendiente"
5. **Admin verifica** y aprueba/rechaza

### Datos Requeridos
```json
{
  "bank": "Banesco",
  "cedula": "V-12345678",
  "phone": "04141234567",
  "reference_number": "987654321",
  "proof_image": "file_upload"
}
```

### Validaciones
- Formato de cédula venezolana
- Formato de teléfono móvil venezolano
- Banco debe estar en lista permitida
- Comprobante de pago obligatorio

---

## 🏦 Transferencia Bancaria

### Información de Cuenta
Configurable desde el panel de administración:
- **Banco**: Banesco / Mercantil / Provincial
- **Titular**: Nombre de la empresa
- **Número de Cuenta**: Cuenta corriente/ahorro
- **RIF**: Registro fiscal de la empresa

### Proceso de Pago
1. **Cliente ve datos de cuenta**
2. **Realiza transferencia** desde su banco
3. **Ingresa número de referencia**
4. **Sube comprobante** de la transferencia
5. **Admin verifica** contra estado de cuenta

### Datos Requeridos
```json
{
  "reference_number": "TRF123456789",
  "transfer_date": "2024-02-14",
  "proof_image": "file_upload"
}
```

---

## 💵 Zelle

### Configuración
- **Email de Zelle**: payments@floresya.com
- **Moneda**: USD únicamente
- **Disponibilidad**: Internacional

### Proceso de Pago
1. **Cliente ve email de Zelle**
2. **Envía pago** por Zelle
3. **Ingresa ID de confirmación** de Zelle
4. **Proporciona email** del remitente
5. **Admin verifica** en cuenta Zelle

### Datos Requeridos
```json
{
  "confirmation_id": "ZEL123456789",
  "sender_email": "cliente@ejemplo.com",
  "amount": 50.00
}
```

### Ventajas
- Pagos inmediatos
- Sin comisiones adicionales
- Ideal para clientes en el exterior

---

## ₿ Binance Pay

### Configuración
- **Usuario Binance**: FloresYaVE
- **Criptomonedas**: USDT, BUSD, BTC, ETH
- **Conversión**: Automática a USD

### Proceso de Pago
1. **Cliente ve usuario de Binance**
2. **Realiza pago** en Binance Pay
3. **Ingresa ID de transacción**
4. **Proporciona usuario** Binance emisor
5. **Admin verifica** en historial Binance

### Datos Requeridos
```json
{
  "transaction_id": "BNB123456789ABC",
  "sender_user": "ClienteBinance123",
  "amount": 50.00
}
```

### Ventajas
- Comisiones muy bajas
- Pagos internacionales
- Ideal para tech-savvy customers

---

## 🔧 Implementación Técnica

### Base de Datos

#### Tabla payment_methods
```sql
CREATE TABLE payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('pago_movil', 'bank_transfer', 'zelle', 'binance_pay') NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    configuration JSON,
    instructions TEXT
);
```

#### Tabla payments
```sql
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'verified', 'failed') DEFAULT 'pending',
    reference_number VARCHAR(255),
    payment_details JSON,
    proof_image_url VARCHAR(255),
    verified_by INT,
    verified_at TIMESTAMP NULL,
    notes TEXT
);
```

### API Endpoints

#### Crear Pago
```http
POST /api/payments
Content-Type: multipart/form-data
```

#### Verificar Pago (Admin)
```http
PATCH /api/payments/:id/verify
Authorization: Bearer <admin-token>

Body:
{
  "status": "verified|failed",
  "notes": "Observaciones del admin"
}
```

### Frontend Implementation

#### Formulario Dinámico
```javascript
// payment.js genera formularios específicos para cada método
class PaymentManager {
    getPaymentForm(method) {
        switch (method.type) {
            case 'pago_movil':
                return this.getPagoMovilForm(method);
            case 'bank_transfer':
                return this.getBankTransferForm(method);
            // ... otros métodos
        }
    }
}
```

---

## 📋 Flujo de Verificación

### Para Administradores

#### 1. Recibir Notificación
- Email automático de pago pendiente
- Badge en panel admin
- Lista de pagos pendientes

#### 2. Verificar Pago
- Ver comprobante subido
- Validar datos proporcionados
- Consultar estado de cuenta/plataforma
- Aprobar o rechazar

#### 3. Actualizar Estado
- Marcar como "Verificado" o "Rechazado"
- Agregar notas si es necesario
- Sistema envía email automático al cliente

### Estados de Pago
1. **Pending**: Pago registrado, esperando verificación
2. **Verified**: Pago confirmado por admin
3. **Failed**: Pago rechazado por admin
4. **Refunded**: Pago reembolsado (futuro)

---

## 🎨 Personalización

### Agregar Nuevo Método de Pago

#### 1. Base de Datos
```sql
INSERT INTO payment_methods (name, type, active, configuration, instructions) 
VALUES (
    'PayPal',
    'paypal',
    TRUE,
    '{"email": "payments@floresya.com"}',
    'Envía tu pago por PayPal y proporciona el ID de transacción'
);
```

#### 2. Backend (paymentController.js)
```javascript
// Agregar validación específica si es necesaria
const validatePayPalPayment = (paymentDetails) => {
    // Lógica de validación
};
```

#### 3. Frontend (payment.js)
```javascript
// Agregar formulario específico
getPayPalForm(method) {
    return `
        <form id="paymentForm">
            <!-- Campos específicos de PayPal -->
        </form>
    `;
}
```

### Configurar Comisiones
```sql
-- Agregar comisión por método de pago
ALTER TABLE payment_methods ADD COLUMN fee_percentage DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE payment_methods ADD COLUMN fee_fixed DECIMAL(10,2) DEFAULT 0.00;
```

---

## 📊 Reportes de Pagos

### Consultas Útiles

#### Pagos por Método
```sql
SELECT 
    pm.name,
    COUNT(*) as total_payments,
    SUM(p.amount) as total_amount
FROM payments p
JOIN payment_methods pm ON p.payment_method_id = pm.id
WHERE p.status = 'verified'
    AND p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY pm.id;
```

#### Pagos Pendientes
```sql
SELECT 
    o.order_number,
    p.amount,
    pm.name as payment_method,
    p.created_at,
    TIMESTAMPDIFF(HOUR, p.created_at, NOW()) as hours_pending
FROM payments p
JOIN orders o ON p.order_id = o.id
JOIN payment_methods pm ON p.payment_method_id = pm.id
WHERE p.status = 'pending'
ORDER BY p.created_at ASC;
```

#### Conversión de Pagos
```sql
SELECT 
    DATE(p.created_at) as date,
    COUNT(*) as attempts,
    SUM(CASE WHEN p.status = 'verified' THEN 1 ELSE 0 END) as verified,
    ROUND(SUM(CASE WHEN p.status = 'verified' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as conversion_rate
FROM payments p
WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(p.created_at)
ORDER BY date DESC;
```

---

## 🔮 Próximas Mejoras

### Integraciones Automáticas
- **API de Bancos**: Verificación automática de Pago Móvil
- **Webhook de Zelle**: Confirmación automática
- **Binance API**: Verificación de transacciones

### Métodos Adicionales
- **PayPal**: Para clientes internacionales
- **Stripe**: Tarjetas de crédito
- **Efectivo**: Pago contra entrega

### Optimizaciones
- **Cache de métodos**: Redis para configuraciones
- **Queue system**: Para procesamiento asíncrono
- **Notificaciones Push**: Alertas en tiempo real

---

**💡 Tip**: Mantén siempre actualizada la información de cuentas bancarias y emails en la configuración de métodos de pago.