/* ==========================================================================
   WA Professionnels Maroc · common.js
   Utilidades compartidas, sesión, idioma, toasts, modales, PWA y WhatsApp.
   ========================================================================== */
(function (window, document) {
  'use strict';
  var CW = (window.CW = window.CW || {});
  var cfg = CW.config;

  var CWU = {
    // ---- DOM -----------------------------------------------------------
    qs: function (sel, root) { return (root || document).querySelector(sel); },
    qsa: function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); },

    esc: function (s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    el: function (tag, attrs, html) {
      var n = document.createElement(tag);
      if (attrs) Object.keys(attrs).forEach(function (k) {
        if (k === 'class') n.className = attrs[k];
        else if (k === 'dataset') Object.keys(attrs[k]).forEach(function (d) { n.dataset[d] = attrs[k][d]; });
        else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
        else n.setAttribute(k, attrs[k]);
      });
      if (html != null) n.innerHTML = html;
      return n;
    },

    // ---- Números y fechas ---------------------------------------------
    money: function (n, currency) {
      currency = currency || cfg.defaultCurrency;
      var v = Number(n || 0);
      var s = v.toFixed(2).replace('.', ',');
      // separador de miles
      s = s.replace(/\B(?=(\d{3})+(?!\d)(?=,))/g, '.');
      return s + ' ' + currency;
    },

    pct: function (a, b) {
      a = Number(a || 0); b = Number(b || 0);
      if (!b || b <= 0) return 0;
      return Math.round((1 - a / b) * 100);
    },

    dateShort: function (iso) {
      if (!iso) return '';
      var d = new Date(iso);
      return d.toLocaleDateString(CW.i18n.lang === 'ar' ? 'ar-MA' : CW.i18n.lang + '-' + 'MA', { year: 'numeric', month: '2-digit', day: '2-digit' });
    },
    dateTime: function (iso) {
      if (!iso) return '';
      var d = new Date(iso);
      return CWU.dateShort(iso) + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    // ---- Teléfono / WhatsApp -------------------------------------------
    normalizePhone: function (country, local) {
      var cc = (COUNTRY_CODES[country] || {}).code || '';
      var digits = String(local || '').replace(/[^\d]/g, '').replace(/^0+/, '');
      return cc + digits;
    },

    COUNTRY_CODES: null, // se asigna abajo

    // Texto de compartir: estructurado, con negrita nativa de WhatsApp y SIN
    // emojis ni simbolos que algunos dispositivos no muestran bien.
    shareItem: function (biz, item) {
      var cur = biz.currency || cfg.defaultCurrency;
      var line = '--------------------------------';
      var L = [];
      L.push('*' + item.name + '*');
      L.push(line);
      if (item.kind === 'service') {
        L.push('Tipo: Servicio');
        L.push('Precio: ' + (Number(item.price) > 0 ? CWU.money(item.price, cur) : 'A consultar'));
        if (item.duration) L.push('Duracion: ' + item.duration);
        if (item.modality) L.push('Modalidad: ' + item.modality);
        L.push('Disponibilidad: Si');
      } else {
        L.push('Tipo: Producto');
        if (Number(item.promo_price) > 0 && Number(item.promo_price) < Number(item.price)) {
          L.push('Precio: ' + CWU.money(item.promo_price, cur));
          L.push('Antes: ' + CWU.money(item.price, cur));
          L.push('Ahorro: ' + CWU.pct(item.promo_price, item.price) + '%');
        } else {
          L.push('Precio: ' + CWU.money(item.price, cur));
        }
      }
      if (item.category_name) L.push('Categoria: ' + item.category_name);
      if (item.description) {
        L.push(line);
        L.push(String(item.description).trim().slice(0, 260));
      }
      L.push(line);
      L.push('*' + biz.name + '*');
      if (biz.whatsapp) L.push('WhatsApp: ' + biz.whatsapp);
      L.push(CW.catalogUrl(biz.slug));
      return L.join('\n');
    },

    // Comparte por WhatsApp (elige contacto) o usa el compartir del sistema.
    shareWhatsApp: function (text) {
      var url = 'https://wa.me/?text=' + encodeURIComponent(text);
      if (navigator.share) {
        navigator.share({ text: text }).catch(function () { window.open(url, '_blank', 'noopener'); });
      } else {
        window.open(url, '_blank', 'noopener');
      }
    },

    // Genera el mensaje de pedido estructurado (sin emojis).
    orderMessage: function (biz, order, opts) {
      opts = opts || {};
      var cur = biz.currency || cfg.defaultCurrency;
      var L = [];
      var line = '--------------------------------';
      L.push('*NUEVO PEDIDO*');
      L.push(biz.name);
      L.push('Código del pedido: *' + order.code + '*');
      L.push(line);
      L.push('*Cliente*');
      L.push('Nombre: ' + (order.customer_name || ''));
      L.push('Teléfono: ' + (order.customer_phone || ''));
      if (order.customer_address) L.push('Dirección: ' + order.customer_address);
      if (order.customer_city) L.push('Ciudad: ' + order.customer_city);
      if (order.note) L.push('Nota: ' + order.note);
      if (order.appointment_at) {
        L.push(line);
        L.push('*Cita*');
        var d = new Date(order.appointment_at);
        L.push('Fecha: ' + d.toLocaleDateString('es-ES'));
        L.push('Hora: ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
      L.push(line);
      L.push('*PRODUCTOS*');
      (order.items || []).forEach(function (it, i) {
        var name = it.name + (it.kind === 'service' ? ' (Servicio)' : '');
        L.push((i + 1) + '. ' + name);
        if (Number(it.price) > 0) {
          L.push('    ' + it.qty + ' x ' + CWU.money(it.price, cur) + ' = ' + CWU.money(it.price * it.qty, cur));
        } else {
          L.push('    ' + it.qty + ' x A consultar');
        }
      });
      L.push(line);
      L.push('*RESUMEN*');
      if (Number(order.fee) > 0) L.push('Subtotal: ' + CWU.money(order.subtotal, cur));
      if (Number(order.fee) > 0) L.push('Entrega: +' + CWU.money(order.fee, cur));
      L.push('TOTAL: *' + CWU.money(order.total, cur) + '*');
      if ((biz.delivery && biz.delivery !== 'whatsapp') || biz.delivery_notes || biz.delivery_time) {
        L.push(line);
        L.push('*ENTREGA*');
        if (biz.delivery_time) L.push('Plazo: ' + biz.delivery_time);
        if (biz.delivery_notes) L.push(biz.delivery_notes);
      }
      var pays = biz.payments || [];
      if (pays.length) {
        L.push(line);
        L.push('*FORMA DE PAGO*');
        L.push(pays.join(', '));
      }
      L.push(line);
      L.push('Creado con WA Professionnels Maroc');
      return L.join('\n');
    },

    waLink: function (phone, text) {
      var p = String(phone || '').replace(/[^\d]/g, '');
      return 'https://wa.me/' + p + '?text=' + encodeURIComponent(text || '');
    },

    // Huecos horarios según horario del negocio
    timeSlots: function (biz, dateStr) {
      var slots = [];
      if (!dateStr) return slots;
      var d = new Date(dateStr + 'T00:00:00');
      var day = d.getDay();
      var work = biz.work_days || [1, 2, 3, 4, 5, 6];
      if (work.indexOf(day) === -1) return slots;
      function toMin(t) { var p = String(t || '09:00').split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
      var open = toMin(biz.open_time), close = toMin(biz.close_time), step = biz.slot_minutes || 30;
      for (var m = open; m + step <= close; m += step) {
        var h = Math.floor(m / 60), mi = m % 60;
        slots.push(('0' + h).slice(-2) + ':' + ('0' + mi).slice(-2));
      }
      return slots;
    },

    // ---- Sesión --------------------------------------------------------
    guard: function (redirect) {
      return CW.store.init().then(function () {
        return CW.store.getSession();
      }).then(function (sess) {
        if (!sess || !sess.user) {
          location.replace(CW.url('login.html'));
          return Promise.reject(new Error('NO_SESSION'));
        }
        CW.session = sess;
        return sess;
      });
    },

    // ---- UI: toast -----------------------------------------------------
    toast: function (msg, type) {
      var t = CWU.el('div', { class: 'cw-toast ' + (type || '') }, CWU.esc(msg));
      document.body.appendChild(t);
      requestAnimationFrame(function () { t.classList.add('show'); });
      setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 250); }, 2600);
    },

    // ---- UI: modal -----------------------------------------------------
    modal: function (opts) {
      var overlay = CWU.el('div', { class: 'cw-modal-overlay' });
      var modal = CWU.el('div', { class: 'cw-modal ' + (opts.className || '') });
      modal.innerHTML =
        '<div class="cw-modal-head"><h3>' + CWU.esc(opts.title || '') + '</h3>' +
        '<button class="icon-btn" data-close aria-label="Cerrar">✕</button></div>' +
        '<div class="cw-modal-body">' + (opts.html || '') + '</div>' +
        (opts.footer ? '<div class="cw-modal-foot">' + opts.footer + '</div>' : '');
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      requestAnimationFrame(function () { overlay.classList.add('show'); });
      function close() {
        overlay.classList.remove('show');
        setTimeout(function () { overlay.remove(); }, 200);
        document.removeEventListener('keydown', onKey);
        if (opts.onClose) opts.onClose();
      }
      function onKey(e) { if (e.key === 'Escape') close(); }
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
      CWU.qsa('[data-close]', modal).forEach(function (b) { b.addEventListener('click', close); });
      document.addEventListener('keydown', onKey);
      return { overlay: overlay, modal: modal, close: close };
    },

    confirm: function (msg, onYes, danger) {
      var m = CWU.modal({
        title: CWU.t('common.confirm'),
        html: '<p>' + CWU.esc(msg) + '</p>',
        footer: '<button class="btn ghost" data-no>' + CWU.esc(CWU.t('common.cancel')) + '</button>' +
          '<button class="btn ' + (danger ? 'danger' : 'primary') + '" data-yes>' + CWU.esc(CWU.t('common.confirm')) + '</button>'
      });
      CWU.qs('[data-no]', m.modal).addEventListener('click', m.close);
      CWU.qs('[data-yes]', m.modal).addEventListener('click', function () { m.close(); onYes(); });
    },

    t: function (k, v) { return CW.i18n.t(k, v); },

    // ---- Cabecera pública con selector de idioma -----------------------
    mountLangSwitchers: function () {
      CWU.qsa('[data-lang-switch]').forEach(function (el) { CW.i18n.langSwitcher(el); });
    },

    // ---- PWA -----------------------------------------------------------
    initPWA: function () {
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register(CW.url('/sw.js')).catch(function () {});
        });
      }
      var deferred = null;
      var banner = CWU.qs('[data-pwa-banner]');
      window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault(); deferred = e;
        if (banner && !localStorage.getItem('cw_pwa_dismissed')) banner.classList.add('show');
      });
      if (banner) {
        var btn = CWU.qs('[data-pwa-install]', banner);
        var no = CWU.qs('[data-pwa-dismiss]', banner);
        if (btn) btn.addEventListener('click', function () {
          if (deferred) { deferred.prompt(); deferred = null; }
          banner.classList.remove('show');
        });
        if (no) no.addEventListener('click', function () {
          banner.classList.remove('show');
          try { localStorage.setItem('cw_pwa_dismissed', '1'); } catch (e) {}
        });
      }
    },

    // ---- Varios --------------------------------------------------------
    download: function (filename, content, mime) {
      var blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    },

    toCSV: function (rows) {
      return rows.map(function (r) {
        return r.map(function (c) {
          var s = String(c == null ? '' : c);
          return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        }).join(';');
      }).join('\r\n');
    },

    copy: function (text) {
      if (navigator.clipboard) return navigator.clipboard.writeText(text).then(function () { CWU.toast(CWU.t('common.copied')); });
      var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); ta.remove(); CWU.toast(CWU.t('common.copied'));
    },

    countryOptions: function (selected) {
      return Object.keys(COUNTRY_CODES).map(function (c) {
        return '<option value="' + c + '"' + (c === selected ? ' selected' : '') + '>' +
          COUNTRY_CODES[c].name + ' (' + COUNTRY_CODES[c].dial + ')</option>';
      }).join('');
    }
  };

  // Códigos de país (reducido y ampliable)
  var COUNTRY_CODES = {
    MA: { name: 'Marruecos', code: '212', dial: '+212', flag: '🇲🇦' },
    ES: { name: 'España', code: '34', dial: '+34', flag: '🇪🇸' },
    FR: { name: 'Francia', code: '33', dial: '+33', flag: '🇫🇷' },
    DZ: { name: 'Argelia', code: '213', dial: '+213', flag: '🇩🇿' },
    TN: { name: 'Túnez', code: '216', dial: '+216', flag: '🇹🇳' },
    EG: { name: 'Egipto', code: '20', dial: '+20', flag: '🇪🇬' },
    SA: { name: 'Arabia Saudí', code: '966', dial: '+966', flag: '🇸🇦' },
    AE: { name: 'Emiratos Árabes', code: '971', dial: '+971', flag: '🇦🇪' },
    SN: { name: 'Senegal', code: '221', dial: '+221', flag: '🇸🇳' },
    CI: { name: 'Costa de Marfil', code: '225', dial: '+225', flag: '🇨🇮' },
    US: { name: 'Estados Unidos', code: '1', dial: '+1', flag: '🇺🇸' },
    GB: { name: 'Reino Unido', code: '44', dial: '+44', flag: '🇬🇧' },
    DE: { name: 'Alemania', code: '49', dial: '+49', flag: '🇩🇪' },
    IT: { name: 'Italia', code: '39', dial: '+39', flag: '🇮🇹' },
    BE: { name: 'Bélgica', code: '32', dial: '+32', flag: '🇧🇪' },
    NL: { name: 'Países Bajos', code: '31', dial: '+31', flag: '🇳🇱' }
  };
  CWU.COUNTRY_CODES = COUNTRY_CODES;

  CWU.currencyList = [
    { code: 'MAD', label: 'dirham marroquí (MAD)' },
    { code: 'EUR', label: 'euro (EUR)' },
    { code: 'USD', label: 'dólar (USD)' },
    { code: 'DZD', label: 'dinar argelino (DZD)' },
    { code: 'TND', label: 'dinar tunecino (TND)' },
    { code: 'EGP', label: 'libra egipcia (EGP)' },
    { code: 'SAR', label: 'rial saudí (SAR)' },
    { code: 'AED', label: 'dirham de EAU (AED)' },
    { code: 'XOF', label: 'franco CFA (XOF)' }
  ];

  // Alias cómodo
  CW.$ = CWU.qs;
  CW.$$ = CWU.qsa;
  CW.esc = CWU.esc;
  CW.el = CWU.el;
  CW.money = CWU.money;
  CW.toast = CWU.toast;
  CW.modal = CWU.modal;
  CW.confirm = CWU.confirm;
  CW.t = CWU.t;
  CW.api = CWU; // acceso completo
  CW.COUNTRY_CODES = COUNTRY_CODES;

  // Aplica i18n al cargar y en cada cambio de idioma.
  document.addEventListener('DOMContentLoaded', function () {
    if (CW._domReady) return; // evita doble inicializacion
    CW._domReady = true;
    CW.i18n.apply();
    CWU.mountLangSwitchers();
    CWU.initPWA();
    // Botón de idioma de cabecera (alterna entre los 3)
    CWU.qsa('[data-lang-toggle]').forEach(function (b) {
      b.addEventListener('click', function () {
        var langs = cfg.languages, i = langs.indexOf(CW.i18n.lang);
        CW.i18n.setLang(langs[(i + 1) % langs.length]);
        b.textContent = CWU.t('common.lang') + ': ' + CW.i18n.lang.toUpperCase();
      });
    });
    // Botón flotante de WhatsApp (soporte del producto).
    var waf = document.querySelector('.wa-float');
    if (waf) {
      if (cfg.supportWhatsapp) waf.href = 'https://wa.me/' + String(cfg.supportWhatsapp).replace(/\D/g, '');
      else waf.hidden = true;
    }

    // Imágenes configurables de la home (Administración → Apariencia)
    var hiEls = document.querySelectorAll('[data-home-img]');
    if (hiEls.length && CW.store && CW.store.getSiteSettings) {
      CW.store.init().then(function () { return CW.store.getSiteSettings(); }).then(function (s) {
        var imgs = (s && s.home_images) || {};
        hiEls.forEach(function (el) {
          var u = imgs[el.getAttribute('data-home-img')];
          if (!u) return;
          el.style.backgroundImage = 'url("' + u + '")';
          el.classList.add('has');
        });
      }).catch(function () {});
    }

    // Menú móvil de la home
    var burger = document.querySelector('[data-lp-burger]');
    var lpMenu = document.querySelector('[data-lp-menu]');
    if (burger && lpMenu) {
      function closeMenu() { lpMenu.hidden = true; burger.setAttribute('aria-expanded', 'false'); burger.textContent = '☰'; }
      burger.addEventListener('click', function (e) {
        e.stopPropagation();
        var willOpen = lpMenu.hidden;
        lpMenu.hidden = !willOpen;
        burger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        burger.textContent = willOpen ? '✕' : '☰';
      });
      lpMenu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
      document.addEventListener('click', function (e) { if (!lpMenu.hidden && !lpMenu.contains(e.target)) closeMenu(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lpMenu.hidden) closeMenu(); });
    }
  });
})(window, document);
