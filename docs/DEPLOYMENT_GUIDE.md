# Guía de Despliegue - FloresYa E-commerce

## 🎯 Opciones de Despliegue

### 1. Despliegue Local (Desarrollo)
### 2. VPS/Servidor Dedicado
### 3. Cloud Platforms (AWS, DigitalOcean, etc.)

---

## 🖥️ Despliegue Local

### Requisitos
- Node.js 16+ 
- MySQL 8.0+
- Git

### Pasos
```bash
# 1. Clonar repositorio
git clone <repository-url>
cd ecommerce-floresya

# 2. Instalar dependencias
npm install

# 3. Configurar base de datos
mysql -u root -p
CREATE DATABASE floresya_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

mysql -u root -p floresya_db < database/schema.sql
mysql -u root -p floresya_db < database/seed_data.sql

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 5. Crear directorio de uploads
mkdir -p uploads/payments

# 6. Ejecutar aplicación
npm run dev
```

**Acceder a:**
- Frontend: http://localhost:3000
- API: http://localhost:3000/api
- Admin Panel: http://localhost:3000/pages/admin.html

---

## 🌐 Despliegue en VPS

### Requisitos del Servidor
- **OS**: Ubuntu 20.04+ / CentOS 8+
- **RAM**: 2GB mínimo (4GB recomendado)
- **Storage**: 20GB mínimo
- **Ancho de banda**: Ilimitado o al menos 1TB/mes

### Software Necesario
- Node.js 18+
- MySQL 8.0+
- Nginx
- PM2 (Process Manager)
- Certbot (para SSL)

### Instalación Paso a Paso

#### 1. Preparar Servidor
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar utilidades básicas
sudo apt install -y curl wget git unzip htop

# Configurar firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

#### 2. Instalar Node.js
```bash
# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version
npm --version
```

#### 3. Instalar MySQL
```bash
# Instalar MySQL
sudo apt install -y mysql-server

# Configuración segura
sudo mysql_secure_installation

# Configurar MySQL
sudo mysql
```

```sql
-- Crear usuario para la aplicación
CREATE USER 'floresya_user'@'localhost' IDENTIFIED BY 'contraseña_segura';
CREATE DATABASE floresya_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON floresya_db.* TO 'floresya_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 4. Instalar Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 5. Instalar PM2
```bash
sudo npm install -g pm2
```

#### 6. Desplegar Aplicación
```bash
# Crear directorio para la aplicación
sudo mkdir -p /var/www/floresya
sudo chown $USER:$USER /var/www/floresya

# Clonar repositorio
cd /var/www/floresya
git clone <repository-url> .

# Instalar dependencias
npm install --production

# Crear estructura de archivos
mkdir -p uploads/payments
mkdir -p logs

# Configurar variables de entorno
cp .env.example .env
nano .env
```

#### 7. Configurar Variables de Entorno (.env)
```env
# Production Environment
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=floresya_db
DB_USER=floresya_user
DB_PASSWORD=contraseña_segura

# JWT
JWT_SECRET=clave_jwt_super_secreta_y_larga_para_produccion
JWT_EXPIRES_IN=7d

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### 8. Configurar Base de Datos
```bash
mysql -u floresya_user -p floresya_db < database/schema.sql
mysql -u floresya_user -p floresya_db < database/seed_data.sql
```

#### 9. Configurar Nginx

Crear archivo `/etc/nginx/sites-available/floresya`:
```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    root /var/www/floresya/frontend;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Handle frontend routes
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Body size limit for file uploads
        client_max_body_size 10M;
    }

    # Uploads directory
    location /uploads/ {
        alias /var/www/floresya/uploads/;
        expires 1y;
        add_header Cache-Control "public";
        access_log off;
    }

    # Admin panel
    location /pages/ {
        try_files $uri $uri/ =404;
    }

    # Security - hide sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ ^/(\.env|package\.json|node_modules|backend) {
        deny all;
    }
}
```

Activar sitio:
```bash
sudo ln -s /etc/nginx/sites-available/floresya /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 10. Iniciar Aplicación con PM2
```bash
cd /var/www/floresya

# Crear archivo ecosystem para PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'floresya',
    script: 'backend/src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    max_memory_restart: '500M',
    watch: false,
    ignore_watch: ['node_modules', 'uploads', 'logs']
  }]
};
EOF

# Iniciar aplicación
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### 11. SSL con Let's Encrypt
```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Verificar renovación automática
sudo certbot renew --dry-run
```

---

## ☁️ Despliegue en Cloud

### DigitalOcean Droplet

#### 1. Crear Droplet
- **Image**: Ubuntu 20.04 LTS
- **Size**: Basic $12/mes (2GB RAM, 1 vCPU, 50GB SSD)
- **Region**: New York / Amsterdam (según tu audiencia)

#### 2. Configuración Inicial
```bash
# Conectar por SSH
ssh root@tu_droplet_ip

# Crear usuario no-root
adduser floresya
usermod -aG sudo floresya
su - floresya

# Copiar SSH keys (opcional)
mkdir ~/.ssh
chmod 700 ~/.ssh
# Copiar tu public key a ~/.ssh/authorized_keys
```

#### 3. Seguir pasos del VPS anterior

### AWS EC2

