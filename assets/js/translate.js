/* ==========================================================================
   WA Professionnels Maroc · translate.js
   Traducción automática de los campos de contenido (francés y árabe).

   Usa la API pública de MyMemory, que no necesita clave ni backend y funciona
   desde el navegador (CORS abierto). Si algún día quieres un modelo de IA
   propio, basta con cambiar `CW.translate.text`.
   ========================================================================== */
(function (window) {
  'use strict';
  var CW = window.CW;
  var cfg = CW.config || {};

  var ENDPOINT = 'https://api.mymemory.translated.net/get';

  // Decodifica entidades HTML que a veces devuelve la API (&quot; etc.).
  function decode(s) {
    var ta = document.createElement('textarea');
    ta.innerHTML = s;
    return ta.value;
  }

  // Traduce un texto. MyMemory limita la consulta a ~500 bytes por petición.
  function text(value, target, source) {
    var q = String(value == null ? '' : value).trim().slice(0, 460);
    if (!q) return Promise.resolve('');
    var url = ENDPOINT + '?q=' + encodeURIComponent(q) + '&langpair=' + (source || 'es') + '|' + target;
    if (cfg.translateEmail) url += '&de=' + encodeURIComponent(cfg.translateEmail);
    return fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var t = j && j.responseData && j.responseData.translatedText;
        if (!t) throw new Error('sin-traduccion');
        return decode(t);
      });
  }

  CW.translate = {
    text: text,

    /**
     * Traduce varios campos al francés y al árabe.
     * pairs: [{ key: 'name', text: 'Lavabo' }, ...]
     * cb({ fr: { name: '...' }, ar: { name: '...' } })
     * Va en serie para no saturar la API y así saber cuándo terminó.
     */
    fill: function (pairs, cb) {
      var source = cfg.defaultLang || 'es';
      var targets = ['fr', 'ar'];
      var out = { fr: {}, ar: {} };
      var jobs = [];

      (pairs || []).forEach(function (p) {
        var v = String((p && p.text) || '').trim();
        if (!v) return;
        targets.forEach(function (lang) { jobs.push({ key: p.key, text: v, lang: lang }); });
      });

      if (!jobs.length) return cb(out);

      var i = 0, done = 0;
      (function next() {
        if (i >= jobs.length) return cb(out);
        var job = jobs[i++];
        text(job.text, job.lang, source).then(function (t) {
          if (t) { out[job.lang][job.key] = t; done++; }
          next();
        }).catch(function () { next(); });
      })();
    }
  };
})(window);
