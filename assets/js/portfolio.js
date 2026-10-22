/* ==========================================================================
   WA Professionnels Maroc · portfolio.js
   Página pública de porfolio: trabajos con imagen, título y descripción breve.
   ========================================================================== */
(function (window, document) {
  'use strict';
  var CW = window.CW;
  var $ = CW.$, $$ = CW.$$, esc = CW.esc;
  var t = function (k, v) { return CW.i18n.t(k, v); };

  var S = { biz: null, items: [] };

  function param(k) { return new URLSearchParams(location.search).get(k); }

  // ---- Datos de ejemplo (para ?b=demo) --------------------------------
  function demoBiz() {
    return { id: 'demo', name: 'Marmol', slug: 'demo', description: 'Piedra natural para cocinas y baños, con instalación incluida.', whatsapp: '212600112233', currency: 'MAD', brand_color: '#5B1A80' };
  }
  function demoItems() {
    return [
      { id: 'w1', business_id: 'demo', title: 'Encimera de cocina', description: 'Mármol blanco pulido con canto recto y fregadero integrado.', image_url: 'assets/demo/camiseta.svg', sort_order: 1, active: true },
      { id: 'w2', business_id: 'demo', title: 'Baño completo', description: 'Revestimiento y lavabo a medida en piedra natural.', image_url: 'assets/demo/arroz.svg', sort_order: 2, active: true },
      { id: 'w3', business_id: 'demo', title: 'Escaleras', description: 'Peldaños macizos con acabado antideslizante.', image_url: 'assets/demo/corte.svg', sort_order: 3, active: true },
      { id: 'w4', business_id: 'demo', title: 'Restauración', description: 'Recuperación de una mesa antigua de mármol.', image_url: 'assets/demo/reparacion.svg', sort_order: 4, active: true }
    ];
  }

  function load() {
    var slug = param('b') || param('biz');
    return CW.store.init().then(function () {
      if (!slug) return null;
      if (slug === 'demo') {
        return CW.store.getBusinessBySlug('demo').then(function (b) { return b || null; }).catch(function () { return null; });
      }
      return CW.store.getBusinessBySlug(slug);
    }).then(function (biz) {
      if (!biz && slug === 'demo') {
        S.biz = demoBiz();
        S.items = demoItems();
        return;
      }
      if (!biz) { S.biz = null; return; }
      S.biz = biz;
      return CW.store.listPortfolio(biz.id, { activeOnly: true }).then(function (items) {
        S.items = (items || []).filter(function (i) { return i.active !== false; });
      });
    }).catch(function (err) {
      console.warn('[CW] No se pudo cargar el porfolio:', err);
      S.biz = null;
    });
  }

  function render() {
    var root = $('[data-pf-root]');
    if (!S.biz) {
      root.innerHTML = '<div class="wrap empty-state big"><div class="es-icon">🔍</div><b>' + t('cat.public.notfound') + '</b>' +
        '<p>' + t('cat.public.notfound.desc') + '</p><a class="btn primary" href="' + CW.url('index.html') + '">WA Professionnels Maroc</a></div>';
      $('[data-pf-brand]').innerHTML = '<b>WA Professionnels Maroc</b>';
      return;
    }

    var b = S.biz;
    document.title = t('port.title') + ' · ' + b.name;
    document.documentElement.style.setProperty('--brand', b.brand_color || '#5B1A80');

    // Cabecera con la marca del negocio
    $('[data-pf-brand]').innerHTML =
      (b.logo_url ? '<img src="' + esc(b.logo_url) + '" alt="" class="cat-logo">' : '<span class="cat-logo ph" style="background:' + esc(b.brand_color || '#5B1A80') + '">' + esc((b.name || 'M').charAt(0)) + '</span>') +
      '<div><b>' + esc(b.name) + '</b><small>' + t('port.title') + '</small></div>';

    var back = $('[data-pf-back]');
    if (back) back.href = CW.url('catalogo.html') + '?b=' + encodeURIComponent(b.slug || '');

    var wa = $('[data-pf-wa]');
    if (b.whatsapp) {
      wa.href = CW.api.waLink(b.whatsapp, 'Hola ' + b.name + ', he visto vuestro porfolio.');
    } else {
      wa.hidden = true;
    }

    var cards = S.items.map(function (it, i) {
      var img = it.image_url
        ? '<img src="' + esc(it.image_url) + '" alt="' + esc(it.title) + '" loading="lazy">'
        : '<div class="pf-ph">🖼️</div>';
      return '<article class="pf-card" role="button" tabindex="0" data-work="' + i + '" aria-label="' + esc(it.title) + '">' +
        '<div class="pf-media">' + img + '</div>' +
        '<div class="pf-body">' +
          '<h2 class="pf-name">' + esc(it.title) + '</h2>' +
          (it.description ? '<p class="pf-desc">' + esc(it.description) + '</p>' : '') +
          '<span class="pf-more">' + t('port.detail') + ' →</span>' +
        '</div></article>';
    }).join('');

    root.innerHTML =
      '<section class="pf-hero"><div class="wrap">' +
        '<span class="pf-kicker">' + esc(b.name) + '</span>' +
        '<h1>' + t('port.title') + '</h1>' +
        '<p>' + esc(S.items.length ? t('port.sub') : t('port.empty.desc')) + '</p>' +
        '<a class="btn ghost small pf-back" href="' + esc(CW.url('catalogo.html') + '?b=' + encodeURIComponent(b.slug || '')) + '">← ' + t('port.back') + '</a>' +
      '</div></section>' +
      (S.items.length
        ? '<section class="wrap pf-grid">' + cards + '</section>'
        : '<section class="wrap pf-empty empty-state big"><div class="es-icon">🖼️</div><b>' + t('port.empty') + '</b><p>' + t('port.empty.desc') + '</p></section>');

    var foot = $('[data-pf-foot]');
    if (foot) foot.textContent = b.name + ' · ' + t('port.title');

    CW.i18n.apply(root);

    // Abrir la ficha del trabajo
    $$('[data-work]', root).forEach(function (card) {
      function open() { openWork(S.items[Number(card.dataset.work)]); }
      card.addEventListener('click', open);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });
  }

  // Pop-up con toda la información del trabajo tal como se rellenó en el panel.
  function openWork(it) {
    if (!it) return;
    var lines = String(it.details || '').split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    var meta = [];
    if (it.client) meta.push('<li><span>' + t('port.client') + '</span><b>' + esc(it.client) + '</b></li>');
    if (it.place) meta.push('<li><span>' + t('port.place') + '</span><b>' + esc(it.place) + '</b></li>');
    if (it.work_date) meta.push('<li><span>' + t('port.date') + '</span><b>' + esc(it.work_date) + '</b></li>');

    var html =
      '<div class="pf-modal-grid">' +
        '<div class="pf-modal-media">' + (it.image_url ? '<img src="' + esc(it.image_url) + '" alt="' + esc(it.title) + '">' : '<div class="pf-ph">🖼️</div>') + '</div>' +
        '<div class="pf-modal-body">' +
          (it.description ? '<p class="pf-modal-desc">' + esc(it.description) + '</p>' : '') +
          (lines.length ? '<h4>' + t('port.details') + '</h4><ul class="pf-modal-list">' + lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' : '') +
          (meta.length ? '<h4>' + t('port.info') + '</h4><ul class="pf-modal-meta">' + meta.join('') + '</ul>' : '') +
        '</div>' +
      '</div>';

    var wa = S.biz && S.biz.whatsapp
      ? '<a class="btn wa" target="_blank" rel="noopener" href="' + CW.api.waLink(S.biz.whatsapp, 'Hola ' + S.biz.name + ', he visto el trabajo «' + it.title + '» y quiero algo parecido.') + '">💬 ' + t('port.want') + '</a>'
      : '';

    CW.modal({
      className: 'pf-modal',
      title: it.title,
      html: html,
      footer: wa + '<button class="btn ghost" data-close>' + t('common.close') + '</button>'
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    load().then(render);
    window.addEventListener('cw:lang', function () { if (S.biz) render(); });
  });
})(window, document);
