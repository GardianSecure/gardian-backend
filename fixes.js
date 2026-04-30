// fixes.js
module.exports = {
  "Content Security Policy (CSP) Header Not Set": {
    risk: "Without a CSP header, attackers can inject malicious scripts or styles.",
    fix: "Add a Content-Security-Policy header restricting allowed sources for scripts, styles, and frames."
  },
  "Strict-Transport-Security Header Not Set": {
    risk: "Browsers may connect over insecure HTTP, exposing users to man-in-the-middle attacks.",
    fix: "Add a Strict-Transport-Security header (e.g., 'max-age=31536000; includeSubDomains') to enforce HTTPS."
  },
  "Missing Anti-clickjacking Header": {
    risk: "Pages can be embedded in iframes, enabling clickjacking attacks.",
    fix: "Add an X-Frame-Options header (DENY or SAMEORIGIN) or use 'frame-ancestors' in CSP."
  },
  "X-Content-Type-Options Header Missing": {
    risk: "Browsers may interpret files as a different MIME type, enabling drive-by downloads or script execution.",
    fix: "Add 'X-Content-Type-Options: nosniff' to all responses."
  },
  "X-Powered-By Header Information Leak": {
    risk: "Reveals backend technology (e.g., Express, PHP), helping attackers target known exploits.",
    fix: "Remove or obfuscate the X-Powered-By header."
  },
  "Retrieved from Cache": {
    risk: "Sensitive pages may be cached by browsers or proxies, exposing private data.",
    fix: "Add 'Cache-Control: no-store' and 'Pragma: no-cache' headers to sensitive responses."
  },
  "Cookie Without Secure Flag": {
    risk: "Cookies can be sent over HTTP, exposing them to interception.",
    fix: "Mark cookies with the 'Secure' flag so they are only sent over HTTPS."
  },
  "Cookie No HttpOnly Flag": {
    risk: "Cookies can be accessed via JavaScript, enabling theft through XSS.",
    fix: "Add the 'HttpOnly' flag to cookies to prevent client-side access."
  },
  "Absence of Anti-CSRF Tokens": {
    risk: "Attackers can trick users into performing unwanted actions.",
    fix: "Implement CSRF tokens in forms and validate them server-side."
  },
  "Open Redirect": {
    risk: "Attackers can redirect users to malicious sites via your domain.",
    fix: "Validate and whitelist redirect URLs before allowing navigation."
  },
  "ZAP is Out of Date": {
    risk: "Scanner may miss newer vulnerabilities.",
    fix: "Update ZAP to the latest version to ensure current rules and fixes are applied."
  }
};
