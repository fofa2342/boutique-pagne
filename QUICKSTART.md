# ⚡ QUICK START GUIDE

Get your application running in 5 minutes!

## 🚀 Prerequisites

- Node.js 18+ installed
- MySQL 8+ running
- Git installed

## 📝 Step-by-Step Setup

### 1️⃣ Install Dependencies (1 min)

```bash
npm install
```

### 2️⃣ Generate Secure Session Secret (30 sec)

```bash
node scripts/generate-secret.js
```

Copy the generated secret (you'll need it in step 3).

### 3️⃣ Configure Environment (1 min)

```bash
cp .env.example .env
nano .env  # or use your preferred editor
```

Update these values:
```env
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASS=your-database-password
DB_NAME=marche
DB_PORT=25881

SESSION_SECRET=paste-the-generated-secret-here

NODE_ENV=development
```

### 4️⃣ Create Database (2 min)

```sql
CREATE DATABASE marche CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then run the schema SQL from README.md or import your backup.

### 5️⃣ Create Admin User (1 min)

Generate password hash:
```bash
node scripts/hash-password.js YourSecurePassword123!
```

Insert into database:
```sql
USE marche;
INSERT INTO users (username, password, role, status) 
VALUES ('admin', 'paste-hash-here', 'superadmin', 'active');
```

### 6️⃣ Start Application (30 sec)

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### 7️⃣ Access Application

Open browser: http://localhost:2000

Login with:
- Username: `admin`
- Password: `YourSecurePassword123!`

---

## ✅ Verify Installation

### Check Health Endpoint
```bash
curl http://localhost:2000/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-12-18T...",
  "uptime": 10,
  "environment": "development"
}
```

### Check Database Connection
Look for in terminal:
```
✅ Database connected successfully
🚀 Serveur lancé sur http://localhost:2000
```

---

## 🐛 Common Issues

### Issue: "Missing required database environment variables"
**Solution:** Check your .env file exists and has all required DB_* variables

### Issue: "SESSION_SECRET must be set"
**Solution:** Run `node scripts/generate-secret.js` and add to .env

### Issue: "Database connection failed"
**Solution:** 
- Verify MySQL is running: `sudo systemctl status mysql`
- Check credentials in .env
- Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Issue: Port already in use
**Solution:** Change PORT in .env to a different number (e.g., 3000, 8080)

### Issue: Cannot login
**Solution:** 
- Verify user exists: `SELECT * FROM users WHERE username='admin';`
- Check status is 'active'
- Verify password hash is correct

---

## 📚 Next Steps

After successful installation:

1. ✅ **Security:** Review [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md) before production
2. ✅ **Documentation:** Read full [README.md](README.md) for features
3. ✅ **Testing:** Create test data for clients, products, suppliers
4. ✅ **Customization:** Update branding, colors in public/css/styles.css

---

## 🆘 Need Help?

1. Check [README.md](README.md) for detailed documentation
2. Review [FIXES_SUMMARY.md](FIXES_SUMMARY.md) for recent changes
3. Check logs in `logs/error.log` and `logs/combined.log`
4. Verify environment with `/health` endpoint

---

## 🎉 You're Ready!

Your secure inventory management system is now running. 

**Default Features Available:**
- ✅ Dashboard with statistics
- ✅ Product management
- ✅ Client management
- ✅ Supplier management
- ✅ Sales processing
- ✅ Stock tracking
- ✅ User management (admin)

Enjoy! 🚀
