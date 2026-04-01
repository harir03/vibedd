// [ARIA] Normalizer: Banking-specific log patterns
// Detects and categorizes banking transaction patterns in HTTP traffic

const bankingPatterns = {
    // Transaction endpoints
    transfer: /\/(?:api\/)?(?:transfer|send|pay|remit)/i,
    balance: /\/(?:api\/)?(?:balance|account|statement|ledger)/i,
    auth: /\/(?:api\/)?(?:login|auth|token|oauth|sso|session)/i,
    admin: /\/(?:api\/)?(?:admin|config|settings|manage|users)/i,
    card: /\/(?:api\/)?(?:card|pan|cvv|expiry)/i,

    // Sensitive data patterns in body/params
    panNumber: /\b(?:\d{4}[-\s]?){3}\d{4}\b/,          // Credit/debit card numbers
    aadhaar: /\b\d{4}\s?\d{4}\s?\d{4}\b/,              // Indian Aadhaar number
    ifsc: /\b[A-Z]{4}0[A-Z0-9]{6}\b/,                  // Indian IFSC code
    swift: /\b[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b/,  // SWIFT code
    amount: /(?:amount|value|sum|total|balance)['":\s]*(\d+(?:\.\d{2})?)/i,
};

// [ARIA] Classify the banking context of a request
function classifyBankingContext(data) {
    const uri = (data.uri || '').toLowerCase();
    const body = typeof data.body === 'string' ? data.body : JSON.stringify(data.body || '');
    const combined = `${uri} ${body}`;

    const context = {
        isFinancialTransaction: bankingPatterns.transfer.test(uri),
        isBalanceInquiry: bankingPatterns.balance.test(uri),
        isAuthentication: bankingPatterns.auth.test(uri),
        isAdminEndpoint: bankingPatterns.admin.test(uri),
        isCardOperation: bankingPatterns.card.test(uri),
        containsPAN: bankingPatterns.panNumber.test(combined),
        containsAadhaar: bankingPatterns.aadhaar.test(combined),
        containsSensitiveData: false,
        transactionAmount: null,
        isAfterHours: isAfterBankingHours(),
    };

    // Check for PII leakage
    context.containsSensitiveData = context.containsPAN || context.containsAadhaar;

    // Extract transaction amount if present
    const amountMatch = combined.match(bankingPatterns.amount);
    if (amountMatch) {
        context.transactionAmount = parseFloat(amountMatch[1]);
    }

    return context;
}

// [ARIA] Indian banking hours: 9:30 AM - 5:30 PM IST (Mon-Sat)
function isAfterBankingHours() {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60; // minutes
    const istMinutes = now.getUTCHours() * 60 + now.getUTCMinutes() + istOffset;
    const istHour = Math.floor(istMinutes / 60) % 24;
    const istDay = now.getUTCDay();

    // Sunday = 0
    if (istDay === 0) return true;                       // Sunday
    if (istHour < 9 || istHour >= 18) return true;       // Before 9 AM or after 6 PM
    return false;
}

module.exports = { classifyBankingContext, bankingPatterns, isAfterBankingHours };
