// app.js
import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import methodOverride from 'method-override';
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import bcrypt from 'bcryptjs';
import { findUserByUsername, findUserById } from './models/userModel.js';
import clientsRoutes from "./routes/clients.js";
import fournisseursRoutes from "./routes/fournisseurs.js";
import produitsRoutes from "./routes/produits.js";
import dashboardRoutes from "./routes/dashboard.js";
import ventesRoutes from "./routes/ventes.js";
import authRoutes from './routes/auth.js';
import flash from 'connect-flash';
import { isAuthenticated, authorizeRoles } from './middleware/authMiddleware.js';



const app = express();
const PORT = process.env.PORT || 3000;

// Pour __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(session({
    secret: 'secret', // Change this to a random string
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Middleware to pass flash messages to views
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null; // Make user object available in templates
    next();
});


// Passport configuration
passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            const user = await findUserByUsername(username);
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        } catch (err) {
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
app.use(express.static(path.join(__dirname, 'public')));

// Vue EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes

app.use('/auth', authRoutes);

// Route racine - Redirection vers le dashboard
app.get("/", isAuthenticated, (req, res) => {
  res.redirect("/dashboard"); // ← Redirection simple
});


// Apply isAuthenticated to all main application routes

app.use("/dashboard", isAuthenticated, dashboardRoutes);

app.use("/clients", isAuthenticated, authorizeRoles('admin'), clientsRoutes);

app.use("/fournisseurs", isAuthenticated, authorizeRoles('admin'), fournisseursRoutes);

app.use("/produits", isAuthenticated, authorizeRoles('admin'), produitsRoutes);

app.use("/ventes", isAuthenticated, ventesRoutes);

// Route 404 simple
app.use((req, res) => {
  res.status(404).send(`
    <html>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #e74c3c;">Page non trouvée</h1>
        <p>La page que vous recherchez n'existe pas.</p>
        <a href="/" style="color: #3498db;">Retour à l'accueil</a>
      </body>
    </html>
  `);
});

// Gestion d'erreurs simple
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).send(`
    <html>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #e74c3c;">Erreur serveur</h1>
        <p>Une erreur s'est produite. Veuillez réessayer plus tard.</p>
        <a href="/" style="color: #3498db;">Retour à l'accueil</a>
      </body>
    </html>
  `);
});

// Serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});