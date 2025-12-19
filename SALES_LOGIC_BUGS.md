# Sales Logic - Bugs and Issues Report

**Date:** 2024  
**Scope:** Sales transaction processing in `ventesController.js` and `venteModel.js`  
**Severity Levels:** CRITICAL | HIGH | MEDIUM | LOW

---

## CRITICAL ISSUES

### 1. **Race Condition: Stock Updates Without Transactions**
**Location:** [controllers/ventesController.js](controllers/ventesController.js#L228-L242)  
**Severity:** CRITICAL  
**Impact:** Data corruption, overselling, inventory inaccuracy

**Problem:**
The `traiterVente` function performs stock updates WITHOUT database transactions. Each operation is independent:
```javascript
// Line 228-242: Separate, non-atomic operations
for (const detail of detailsVente) {
  await addVenteDetail(detail);  // Operation 1
  
  const produit = await getProduitById(detail.produit_id);  // Operation 2
  const currentStock = parseInt(produit.quantite_stock);
  const newStock = currentStock - parseInt(detail.quantite);
  
  await updateStock(detail.produit_id, newStock);  // Operation 3 - NO ROW LOCK
}
```

**Issues:**
- No `BEGIN TRANSACTION` / `COMMIT` / `ROLLBACK`
- No row-level locking (`FOR UPDATE`)
- If sale creation succeeds but stock update fails → inconsistent state
- Two concurrent sales can read same stock value → overselling
- No rollback mechanism if payment fails after stock reduced

**Example Failure Scenario:**
1. Product has 10 units in stock
2. Sale A reads stock: 10 units
3. Sale B reads stock: 10 units (before A updates)
4. Sale A sells 8 units → updates stock to 2
5. Sale B sells 8 units → updates stock to 2
6. **RESULT: Sold 16 units, only had 10** ❌

**Solution Required:** Use `utils/transactions.js::processSaleWithTransaction()` which implements proper locking

---

### 2. **Data Inconsistency: Vente Created With Wrong Payment Values**
**Location:** [controllers/ventesController.js](controllers/ventesController.js#L217-L222)  
**Severity:** CRITICAL  
**Impact:** Financial reporting errors, incorrect customer balances

**Problem:**
Sale record is ALWAYS created with `montant_paye = 0` and `reste = total_ttc`, even when payments are provided:
```javascript
// Lines 164-192: Code calculates correct payment amounts
const montantTotalPaye = Math.min(total_ttc, totalFromPayments);
const monnaieRendue = Math.max(0, montantDonne - montantTotalPaye);
const reste = total_ttc - montantTotalPaye;

// Lines 217-222: BUT then ignores the calculations!
const venteId = await createVente({
  client_id,
  date_vente: new Date(),
  total_ht,
  tax: 0,
  total_ttc,
  montant_paye: 0,        // ❌ ALWAYS 0 - WRONG!
  reste: total_ttc        // ❌ ALWAYS FULL AMOUNT - WRONG!
});

// Lines 245-268: Payments added LATER, updating vente asynchronously
for (const paiement of listePaiements) {
  await addPaiement({ vente_id: venteId, montant: paiement.montant, mode: paiement.mode });
}
```

**Issues:**
- Vente record doesn't reflect actual payment status at creation
- Reporting queries see incorrect `montant_paye` until async payment updates complete
- Race condition: if process crashes between vente creation and payment recording → lost payments
- Customer shown wrong balance initially

**Correct Approach:**
```javascript
const venteId = await createVente({
  client_id,
  date_vente: new Date(),
  total_ht,
  tax: 0,
  total_ttc,
  montant_paye: montantTotalPaye,  // ✅ Use calculated value
  reste: reste                     // ✅ Use calculated value
});
```

---

### 3. **Concurrent Payment Race Condition**
**Location:** [controllers/ventesController.js](controllers/ventesController.js#L339-L368)  
**Severity:** CRITICAL  
**Impact:** Overpayment, double payment, incorrect balances

**Problem:**
The `ajouterPaiement` function doesn't lock the vente row before checking the remaining balance:
```javascript
// Line 347-352: No transaction, no row lock
const vente = await getVenteById(id);

if (!vente) {
  return res.status(404).json({ error: "Vente non trouvée" });
}

const montantNum = parseFloat(montant);
const resteActuel = parseFloat(vente.reste);

// Line 357-362: Check happens BEFORE lock
if (montantNum > resteActuel) {
  req.flash('error_msg', `Le montant (${montantNum}) dépasse le reste à payer (${resteActuel})`);
  return res.redirect(`/ventes/${id}`);
}

await addPaiement({ vente_id: id, montant: montantNum, mode });
```

**Issues:**
- Two clerks can simultaneously add payments for same sale
- Both read `reste = 100`, both add 100 → total paid = 200 for 100 sale
- No `SELECT ... FOR UPDATE` to lock row during payment processing

**Example Failure Scenario:**
1. Sale total: $100, reste: $100
2. Clerk A: GET vente → reste = $100
3. Clerk B: GET vente → reste = $100
4. Clerk A: Add payment $100 → reste becomes $0
5. Clerk B: Add payment $100 → reste becomes -$100 ❌
6. **RESULT: Customer paid $200 for $100 sale**

---

## HIGH SEVERITY ISSUES

### 4. **Stock Validation After Parsing, Not Before**
**Location:** [controllers/ventesController.js](controllers/ventesController.js#L118-L149)  
**Severity:** HIGH  
**Impact:** Possible overselling if validation bypassed

**Problem:**
Stock is checked INSIDE the product loop. If one product fails validation after others succeeded, no rollback occurs:
```javascript
// Line 118-149: Loop validates one-by-one
for (const item of produitsArray) {
  const produit = await getProduitById(item.produit_id);
  
  // Line 137-139: Check happens mid-loop
  if (qty > produit.quantite_stock) {
    logger.warn('Insufficient stock', { 
      productId: item.produit_id, 
      requested: qty, 
      available: produit.quantite_stock 
    });
    return res.status(400).json({ 
      error: `Stock insuffisant pour ${produit.nom}. Disponible: ${produit.quantite_stock}, Demandé: ${qty}` 
    });
  }
  
  detailsVente.push({ /* ... */ });
  total_ht += subtotal;
}
```

**Issues:**
- If product #3 fails stock check, products #1 and #2 already processed
- Without transactions, partial data may remain in `detailsVente` array
- Better to validate ALL products BEFORE starting any database writes

**Better Approach:**
1. First loop: Validate ALL products (stock, existence, prices)
2. Second loop: Execute writes in transaction

---

### 5. **Tax Calculation Disabled But Field Still Used**
**Location:** [controllers/ventesController.js](controllers/ventesController.js#L150-L157)  
**Severity:** HIGH  
**Impact:** Future tax implementation will be complex

**Problem:**
```javascript
// Line 150-157: Tax calculation commented out
// SUPPRIMER LE CALCUL DE TAXE
// const taxPercent = 0.18; 
// const tax = total_ht * taxPercent;
// const total_ttc = total_ht + tax;

const tax = 0;
const total_ttc = total_ht;
```

**Issues:**
- Database still has `tax` column in `vente` table
- Always set to 0, making column meaningless
- If tax needs to be added later, historical data will be incorrect
- No migration path to add tax to existing sales
- Revenue reports may be wrong if tax expected

**Recommendation:**
Either:
1. Remove `tax` column from database entirely (breaking change)
2. Implement proper tax calculation
3. Add configuration flag for tax-enabled regions

---

### 6. **Duplicate Payment System - Confusing Logic**
**Location:** [controllers/ventesController.js](controllers/ventesController.js#L164-L192)  
**Severity:** HIGH  
**Impact:** Code complexity, maintenance nightmare, potential bugs

**Problem:**
The system has TWO payment input methods that both try to work simultaneously:
```javascript
// Method 1: listePaiements array (lines 164-179)
let listePaiements = [];
try {
  listePaiements = typeof req.body.listePaiements === 'string' 
    ? JSON.parse(req.body.listePaiements) 
    : (Array.isArray(req.body.listePaiements) ? req.body.listePaiements : []);
} catch (parseErr) {
  logger.error('Error parsing listePaiements', { error: parseErr.message });
  listePaiements = [];
}

// Method 2: Single montant_paye field (lines 180-184)
const montantPaye = parseFloat(req.body.montant_paye) || 0;
const montantDonne = parseFloat(req.body.montant_donne) || 0;

// Lines 185-192: Calculate total from BOTH sources
let montantTotalPaye = 0;
if (listePaiements.length > 0) {
  montantTotalPaye = listePaiements.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0);
} else if (montantPaye > 0) {
  montantTotalPaye = montantPaye;  // Fallback to old method
}

if (montantTotalPaye > total_ttc) {
  montantTotalPaye = total_ttc;  // Cap at total
}
```

**Issues:**
- Which payment method is authoritative? Both? First one?
- Frontend must know to send EITHER `listePaiements` OR `montant_paye`, not both
- What if frontend sends both? Which wins?
- `montant_donne` only used when NOT using `listePaiements`
- Change calculation (`monnaieRendue`) only works for single-payment method
- No clear documentation on which method to use

**Recommendation:**
Choose ONE payment input method:
- Either: Multiple payments → use only `listePaiements`
- Or: Single payment → use only `montant_paye` + `montant_donne`
- Remove the other to prevent confusion

---

## MEDIUM SEVERITY ISSUES

### 7. **No Validation for Payment Mode**
**Location:** [controllers/ventesController.js](controllers/ventesController.js#L245-L268)  
**Severity:** MEDIUM  
**Impact:** Invalid payment modes in database

**Problem:**
```javascript
// Line 245-268: Payment mode not validated
for (const paiement of listePaiements) {
  await addPaiement({
    vente_id: venteId,
    montant: paiement.montant,
    mode: paiement.mode  // ❌ No validation - could be anything
  });
}
```

**Issues:**
- Frontend can send ANY string as payment mode
- Database may contain: "cash", "Cash", "CASH", "money", "espèces", etc.
- Reports filtering by payment mode will be inconsistent
- No enum constraint in database or code

**Solution:**
```javascript
const VALID_PAYMENT_MODES = ['cash', 'card', 'transfer', 'check'];
const mode = VALID_PAYMENT_MODES.includes(paiement.mode) ? paiement.mode : 'cash';
```

---

### 8. **Money Precision Issues - Using parseFloat**
**Location:** [controllers/ventesController.js](controllers/ventesController.js#L133-L145)  
**Severity:** MEDIUM  
**Impact:** Rounding errors in financial calculations

**Problem:**
```javascript
// Line 133-145: Financial calculations with floating point
const prixVente = parseFloat(produit.prix_vente);
const prixAchat = parseFloat(produit.prix_achat);
const subtotal = prixVente * qty;
const marge = (prixVente - prixAchat) * qty;

total_ht += subtotal;
```

**Issues:**
- JavaScript `parseFloat` has precision issues: 0.1 + 0.2 = 0.30000000000000004
- Financial calculations should use integers (cents) or `Decimal` library
- Rounding errors accumulate over many sales
- `total_ht` may not match sum of subtotals after many iterations

**Example:**
```javascript
let total = 0;
for (let i = 0; i < 1000; i++) {
  total += 0.1;  // Should be 100.0
}
console.log(total);  // 99.99999999999997 ❌
```

**Solution:**
- Store amounts as integers (cents): $10.50 → 1050 cents
- Or use library like `decimal.js` or `big.js`
- Database: DECIMAL(10,2) not FLOAT

---

### 9. **Vente Deletion Doesn't Restore Stock**
**Location:** [controllers/ventesController.js](controllers/ventesController.js#L373-L387)  
**Severity:** MEDIUM  
**Impact:** Inventory inaccuracy after sale deletion

**Problem:**
```javascript
// Line 373-387: Delete sale without stock restoration
export async function deleteVenteController(req, res) {
  try {
    const id = parseInt(req.params.id);
    const deleted = await deleteVente(id);  // Deletes vente + details + payments
    
    if (deleted) {
      req.flash('success_msg', 'Vente supprimée avec succès');
      res.redirect('/ventes');
    } else {
      req.flash('error_msg', 'Vente introuvable');
      res.redirect('/ventes');
    }
  } catch (error) {
    logger.error('Error deleting vente', { error: error.message });
    req.flash('error_msg', 'Erreur lors de la suppression');
    res.redirect('/ventes');
  }
}
```

**Issues:**
- Sale deleted from database
- Stock quantity NOT restored (products still marked as sold)
- If sale of 10 units deleted → those 10 units lost forever
- Inventory count will be permanently wrong

**Solution:**
Before deleting vente:
1. Get all `vente_details` for that sale
2. For each product sold, add quantity back to stock
3. Then delete vente records
4. Wrap in transaction

---

### 10. **Model addPaiement Has Complex Logic - Should Be in Controller**
**Location:** [models/venteModel.js](models/venteModel.js#L39-L73)  
**Severity:** MEDIUM  
**Impact:** Separation of concerns violation, hard to test

**Problem:**
```javascript
// models/venteModel.js line 39-73: Business logic in data layer
export async function addPaiement(paiement) {
  const { vente_id, montant, mode } = paiement;

  // 1. Insert payment
  await pool.execute(
    `INSERT INTO paiement (vente_id, montant, mode) VALUES (?, ?, ?)`,
    [vente_id, montant, mode]
  );

  // 2. Recalculate total from database
  const [rows] = await pool.execute(
    `SELECT SUM(montant) as total_paye FROM paiement WHERE vente_id = ?`,
    [vente_id]
  );
  const totalPayeReel = parseFloat(rows[0].total_paye) || 0;

  // 3. Get vente total
  const [ventes] = await pool.execute(
    `SELECT total_ttc FROM vente WHERE id_vente = ?`,
    [vente_id]
  );
  const venteActuelle = ventes[0];

  if (venteActuelle) {
    const totalTTC = parseFloat(venteActuelle.total_ttc) || 0;
    const nouveauMontantPaye = Math.min(totalTTC, totalPayeReel);  // Cap at total
    const nouveauReste = Math.max(0, totalTTC - nouveauMontantPaye);

    // 4. Update vente
    await pool.execute(
      `UPDATE vente SET montant_paye = ?, reste = ? WHERE id_vente = ?`,
      [nouveauMontantPaye, nouveauReste, vente_id]
    );
  }
}
```

**Issues:**
- Model should only do CRUD (Create, Read, Update, Delete)
- Business logic (payment capping, reste calculation) belongs in controller
- Makes testing difficult - can't mock intermediate queries
- Violates single responsibility principle
- Code duplication with controller payment logic

**Recommendation:**
- Move calculation logic to controller
- Model function should just INSERT payment
- Controller calculates new totals and calls separate UPDATE function

---

## LOW SEVERITY ISSUES

### 11. **Inconsistent Error Handling - Mix of JSON and Redirects**
**Location:** [controllers/ventesController.js](controllers/ventesController.js#L76-L280)  
**Severity:** LOW  
**Impact:** Frontend compatibility issues

**Problem:**
```javascript
// Some errors return JSON (Line 139)
return res.status(400).json({ error: `Stock insuffisant...` });

// Other errors use flash + redirect (Line 197)
req.flash('error_msg', 'Aucun produit fourni');
return res.redirect('/ventes/nouveau');

// Some use render (Line 272-280)
res.render('successVente', { vente: { id_vente: venteId, monnaieRendue } });
```

**Issues:**
- API route should be consistent
- JSON responses can't show flash messages
- Redirects don't work with AJAX requests
- Frontend doesn't know which error format to expect

**Solution:**
Choose ONE pattern for POST routes:
- Either: Always return JSON (for AJAX)
- Or: Always redirect with flash (for server-rendered forms)

---

### 12. **Magic Strings - Payment Modes Not Constants**
**Location:** [controllers/ventesController.js](controllers/ventesController.js#L252)  
**Severity:** LOW  
**Impact:** Typos, maintenance difficulty

**Problem:**
```javascript
// Line 252: Magic string 'cash'
mode: paiement.mode || 'cash'

// Payment modes scattered throughout code
// "cash", "card", "transfer", "check" - no single source of truth
```

**Issues:**
- Typo "csah" instead of "cash" → silent bug
- If adding new payment mode, must update multiple files
- No autocomplete in IDE

**Solution:**
```javascript
// constants/paymentModes.js
export const PAYMENT_MODES = {
  CASH: 'cash',
  CARD: 'card',
  TRANSFER: 'transfer',
  CHECK: 'check'
};

// Usage
mode: paiement.mode || PAYMENT_MODES.CASH
```

---

### 13. **DEBUG Flag Not Used Consistently**
**Location:** [controllers/ventesController.js](controllers/ventesController.js#L6)  
**Severity:** LOW  
**Impact:** Unnecessary logging in production

**Problem:**
```javascript
// Line 6: DEBUG flag exists
const DEBUG = process.env.NODE_ENV !== 'production';

// But not used everywhere
logger.info('DEBUG traiterVente', { total_ht, total_ttc });  // Line 159
// Should be: if (DEBUG) logger.info(...)
```

**Issues:**
- Debug logs run in production
- Performance impact from excessive logging
- Sensitive data may leak in logs

---

## SUMMARY

### Critical Issues (Fix Immediately)
1. ❌ No database transactions → race conditions, overselling
2. ❌ Vente created with wrong payment values → financial errors
3. ❌ Concurrent payment race condition → overpayment possible

### High Priority
4. ⚠️ Stock validation happens too late
5. ⚠️ Tax field unused but present
6. ⚠️ Duplicate payment systems confusing

### Medium Priority
7. Payment mode not validated
8. Floating point precision issues
9. Sale deletion doesn't restore stock
10. Business logic in model layer

### Low Priority
11. Inconsistent error responses
12. Magic strings for payment modes
13. Debug flag not used properly

---

## RECOMMENDED FIX STRATEGY

### Phase 1: Critical Data Integrity (DO THIS FIRST)
1. **Use existing transaction utility:** Replace `traiterVente` logic with `utils/transactions.js::processSaleWithTransaction()`
2. **Fix vente creation:** Pass correct `montant_paye` and `reste` values
3. **Add row locking:** Wrap `ajouterPaiement` in transaction with `FOR UPDATE`

### Phase 2: High Priority Logic Fixes
4. Validate all products before database writes
5. Decide on payment input method (single vs multiple)
6. Add payment mode validation

### Phase 3: Financial Accuracy
7. Consider decimal library for money calculations
8. Implement stock restoration on sale deletion
9. Move business logic from model to controller

### Phase 4: Code Quality
10. Standardize error handling
11. Extract constants
12. Clean up debug logging

---

**CRITICAL:** Issues 1, 2, and 3 can cause financial loss and data corruption. Fix these before deploying to production.
