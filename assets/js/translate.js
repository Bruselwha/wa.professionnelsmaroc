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
  // Lanza error si no hay red, si tarda demasiado o si la API responde mal.
  function text(value, target, source) {
    var q = String(value == null ? '' : value).trim().slice(0, 460);
    if (!q) return Promise.resolve('');

    var url = ENDPOINT + '?q=' + encodeURIComponent(q) + '&langpair=' + (source || 'es') + '|' + target;
    if (cfg.translateEmail) url += '&de=' + encodeURIComponent(cfg.translateEmail);

    // Tiempo máximo por petición: si la API no responde, no dejamos la interfaz
    // bloqueada esperando para siempre.
    var ms = Number(cfg.translateTimeout || 12000);
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, ms) : null;

    function clear() { if (timer) { clearTimeout(timer); timer = null; } }

    return fetch(url, { signal: ctrl ? ctrl.signal : undefined, headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('http-' + r.status);
        return r.json();
      })
      .then(function (j) {
        clear();
        // MyMemory devuelve 200 en HTTP pero con error dentro del JSON.
        if (j && j.responseStatus && Number(j.responseStatus) !== 200) throw new Error('api-' + j.responseStatus);
        var t = j && j.responseData && j.responseData.translatedText;
        if (!t || /MYMEMORY WARNING|QUOTA EXCEEDED|INVALID/i.test(t)) throw new Error('sin-traduccion');
        return decode(t);
      }, function (err) {
        clear();
        throw err && err.name === 'AbortError' ? new Error('timeout') : (err || new Error('red'));
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
    fill: function (pairs, cb, onProgress) {
      var source = cfg.defaultLang || 'es';
      var targets = ['fr', 'ar'];
      var out = { fr: {}, ar: {} };
      var jobs = [];

      (pairs || []).forEach(function (p) {
        var v = String((p && p.text) || '').trim();
        if (!v) return;
        targets.forEach(function (lang) { jobs.push({ key: p.key, text: v, lang: lang }); });
      });

      var total = jobs.length;
      var i = 0, translated = 0, failed = 0;

      function finish() {
        cb(out, { total: total, translated: translated, failed: failed });
      }
      if (!total) return finish();

      (function next() {
        if (i >= total) return finish();
        var job = jobs[i++];
        text(job.text, job.lang, source).then(function (t) {
          if (t) { out[job.lang][job.key] = t; translated++; }
          else failed++;
        }).catch(function () {
          failed++;
        }).then(function () {
          if (onProgress) onProgress(i, total, { translated: translated, failed: failed });
          next();
        });
      })();
    }
  };
})(window);
