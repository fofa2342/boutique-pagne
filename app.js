// app.js
import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import methodOverride from 'method-override';
import compression from 'compression';
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { findUserByUsername, findUserById } from './models/userModel.js';
import clientsRoutes from "./routes/clients.js";
import fournisseursRoutes from "./routes/fournisseurs.js";
import produitsRoutes from "./routes/produits.js";
import dashboardRoutes from "./routes/dashboard.js";
import ventesRoutes from "./routes/ventes.js";
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import flash from 'connect-flash';
import { isAuthenticated, authorizeRoles } from './middleware/authMiddleware.js';
import pool from './config/db.js';
import expressMySQLSession from 'express-mysql-session';
import logger from './config/logger.js';
import { escapeHtml, safeJson } from './utils/escapeHtml.js';

const MySQLStore = expressMySQLSession(session);

const app = express();
const PORT = process.env.PORT || 3000;

const isProd = process.env.NODE_ENV === 'production';
if (isProd) {
  // Needed for secure cookies when behind a proxy (Render/Heroku/Nginx, etc.)
  app.set('trust proxy', 1);
}

// Security: Remove X-Powered-By header
app.disable('x-powered-by');

// Security: Helmet middleware for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: isProd ? [] : null
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Logging: HTTP request logger
if (isProd) {
  app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  }));
} else {
  app.use(morgan('dev'));
}

// Compress responses (HTML/CSS/JS/JSON) to improve load time
app.use(compression());

// Pour __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(methodOverride('_method'));

const sessionStore = new MySQLStore({}, pool);

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret === 'CHANGE_ME__GENERATE_A_LONG_RANDOM_SECRET') {
  logger.error('[ERROR] SESSION_SECRET is not properly configured!');
  if (isProd) {
    throw new Error('SESSION_SECRET must be set to a secure random value in production');
  }
  logger.warn('[WARNING] Using insecure session secret in development mode');
}

app.use(session({
    secret: sessionSecret || 'dev-insecure-secret-DO-NOT-USE-IN-PRODUCTION',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    },
    name: 'sessionId' // Custom cookie name (security through obscurity)
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: 'Trop de requêtes. Veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware to pass flash messages and utilities to views
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null; // Make user object available in templates
    
    // Helper functions for templates
    res.locals.escapeHtml = escapeHtml;
    res.locals.safeJson = safeJson;
    
    next();
});


// Passport configuration
passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            const user = await findUserByUsername(username);
            if (!user) {
                logger.warn(`Failed login attempt for username: ${username}`);
                return done(null, false, { message: 'Nom d\'utilisateur ou mot de passe incorrect.' });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                logger.warn(`Failed login attempt (wrong password) for username: ${username}`);
                return done(null, false, { message: 'Nom d\'utilisateur ou mot de passe incorrect.' });
            }
            if (user.status !== 'active') {
                logger.warn(`Login attempt for inactive user: ${username}`);
                return done(null, false, { message: 'Votre compte est en attente d\'approbation par un administrateur.' });
            }
            logger.info(`Successful login for user: ${username}`);
            return done(null, user);
        } catch (err) {
            logger.error('Error during authentication:', err);
            return done(err);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await findUserById(id);
        if (user) {
            done(null, user);
            // Store user in session and make available to views
        } else {
            done(null, false);
        }
    } catch (err) {
        done(err);
    }
});


// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: isProd ? '7d' : 0,
  etag: true,
}));

// Vue EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes

// Apply rate limiting to auth routes
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);
app.use('/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route racine - Redirection vers le dashboard
app.get("/", isAuthenticated, (req, res) => {
  res.redirect("/dashboard");
});

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Apply isAuthenticated to all main application routes
app.use("/dashboard", isAuthenticated, dashboardRoutes);

app.use("/clients", isAuthenticated, authorizeRoles('admin'), clientsRoutes);

app.use("/fournisseurs", isAuthenticated, authorizeRoles('admin'), fournisseursRoutes);

app.use("/produits", isAuthenticated, authorizeRoles('admin'), produitsRoutes);

app.use("/admin", isAuthenticated, authorizeRoles('admin'), adminRoutes);

app.use("/ventes", isAuthenticated, ventesRoutes);

// Route 404 simple
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).render('error', {
    title: 'Page non trouvée',
    message: 'Page non trouvée',
    error: { status: 404 }
  });
});

// Gestion d'erreurs centralisée
app.use((err, req, res, next) => {
  // Log error details
  logger.error('Application error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    user: req.user ? req.user.id : 'anonymous'
  });

  // Don't leak error details in production
  const errorMessage = isProd 
    ? 'Une erreur s\'est produite. Veuillez réessayer plus tard.'
    : err.message;

  const errorDetails = isProd ? {} : { stack: err.stack };

  // Check if it's an AJAX request
  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    return res.status(err.status || 500).json({
      error: errorMessage,
      ...errorDetails
    });
  }

  // Render error page
  res.status(err.status || 500).render('error', {
    title: 'Erreur',
    message: errorMessage,
    error: errorDetails
  });
});

// Serveur
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`[INFO] Environment: ${process.env.NODE_ENV || 'development'}`);
});