#### 1. Lanzar Instancia EC2
- **AMI**: Ubuntu Server 20.04 LTS
- **Type**: t3.small (2 vCPUs, 2GB RAM)
- **Storage**: 20GB gp3
- **Security Group**: HTTP (80), HTTPS (443), SSH (22)

#### 2. Configurar Dominio
```bash
# Asociar Elastic IP
# Configurar Route 53 o tu DNS provider
```

#### 3. Seguir pasos del VPS

---

## 🔒 Configuraciones de Seguridad

### 1. Firewall (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. Fail2Ban (Protección SSH)
```bash
sudo apt install fail2ban -y

# Configurar jail local
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
```

### 3. Actualizaciones Automáticas
```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 📊 Monitoreo y Mantenimiento

### Logs
```bash
# Logs de PM2
pm2 logs floresya

# Logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs del sistema
sudo journalctl -u nginx
sudo journalctl -f
```

### Monitoreo de Recursos
```bash
# Monitoreo con PM2
pm2 monit

# Uso de disco
df -h

# Uso de memoria
free -h

# Procesos
htop
```

### Backup Automático
```bash
# Crear script de backup
cat > /home/floresya/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/floresya/backups"
mkdir -p $BACKUP_DIR

# Backup de base de datos
mysqldump -u floresya_user -p$DB_PASSWORD floresya_db > $BACKUP_DIR/db_backup_$DATE.sql

# Backup de uploads
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz -C /var/www/floresya uploads/

# Limpiar backups antiguos (más de 30 días)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completado: $DATE"
EOF

chmod +x /home/floresya/backup.sh

# Programar backup diario
crontab -e
# Agregar: 0 2 * * * /home/floresya/backup.sh >> /home/floresya/backup.log 2>&1
```

---

## 🔄 Actualizaciones

### Actualizar Aplicación
```bash
cd /var/www/floresya

# Backup actual
cp .env .env.backup

# Obtener últimos cambios
git pull origin main

# Instalar nuevas dependencias
npm install --production

# Reiniciar aplicación
pm2 restart floresya

# Verificar estado
pm2 status
```

### Migración de Base de Datos
```bash
# Si hay cambios en el esquema
mysql -u floresya_user -p floresya_db < database/migrations/migration_xxx.sql
```

---

## 🚨 Solución de Problemas

### Aplicación no Inicia
```bash
# Verificar logs
pm2 logs floresya --lines 50

# Verificar conexión a DB
mysql -u floresya_user -p floresya_db -e "SELECT 1;"

# Verificar variables de entorno
pm2 env 0
```

### Error de Conexión DB
```bash
# Verificar estado de MySQL
sudo systemctl status mysql

# Reiniciar MySQL
sudo systemctl restart mysql

# Verificar permisos de usuario
mysql -u root -p
SHOW GRANTS FOR 'floresya_user'@'localhost';
```

### Problemas de Permisos
```bash
# Verificar propietario de archivos
ls -la /var/www/floresya

# Corregir permisos
sudo chown -R floresya:floresya /var/www/floresya
chmod -R 755 /var/www/floresya
chmod -R 777 /var/www/floresya/uploads
```

### Nginx no Sirve Archivos
```bash
# Verificar configuración
sudo nginx -t

# Verificar logs
sudo tail -f /var/log/nginx/error.log

# Recargar configuración
sudo systemctl reload nginx
```

---

## 📈 Optimización para Producción

### 1. Configuración de MySQL
```sql
-- my.cnf optimizations
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
max_connections = 200
query_cache_type = 1
query_cache_size = 64M
```

### 2. PM2 Cluster Mode
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'floresya',
    script: 'backend/src/server.js',
    instances: 'max', // Usa todos los CPUs
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### 3. Nginx Caching
```nginx
# Agregar al bloque server
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# Cache para API responses (solo para datos estáticos)
location /api/categories {
    proxy_pass http://localhost:3000;
    proxy_cache_valid 200 1h;
}
```

---

## 🌍 Despliegue Multi-Región

### Configuración CDN
Usar **CloudFlare** o **AWS CloudFront** para:
- Cache global de assets
- Protección DDoS
- Optimización de imágenes

### Load Balancer
Para alta disponibilidad:
```nginx
upstream floresya_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    location /api/ {
        proxy_pass http://floresya_backend;
    }
}
```

---

## 🔐 Checklist de Seguridad

### Antes del Despliegue
- [ ] Cambiar todas las contraseñas por defecto
- [ ] Configurar JWT_SECRET fuerte
- [ ] Configurar SMTP con app passwords
- [ ] Verificar permisos de archivos
- [ ] Configurar firewall
- [ ] Instalar fail2ban
- [ ] Configurar SSL/TLS
- [ ] Verificar rate limiting
- [ ] Testear endpoints de seguridad
- [ ] Configurar backups automáticos

### Después del Despliegue
- [ ] Verificar funcionamiento completo
- [ ] Testear creación de órdenes
- [ ] Testear métodos de pago
- [ ] Verificar emails
- [ ] Testear panel admin
- [ ] Configurar monitoreo
- [ ] Documentar URLs y credenciales

---

## 📞 Contacto y Soporte

Para problemas de despliegue:
- Revisar logs primero
- Verificar configuraciones
- Consultar documentación de la API

**¡Tu floristería en línea estará lista para vender! 🌸**