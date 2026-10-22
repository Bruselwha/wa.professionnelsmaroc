/* ==========================================================================
   WA Professionnels Maroc · catalog.js
   Catálogo público: filtros, tarjetas, ficha, carrito y pedido por WhatsApp.
   ========================================================================== */
(function (window, document) {
  'use strict';
  var CW = window.CW;
  var $ = CW.$, $$ = CW.$$, esc = CW.esc, money = CW.money;
  var t = function (k, v) { return CW.i18n.t(k, v); };

  var S = {
    biz: null, cats: [], products: [], portfolio: [],
    filterType: 'all', filterCat: '', q: '',
    cart: [] // {id, name, price, qty, kind, image}
  };

  function param(k) { return new URLSearchParams(location.search).get(k); }

  // ---- Datos ----------------------------------------------------------
  // El catálogo de ejemplo (`?b=demo`) se puede editar desde el panel:
  // Administración → Demo. Si no hay nada guardado, usa los valores base.
  function demoData(cb) {
    CW.store.getSiteSettings().then(function (settings) {
      cb(CW.demoCatalogMerged(settings && settings.demo_catalog));
    }).catch(function () { cb(CW.demoCatalogMerged(null)); });
  }

  function load() {
    var slug = param('b') || param('biz');
    return CW.store.init().then(function () {
      if (!slug) return null;
      if (slug === 'demo') {
        // Si existe un negocio real "demo", úsalo; si no, datos de ejemplo.
        return CW.store.getBusinessBySlug('demo').then(function (b) { return b || null; });
      }
      return CW.store.getBusinessBySlug(slug);
    }).then(function (biz) {
      if (!biz && slug === 'demo') {
        return new Promise(function (resolve) {
          demoData(function (d) {
            S.biz = d.biz; S.cats = d.cats; S.products = d.products; S.portfolio = d.portfolio || [];
            resolve();
          });
        });
      }
      if (!biz || (!biz.published && !CW.isDemo)) { S.biz = null; return; }
      S.biz = biz;
      return Promise.all([
        CW.store.listCategories(biz.id),
        CW.store.listProducts(biz.id, { activeOnly: true }),
        CW.store.listPortfolio(biz.id, { activeOnly: true }).catch(function () { return []; })
      ]).then(function (r) {
        S.cats = r[0]; S.products = r[1];
        S.portfolio = (r[2] || []).filter(function (i) { return i.active !== false; });
      });
    });
  }

  // ---- Render principal ----------------------------------------------
  function render() {
    var root = $('[data-catalog-root]');
    if (!S.biz) {
      root.innerHTML = '<div class="wrap empty-state big"><div class="es-icon">🔍</div><b>' + t('cat.public.notfound') + '</b><p>' + t('cat.public.notfound.desc') + '</p><a class="btn primary" href="' + CW.url('index.html') + '">WA Professionnels Maroc</a></div>';
      return;
    }
    var b = S.biz;
    document.title = (CW.tx(b, 'seo_title') || CW.tx(b, 'name')) + ' · WA Professionnels Maroc';
    document.querySelector('meta[name=description]').setAttribute('content', CW.tx(b, 'seo_description') || CW.tx(b, 'description') || '');
    document.documentElement.style.setProperty('--brand', b.brand_color || '#5B1A80');
    document.documentElement.style.setProperty('--brand-soft', hexSoft(b.brand_color || '#5B1A80'));

    // Cabecera
    var brand = $('[data-cat-brand]');
    brand.innerHTML =
      (b.logo_url ? '<img src="' + esc(b.logo_url) + '" alt="" class="cat-logo">' : '<span class="cat-logo ph" style="background:' + esc(b.brand_color) + '">' + esc((CW.tx(b, 'name') || 'M').charAt(0)) + '</span>') +
      '<div><b>' + esc(CW.tx(b, 'name')) + '</b>' + (CW.tx(b, 'description') ? '<small>' + esc(CW.tx(b, 'description')) + '</small>' : '') + '</div>';

    // Enlace al porfolio: solo si el negocio ha publicado trabajos.
    $$('[data-pf-link]').forEach(function (pf) {
      if (S.portfolio.length) {
        pf.hidden = false;
        pf.href = CW.url('porfolio.html') + '?b=' + encodeURIComponent(b.slug || '');
        pf.textContent = t('port.link');
      } else {
        pf.hidden = true;
      }
    });

    // Hero
    var hero = '';
    if (b.hero_enabled) {
      hero = '<section class="cat-hero" style="' + (b.hero_image ? 'background-image:linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)),url(' + esc(b.hero_image) + ')' : '') + '">' +
        '<div class="wrap"><h1>' + esc(CW.tx(b, 'hero_title') || CW.tx(b, 'name')) + '</h1>' +
        (CW.tx(b, 'hero_desc') ? '<p>' + esc(CW.tx(b, 'hero_desc')) + '</p>' : '') + '</div></section>';
    }

    // Info entrega / pagos
    var info = '';
    var dvModes = (b.delivery && b.delivery !== 'whatsapp') ? String(b.delivery).split(',') : [];
    var hasDelivery = dvModes.length > 0 || b.delivery_time || b.delivery_notes || Number(b.delivery_fee) > 0;
    var hasPays = (b.payments || []).length;
    if (hasDelivery || hasPays) {
      info = '<section class="cat-info"><div class="wrap cat-info-grid">' +
        (hasDelivery ? '<div class="info-card"><span>🚚</span><div><b>' + t('cat.public.delivery') + '</b>' +
          '<small>' + (dvModes.length ? dvModes.map(function (m) { return m === 'pickup' ? t('cat.public.pickup') : t('cat.public.deliveryMode'); }).join(' · ') + ' · ' : '') +
          (Number(b.delivery_fee) > 0 ? t('cat.public.fee') + ': ' + money(b.delivery_fee, b.currency) : '') +
          (b.delivery_time ? ' · ' + esc(b.delivery_time) : '') + (b.delivery_notes ? ' · ' + esc(b.delivery_notes) : '') + '</small></div></div>' : '') +
        (hasPays ? '<div class="info-card"><span>💳</span><div><b>' + t('cat.public.payment') + '</b><small>' + esc((b.payments || []).join(', ')) + '</small></div></div>' : '') +
        '</div></section>';
    }

    // El menú (categorías + buscador) vive en la cabecera, entre el logo y las
    // banderas de idioma. En móvil se despliega desde la hamburguesa.
    var menu = $('[data-cat-menu]');
    if (menu) menu.innerHTML = renderFilters();

    root.innerHTML = hero + info +
      '<section class="wrap cat-grid" data-grid></section>' +
      '<footer class="cat-footer"><div class="wrap"><div>' + esc(CW.tx(b, 'name')) + ' · WA Professionnels Maroc</div>' +
        '<nav class="cat-policies">' +
          (S.portfolio.length ? '<a href="' + esc(CW.url('porfolio.html') + '?b=' + encodeURIComponent(b.slug || '')) + '">' + t('port.link') + '</a>' : '') +
          ['legal', 'privacy', 'cookies', 'terms', 'returns', 'shipping'].map(function (k) {
            return '<a href="#" data-policy="' + k + '">' + t('pol.' + k) + '</a>';
          }).join('') +
        '</nav></div></footer>';

    bindFilters();
    drawGrid();
    updateCartUI();
  }

  function hexSoft(hex) {
    try {
      var h = hex.replace('#', '');
      var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), bl = parseInt(h.slice(4, 6), 16);
      return 'rgba(' + r + ',' + g + ',' + bl + ',0.10)';
    } catch (e) { return 'rgba(91,26,128,.1)'; }
  }

  // ---- Filtros --------------------------------------------------------
  function countInCat(catId) { return S.products.filter(function (p) { return p.category_id === catId; }).length; }

  function renderFilters() {
    // Detectamos qué tipos existen realmente en el catálogo.
    var hasP = S.products.some(function (p) { return p.kind !== 'service'; });
    var hasS = S.products.some(function (p) { return p.kind === 'service'; });
    // Si solo hay un tipo, fijamos ese tipo y ocultamos el selector.
    if (hasP && !hasS && S.filterType === 'service') S.filterType = 'product';
    if (hasS && !hasP && S.filterType === 'product') S.filterType = 'service';
    var showTypes = hasP && hasS;

    // Una sola lista de categorias, agrupada por tipo y respetando el filtro de tipo.
    // Las categorías desactivadas en el panel no aparecen en el catálogo público.
    var cats = S.cats.filter(function (c) {
      if (c.active === false) return false;
      if (S.filterType === 'product') return c.kind !== 'service';
      if (S.filterType === 'service') return c.kind === 'service';
      return true;
    });
    var prodCats = cats.filter(function (c) { return c.kind !== 'service'; });
    var servCats = cats.filter(function (c) { return c.kind === 'service'; });
    function opt(c) { return '<option value="' + c.id + '"' + (c.id === S.filterCat ? ' selected' : '') + '>' + esc(CW.tx(c, 'name')) + ' (' + countInCat(c.id) + ')</option>'; }
    var catOpts = '<option value="">' + t('cat.public.allcat') + '</option>';
    if (prodCats.length && servCats.length) {
      catOpts += '<optgroup label="' + t('cat.public.products') + '">' + prodCats.map(opt).join('') + '</optgroup>';
      catOpts += '<optgroup label="' + t('cat.public.services') + '">' + servCats.map(opt).join('') + '</optgroup>';
    } else {
      catOpts += cats.map(opt).join('');
    }
    var active = (showTypes && S.filterType !== 'all') || S.filterCat || S.q;
    return '<div class="filter-inner" data-filters>' +
      (showTypes ? '<div class="segmented" data-ftype>' +
        '<button data-ft="all" class="' + (S.filterType === 'all' ? 'active' : '') + '">' + t('common.all') + '</button>' +
        '<button data-ft="product" class="' + (S.filterType === 'product' ? 'active' : '') + '">' + t('cat.public.products') + '</button>' +
        '<button data-ft="service" class="' + (S.filterType === 'service' ? 'active' : '') + '">' + t('cat.public.services') + '</button>' +
      '</div>' : '') +
      (cats.length ? '<select data-fcat aria-label="' + t('common.category') + '">' + catOpts + '</select>' : '') +
      '<input class="search" data-fq type="search" aria-label="' + t('cat.public.search') + '" placeholder="' + t('cat.public.search') + '" value="' + esc(S.q) + '">' +
      (active ? '<button class="btn ghost small" data-fclear>' + t('cat.public.clear') + '</button>' : '') +
      '</div>';
  }

  function bindFilters() {
    $$('[data-ft]').forEach(function (b) { b.addEventListener('click', function () { S.filterType = b.dataset.ft; S.filterCat = ''; rerenderFilters(); }); });
    var fc = $('[data-fcat]'); if (fc) fc.addEventListener('change', function () { S.filterCat = fc.value; drawGrid(); });
    var q = $('[data-fq]'); if (q) q.addEventListener('input', function () { S.q = q.value; drawGrid(); });
    var cl = $('[data-fclear]'); if (cl) cl.addEventListener('click', function () { S.filterType = 'all'; S.filterCat = ''; S.q = ''; rerenderFilters(); });
  }
  function rerenderFilters() {
    var menu = $('[data-cat-menu]');
    if (menu) menu.innerHTML = renderFilters();
    bindFilters();
    drawGrid();
  }

  // ---- Tarjetas -------------------------------------------------------
  function visible() {
    var list = S.products.slice();
    if (S.filterType === 'product') list = list.filter(function (p) { return p.kind !== 'service'; });
    if (S.filterType === 'service') list = list.filter(function (p) { return p.kind === 'service'; });
    if (S.filterCat) list = list.filter(function (p) { return p.category_id === S.filterCat; });
    // Nota: una categoría desactivada desaparece del selector, pero sus
    // artículos siguen visibles en «Todas».
    if (S.q) { var q = S.q.toLowerCase(); list = list.filter(function (p) {
      return String(CW.tx(p, 'name') || '').toLowerCase().includes(q) || String(CW.tx(p, 'description') || '').toLowerCase().includes(q);
    }); }
    list.sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); });
    return list;
  }
  function eff(p) { return Number(p.promo_price) > 0 ? Number(p.promo_price) : Number(p.price || 0); }
  function catOf(id) { return S.cats.find(function (c) { return c.id === id; }); }

  function drawGrid() {
    var list = visible();
    var grid = $('[data-grid]');
    if (!list.length) { grid.innerHTML = '<div class="empty-state"><div class="es-icon">📦</div><b>' + t('prod.empty') + '</b></div>'; return; }
    grid.innerHTML = list.map(cardHTML).join('');
    $$('[data-add]', grid).forEach(function (b) { b.addEventListener('click', function () { addToCart(b.dataset.add); }); });
    $$('[data-book]', grid).forEach(function (b) { b.addEventListener('click', function () { openBooking(b.dataset.book); }); });
    $$('[data-detail]', grid).forEach(function (b) { b.addEventListener('click', function () { openDetail(b.dataset.detail); }); });
    $$('[data-share]', grid).forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); shareCard(b.dataset.share); }); });
  }

  function shareCard(id) {
    var p = S.products.find(function (x) { return x.id === id; }); if (!p) return;
    var c = catOf(p.category_id);
    CW.api.shareWhatsApp(CW.api.shareItem(S.biz, Object.assign({}, p, { name: CW.tx(p, 'name'), description: CW.tx(p, 'description'), category_name: c ? CW.tx(c, 'name') : '' })));
  }

  // Descripción breve para las tarjetas: se usa la del panel; si está vacía,
  // se recorta la descripción larga a 90 caracteres.
  function shortText(p) {
    var s = String(CW.tx(p, 'short_desc') || '').replace(/\s+/g, ' ').trim();
    var isOwn = !!s;
    if (!s) s = String(CW.tx(p, 'description') || '').replace(/\s+/g, ' ').trim();
    if (!s) return '';
    if (s.length > 90) {
      s = s.slice(0, 89).replace(/[\s,.;:]+\S*$/, '').replace(/[\s,.;:]+$/, '') + '…';
      if (!isOwn && s.length > 90) s = s.slice(0, 90);
    }
    return s;
  }

  function cardHTML(p) {
    var c = catOf(p.category_id);
    var short = shortText(p);
    var isService = p.kind === 'service';
    var hasPromo = !isService && Number(p.promo_price) > 0 && Number(p.promo_price) < Number(p.price);
    var img = (p.images && p.images[0]) ? '<img src="' + esc(p.images[0]) + '" alt="' + esc(CW.tx(p, 'name')) + '" loading="lazy">' : '<div class="ph-img">🖼️</div>';
    var inCart = S.cart.find(function (x) { return x.id === p.id; });

    var media = '<div class="pc-media" data-detail="' + p.id + '">' + img +
      (isService ? '<span class="pc-kind">🔧 ' + t('prod.type.service') + '</span>' : '') +
      (c ? '<span class="pc-cat">' + esc(CW.tx(c, 'name')) + '</span>' : '') +
      (hasPromo ? '<span class="pc-off">-' + CW.api.pct(p.promo_price, p.price) + '%</span>' : '') +
      (inCart ? '<span class="pc-incart">✓ ' + inCart.qty + '</span>' : '') +
      '</div>';

    var btn = isService ? (p.bookable ? t('cat.public.book') : t('cat.public.request')) : t('cat.public.add');
    var actions = '<div class="pc-actions">' +
      (isService && p.bookable
        ? '<button class="btn primary small" data-book="' + p.id + '">📅 ' + t('cat.public.book') + '</button>'
        : '<button class="btn ' + (isService ? 'soft' : 'primary') + ' small" data-add="' + p.id + '">' + btn + '</button>') +
      '<button class="btn ghost small" data-detail="' + p.id + '">' + t('cat.public.details') + '</button>' +
      '<button class="btn ghost small pc-share" data-share="' + p.id + '" aria-label="' + t('common.share') + '" title="' + t('common.share') + '">↗</button>' +
      '</div>';

    // ---- Tarjeta de SERVICIO: pensada para servicios ----
    if (isService) {
      var price = Number(p.price) > 0
        ? '<b>' + money(p.price, S.biz.currency) + '</b>'
        : '<b class="consult">' + t('cat.public.consult') + '</b>';
      var specs = '';
      if (p.duration) specs += '<span class="pc-spec"><i>⏱</i>' + esc(p.duration) + '</span>';
      if (p.modality) specs += '<span class="pc-spec"><i>📍</i>' + esc(p.modality) + '</span>';
      return '<article class="pc pc--service">' + media +
        '<div class="pc-body">' +
          '<h3 class="pc-name">' + esc(CW.tx(p, 'name')) + '</h3>' +
          (short ? '<p class="pc-desc">' + esc(short) + '</p>' : '') +
          (specs ? '<div class="pc-specs-list">' + specs + '</div>' : '') +
          '<div class="pc-service-foot">' +
            '<div class="pc-price">' + price + '</div>' +
            '<span class="pc-avail">✅ ' + t('cat.public.available') + '</span>' +
          '</div>' +
          actions +
        '</div></article>';
    }

    // ---- Tarjeta de PRODUCTO ----
    var priceHtml = hasPromo
      ? '<div class="pc-price"><b>' + money(p.promo_price, S.biz.currency) + '</b><s>' + money(p.price, S.biz.currency) + '</s></div>'
      : '<div class="pc-price"><b>' + money(p.price, S.biz.currency) + '</b></div>';
    var promo = hasPromo
      ? '<div class="pc-specs"><span class="save">🎁 ' + t('cat.public.save') + ' ' + CW.api.pct(p.promo_price, p.price) + '%</span></div>'
      : '';
    return '<article class="pc pc--product">' + media +
      '<div class="pc-body">' +
        '<h3 class="pc-name">' + esc(CW.tx(p, 'name')) + '</h3>' +
        (short ? '<p class="pc-desc">' + esc(short) + '</p>' : '') +
        priceHtml + promo +
        actions +
      '</div></article>';
  }

  // ---- Ficha de detalle ----------------------------------------------
  function openDetail(id) {
    var p = S.products.find(function (x) { return x.id === id; }); if (!p) return;
    if (S.biz.id !== 'demo') CW.store.incrementViews(p.id);
    var c = catOf(p.category_id);
    var imgs = (p.images && p.images.length) ? p.images : [null];
    var m = CW.modal({
      className: 'detail-modal',
      title: CW.tx(p, 'name'),
      html:
        '<div class="detail-grid">' +
          '<div class="detail-gallery"><div class="dg-main" data-dg-main>' + (imgs[0] ? '<img src="' + esc(imgs[0]) + '">' : '<div class="ph-img big">🖼️</div>') + '</div>' +
          (imgs.length > 1 ? '<div class="dg-thumbs">' + imgs.map(function (u, i) { return '<button data-dg="' + i + '" class="' + (i === 0 ? 'active' : '') + '">' + (u ? '<img src="' + esc(u) + '">' : '🖼️') + '</button>'; }).join('') + '</div>' : '') + '</div>' +
          '<div class="detail-info"><span class="detail-type">' + (p.kind === 'service' ? t('prod.type.service') : t('prod.type.product')) + (c ? ' · ' + esc(CW.tx(c, 'name')) : '') + '</span>' +
          '<h2>' + esc(CW.tx(p, 'name')) + '</h2>' +
          '<div class="detail-price">' + (Number(p.promo_price) > 0 && Number(p.promo_price) < Number(p.price) ?
            '<b>' + money(p.promo_price, S.biz.currency) + '</b> <s>' + money(p.price, S.biz.currency) + '</s> <span class="tag warn">-' + CW.api.pct(p.promo_price, p.price) + '%</span>' :
            (Number(p.price) > 0 ? '<b>' + money(p.price, S.biz.currency) + '</b>' : '<b>' + t('cat.public.consult') + '</b>')) + '</div>' +
          '<ul class="detail-rows">' +
            '<li>🏷️ ' + t('cat.public.category') + ': <b>' + esc(c ? CW.tx(c, 'name') : '—') + '</b></li>' +
            (p.duration ? '<li>⏱ ' + t('cat.public.duration') + ': <b>' + esc(p.duration) + '</b></li>' : '') +
            (p.modality ? '<li>📍 ' + t('cat.public.modality') + ': <b>' + esc(p.modality) + '</b></li>' : '') +
            (p.kind === 'service' ? '<li>✅ ' + t('cat.public.available') + '</li>' : '') +
          '</ul>' +
          (CW.tx(p, 'description') ? '<p class="detail-desc">' + esc(CW.tx(p, 'description')).replace(/\n/g, '<br>') + '</p>' : '') +
          '<div class="detail-actions"><button class="btn primary" data-d-add="' + p.id + '">' + (p.kind === 'service' ? (p.bookable ? t('cat.public.book') : t('cat.public.request')) : t('cat.public.add')) + '</button>' +
          '<button class="btn ghost" data-d-share="' + p.id + '">↗ ' + t('common.share') + '</button></div></div>' +
        '</div>'
    });
    $$('[data-dg]', m.modal).forEach(function (b) {
      b.addEventListener('click', function () {
        var i = Number(b.dataset.dg);
        $$('[data-dg]', m.modal).forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active');
        $('[data-dg-main]', m.modal).innerHTML = imgs[i] ? '<img src="' + esc(imgs[i]) + '">' : '<div class="ph-img big">🖼️</div>';
      });
    });
    $('[data-d-add]', m.modal).addEventListener('click', function () { addToCart(p.id); m.close(); openCart(); });
    $('[data-d-share]', m.modal).addEventListener('click', function () {
      CW.api.shareWhatsApp(CW.api.shareItem(S.biz, Object.assign({}, p, { name: CW.tx(p, 'name'), description: CW.tx(p, 'description'), category_name: c ? CW.tx(c, 'name') : '' })));
    });
  }

  // ---- Reserva de servicios -------------------------------------------
  // Formulario propio para servicios (fontanero, peluquería, diseño web…):
  // calendario con días cerrados y ocupados, horas disponibles y detalles.
  var BK = { item: null, month: null, date: '', time: '', busy: [], modal: null };

  function ymd(d) {
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function parseYmd(v) { var p = String(v).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function workDays(biz) { return (biz.work_days && biz.work_days.length) ? biz.work_days : [1, 2, 3, 4, 5, 6]; }

  function openBooking(id) {
    var p = S.products.find(function (x) { return x.id === id; });
    if (!p) return;
    BK.item = p; BK.date = ''; BK.time = ''; BK.busy = [];
    var today = new Date();
    BK.month = new Date(today.getFullYear(), today.getMonth(), 1);

    var m = CW.modal({
      className: 'bk-modal',
      title: t('bk.title'),
      html:
        '<div class="bk-service">' +
          '<div class="bk-service-thumb">' + ((p.images && p.images[0]) ? '<img src="' + esc(p.images[0]) + '" alt="">' : '🛠️') + '</div>' +
          '<div class="bk-service-info"><b>' + esc(CW.tx(p, 'name')) + '</b>' +
            '<small>' + [p.duration, p.modality].filter(Boolean).map(esc).join(' · ') + '</small>' +
            '<span class="bk-price">' + (Number(p.price) > 0 ? money(p.price, S.biz.currency) : t('cat.public.consult')) + '</span>' +
          '</div>' +
        '</div>' +
        (p.requirements ? '<p class="bk-req">ℹ️ ' + esc(p.requirements) + '</p>' : '') +
        '<div class="bk-grid">' +
          '<div class="bk-cal"><div class="bk-cal-head">' +
            '<button type="button" class="icon-btn" data-bk-prev aria-label="' + t('bk.prev') + '">‹</button>' +
            '<b data-bk-month></b>' +
            '<button type="button" class="icon-btn" data-bk-next aria-label="' + t('bk.next') + '">›</button>' +
          '</div><div class="bk-days-head">' + ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div>' +
          '<div class="bk-days" data-bk-days></div>' +
          '<p class="muted bk-legend">' + t('bk.legend') + '</p></div>' +
          '<div class="bk-slots"><h4>' + t('bk.slots') + '</h4><div class="bk-slot-list" data-bk-slotlist>' +
            '<p class="muted">' + t('bk.pickday') + '</p></div>' +
            '<label class="field"><span>' + t('bk.notes') + '</span><textarea data-bk-notes rows="2" maxlength="240"></textarea></label>' +
            '<label class="field bk-address" hidden><span>' + t('bk.address') + '</span><input data-bk-address></label>' +
          '</div>' +
        '</div>' +
        '<p class="bk-summary muted" data-bk-sum>' + t('bk.nothing') + '</p>',
      footer: '<button class="btn ghost" data-close>' + t('common.cancel') + '</button>' +
              '<button class="btn primary" data-bk-confirm disabled>✓ ' + t('bk.confirm') + '</button>'
    });
    BK.modal = m;
    if (/domicilio|a domicilio|home/i.test(String(p.modality || '')) || /delivery/.test(String(S.biz.delivery || ''))) {
      $('.bk-address', m.modal).hidden = false;
    }
    $('[data-bk-prev]', m.modal).addEventListener('click', function () { BK.month.setMonth(BK.month.getMonth() - 1); drawBookingCalendar(m.modal); });
    $('[data-bk-next]', m.modal).addEventListener('click', function () { BK.month.setMonth(BK.month.getMonth() + 1); drawBookingCalendar(m.modal); });
    $('[data-bk-confirm]', m.modal).addEventListener('click', confirmBooking);
    drawBookingCalendar(m.modal);
  }

  function drawBookingCalendar(modal) {
    var lang = (CW.i18n && CW.i18n.lang) || 'es';
    var fmt = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' });
    $('[data-bk-month]', modal).textContent = fmt.format(BK.month);

    var first = new Date(BK.month.getFullYear(), BK.month.getMonth(), 1);
    var startOffset = (first.getDay() + 6) % 7; // lunes = 0
    var daysInMonth = new Date(BK.month.getFullYear(), BK.month.getMonth() + 1, 0).getDate();
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var html = '';
    for (var i = 0; i < startOffset; i++) html += '<span class="bk-day empty"></span>';
    for (var d = 1; d <= daysInMonth; d++) {
      var date = new Date(BK.month.getFullYear(), BK.month.getMonth(), d);
      var past = date < today;
      var closed = workDays(S.biz).indexOf(date.getDay()) === -1;
      var sel = BK.date === ymd(date);
      html += '<button type="button" class="bk-day' + (past || closed ? ' off' : '') + (sel ? ' sel' : '') + '"' +
        (past || closed ? ' disabled' : '') + ' data-bk-day="' + ymd(date) + '">' + d + '</button>';
    }
    var box = $('[data-bk-days]', modal);
    box.innerHTML = html;
    $$('[data-bk-day]', box).forEach(function (b) {
      b.addEventListener('click', function () { selectBookingDay(modal, b.dataset.bkDay); });
    });
  }

  function selectBookingDay(modal, day) {
    BK.date = day; BK.time = '';
    drawBookingCalendar(modal);
    var list = $('[data-bk-slotlist]', modal);
    list.innerHTML = '<p class="muted">' + t('common.loading') + '</p>';
    CW.store.busySlots(S.biz.id, day).then(function (busy) {
      BK.busy = busy || [];
      var slots = CW.api.timeSlots(S.biz, day);
      if (day === ymd(new Date())) {
        var now = new Date();
        slots = slots.filter(function (s) {
          var hm = s.split(':'); var t2 = new Date(); t2.setHours(+hm[0], +hm[1], 0, 0);
          return t2 > now;
        });
      }
      var free = slots.filter(function (s) { return BK.busy.indexOf(s) === -1; });
      list.innerHTML = free.length
        ? free.map(function (s) {
            return '<button type="button" class="bk-slot' + (BK.time === s ? ' sel' : '') + '" data-bk-slot="' + s + '">' + s + '</button>';
          }).join('')
        : '<p class="muted">' + t('bk.full') + '</p>';
      $$('[data-bk-slot]', list).forEach(function (b) {
        b.addEventListener('click', function () {
          BK.time = b.dataset.bkSlot;
          $$('[data-bk-slot]', list).forEach(function (x) { x.classList.toggle('sel', x === b); });
          updateBookingSummary(modal);
        });
      });
      updateBookingSummary(modal);
    });
  }

  function updateBookingSummary(modal) {
    var sum = $('[data-bk-sum]', modal);
    var ok = !!(BK.date && BK.time);
    if (sum) {
      sum.textContent = ok
        ? t('bk.summary', { date: new Date(BK.date + 'T00:00:00').toLocaleDateString((CW.i18n && CW.i18n.lang) || 'es', { weekday: 'long', day: 'numeric', month: 'long' }), time: BK.time })
        : t('bk.nothing');
      sum.classList.toggle('ok', ok);
    }
    var btn = $('[data-bk-confirm]', modal);
    if (btn) btn.disabled = !ok;
  }

  function confirmBooking() {
    if (!BK.date || !BK.time) return;
    var box = BK.modal && BK.modal.modal;
    var notes = (box && $('[data-bk-notes]', box) || {}).value || '';
    var addr = (box && $('[data-bk-address]', box) || {}).value || '';
    var p = BK.item;
    addToCart(p.id, {
      appointment: { date: BK.date, time: BK.time, notes: notes.trim(), address: addr.trim() }
    });
    BK.modal.close();
    openCart();
    CW.toast(t('bk.added'), 'ok');
  }

  // ---- Carrito --------------------------------------------------------
  function addToCart(id, opts) {
    var p = S.products.find(function (x) { return x.id === id; }); if (!p) return;
    opts = opts || {};
    // Una reserva de servicio nunca se suma a otra: es una cita con su hora.
    var it = opts.appointment ? null : S.cart.find(function (x) { return x.id === id && !x.appointment; });
    if (it) it.qty++;
    else S.cart.push({
      id: p.id, name: CW.tx(p, 'name'), price: eff(p), qty: 1, kind: p.kind,
      image: (p.images && p.images[0]) || '', bookable: !!p.bookable,
      category_name: (catOf(p.category_id) || {}).name || '',
      duration: p.duration || '', modality: p.modality || '',
      appointment: opts.appointment || null
    });
    if (!opts.appointment) CW.toast(t('common.add') + ': ' + CW.tx(p, 'name'));
    updateCartUI(); drawGrid();
  }
  function removeFromCart(id) { S.cart = S.cart.filter(function (x) { return x.id !== id; }); updateCartUI(); drawGrid(); }
  function setQty(id, d) {
    var it = S.cart.find(function (x) { return x.id === id; }); if (!it) return;
    it.qty += d; if (it.qty <= 0) removeFromCart(id); else { updateCartUI(); }
  }
  function cartCount() { return S.cart.reduce(function (s, x) { return s + x.qty; }, 0); }
  function subtotal() { return S.cart.reduce(function (s, x) { return s + x.price * x.qty; }, 0); }

  function updateCartUI() {
    var fab = $('[data-cart-fab]');
    $('[data-cart-count]').textContent = cartCount();
    fab.hidden = cartCount() === 0;
    if (!$('[data-cart]').hidden) drawCart();
  }

  function openCart() {
    $('[data-cart]').hidden = false; $('[data-cart-overlay]').hidden = false;
    document.body.classList.add('cart-open');
    requestAnimationFrame(function () { $('[data-cart]').classList.add('show'); });
    drawCart();
  }
  function closeCart() {
    $('[data-cart]').classList.remove('show');
    setTimeout(function () { $('[data-cart]').hidden = true; $('[data-cart-overlay]').hidden = true; document.body.classList.remove('cart-open'); }, 200);
  }

  function drawCart() {
    var body = $('[data-cart-body]');
    var foot = $('[data-cart-foot]');
    // Conserva lo que el cliente ya escribió antes de re-renderizar.
    var prev = {};
    ['name', 'phone', 'address', 'city', 'note', 'date'].forEach(function (k) {
      var el = $('[data-c-' + k + ']', body); if (el) prev[k] = el.value;
    });
    if (!S.cart.length) {
      body.innerHTML = '<div class="empty-state"><div class="es-icon">🛒</div><b>' + t('cat.public.emptycart') + '</b></div>';
      foot.innerHTML = '';
      return;
    }
    var hasBookable = S.cart.some(function (x) { return x.bookable; });
    var fee = S.biz.delivery === 'custom' ? Number(S.biz.delivery_fee || 0) : 0;
    var total = subtotal() + fee;
    body.innerHTML =
      '<ul class="cart-items">' + S.cart.map(function (it) {
        return '<li class="cart-item">' +
          '<div class="ci-thumb">' + (it.image ? '<img src="' + esc(it.image) + '">' : '🖼️') + '</div>' +
          '<div class="ci-info"><b>' + esc(it.name) + '</b>' + (it.kind === 'service' ? '<small>' + t('prod.type.service') + '</small>' : '') +
          (it.appointment ? '<small class="ci-appt">📅 ' + esc(it.appointment.date) + ' · ' + esc(it.appointment.time) + '</small>' : '') +
          '<div class="qty"><button data-qm="' + it.id + '">−</button><span>' + it.qty + '</span><button data-qp="' + it.id + '">+</button></div></div>' +
          '<div class="ci-right"><b>' + (it.price > 0 ? money(it.price * it.qty, S.biz.currency) : t('cat.public.consult')) + '</b>' +
          '<button class="icon-btn" data-rm="' + it.id + '">✕</button></div></li>';
      }).join('') + '</ul>' +
      '<div class="cart-form">' +
        '<h4>' + t('cat.public.yourdata') + '</h4>' +
        '<div class="two-col-inline">' +
          '<label class="field"><span>' + t('common.name') + ' *</span><input data-c-name></label>' +
          '<label class="field"><span>' + t('common.phone') + ' *</span><input data-c-phone></label>' +
        '</div>' +
        '<div class="two-col-inline">' +
          '<label class="field"><span>' + t('cat.public.address') + '</span><input data-c-address></label>' +
          '<label class="field"><span>' + t('cat.public.city') + '</span><input data-c-city></label>' +
        '</div>' +
        '<label class="field"><span>' + t('cat.public.note') + '</span><textarea data-c-note rows="2"></textarea></label>' +
        (hasBookable ? '<div class="appt-block"><h4>' + t('cat.public.appt') + '</h4><div class="two-col-inline">' +
          '<label class="field"><span>' + t('cat.public.date') + '</span><input type="date" data-c-date></label>' +
          '<label class="field"><span>' + t('cat.public.time') + '</span><select data-c-time></select></label></div>' +
          '<small class="muted" data-c-closed hidden>' + t('cat.public.closed') + '</small></div>' : '') +
      '</div>';

    foot.innerHTML =
      '<div class="cart-totals">' +
        (fee > 0 ? '<div><span>' + t('cat.public.subtotal') + '</span><b>' + money(subtotal(), S.biz.currency) + '</b></div>' +
          '<div><span>' + t('cat.public.fee') + '</span><b>+' + money(fee, S.biz.currency) + '</b></div>' : '') +
        '<div class="grand"><span>' + t('cat.public.total') + '</span><b>' + money(total, S.biz.currency) + '</b></div>' +
      '</div>' +
      '<button class="btn wa block" data-send>💬 ' + t('cat.public.send') + '</button>';

    $$('[data-qm]', body).forEach(function (b) { b.addEventListener('click', function () { setQty(b.dataset.qm, -1); }); });
    $$('[data-qp]', body).forEach(function (b) { b.addEventListener('click', function () { setQty(b.dataset.qp, 1); }); });
    $$('[data-rm]', body).forEach(function (b) { b.addEventListener('click', function () { removeFromCart(b.dataset.rm); }); });

    // Restaura los datos del cliente.
    ['name', 'phone', 'address', 'city', 'note', 'date'].forEach(function (k) {
      var el = $('[data-c-' + k + ']', body); if (el && prev[k] != null) el.value = prev[k];
    });

    if (hasBookable) {
      var dateEl = $('[data-c-date]', body), timeEl = $('[data-c-time]', body);
      function refreshSlots() {
        var slots = CW.api.timeSlots(S.biz, dateEl.value);
        $('[data-c-closed]', body).hidden = !dateEl.value || slots.length > 0;
        timeEl.innerHTML = slots.length ? slots.map(function (s) { return '<option>' + s + '</option>'; }).join('') : '<option>—</option>';
      }
      dateEl.addEventListener('change', refreshSlots);
      var today = new Date().toISOString().slice(0, 10); dateEl.min = today;
      dateEl.value = prev.date || today;
      refreshSlots();
    }

    $('[data-send]', foot).addEventListener('click', function () {
      var name = ($('[data-c-name]', body).value || '').trim();
      var phone = ($('[data-c-phone]', body).value || '').trim();
      if (!name || !phone) { CW.toast(t('cat.public.required')); return; }
      var appt = null;
      var booked = S.cart.filter(function (x) { return x.appointment && x.appointment.date; })[0];
      if (booked) appt = new Date(booked.appointment.date + 'T' + booked.appointment.time + ':00').toISOString();
      else if (hasBookable) {
        var d = $('[data-c-date]', body).value, h = $('[data-c-time]', body).value;
        if (d && h && h !== '—') appt = new Date(d + 'T' + h + ':00').toISOString();
      }
      var order = {
        business_id: S.biz.id, code: CW.store.newOrderCode(),
        customer_name: name, customer_phone: phone,
        customer_address: ($('[data-c-address]', body).value || '').trim(),
        customer_city: ($('[data-c-city]', body).value || '').trim(),
        note: ($('[data-c-note]', body).value || '').trim(),
        items: S.cart.map(function (x) {
          return {
            name: x.name, qty: x.qty, price: x.price, kind: x.kind,
            duration: x.duration || '', modality: x.modality || '',
            appointment: x.appointment || null
          };
        }),
        subtotal: subtotal(), fee: fee, total: total, appointment_at: appt, status: 'new'
      };
      var msg = CW.api.orderMessage(S.biz, order);
      // Guarda (si no es demo) y abre WhatsApp
      var save = (S.biz.id === 'demo' && CW.isDemo) ? Promise.resolve(order) : CW.store.createOrder(order);
      save.then(function () {
        window.open(CW.api.waLink(S.biz.whatsapp, msg), '_blank');
        S.cart = []; updateCartUI(); closeCart(); drawGrid();
        CW.toast('✓');
      }).catch(function () { window.open(CW.api.waLink(S.biz.whatsapp, msg), '_blank'); });
    });
  }

  // ---- API para otros módulos (p. ej. el asistente) -------------------
  CW.catalogData = function () {
    return { biz: S.biz, products: S.products, cats: S.cats, cart: S.cart };
  };
  CW.catalogAdd = function (id) { addToCart(id); };
  CW.catalogOpen = function () { openCart(); };

  // ---- Init -----------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    var ov = $('[data-cart-overlay]'); if (ov) ov.addEventListener('click', closeCart);
    var cc = $('[data-cart-close]'); if (cc) cc.addEventListener('click', closeCart);
    var fab = $('[data-cart-fab]'); if (fab) fab.addEventListener('click', openCart);

    // Hamburguesa: despliega el menú completo (categorías, buscador, idioma,
    // porfolio y asistente) en móvil.
    var burger = $('[data-cat-burger]');
    var header = $('[data-cat-header]');
    if (burger && header) {
      burger.addEventListener('click', function () {
        var open = header.classList.toggle('menu-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        burger.textContent = open ? '✕' : '☰';
      });
      document.addEventListener('click', function (e) {
        if (!header.classList.contains('menu-open')) return;
        if (header.contains(e.target)) return;
        header.classList.remove('menu-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.textContent = '☰';
      });
    }

    // Botón «Asistente» de la cabecera y del menú móvil.
    $$('[data-asst-open]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (header) header.classList.remove('menu-open');
        if (CW.assistant && CW.assistant.open) CW.assistant.open();
      });
    });
    window.addEventListener('cw:lang', function () { if (S.biz) render(); });
    load().then(render).catch(function (e) { console.error(e); render(); });
  });
})(window, document);
