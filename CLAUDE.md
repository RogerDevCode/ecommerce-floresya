# FloresYa - E-commerce Project Commands

## 🚀 Quick Start Commands

### Quick Demo (One Command)
```bash
# Install and run everything automatically
npm install && npm run demo
```

### Development
```bash
# Development with auto-reload  
npm run dev

# Production mode
npm start

# Reset database
npm run db:reset
```

### Testing & Quality
```bash
# Run tests
npm test

# Run linting
npm run lint

# Check database connection
npm run db:init
```

## 📁 Project Structure Quick Reference

- **Backend API**: `backend/src/server.js`
- **Frontend**: `frontend/index.html`  
- **Database**: `database/floresya.db` (SQLite - created automatically)
- **Admin Panel**: `frontend/pages/admin.html`
- **Payment Page**: `frontend/pages/payment.html`

## 🔐 Default Admin Credentials

- **Email**: admin@floresya.com
- **Password**: admin123
- **Admin Panel**: http://localhost:3000/pages/admin.html

## 📊 Key URLs

- **Homepage**: http://localhost:3000
- **API Health**: http://localhost:3000/api/health
- **Admin Panel**: http://localhost:3000/pages/admin.html
- **API Docs**: Available in `/docs/API_DOCUMENTATION.md`

## 🛠️ Database

- **SQLite**: No setup required, file created automatically
- **Location**: `database/floresya.db`
- **Pre-loaded**: Sample products, users, orders included

### Optional Environment Variables
Copy `.env.example` to `.env` for:
- JWT secret customization
- Email notifications (SMTP)
- Upload configurations

## 📦 Main Dependencies

- **Express.js**: Web framework
- **SQLite3**: Database (no installation required)
- **JWT**: Authentication
- **Nodemailer**: Email service  
- **Multer**: File uploads
- **Bootstrap 5**: Frontend framework