// fixes.js
module.exports = {
  "Content Security Policy (CSP) Header Not Set":
    "Add a Content-Security-Policy header to restrict sources of scripts and styles.",
  "Cookie Without Secure Flag":
    "Mark cookies with the Secure flag so they’re only sent over HTTPS.",
  "X-Content-Type-Options Header Missing":
    "Add the X-Content-Type-Options: nosniff header to prevent MIME type sniffing.",
  "Cross-Domain Misconfiguration":
    "Restrict cross-domain access in your server configuration.",
  "Directory Browsing":
    "Disable directory listing on your web server.",
  "Information Disclosure - Debug Error Messages":
    "Turn off debug mode and remove stack traces from production responses.",
  "Cookie without SameSite Attribute":
    "Add the SameSite attribute to cookies to protect against CSRF attacks.",
  "Absence of Anti-CSRF Tokens":
    "Implement CSRF tokens in forms to prevent cross-site request forgery.",
  "Private IP Disclosure":
    "Remove internal IP addresses from responses and logs.",
  "Heartbleed OpenSSL Vulnerability (Indicative)":
    "Update OpenSSL to a patched version to mitigate Heartbleed."
};
