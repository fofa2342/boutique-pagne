# 🔒 SECURITY CHECKLIST - PRE-DEPLOYMENT

## ⚠️ CRITICAL - Must Complete Before Production

### 1. Environment Configuration
- [ ] Generate secure SESSION_SECRET (128+ characters)
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- [ ] Set NODE_ENV=production in production environment
- [ ] Verify .env is in .gitignore and NOT committed to git
- [ ] Remove .env from git history if previously committed:
  ```bash
  git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
  ```
- [ ] Rotate all database credentials after removing from git

### 2. Database Security
- [ ] Configure proper SSL/TLS certificate (set DB_SSL_CA path)
- [ ] Verify rejectUnauthorized is true in production
- [ ] Create database indexes on foreign keys:
  ```sql
  CREATE INDEX idx_produit_fournisseur ON produit(fournisseur_id);
  CREATE INDEX idx_vente_client ON vente(client_id);
  CREATE INDEX idx_vente_details_vente ON vente_details(vente_id);
  CREATE INDEX idx_vente_details_produit ON vente_details(produit_id);
  CREATE INDEX idx_mouvement_produit ON mouvement_stock(produit_id);
  CREATE INDEX idx_paiement_vente ON paiement(vente_id);
  ```
- [ ] Set up automated database backups
- [ ] Test database backup restoration procedure

### 3. User Security
- [ ] Change default admin password
- [ ] Create superadmin user with strong password
- [ ] Review and approve all pending users
- [ ] Disable or delete test users

### 4. Server Configuration
- [ ] Set up HTTPS with valid SSL certificate (Let's Encrypt or commercial)
- [ ] Configure reverse proxy (Nginx/Apache)
  - Enable HTTPS
  - Set up HTTP to HTTPS redirect
  - Configure proper headers
  - Enable gzip compression
- [ ] Configure firewall (allow only 80, 443, and SSH)
- [ ] Disable directory listing
- [ ] Set up fail2ban for SSH protection

### 5. Application Security
- [ ] Verify all validation middleware is in place
- [ ] Test rate limiting on login/register routes
- [ ] Verify XSS protection (escapeHtml usage)
- [ ] Test error handling (no sensitive data in error messages)
- [ ] Review all user inputs for validation
- [ ] Verify SQL injection protection (parameterized queries)

### 6. Monitoring & Logging
- [ ] Set up log rotation (logrotate)
- [ ] Configure log monitoring/alerting
- [ ] Set up application monitoring (PM2, New Relic, or similar)
- [ ] Configure uptime monitoring
- [ ] Set up error tracking (Sentry or similar)

### 7. Performance
- [ ] Enable production mode caching
- [ ] Verify compression is enabled
- [ ] Set up CDN for static assets (optional)
- [ ] Configure PM2 cluster mode
- [ ] Test load handling capacity

### 8. Compliance & Backup
- [ ] Document backup procedures
- [ ] Test backup restoration
- [ ] Set up offsite backup storage
- [ ] Document incident response procedures
- [ ] Review data retention policies

## 🔍 Security Testing Checklist

### Authentication & Authorization
- [ ] Test login rate limiting (should block after 5 attempts)
- [ ] Test password requirements (12+ chars, complexity)
- [ ] Verify inactive users cannot login
- [ ] Test role-based access (admin, user, superadmin)
- [ ] Verify session timeout works correctly
- [ ] Test logout functionality

### Input Validation
- [ ] Test SQL injection on all forms
- [ ] Test XSS attacks on text inputs
- [ ] Test file upload vulnerabilities (if applicable)
- [ ] Test parameter tampering (ID modification)
- [ ] Test negative numbers in quantity fields
- [ ] Test extremely long strings in text fields

### Business Logic
- [ ] Test overselling (selling more stock than available)
- [ ] Test concurrent stock updates (race conditions)
- [ ] Test negative stock scenarios
- [ ] Test payment amounts exceeding totals
- [ ] Test sale without products
- [ ] Test deletion cascades properly

### Error Handling
- [ ] Test 404 page
- [ ] Test 500 error page
- [ ] Verify no stack traces in production errors
- [ ] Test database connection failure handling
- [ ] Test invalid session handling

## 📋 Pre-Launch Checklist

### Code Review
- [ ] Remove all console.log debugging statements
- [ ] Remove commented-out code
- [ ] Review all TODO comments
- [ ] Verify no hardcoded credentials
- [ ] Check for exposed API keys

### Documentation
- [ ] Update README.md with deployment instructions
- [ ] Document environment variables
- [ ] Create runbook for common issues
- [ ] Document backup/restore procedures
- [ ] Create user manual

### Final Steps
- [ ] Run npm audit and fix vulnerabilities
- [ ] Update all dependencies to latest stable versions
- [ ] Test all critical user flows
- [ ] Perform load testing
- [ ] Create deployment checklist
- [ ] Schedule deployment window
- [ ] Prepare rollback plan

## 🚀 Deployment Steps

1. **Backup current production** (if updating)
2. **Pull latest code** to production server
3. **Install dependencies** (`npm ci --production`)
4. **Run database migrations** (if any)
5. **Test application** in staging environment
6. **Start application** with PM2
7. **Verify health endpoint** (`/health`)
8. **Monitor logs** for errors
9. **Test critical functionality**
10. **Monitor for 24 hours**

## 🔄 Post-Deployment

### Immediate (First Hour)
- [ ] Monitor error logs
- [ ] Check application performance
- [ ] Verify database connections
- [ ] Test user login/logout
- [ ] Test critical business operations

### First 24 Hours
- [ ] Monitor server resources (CPU, RAM, disk)
- [ ] Check for memory leaks
- [ ] Review error rates
- [ ] Monitor response times
- [ ] Check backup completion

### First Week
- [ ] Review security logs
- [ ] Analyze performance metrics
- [ ] Gather user feedback
- [ ] Monitor database growth
- [ ] Review and optimize slow queries

## 📞 Emergency Contacts

```
Lead Developer: [Name] - [Phone] - [Email]
System Admin: [Name] - [Phone] - [Email]
Database Admin: [Name] - [Phone] - [Email]
Manager: [Name] - [Phone] - [Email]
```

## 🆘 Rollback Procedure

If critical issues occur:

1. Stop the application
   ```bash
   pm2 stop all
   ```

2. Restore database backup
   ```bash
   mysql -u user -p database < backup.sql
   ```

3. Checkout previous stable version
   ```bash
   git checkout <previous-tag>
   npm ci --production
   ```

4. Restart application
   ```bash
   pm2 restart all
   ```

5. Verify functionality

6. Notify stakeholders

## ✅ Sign-Off

- [ ] Security Review Complete - _______________ Date: ___/___/___
- [ ] Technical Lead Approval - _______________ Date: ___/___/___
- [ ] Manager Approval - _______________ Date: ___/___/___

---

**Last Updated:** December 18, 2025
**Version:** 2.0.0
