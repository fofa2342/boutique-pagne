// middleware/validators.js
import { body, param, query, validationResult } from 'express-validator';

// Utility to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    req.flash('error_msg', errorMessages);
    return res.redirect('back');
  }
  next();
};

// Client validation rules
export const validateClient = [
  body('nom')
    .trim()
    .notEmpty().withMessage('Le nom est obligatoire')
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Le nom contient des caractères invalides'),
  body('telephone')
    .trim()
    .notEmpty().withMessage('Le téléphone est obligatoire')
    .matches(/^[\d\s\-+()]+$/).withMessage('Format de téléphone invalide')
    .isLength({ min: 8, max: 20 }).withMessage('Le téléphone doit contenir entre 8 et 20 caractères'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Format d\'email invalide')
    .normalizeEmail(),
  body('adresse')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 }).withMessage('L\'adresse est trop longue'),
  handleValidationErrors
];

// Product validation rules
export const validateProduct = [
  body('nom')
    .trim()
    .notEmpty().withMessage('Le nom du produit est obligatoire')
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('La description est trop longue'),
  body('prix_achat')
    .notEmpty().withMessage('Le prix d\'achat est obligatoire')
    .isFloat({ min: 0 }).withMessage('Le prix d\'achat doit être un nombre positif')
    .toFloat(),
  body('prix_vente')
    .notEmpty().withMessage('Le prix de vente est obligatoire')
    .isFloat({ min: 0 }).withMessage('Le prix de vente doit être un nombre positif')
    .toFloat()
    .custom((value, { req }) => {
      if (parseFloat(value) < parseFloat(req.body.prix_achat)) {
        throw new Error('Le prix de vente doit être supérieur au prix d\'achat');
      }
      return true;
    }),
  body('quantite_stock')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }).withMessage('La quantité doit être un nombre entier positif')
    .toInt(),
  body('seuil_alerte')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }).withMessage('Le seuil d\'alerte doit être un nombre entier positif')
    .toInt(),
  handleValidationErrors
];

// Stock movement validation
export const validateStockEntry = [
  body('produit_id')
    .notEmpty().withMessage('Le produit est obligatoire')
    .isInt({ min: 1 }).withMessage('ID de produit invalide')
    .toInt(),
  body('quantite')
    .notEmpty().withMessage('La quantité est obligatoire')
    .isInt({ min: 1 }).withMessage('La quantité doit être un nombre entier positif')
    .toInt(),
  body('fournisseur_nom')
    .trim()
    .notEmpty().withMessage('Le nom du fournisseur est obligatoire')
    .isLength({ min: 2, max: 100 }).withMessage('Le nom du fournisseur doit contenir entre 2 et 100 caractères'),
  body('raison')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 }).withMessage('La raison est trop longue'),
  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Les notes sont trop longues'),
  body('prix_achat')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('Le prix d\'achat doit être un nombre positif')
    .toFloat(),
  handleValidationErrors
];

// Supplier validation rules
export const validateSupplier = [
  body('nom')
    .trim()
    .notEmpty().withMessage('Le nom du fournisseur est obligatoire')
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('telephone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[\d\s\-+()]+$/).withMessage('Format de téléphone invalide'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Format d\'email invalide')
    .normalizeEmail(),
  body('pays')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Le nom du pays est trop long'),
  handleValidationErrors
];

// User registration validation
export const validateUserRegistration = [
  body('username')
    .trim()
    .notEmpty().withMessage('Le nom d\'utilisateur est obligatoire')
    .isLength({ min: 3, max: 50 }).withMessage('Le nom d\'utilisateur doit contenir entre 3 et 50 caractères')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'),
  body('password')
    .notEmpty().withMessage('Le mot de passe est obligatoire')
    .isLength({ min: 12 }).withMessage('Le mot de passe doit contenir au moins 12 caractères')
    .matches(/[a-z]/).withMessage('Le mot de passe doit contenir au moins une minuscule')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule')
    .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Le mot de passe doit contenir au moins un caractère spécial'),
  handleValidationErrors
];

// Login validation
export const validateLogin = [
  body('username')
    .trim()
    .notEmpty().withMessage('Le nom d\'utilisateur est obligatoire'),
  body('password')
    .notEmpty().withMessage('Le mot de passe est obligatoire'),
  handleValidationErrors
];

// ID parameter validation
export const validateId = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID invalide')
    .toInt(),
  handleValidationErrors
];

// Sale validation
export const validateSale = [
  body('produits')
    .notEmpty().withMessage('Au moins un produit doit être sélectionné'),
  body('client_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('ID de client invalide')
    .toInt(),
  body('montant_paye')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('Le montant payé doit être un nombre positif')
    .toFloat(),
  body('montant_donne')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('Le montant donné doit être un nombre positif')
    .toFloat(),
  handleValidationErrors
];

// Payment validation
export const validatePayment = [
  body('montant')
    .notEmpty().withMessage('Le montant est obligatoire')
    .isFloat({ min: 0.01 }).withMessage('Le montant doit être supérieur à 0')
    .toFloat(),
  body('mode')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['cash', 'card', 'transfer', 'check']).withMessage('Mode de paiement invalide'),
  handleValidationErrors
];
