/**
 * VendorIQ Runtime Environment Configuration
 * This file allows configuring the API URL dynamically at deployment time without rebuilding the Angular application.
 *
 * Usage:
 *   For direct backend hosting (e.g. Render, Railway, EC2):
 *     window.__env.apiUrl = 'https://your-backend-api.onrender.com/api';
 *   For reverse-proxy / same-origin hosting (e.g. Vercel rewrites):
 *     window.__env.apiUrl = '/api';
 */
(function (window) {
  window.__env = window.__env || {};
  // Default is left unset so environment.prod.ts falls back cleanly to '/api'
  // Uncomment and set if you want to override without rebuilding:
  // window.__env.apiUrl = 'https://your-backend-api.onrender.com/api';
})(this);
