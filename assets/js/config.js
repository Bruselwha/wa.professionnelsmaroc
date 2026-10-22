/* ==========================================================================
   WA Professionnels Maroc · config.js
   Claves y ajustes globales. Si SUPABASE_URL / SUPABASE_ANON_KEY están
   vacías, la app arranca en MODO DEMO usando localStorage.
   ========================================================================== */
(function (window) {
  'use strict';

  var CW = (window.CW = window.CW || {});

  CW.config = {
    appName: 'WA Professionnels Maroc',

    // --- Supabase (déjalas vacías para MODO DEMO) -------------------------
    SUPABASE_URL: 'https://wbmpzbshifrvfyxzediz.supabase.co',        // p.ej. 'https://xxxxxxxx.supabase.co'
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndibXB6YnNoaWZydmZ5eHplZGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMjc1MzQsImV4cCI6MjEwNzkwMzUzNH0.iC8PYTlz6SFtHZ27mB1EFcOrpiwAgwkT4pLmTLmEn9U',   // p.ej. 'eyJhbGciOi...'

    // --- Dominio público (solo el host, sin https:// ni barra final) ------
    // Si está vacío se detecta automáticamente del dominio actual.
    publicDomain: 'wa.professionnelsmaroc.click',

    // --- Ajustes generales -------------------------------------------------
    defaultLang: 'es',
    languages: ['es', 'fr', 'ar'],
    defaultCurrency: 'MAD',
    supportWhatsapp: '+212670964030',  // WhatsApp de soporte del producto

    // Traducción automática (botón «Traducir con IA»). MyMemory no necesita
    // clave; si pones un correo, amplía la cuota diaria anónima.
    translateEmail: '',
    version: '1.0.0',
    cacheVersion: 'cw-v1',

    // Cuotas del plan gratuito (el admin puede sobreescribirlas por negocio)
    freeMaxProducts: 15,
    freeMaxStorageMb: 100
  };

  // ¿Hay backend real configurado?
  CW.isDemo = !(CW.config.SUPABASE_URL && CW.config.SUPABASE_ANON_KEY);

  // Host público resuelto.
  CW.publicHost = (function () {
    var d = (CW.config.publicDomain || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (d) return d;
    if (typeof location !== 'undefined' && location.host) return location.host;
    return 'localhost';
  })();

  // ¿El servidor usa URLs limpias (sin .html)? Vercel sí, local no.
  CW.cleanUrls = (function () {
    if (typeof location === 'undefined') return false;
    var h = location.hostname;
    return !(h === 'localhost' || h === '127.0.0.1' || h === '' || /^\d+\.\d+\.\d+\.\d+$/.test(h));
  })();

  // Construye una ruta interna respetando cleanUrls.
  CW.url = function (page) {
    var isHtml = /\.html?$/.test(page);
    if (!isHtml) return page;
    var base = page.replace(/\.html?$/, '');
    return CW.cleanUrls ? base : page;
  };

  // URL absoluta de una página interna.
  CW.absUrl = function (page) {
    return 'https://' + CW.publicHost + '/' + CW.url(page).replace(/^\/+/, '');
  };

  // URL absoluta del catálogo de un negocio.
  CW.catalogUrl = function (slug) {
    return CW.absUrl('catalogo.html') + '?b=' + encodeURIComponent(slug || '');
  };
})(window);
