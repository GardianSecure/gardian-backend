// fixes.js
module.exports = {
  "Content Security Policy (CSP) Header Not Set":
    "Risk: Without a CSP header, attackers can inject malicious scripts or styles. \
Fix: Add a Content-Security-Policy header restricting allowed sources for scripts, styles, and frames.",

  "Strict-Transport-Security Header Not Set":
    "Risk: Browsers may connect over insecure HTTP, exposing users to man-in-the-middle attacks. \
Fix: Add a Strict-Transport-Security header (e.g., 'max-age=31536000; includeSubDomains') to enforce HTTPS.",

  "Missing Anti-clickjacking Header":
    "Risk: Pages can be embedded in iframes, enabling clickjacking attacks. \
Fix: Add an X-Frame-Options header (DENY or SAMEORIGIN) or use 'frame-ancestors' in CSP.",

  "X-Content-Type-Options Header Missing":
    "Risk: Browsers may interpret files as a different MIME type, enabling drive-by downloads or script execution. \
Fix: Add 'X-Content-Type-Options: nosniff' to all responses.",

  "X-Powered-By Header Information Leak":
    "Risk: Reveals backend technology (e.g., Express, PHP), helping attackers target known exploits. \
Fix: Remove or obfuscate the X-Powered-By header.",

  "Retrieved from Cache":
    "Risk: Sensitive pages may be cached by browsers or proxies, exposing private data. \
Fix: Add 'Cache-Control: no-store' and 'Pragma: no-cache' headers to sensitive responses.",

  "Cookie Without Secure Flag":
    "Risk: Cookies can be sent over HTTP, exposing them to interception. \
Fix: Mark cookies with the 'Secure' flag so they are only sent over HTTPS.",

  "Cookie No HttpOnly Flag":
    "Risk: Cookies can be accessed via JavaScript, enabling theft through XSS. \
Fix: Add the 'HttpOnly' flag to cookies to prevent client-side access.",

  "Absence of Anti-CSRF Tokens":
    "Risk: Attackers can trick users into performing unwanted actions. \
Fix: Implement CSRF tokens in forms and validate them server-side.",

  "Open Redirect":
    "Risk: Attackers can redirect users to malicious sites via your domain. \
Fix: Validate and whitelist redirect URLs before allowing navigation.",

  "ZAP is Out of Date":
    "Risk: Scanner may miss newer vulnerabilities. \
Fix: Update ZAP to the latest version to ensure current rules and fixes are applied."
};
