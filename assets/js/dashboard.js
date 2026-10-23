/* ==========================================================================
   WA Professionnels Maroc · dashboard.js
   Panel del negocio + administración (con cobertura de usuarios/negocios).
   ========================================================================== */
(function (window, document) {
  'use strict';
  var CW = window.CW;
  var $ = CW.$, $$ = CW.$$, esc = CW.esc, money = CW.money, t = function (k, v) { return CW.i18n.t(k, v); };

  var WA_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3 0-.5l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1z"/></svg>';

  var SET_HERO = {
    info: ['Información del negocio', 'Nombre, descripción, ubicación y zona horaria.'],
    whatsapp: ['WhatsApp del negocio', 'Define el número de WhatsApp al que tus clientes enviarán sus pedidos.'],
    brand: ['Marca del negocio', 'Elige el logotipo y el color principal de tu catálogo.'],
    currency: ['Moneda', 'Define la moneda con la que trabajará tu catálogo.'],
    link: ['Enlace del catálogo', 'El enlace que compartes para que tus clientes abran tu catálogo.'],
    presentation: ['Presentación del catálogo', 'Título, descripción e imagen del encabezado público.'],
    delivery: ['Entrega', 'Define cómo coordinarás la entrega o el retiro de los pedidos con tus clientes.'],
    payments: ['Formas de pago', 'Opciones que el cliente puede indicar al hacer su pedido.'],
    hours: ['Horarios', 'Días y horas en que atiendes.'],
    seo: ['SEO y compartir', 'Mejora cómo se presenta tu catálogo en buscadores y cuando compartes tu enlace. Tú eliges el contenido; nosotros nos encargamos de las etiquetas técnicas.']
  };

  var HOME_IMAGES = [
    { key: 'hero', label: 'Hero · móvil principal' },
    { key: 'problem_a', label: 'Problema · sin catálogo' },
    { key: 'problem_b', label: 'Problema · con catálogo' },
    { key: 'value_1', label: 'Valor 1' },
    { key: 'value_2', label: 'Valor 2' },
    { key: 'value_3', label: 'Valor 3' },
    { key: 'split_1', label: 'Bloque · experiencia del cliente' },
    { key: 'split_2', label: 'Bloque · control del negocio' },
    { key: 'tpl_1', label: 'Plantilla 1' },
    { key: 'tpl_2', label: 'Plantilla 2' },
    { key: 'tpl_3', label: 'Plantilla 3' },
    { key: 'tpl_4', label: 'Plantilla 4' },
    { key: 'tpl_5', label: 'Plantilla 5' }
  ];

  var state = {
    session: null, biz: null, isAdmin: false,
    cats: [], products: [], orders: [], library: [], portfolio: [], team: [],
    route: 'home', sub: null
  };

  // ---------------------------------------------------------------------
  // Helpers de datos
  // ---------------------------------------------------------------------
  function loadAll() {
    if (!state.biz) return Promise.resolve();
    var id = state.biz.id;
    return Promise.all([
      CW.store.listCategories(id),
      CW.store.listProducts(id),
      CW.store.listOrders(id),
      CW.store.listLibrary(id),
      // Si la tabla del porfolio todavía no existe, el panel debe seguir
      // funcionando (solo se queda sin porfolio).
      CW.store.listPortfolio(id).catch(function () { return []; }),
      CW.store.listProfessionals(id).catch(function () { return []; })
    ]).then(function (r) {
      state.cats = r[0]; state.products = r[1]; state.orders = r[2]; state.library = r[3];
      state.portfolio = r[4] || [];
      state.team = r[5] || [];
    });
  }

  function catName(id) {
    var c = state.cats.find(function (x) { return x.id === id; });
    return c ? c.name : '';
  }

  function bizUrl() { return CW.catalogUrl(state.biz.slug); }

  function stripCountry(country, phone) {
    var c = CW.COUNTRY_CODES[country]; if (!c) return String(phone || '');
    var s = String(phone || '').replace(/[^\d]/g, '');
    if (s.indexOf(c.code) === 0) s = s.slice(c.code.length);
    return s;
  }

  // ---------------------------------------------------------------------
  // Arranque
  // ---------------------------------------------------------------------
  function boot() {
    CW.store.init().then(function () {
      return CW.store.getSession();
    }).then(function (sess) {
      if (!sess || !sess.user) { location.replace(CW.url('login.html')); return; }
      state.session = sess;
      state.biz = sess.business;
      if (!state.biz) {
        // Cuenta sin negocio (poco probable): lo creamos.
        return CW.store.getMyBusiness().then(function (b) { state.biz = b; });
      }
    }).then(function () {
      return CW.store.isAdmin().then(function (a) { state.isAdmin = a; applyAdmin(a); });
    }).then(function () {
      if (!state.biz) { location.replace(CW.url('login.html')); return; }
      // ¿Asistente?
      var forceOnb = location.hash === '#onboarding';
      if (!state.biz.onboarded || forceOnb) { showOnboarding(); }
      $('[data-app]').hidden = false;
      renderBizChip();
      $('[data-crumb-business]').textContent = state.biz.name;
      var prev = $('[data-preview]'); if (prev) prev.href = CW.url('catalogo.html') + '?b=' + encodeURIComponent(state.biz.slug);
      loadAll().then(route);
      window.addEventListener('hashchange', route);
      // Si el usuario abre el panel en otra pestaña y cambian sus permisos,
      // al volver se vuelve a comprobar en lugar de quedarse sin el menú.
      window.addEventListener('focus', function () {
        CW.store.isAdmin().then(function (a) { if (a !== state.isAdmin) { state.isAdmin = a; applyAdmin(a); } });
      });
    }).catch(function (err) {
      console.warn('[CW] Error al arrancar el panel:', err);
      $('[data-app]').hidden = false;
    });
  }

  // Muestra u oculta todo lo reservado al super administrador.
  function applyAdmin(a) {
    $$('[data-admin-only]').forEach(function (e) { e.hidden = !a; });
  }

  function renderBizChip() {
    var chip = $('[data-biz-chip]');
    if (!chip) return;
    var initial = (state.biz.name || 'M').trim().charAt(0).toUpperCase();
    chip.innerHTML =
      '<div class="biz-avatar" style="background:' + esc(state.biz.brand_color || '#5B1A80') + '">' + esc(initial) + '</div>' +
      '<div class="biz-meta"><b>' + esc(state.biz.name) + '</b><small>' + (state.biz.published ? t('adm.published') : t('home.ready')) + '</small></div>';
  }

  // ---------------------------------------------------------------------
  // Router
  // ---------------------------------------------------------------------
  var ROUTES = ['home', 'orders', 'contacts', 'agenda', 'sales', 'products', 'services', 'categories', 'portfolio', 'team', 'library', 'settings', 'plan', 'account', 'admin'];

  function route() {
    var h = location.hash.replace(/^#/, '') || 'home';
    var parts = h.split('/');
    state.route = ROUTES.indexOf(parts[0]) >= 0 ? parts[0] : 'home';
    state.sub = parts[1] || null;
    state.param = parts[2] || null;
    $$('.side-nav a[data-route]').forEach(function (a) { a.classList.toggle('active', a.dataset.route === state.route); });
    $('[data-crumb]').textContent = t('nav.' + state.route);
    closeSidebar();
    var view = $('[data-view]');
    var fn = ({
      home: renderHome, orders: renderOrders, contacts: renderContacts, agenda: renderAgenda, sales: renderSales,
      products: renderProducts, services: renderServices, categories: renderCategories, portfolio: renderPortfolio, team: renderTeam, library: renderLibrary,
      settings: renderSettings, plan: renderPlan, account: renderAccount, admin: renderAdmin
    })[state.route];
    if (state.route === 'admin' && !state.isAdmin) {
      view.innerHTML = '<section class="card"><p class="muted">' + t('adm.checking') + '</p></section>';
      CW.store.isAdmin().then(function (a) {
        state.isAdmin = a; applyAdmin(a);
        if (a) { route(); return; }
        view.innerHTML = '<section class="card"><h3>' + t('adm.denied') + '</h3><p class="muted">' + t('adm.denied.desc') + '</p>' +
          '<a class="btn ghost small" href="#home">' + t('nav.home') + '</a></section>';
        CW.i18n.apply(view);
      });
      return;
    }
    view.innerHTML = '';
    fn(view);
    CW.i18n.apply(view);
    if (CW.panelI18n) CW.panelI18n.apply(view);
    window.scrollTo(0, 0);
  }

  // ---------------------------------------------------------------------
  // INICIO
  // ---------------------------------------------------------------------
  function renderHome(view) {
    var activeProducts = state.products.filter(function (p) { return p.active !== false; }).length;
    var reqs = [];
    if (!state.biz.slug) reqs.push(t('home.req.link'));
    if (!state.biz.whatsapp) reqs.push(t('home.req.whatsapp'));
    if (!activeProducts) reqs.push(t('home.req.product'));

    view.innerHTML =
      '<section class="hero-panel">' +
        '<span class="badge-soft">' + (state.biz.published ? '● ' + t('home.published') : '◆ ' + t('home.ready')) + '</span>' +
        '<h1>' + esc(state.biz.name) + '</h1>' +
        '<p>' + t('home.sub') + '</p>' +
        '<div class="hero-actions">' +
          '<button class="btn primary" data-go="settings/link">' + t('home.prepare') + ' ↗</button>' +
          '<button class="btn ghost" data-new-product>+ ' + t('home.newproduct') + '</button>' +
        '</div>' +
      '</section>' +

      '<div class="home-grid">' +
        '<section class="card">' +
          '<div class="card-head"><div><span class="kicker">' + t('nav.catalog').toUpperCase() + '</span>' +
          '<h3>' + (reqs.length ? t('home.requirements').replace('{n}', reqs.length).replace('%s', reqs.length) : t('home.published')) + '</h3></div>' +
          '<span class="tag ' + (reqs.length ? 'warn' : 'ok') + '">' + (reqs.length ? '● ' + t('home.pending') : '✓ ' + t('set.configured')) + '</span></div>' +
          '<p class="muted">' + t('home.sub') + '</p>' +
          (state.biz.slug ? '<div class="url-line">' + esc(bizUrl()) + '</div>' : '<div class="url-line empty">' + t('home.req.address') + '</div>') +
          (reqs.length ? '<ul class="req-list">' + reqs.map(function (r) { return '<li>• ' + esc(r) + '</li>'; }).join('') + '</ul>' : '') +
          '<div class="card-actions"><button class="btn primary" data-go="settings">' + t('home.complete') + '</button>' +
          '<button class="btn ghost" data-go="products">' + t('home.manage') + '</button></div>' +
        '</section>' +

        '<section class="card summary">' +
          '<span class="kicker">' + t('home.summary').toUpperCase() + '</span>' +
          '<h3>' + t('home.quick') + '</h3>' +
          '<p class="muted">' + t('home.activity.empty') + '</p>' +
          '<div class="stat-row">' +
            '<div class="stat"><small>' + t('home.products').toUpperCase() + '</small><b>' + state.products.length + '</b></div>' +
            '<div class="stat"><small>' + t('home.categories').toUpperCase() + '</small><b>' + state.cats.length + '</b></div>' +
            '<div class="stat"><small>' + t('home.orders').toUpperCase() + '</small><b>' + state.orders.length + '</b></div>' +
          '</div>' +
        '</section>' +
      '</div>' +

      '<div class="quick-grid">' +
        quick('📦', t('home.newproduct'), t('home.newproduct.desc'), 'products/new') +
        quick('🧾', t('home.vieworders'), t('home.vieworders.desc'), 'orders') +
        quick('⚙️', t('home.config'), t('home.config.desc'), 'settings') +
        quick('🚀', t('home.publish'), t('home.publish.desc'), 'settings/link') +
      '</div>' +

      '<section class="card activity">' +
        '<span class="kicker">' + t('home.activity').toUpperCase() + '</span>' +
        '<h3>' + t('home.activity.title') + '</h3>' +
        '<p class="muted">' + t('home.activity.empty') + '</p>' +
        (function () {
          var ev = [];
          state.orders.slice(0, 6).forEach(function (o) { ev.push({ t: o.created_at, icon: '🧾', text: t('nav.orders') + ' · ' + (o.code || '') + ' · ' + (o.customer_name || '') }); });
          state.products.slice(0, 6).forEach(function (p) { ev.push({ t: p.created_at, icon: '📦', text: (p.name || '') }); });
          ev.sort(function (a, b) { return new Date(b.t) - new Date(a.t); });
          ev = ev.slice(0, 5);
          if (!ev.length) return '<div class="activity-item muted">' + t('common.none') + '</div>';
          return ev.map(function (e) { return '<div class="activity-item">' + e.icon + ' ' + esc(e.text) + ' <small class="muted">' + CW.api.dateTime(e.t) + '</small></div>'; }).join('');
        })() +
      '</section>';

    bindGo(view);
    var np = $('[data-new-product]', view); if (np) np.addEventListener('click', function () { location.hash = '#products/new'; });
  }

  function quick(icon, title, desc, go) {
    return '<button class="quick-card" data-go="' + go + '"><span class="qc-icon">' + icon + '</span><b>' + esc(title) + '</b><small>' + esc(desc) + '</small></button>';
  }

  function bindGo(root) {
    $$('[data-go]', root).forEach(function (b) {
      b.addEventListener('click', function () { location.hash = '#' + b.dataset.go; });
    });
  }

  // ---------------------------------------------------------------------
  // PEDIDOS
  // ---------------------------------------------------------------------
  function renderOrders(view) {
    view.innerHTML =
      '<div class="view-head"><div><h1>' + t('ord.title') + '</h1><p class="muted">' + t('ord.sub') + '</p></div></div>' +
      '<section class="card filter-bar">' +
        '<label class="field"><span>' + t('ord.code') + '</span><input data-f-code placeholder="ORG-8F42KD"></label>' +
        '<label class="field"><span>' + t('common.status') + '</span><select data-f-status>' +
          '<option value="">' + t('common.all') + '</option>' +
          ['new', 'confirmed', 'delivered', 'cancelled'].map(function (s) { return '<option value="' + s + '">' + t('ord.status.' + s) + '</option>'; }).join('') +
        '</select></label>' +
        '<label class="field"><span>Desde</span><input type="date" data-f-from></label>' +
        '<label class="field"><span>Hasta</span><input type="date" data-f-to></label>' +
        '<button class="btn primary" data-f-apply>' + t('common.search') + '</button>' +
        '<button class="btn ghost" data-f-csv>' + t('common.export') + ' CSV</button>' +
      '</section>' +
      '<section class="card"><div class="card-head"><h3>' + t('ord.list') + '</h3><span class="muted" data-count></span></div>' +
      '<div data-orders-table></div></section>';

    function apply() {
      var code = ($('[data-f-code]', view).value || '').toLowerCase();
      var st = $('[data-f-status]', view).value;
      var from = $('[data-f-from]', view).value;
      var to = $('[data-f-to]', view).value;
      var list = state.orders.filter(function (o) {
        if (code && !(o.code || '').toLowerCase().includes(code) && !(o.customer_name || '').toLowerCase().includes(code) && !(o.customer_phone || '').includes(code)) return false;
        if (st && o.status !== st) return false;
        if (from && new Date(o.created_at) < new Date(from + 'T00:00:00')) return false;
        if (to && new Date(o.created_at) > new Date(to + 'T23:59:59')) return false;
        return true;
      });
      $('[data-count]', view).textContent = list.length + ' ' + t('home.orders').toLowerCase();
      renderOrdersTable($('[data-orders-table]', view), list);
      view._filtered = list;
    }
    $('[data-f-apply]', view).addEventListener('click', apply);
    $('[data-f-code]', view).addEventListener('input', apply);
    $('[data-f-status]', view).addEventListener('change', apply);
    $('[data-f-csv]', view).addEventListener('click', function () {
      var rows = [['Codigo', 'Cliente', 'Telefono', 'Ciudad', 'Estado', 'Total', 'Fecha']];
      (view._filtered || []).forEach(function (o) {
        rows.push([o.code, o.customer_name, o.customer_phone, o.customer_city || '', o.status, o.total, o.created_at]);
      });
      CW.api.download('pedidos.csv', '\ufeff' + CW.api.toCSV(rows), 'text/csv');
    });
    apply();
  }

  function renderOrdersTable(host, list) {
    if (!list.length) {
      host.innerHTML = '<div class="empty-state"><div class="es-icon">🧾</div><b>' + t('ord.empty') + '</b><p>' + t('ord.empty.desc') + '</p></div>';
      return;
    }
    host.innerHTML = '<div class="table-wrap"><table class="data-table"><thead><tr>' +
      '<th>' + t('ord.code') + '</th><th>' + t('ord.customer') + '</th><th>' + t('common.status') + '</th><th>' + t('ord.total') + '</th><th>' + t('ord.date') + '</th><th></th></tr></thead><tbody>' +
      list.map(function (o) {
        return '<tr><td><b>' + esc(o.code) + '</b></td><td>' + esc(o.customer_name) + '<br><small class="muted">' + esc(o.customer_phone) + '</small></td>' +
          '<td><span class="tag ' + statusClass(o.status) + '">' + t('ord.status.' + o.status) + '</span></td>' +
          '<td>' + money(o.total, state.biz.currency) + '</td><td>' + CW.api.dateTime(o.created_at) + '</td>' +
          '<td><button class="btn ghost small" data-view="' + o.id + '">' + t('ord.detail') + '</button></td></tr>';
      }).join('') + '</tbody></table></div>';
    $$('[data-view]', host).forEach(function (b) {
      b.addEventListener('click', function () { orderDetail(list.find(function (o) { return o.id === b.dataset.view; })); });
    });
  }
  function statusClass(s) { return s === 'new' ? 'warn' : s === 'confirmed' ? 'info' : s === 'delivered' ? 'ok' : 'bad'; }

  function orderDetail(o) {
    if (!o) return;
    var items = (o.items || []).map(function (it) {
      return '<li><span>' + esc(it.name) + (it.kind === 'service' ? ' (Servicio)' : '') + ' × ' + it.qty + '</span><b>' + (Number(it.price) > 0 ? money(it.price * it.qty, state.biz.currency) : t('cat.public.consult')) + '</b></li>';
    }).join('');
    var msg = CW.api.orderMessage(state.biz, o);
    var m = CW.modal({
      title: t('ord.detail') + ' · ' + o.code,
      html:
        '<div class="detail-block"><b>' + t('ord.customer') + '</b><p>' + esc(o.customer_name) + ' · ' + esc(o.customer_phone) + '</p>' +
        (o.customer_address ? '<p>' + esc(o.customer_address) + (o.customer_city ? ', ' + esc(o.customer_city) : '') + '</p>' : '') +
        (o.note ? '<p class="muted">' + esc(o.note) + '</p>' : '') + '</div>' +
        '<ul class="mini-list">' + items + '</ul>' +
        '<div class="detail-total"><span>' + t('cat.public.total') + '</span><b>' + money(o.total, state.biz.currency) + '</b></div>' +
        '<div class="status-picker">' + ['new', 'confirmed', 'delivered', 'cancelled'].map(function (s) {
          return '<button class="chip' + (o.status === s ? ' active' : '') + '" data-st="' + s + '">' + t('ord.status.' + s) + '</button>';
        }).join('') + '</div>',
      footer: '<a class="btn wa" target="_blank" rel="noopener" href="' + CW.api.waLink(o.customer_phone, msg) + '">' + t('ord.contact') + '</a>'
    });
    $$('[data-st]', m.modal).forEach(function (b) {
      b.addEventListener('click', function () {
        CW.store.updateOrderStatus(o.id, b.dataset.st).then(function () {
          o.status = b.dataset.st; CW.toast(t('common.save')); m.close(); loadAll().then(route);
        });
      });
    });
  }

  // ---------------------------------------------------------------------
  // CONTACTOS (captados por el asistente del catálogo)
  // ---------------------------------------------------------------------
  // Un contacto del asistente es un pedido sin artículos: el asistente guarda
  // el pedido con items vacíos y la necesidad en la nota.
  function isLead(o) { return !(o.items && o.items.length); }
  function leadNeed(o) {
    var n = o.note || '';
    var m = n.match(/Necesita:\s*(.*)$/i);
    return m ? m[1].trim() : n;
  }

  function renderContacts(view) {
    var leads = state.orders.filter(isLead);
    view.innerHTML =
      '<div class="view-head"><div><h1>' + t('con.title') + '</h1><p class="muted">' + t('con.sub') + '</p></div>' +
      '<div class="head-actions"><input class="search" data-cq placeholder="' + t('con.search') + '">' +
      '<button class="btn ghost" data-ccsv>' + t('con.export') + '</button></div></div>' +
      '<div data-clist></div>';

    function draw(q) {
      var list = leads.filter(function (o) {
        if (!q) return true;
        var s = ((o.customer_name || '') + ' ' + (o.customer_phone || '') + ' ' + (o.note || '')).toLowerCase();
        return s.indexOf(q.toLowerCase()) >= 0;
      });
      if (!list.length) {
        $('[data-clist]', view).innerHTML = '<div class="card empty-state"><div class="es-icon">👥</div><b>' + t('con.empty') + '</b><p>' + t('con.empty.desc') + '</p></div>';
        view._leads = [];
        return;
      }
      $('[data-clist]', view).innerHTML = '<div class="card"><div class="card-head"><h3>' + t('con.title') + '</h3><span class="muted">' + list.length + '</span></div>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        '<th>' + t('common.name') + '</th><th>' + t('common.phone') + '</th><th>' + t('con.need') + '</th><th>' + t('common.status') + '</th><th>' + t('ord.date') + '</th><th></th></tr></thead><tbody>' +
        list.map(function (o) {
          return '<tr><td><b>' + esc(o.customer_name || '—') + '</b></td>' +
            '<td>' + esc(o.customer_phone || '—') + '</td>' +
            '<td class="muted">' + esc(leadNeed(o)).slice(0, 90) + '</td>' +
            '<td><select class="mini-select" data-cst="' + o.id + '">' +
              [['new', 'new'], ['confirmed', 'contacted'], ['delivered', 'done'], ['cancelled', 'discarded']].map(function (p) {
                return '<option value="' + p[0] + '"' + (o.status === p[0] ? ' selected' : '') + '>' + t('con.status.' + p[1]) + '</option>';
              }).join('') +
            '</select></td>' +
            '<td>' + CW.api.dateTime(o.created_at) + '</td>' +
            '<td class="row-actions"><a class="btn wa small" target="_blank" rel="noopener" href="' + CW.api.waLink(o.customer_phone, 'Hola ' + (o.customer_name || '') + ', te escribo por tu consulta.') + '">💬</a>' +
            '<button class="btn ghost small danger" data-cdel="' + o.id + '">✕</button></td></tr>';
        }).join('') + '</tbody></table></div></div>';

      $$('[data-cst]', view).forEach(function (s) {
        s.addEventListener('change', function () {
          var id = s.dataset.cst, st = s.value;
          CW.store.updateOrderStatus(id, st).then(function () {
            var o = state.orders.find(function (x) { return x.id === id; });
            if (o) o.status = st;
            CW.toast(t('con.saved'));
          });
        });
      });
      $$('[data-cdel]', view).forEach(function (b) {
        b.addEventListener('click', function () {
          CW.confirm('¿Eliminar este contacto?', function () {
            CW.store.deleteOrder(b.dataset.cdel).then(function () {
              state.orders = state.orders.filter(function (x) { return x.id !== b.dataset.cdel; });
              leads = state.orders.filter(isLead);
              draw($('[data-cq]', view).value);
            });
          }, true);
        });
      });
      view._leads = list;
    }

    $('[data-cq]', view).addEventListener('input', function (e) { draw(e.target.value); });
    $('[data-ccsv]', view).addEventListener('click', function () {
      var rows = [['Nombre', 'Telefono', 'Necesita', 'Estado', 'Fecha']];
      (view._leads || []).forEach(function (o) {
        rows.push([o.customer_name || '', o.customer_phone || '', leadNeed(o), o.status, o.created_at]);
      });
      CW.api.download('contactos.csv', '\ufeff' + CW.api.toCSV(rows), 'text/csv');
    });
    draw('');
  }

  // ---------------------------------------------------------------------
  // AGENDA
  // ---------------------------------------------------------------------
  function renderAgenda(view) {
    var appts = state.orders.filter(function (o) { return o.appointment_at; })
      .sort(function (a, b) { return new Date(a.appointment_at) - new Date(b.appointment_at); });
    var groups = {};
    appts.forEach(function (o) {
      var d = new Date(o.appointment_at).toISOString().slice(0, 10);
      (groups[d] = groups[d] || []).push(o);
    });
    var keys = Object.keys(groups).sort();
    var now = Date.now();
    view.innerHTML = '<div class="view-head"><div><h1>' + t('nav.agenda') + '</h1></div></div>' +
      (keys.length ? keys.map(function (d) {
        return '<section class="card"><h3>' + new Date(d + 'T00:00:00').toLocaleDateString() + '</h3>' +
          groups[d].map(function (o) {
            var past = new Date(o.appointment_at).getTime() < now;
            return '<div class="appt' + (past ? ' past' : '') + '"><div class="appt-time">' +
              new Date(o.appointment_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</div>' +
              '<div class="appt-info"><b>' + esc(o.customer_name) + '</b><small>' + esc(o.code) + ' · ' + esc(o.customer_phone) + '</small></div>' +
              '<a class="btn ghost small" target="_blank" href="' + CW.api.waLink(o.customer_phone, CW.api.orderMessage(state.biz, o)) + '">💬</a></div>';
          }).join('') + '</section>';
      }).join('') : '<div class="card empty-state"><div class="es-icon">📅</div><b>' + t('ord.empty') + '</b></div>');
  }

  // ---------------------------------------------------------------------
  // VENTAS
  // ---------------------------------------------------------------------
  function renderSales(view) {
    var periods = { 7: '7 días', 30: '30 días', 365: '365 días', 0: t('common.all') };
    view.innerHTML = '<div class="view-head"><div><h1>' + t('nav.sales') + '</h1></div>' +
      '<div class="segmented" data-period>' + Object.keys(periods).map(function (k) {
        return '<button data-p="' + k + '" class="' + (k === '30' ? 'active' : '') + '">' + periods[k] + '</button>';
      }).join('') + '</div>' +
      '<button class="btn ghost" data-csv>' + t('common.export') + ' CSV</button></div><div data-sales></div>';
    function draw(days) {
      var from = days ? Date.now() - days * 864e5 : 0;
      var list = state.orders.filter(function (o) { return new Date(o.created_at).getTime() >= from && o.status !== 'cancelled'; });
      var billed = list.reduce(function (s, o) { return s + Number(o.total || 0); }, 0);
      var pending = list.filter(function (o) { return o.status === 'new'; }).length;
      var avg = list.length ? billed / list.length : 0;
      var byDay = {};
      list.forEach(function (o) { var d = o.created_at.slice(0, 10); byDay[d] = (byDay[d] || 0) + Number(o.total || 0); });
      var top = {};
      list.forEach(function (o) { (o.items || []).forEach(function (it) { top[it.name] = (top[it.name] || 0) + it.qty; }); });
      var topArr = Object.keys(top).map(function (k) { return { name: k, qty: top[k] }; }).sort(function (a, b) { return b.qty - a.qty; }).slice(0, 8);
      $('[data-sales]', view).innerHTML =
        '<div class="stat-cards">' +
          statCard('💵', 'Facturado', money(billed, state.biz.currency)) +
          statCard('🧾', 'Pedidos', list.length) +
          statCard('📊', 'Ticket medio', money(avg, state.biz.currency)) +
          statCard('⏳', 'Pendientes', pending) +
        '</div>' +
        '<div class="two-col"><section class="card"><h3>Ventas por día</h3>' +
          (Object.keys(byDay).length ? '<div class="table-wrap"><table class="data-table"><thead><tr><th>Fecha</th><th>Total</th></tr></thead><tbody>' +
            Object.keys(byDay).sort().reverse().map(function (d) { return '<tr><td>' + d + '</td><td>' + money(byDay[d], state.biz.currency) + '</td></tr>'; }).join('') +
          '</tbody></table></div>' : '<p class="muted">—</p>') + '</section>' +
          '<section class="card"><h3>Productos más vendidos</h3>' +
          (topArr.length ? '<ul class="mini-list">' + topArr.map(function (x) { return '<li><span>' + esc(x.name) + '</span><b>' + x.qty + '</b></li>'; }).join('') + '</ul>' : '<p class="muted">—</p>') +
          '</section></div>';
      view._list = list;
    }
    $$('[data-period] button', view).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('[data-period] button', view).forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active'); draw(Number(b.dataset.p));
      });
    });
    $('[data-csv]', view).addEventListener('click', function () {
      var rows = [['Codigo', 'Fecha', 'Estado', 'Total']];
      (view._list || []).forEach(function (o) { rows.push([o.code, o.created_at, o.status, o.total]); });
      CW.api.download('ventas.csv', '\ufeff' + CW.api.toCSV(rows), 'text/csv');
    });
    draw(30);
  }
  function statCard(icon, label, value) {
    return '<div class="stat-card"><span>' + icon + '</span><small>' + label + '</small><b>' + value + '</b></div>';
  }

  // ---------------------------------------------------------------------
  // PRODUCTOS
  // ---------------------------------------------------------------------
  function renderProducts(view) {
    if (state.sub === 'new' || state.sub === 'edit') return renderProductForm(view);
    var q = '';
    view.innerHTML = '<div class="view-head"><div><h1>' + t('nav.products') + '</h1></div>' +
      '<div class="head-actions"><input class="search" data-q placeholder="' + t('common.search') + '…">' +
      '<button class="btn primary" data-new>+ ' + t('prod.new') + '</button></div></div><div data-list></div>';
    function draw() {
      var list = state.products.filter(function (p) { return p.kind !== 'service' && (p.name || '').toLowerCase().includes(q.toLowerCase()); });
      $('[data-list]', view).innerHTML = list.length ? '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        '<th></th><th>' + t('common.name') + '</th><th>' + t('prod.type') + '</th><th>' + t('common.category') + '</th><th>' + t('common.price') + '</th><th>' + t('common.status') + '</th><th></th></tr></thead><tbody>' +
        list.map(function (p) {
          var img = (p.images && p.images[0]) ? '<img class="row-thumb" src="' + esc(p.images[0]) + '" alt="">' : '<div class="row-thumb ph"></div>';
          return '<tr><td>' + img + '</td><td><b>' + esc(p.name) + '</b></td>' +
            '<td>' + (p.kind === 'service' ? '🔧 Servicio' : '📦 Producto') + '</td><td>' + esc(catName(p.category_id)) + '</td>' +
            '<td>' + (Number(p.price) > 0 ? money(p.price, state.biz.currency) : t('cat.public.consult')) + '</td>' +
            '<td><button class="switch' + (p.active !== false ? ' on' : '') + '" data-toggle="' + p.id + '"></button></td>' +
            '<td class="row-actions"><button class="btn ghost small" data-edit="' + p.id + '">' + t('common.edit') + '</button>' +
            '<button class="btn ghost small danger" data-del="' + p.id + '">' + t('common.delete') + '</button></td></tr>';
        }).join('') + '</tbody></table></div>'
        : '<div class="card empty-state"><div class="es-icon">📦</div><b>' + t('prod.empty') + '</b><p>' + t('prod.empty.desc') + '</p></div>';
      $$('[data-edit]', view).forEach(function (b) { b.addEventListener('click', function () { location.hash = '#products/edit/' + b.dataset.edit; }); });
      $$('[data-toggle]', view).forEach(function (b) {
        b.addEventListener('click', function () {
          var p = state.products.find(function (x) { return x.id === b.dataset.toggle; });
          CW.store.saveProduct({ id: p.id, active: !(p.active !== false) }).then(function () { p.active = !(p.active !== false); draw(); });
        });
      });
      $$('[data-del]', view).forEach(function (b) {
        b.addEventListener('click', function () {
          CW.confirm('¿Eliminar este artículo?', function () {
            CW.store.deleteProduct(b.dataset.del).then(function () { loadAll().then(draw); });
          }, true);
        });
      });
    }
    $('[data-q]', view).addEventListener('input', function (e) { q = e.target.value; draw(); });
    $('[data-new]', view).addEventListener('click', function () { location.hash = '#products/new'; });
    draw();
  }

  // ---------------------------------------------------------------------
  // SERVICIOS (misma ficha que productos, con las opciones de reserva)
  // ---------------------------------------------------------------------
  function renderServices(view) {
    if (state.sub === 'new' || state.sub === 'edit') return renderProductForm(view);
    var q = '';
    view.innerHTML = '<div class="view-head"><div><h1>' + t('sv.list') + '</h1><p class="muted">' + t('sv.sub') + '</p></div>' +
      '<div class="head-actions"><input class="search" data-q placeholder="' + t('common.search') + '…">' +
      '<button class="btn primary" data-new>+ ' + t('sv.new') + '</button></div></div><div data-list></div>';

    function draw() {
      var list = state.products.filter(function (p) {
        return p.kind === 'service' && (p.name || '').toLowerCase().includes(q.toLowerCase());
      });
      $('[data-list]', view).innerHTML = list.length
        ? '<div class="table-wrap"><table class="data-table"><thead><tr>' +
            '<th></th><th>' + t('common.name') + '</th><th>' + t('common.category') + '</th>' +
            '<th>' + t('common.price') + '</th><th>' + t('prod.duration') + '</th><th>' + t('common.status') + '</th><th></th>' +
          '</tr></thead><tbody>' +
          list.map(function (p) {
            var img = (p.images && p.images[0]) ? '<img class="row-thumb" src="' + esc(p.images[0]) + '" alt="">' : '<div class="row-thumb ph">🔧</div>';
            return '<tr><td>' + img + '</td><td><b>' + esc(p.name) + '</b>' +
              (p.bookable ? ' <span class="tag">📅 ' + t('prod.bookable') + '</span>' : '') + '</td>' +
              '<td>' + esc(catName(p.category_id)) + '</td>' +
              '<td>' + (Number(p.price) > 0 ? money(p.price, state.biz.currency) : t('cat.public.consult')) + '</td>' +
              '<td>' + esc(p.duration || '—') + '</td>' +
              '<td><button class="switch' + (p.active !== false ? ' on' : '') + '" data-toggle="' + p.id + '" role="switch" aria-checked="' + (p.active !== false) + '"></button></td>' +
              '<td class="row-actions"><button class="btn ghost small" data-edit="' + p.id + '">' + t('common.edit') + '</button>' +
              '<button class="btn ghost small danger" data-del="' + p.id + '">' + t('common.delete') + '</button></td></tr>';
          }).join('') + '</tbody></table></div>'
        : '<div class="card empty-state"><div class="es-icon">🔧</div><b>' + t('sv.empty') + '</b><p>' + t('sv.sub') + '</p>' +
          '<button class="btn primary" data-new2>+ ' + t('sv.new') + '</button></div>';

      $$('[data-edit]', view).forEach(function (b) { b.addEventListener('click', function () { location.hash = '#services/edit/' + b.dataset.edit; }); });
      $$('[data-toggle]', view).forEach(function (b) {
        b.addEventListener('click', function () {
          var p = state.products.find(function (x) { return x.id === b.dataset.toggle; });
          CW.store.saveProduct({ id: p.id, active: !(p.active !== false) }).then(function () { p.active = !(p.active !== false); draw(); });
        });
      });
      $$('[data-del]', view).forEach(function (b) {
        b.addEventListener('click', function () {
          CW.confirm('¿Eliminar este servicio?', function () {
            CW.store.deleteProduct(b.dataset.del).then(function () { loadAll().then(draw); });
          }, true);
        });
      });
      $$('[data-new], [data-new2]', view).forEach(function (b) { b.addEventListener('click', function () { location.hash = '#services/new'; }); });
    }
    $('[data-q]', view).addEventListener('input', function (e) { q = e.target.value; draw(); });
    $('[data-new]', view).addEventListener('click', function () { location.hash = '#services/new'; });
    draw();
  }

  function renderProductForm(view) {
    var onServices = state.route === 'services';
    var editing = state.sub === 'edit' ? state.products.find(function (p) { return p.id === state.param; }) : null;
    var p = editing || { name: '', slug: '', category_id: '', description: '', short_desc: '', sort_order: 0, price: 0, promo_price: '', images: [], active: true, kind: onServices ? 'service' : 'product', duration: '', modality: '', bookable: onServices, requirements: '' };
    var images = (p.images || []).slice();
    view.innerHTML =
      '<div class="view-head"><div><span class="crumb-mini">' + (onServices ? t('sv.list') : t('nav.products')) + ' / ' + (editing ? t('common.edit') : t('common.add')) + '</span>' +
      '<h1>' + (onServices ? (editing ? t('common.edit') + ' · ' + t('nav.services') : t('sv.new')) : (editing ? t('prod.edit') : t('prod.new'))) + '</h1></div>' +
      '<button class="btn ghost" data-back>← ' + t('common.back') + '</button></div>' +
      '<div class="form-grid">' +
        '<div class="form-main">' +
          card(t('prod.data'), t('prod.data.desc'),
            field(t('prod.name'), '<input data-f="name" value="' + esc(p.name) + '" placeholder="Ej. Chaise en bois">') +
            field(t('prod.url'), '<input data-f="slug" value="' + esc(p.slug) + '" placeholder="arroz-extra-5-kg">') +
            (onServices ? '' : field(t('prod.type'), '<div class="segmented" data-kind>' +
              '<button type="button" data-k="product" class="' + (p.kind !== 'service' ? 'active' : '') + '">📦 ' + t('prod.type.product') + '</button>' +
              '<button type="button" data-k="service" class="' + (p.kind === 'service' ? 'active' : '') + '">🔧 ' + t('prod.type.service') + '</button></div>')) +
            field(t('common.category'), '<select data-f="category_id"><option value="">' + t('common.none') + '</option>' +
              state.cats.map(function (c) { return '<option value="' + c.id + '"' + (c.id === p.category_id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select>') +
            field(t('prod.desc') + ' <span class="muted">(' + t('common.optional') + ')</span>', '<textarea data-f="description" rows="6">' + esc(p.description) + '</textarea>') +
            field(t('prod.shortdesc') + ' <span class="muted">(' + t('common.optional') + ')</span>', '<input data-f="short_desc" maxlength="90" value="' + esc(p.short_desc || '') + '" placeholder="Ej. Mármol blanco pulido, 60 × 60 cm"><small class="muted">' + t('prod.shortdesc.hint') + '</small>') +
            field(t('prod.sort'), '<input type="number" data-f="sort_order" value="' + (p.sort_order || 0) + '"><small class="muted">' + t('prod.sort.hint') + '</small>')
          ) +
          card(t('prod.price.title'), '', '<div class="two-col-inline">' +
            field(t('prod.regular') + ' (' + state.biz.currency + ')', '<input type="number" step="0.01" data-f="price" value="' + (p.price || '') + '">') +
            field(t('prod.promo') + ' <span class="muted">(' + t('common.optional') + ')</span>', '<input type="number" step="0.01" data-f="promo_price" value="' + (p.promo_price || '') + '">') +
            '</div>') +
          '<div data-service-fields' + (p.kind === 'service' ? '' : ' hidden') + '>' +
            card(t('prod.type.service'), '', '<div class="two-col-inline">' +
              field(t('prod.duration'), '<input data-f="duration" value="' + esc(p.duration || '') + '" placeholder="Ej. 1 h 30">') +
              field(t('prod.modality'), '<input data-f="modality" value="' + esc(p.modality || '') + '" placeholder="Ej. À domicile / En boutique / En ligne">') +
              '</div>' +
              '<label class="check"><input type="checkbox" data-f="bookable"' + (p.bookable ? ' checked' : '') + '> ' + t('prod.bookable') + '</label>' +
              field(t('sv.requirements'), '<textarea data-f="requirements" rows="3" maxlength="400">' + esc(p.requirements || '') + '</textarea><small class="muted">' + t('sv.requirements.hint') + '</small>')) +
          '</div>' +
          card(t('prod.images.title'), t('prod.images.hint'),
            '<div class="img-picker" data-img-picker></div>' +
            '<button type="button" class="btn ghost" data-add-img>+ ' + t('common.add') + ' ' + t('common.images') + '</button>') +
        '</div>' +
        '<aside class="form-side">' +
          '<div class="card tip-card"><span class="tip-icon">💡</span><b>' + t('prod.tip') + '</b><ul>' +
            '<li>' + t('prod.tip.1') + '</li><li>' + t('prod.tip.2') + '</li><li>' + t('prod.tip.3') + '</li></ul></div>' +
          '<div class="card"><span class="kicker">' + t('prod.currency').toUpperCase() + '</span><h3>' + state.biz.currency + '</h3>' +
            '<p class="muted">' + t('prod.price.title') + '</p></div>' +
        '</aside>' +
      '</div>' +
      trCard(p, [
        { key: 'name', label: t('common.name') },
        { key: 'short_desc', label: t('prod.shortdesc') },
        { key: 'description', label: t('prod.desc'), type: 'area', rows: 4 }
      ]) +
      '<div class="form-sticky"><button class="btn ghost" data-back2>' + t('common.cancel') + '</button>' +
      '<button class="btn primary" data-save>✓ ' + t('prod.save') + '</button></div>';

    function drawImages() {
      $('[data-img-picker]', view).innerHTML = Array.from({ length: 5 }).map(function (_, i) {
        var u = images[i];
        return '<div class="img-slot' + (u ? ' filled' : '') + '">' + (u ? '<img src="' + esc(u) + '" alt=""><button type="button" class="slot-x" data-rm="' + i + '">✕</button>' : '<span>+</span>') + '</div>';
      }).join('');
      $$('[data-rm]', view).forEach(function (b) { b.addEventListener('click', function () { images.splice(Number(b.dataset.rm), 1); drawImages(); }); });
    }
    drawImages();
    bindTrAi(view, [
      { key: 'name', from: '[data-f="name"]' },
      { key: 'short_desc', from: '[data-f="short_desc"]' },
      { key: 'description', from: '[data-f="description"]' }
    ]);
    var backRoute = onServices ? '#services' : '#products';
    $('[data-back]', view).addEventListener('click', function () { location.hash = backRoute; });
    $('[data-back2]', view).addEventListener('click', function () { location.hash = backRoute; });
    $$('[data-kind] button', view).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('[data-kind] button', view).forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        $('[data-service-fields]', view).hidden = b.dataset.k !== 'service';
      });
    });
    var nameInput = $('[data-f="name"]', view);
    var slugInput = $('[data-f="slug"]', view);
    nameInput.addEventListener('input', function () { if (!editing) slugInput.value = CW.store.slugify(nameInput.value); });
    $('[data-add-img]', view).addEventListener('click', function () {
      openImagePicker(5 - images.length, function (urls) { images = images.concat(urls).slice(0, 5); drawImages(); });
    });
    $('[data-save]', view).addEventListener('click', function () {
      function val(f) { var el = $('[data-f="' + f + '"]', view); return el ? el.value : ''; }
      var kind = onServices ? 'service' : $('[data-kind] button.active', view).dataset.k;
      var obj = {
        id: editing ? editing.id : undefined, business_id: state.biz.id,
        name: val('name').trim(), slug: CW.store.slugify(val('slug') || val('name')),
        category_id: val('category_id') || null, description: val('description'),
        short_desc: val('short_desc').slice(0, 90),
        sort_order: Number(val('sort_order') || 0), price: Number(val('price') || 0),
        promo_price: val('promo_price') === '' ? null : Number(val('promo_price')),
        images: images, active: p.active !== false, kind: kind,
        duration: kind === 'service' ? val('duration') : '', modality: kind === 'service' ? val('modality') : '',
        bookable: kind === 'service' ? !!$('[data-f="bookable"]', view).checked : false,
        requirements: kind === 'service' ? val('requirements') : ''
      };
      obj.i18n = trCollect(view, p);
      if (!obj.name) { CW.toast(t('common.required')); return; }
      CW.store.saveProduct(obj).then(function () {
        CW.toast(t('common.save'), 'ok');
        location.hash = backRoute;
        loadAll().then(route);
      }).catch(function (err) {
        console.warn('[CW] No se pudo guardar el artículo:', err);
        CW.toast(t('set.save.error'), 'error');
      });
    });
  }

  // ---------------------------------------------------------------------
  // Traducciones del contenido (francés y árabe; el español es el base)
  // ---------------------------------------------------------------------
  var TR_LANGS = [{ code: 'fr', label: 'Français', dir: 'ltr' }, { code: 'ar', label: 'العربية', dir: 'rtl' }];

  function trGet(item, lang, field) {
    var pack = item && item.i18n && item.i18n[lang];
    return (pack && pack[field]) || '';
  }

  function trCard(item, fields) {
    return '<section class="card tr-card">' +
      '<div class="card-head"><div><span class="kicker">' + t('tr.kicker') + '</span>' +
      '<h3>' + t('tr.title') + '</h3><p class="muted">' + t('tr.hint') + '</p></div>' +
      '<button type="button" class="btn soft small" data-ai-tr>✨ ' + t('tr.ai') + '</button></div>' +
      '<div class="tr-grid">' + TR_LANGS.map(function (L) {
        return '<div class="tr-col" dir="' + L.dir + '"><h4>' + L.label + '</h4>' +
          fields.map(function (f) {
            var val = trGet(item, L.code, f.key);
            var input = f.type === 'area'
              ? '<textarea rows="' + (f.rows || 3) + '" data-tr="' + L.code + '.' + f.key + '">' + esc(val) + '</textarea>'
              : '<input data-tr="' + L.code + '.' + f.key + '" value="' + esc(val) + '">';
            return '<label class="field"><span>' + esc(f.label) + '</span>' + input + '</label>';
          }).join('') +
        '</div>';
      }).join('') + '</div>' +
      '<p class="tr-status" data-tr-status role="status" aria-live="polite" hidden></p></section>';
  }

  // Botón «Traducir con IA»: toma el texto base y rellena los campos de
  // francés y árabe que estén vacíos (lo escrito a mano no se toca).
  function bindTrAi(view, pairs) {
    var btn = $('[data-ai-tr]', view);
    if (!btn || !CW.translate) return;
    var status = $('[data-tr-status]', view);

    function setStatus(txt) {
      if (!status) return;
      status.hidden = !txt;
      status.textContent = txt || '';
      status.classList.remove('error');
    }

    btn.addEventListener('click', function () {
      if (btn.dataset.busy === '1') return;              // ya está traduciendo
      if (navigator.onLine === false) {
        CW.toast(t('tr.ai.offline'), 'error');
        return;
      }

      var data = pairs.map(function (p) {
        var el = $(p.from, view);
        return { key: p.key, text: el ? el.value : '' };
      }).filter(function (p) { return String(p.text || '').trim(); });

      if (!data.length) { CW.toast(t('tr.ai.empty'), 'warn'); return; }

      var label = btn.innerHTML;
      var total = data.length * 2;                        // francés + árabe
      btn.dataset.busy = '1';
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      btn.innerHTML = '⏳ ' + t('tr.ai.working');
      setStatus(t('tr.ai.progress', { done: 0, total: total }));

      function release() {
        btn.dataset.busy = '';
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        btn.innerHTML = label;
        setStatus('');
      }

      // Red de seguridad: si la API se queda colgada y no llama al callback,
      // devolvemos el botón a su estado normal pasado el tiempo máximo.
      var guard = setTimeout(function () {
        if (btn.dataset.busy !== '1') return;
        release();
        CW.toast(t('tr.ai.error'), 'error');
        if (status) { status.hidden = false; status.textContent = t('tr.ai.error'); status.classList.add('error'); }
      }, (Number(CW.config.translateTimeout || 12000) + 5000) * Math.max(1, data.length));

      CW.translate.fill(data, function (res, stats) {
        clearTimeout(guard);
        release();
        stats = stats || { total: total, translated: 0, failed: 0 };

        var n = 0;
        ['fr', 'ar'].forEach(function (lang) {
          Object.keys(res[lang] || {}).forEach(function (k) {
            var el = $('[data-tr="' + lang + '.' + k + '"]', view);
            if (el && !el.value.trim()) { el.value = res[lang][k]; n++; }
          });
        });

        if (!stats.translated) {
          CW.toast(t('tr.ai.error'), 'error');
          if (status) { status.hidden = false; status.textContent = t('tr.ai.error'); status.classList.add('error'); }
          return;
        }
        if (stats.failed) {
          CW.toast(t('tr.ai.partial', { n: n, failed: stats.failed }), 'warn');
          if (status) { status.hidden = false; status.textContent = t('tr.ai.partial', { n: n, failed: stats.failed }); status.classList.add('error'); }
          return;
        }
        if (n) CW.toast(t('tr.ai.done', { n: n }), 'ok');
        else CW.toast(t('tr.ai.none'), 'warn');
      }, function (done, tot) {
        setStatus(t('tr.ai.progress', { done: done, total: tot }));
      });

    });
  }

  // Recoge lo escrito en la tarjeta de traducciones. Lo que se deje vacío no
  // se guarda y el catálogo usará el texto del idioma base.
  function trCollect(view, base) {
    var out = JSON.parse(JSON.stringify((base && base.i18n) || {}));
    $$('[data-tr]', view).forEach(function (el) {
      var p = el.dataset.tr.split('.');
      var lang = p[0], field = p[1];
      var v = String(el.value || '').trim();
      out[lang] = out[lang] || {};
      if (v) out[lang][field] = v; else delete out[lang][field];
    });
    Object.keys(out).forEach(function (l) { if (!Object.keys(out[l]).length) delete out[l]; });
    return out;
  }

  function trPatch(view, base, patch) {
    if ($('[data-tr]', view)) patch.i18n = trCollect(view, base);
    return patch;
  }

  function card(title, desc, body) {
    return '<section class="card form-card">' + (title ? '<div class="card-head"><div><span class="kicker">' + esc(title).toUpperCase() + '</span>' + (desc ? '<h3>' + esc(desc) + '</h3>' : '') + '</div></div>' : '') + body + '</section>';
  }
  function field(label, control) { return '<label class="field"><span>' + label + '</span>' + control + '</label>'; }

  // ---------------------------------------------------------------------
  // CATEGORÍAS
  // ---------------------------------------------------------------------
  function renderCategories(view) {
    if (state.sub === 'new' || state.sub === 'edit') return renderCategoryForm(view);
    var count = state.cats.length, organized = state.products.filter(function (p) { return p.category_id; }).length;
    view.innerHTML = '<div class="view-head"><div><h1>' + t('cat.title') + '</h1><p class="muted">' + t('cat.sub') + '</p></div>' +
      '<button class="btn primary" data-new>+ ' + t('cat.new') + '</button></div>' +
      '<div class="stat-cards">' + statCard('🗂️', t('cat.count'), count) + statCard('📦', t('cat.organized'), organized) + statCard('⭐', t('cat.default'), 'Otros') + '</div>' +
      '<section class="card"><div class="card-head"><div><h3>' + t('cat.list') + '</h3><p class="muted">' + t('cat.list.hint') + '</p></div></div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>' + t('common.category') + '</th><th>' + t('common.order') + '</th><th>' + t('nav.products') + '</th><th>' + t('prod.type') + '</th><th>' + t('common.status') + '</th><th></th></tr></thead><tbody>' +
      state.cats.map(function (c) {
        var n = state.products.filter(function (p) { return p.category_id === c.id; }).length;
        return '<tr><td><b>' + esc(c.name) + '</b><br><small class="muted">/' + esc(c.slug || '') + '</small></td>' +
          '<td>' + (c.sort_order || 0) + '</td><td>' + n + '</td>' +
          '<td>' + (c.kind === 'service' ? '🔧 Servicio' : '📦 Producto') + (c.slug === 'otros' ? ' · <span class="tag">' + t('cat.default') + '</span>' : '') + '</td>' +
          '<td><button class="switch' + (c.active !== false ? ' on' : '') + '" data-cat-toggle="' + c.id + '" role="switch" aria-checked="' + (c.active !== false) + '" aria-label="' + t('cat.toggle') + '"></button></td>' +
          '<td class="row-actions"><button class="btn ghost small" data-edit="' + c.id + '">' + t('common.edit') + '</button>' +
          (c.slug === 'otros' ? '' : '<button class="btn ghost small danger" data-del="' + c.id + '">' + t('common.delete') + '</button>') + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="muted" style="margin-top:12px">' + t('cat.toggle.hint') + '</p></section>';
    $('[data-new]', view).addEventListener('click', function () { location.hash = '#categories/new'; });
    $$('[data-cat-toggle]', view).forEach(function (b) {
      b.addEventListener('click', function () {
        var c = state.cats.find(function (x) { return x.id === b.dataset.catToggle; });
        if (!c) return;
        var next = !(c.active !== false);
        b.disabled = true;
        CW.store.saveCategory({ id: c.id, active: next }).then(function () {
          c.active = next;
          b.classList.toggle('on', next);
          b.setAttribute('aria-checked', String(next));
          b.disabled = false;
          CW.toast(next ? t('cat.toggle.on') : t('cat.toggle.off'), next ? 'ok' : 'warn');
        }).catch(function (err) {
          b.disabled = false;
          console.warn('[CW] No se pudo cambiar el estado de la categoría:', err);
          var missing = err && (err.code === '42703' || err.code === 'PGRST204' || /active/i.test(String(err.message || '')));
          CW.toast(missing ? t('cat.toggle.missing') : t('set.save.error'), 'error');
        });
      });
    });
    $$('[data-edit]', view).forEach(function (b) { b.addEventListener('click', function () { location.hash = '#categories/edit/' + b.dataset.edit; }); });
    $$('[data-del]', view).forEach(function (b) {
      b.addEventListener('click', function () {
        CW.confirm('¿Eliminar categoría?', function () { CW.store.deleteCategory(b.dataset.del).then(function () { loadAll().then(route); }); }, true);
      });
    });
  }

  function renderCategoryForm(view) {
    var editing = state.sub === 'edit' ? state.cats.find(function (c) { return c.id === state.param; }) : null;
    var c = editing || { name: '', slug: '', sort_order: 0, image_url: '', alt: '', kind: 'product', active: true };
    view.innerHTML = '<div class="view-head"><div><span class="crumb-mini">' + t('nav.categories') + ' / ' + (editing ? t('common.edit') : t('cat.new')) + '</span><h1>' + (editing ? t('common.edit') : t('cat.new')) + '</h1><p class="muted">' + t('cat.sub') + '</p></div>' +
      '<button class="btn ghost" data-back>← ' + t('common.back') + '</button></div>' +
      card(t('cat.data'), '', 
        field(t('common.name'), '<input data-f="name" value="' + esc(c.name) + '" placeholder="Ej. Mobilier">') +
        field(t('cat.slug'), '<input data-f="slug" value="' + esc(c.slug) + '" placeholder="abarrotes">') +
        field(t('prod.type'), '<div class="segmented" data-kind>' +
          '<button type="button" data-k="product" class="' + (c.kind !== 'service' ? 'active' : '') + '">📦 ' + t('prod.type.product') + '</button>' +
          '<button type="button" data-k="service" class="' + (c.kind === 'service' ? 'active' : '') + '">🔧 ' + t('prod.type.service') + '</button></div>') +
        field(t('common.order'), '<input type="number" data-f="sort_order" value="' + (c.sort_order || 0) + '">')) +
      card(t('cat.image'), t('cat.alt'),
        field('', '<div class="img-slot filled" data-cat-img style="max-width:220px">' + (c.image_url ? '<img src="' + esc(c.image_url) + '">' : '<span>+</span>') + '</div>') +
        field(t('cat.alt'), '<input data-f="alt" value="' + esc(c.alt || '') + '">')) +
      trCard(c, [{ key: 'name', label: t('common.name') }, { key: 'alt', label: t('cat.alt') }]) +
      '<div class="form-sticky"><button class="btn ghost" data-back2>' + t('common.cancel') + '</button><button class="btn primary" data-save>✓ ' + t('cat.save') + '</button></div>';
    $('[data-back]', view).addEventListener('click', function () { location.hash = '#categories'; });
    $('[data-back2]', view).addEventListener('click', function () { location.hash = '#categories'; });
    bindTrAi(view, [{ key: 'name', from: '[data-f="name"]' }, { key: 'alt', from: '[data-f="alt"]' }]);
    $$('[data-kind] button', view).forEach(function (b) { b.addEventListener('click', function () { $$('[data-kind] button', view).forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); }); });
    $('[data-cat-img]', view).addEventListener('click', function () {
      openImagePicker(1, function (urls) { if (urls[0]) $('[data-cat-img]', view).innerHTML = '<img src="' + esc(urls[0]) + '">'; view._img = urls[0]; });
    });
    $('[data-save]', view).addEventListener('click', function () {
      function val(f) { var el = $('[data-f="' + f + '"]', view); return el ? el.value : ''; }
      var obj = {
        id: editing ? editing.id : undefined, business_id: state.biz.id,
        name: val('name').trim(), slug: CW.store.slugify(val('slug') || val('name')),
        sort_order: Number(val('sort_order') || 0), alt: val('alt'),
        image_url: view._img || c.image_url, kind: $('[data-kind] button.active', view).dataset.k,
        active: c.active !== false
      };
      obj.i18n = trCollect(view, c);
      if (!obj.name) { CW.toast(t('common.required')); return; }
      CW.store.saveCategory(obj).then(function () { CW.toast(t('common.save')); location.hash = '#categories'; loadAll().then(route); });
    });
  }

  // ---------------------------------------------------------------------
  // PORFOLIO (trabajos de ejemplo)
  // ---------------------------------------------------------------------
  function renderPortfolio(view) {
    if (state.sub === 'new' || state.sub === 'edit') return renderPortfolioForm(view);
    var items = state.portfolio;
    var url = CW.url('porfolio.html') + '?b=' + encodeURIComponent(state.biz.slug);
    view.innerHTML = '<div class="view-head"><div><h1>' + t('port.list') + '</h1><p class="muted">' + t('port.list.hint') + '</p></div>' +
      '<div class="head-actions">' +
      '<a class="btn ghost small" href="' + esc(url) + '" target="_blank" rel="noopener">' + t('port.link') + ' ↗</a>' +
      '<button class="btn primary" data-new>+ ' + t('port.new') + '</button></div></div>' +
      (items.length
        ? '<section class="card"><ul class="pf-sort" data-sortable>' +
          items.map(function (it) {
            var img = it.image_url ? '<img class="row-thumb" src="' + esc(it.image_url) + '" alt="">' : '<div class="row-thumb ph"></div>';
            return '<li class="pf-sort-item" data-sort-item="' + it.id + '">' +
              '<button type="button" class="pf-drag" data-drag aria-label="' + t('port.reorder') + '" title="' + t('port.reorder') + '">⠿</button>' +
              img +
              '<div class="pf-sort-main"><b>' + esc(it.title) + '</b>' +
                (it.description ? '<small class="muted">' + esc(String(it.description).slice(0, 80)) + (String(it.description).length > 80 ? '…' : '') + '</small>' : '') +
              '</div>' +
              '<button class="switch' + (it.active !== false ? ' on' : '') + '" data-port-toggle="' + it.id + '" role="switch" aria-checked="' + (it.active !== false) + '" aria-label="' + t('port.item') + '"></button>' +
              '<div class="pf-sort-actions">' +
                '<button class="btn ghost small" data-edit="' + it.id + '">' + t('common.edit') + '</button>' +
                '<button class="btn ghost small danger" data-del="' + it.id + '">' + t('common.delete') + '</button>' +
              '</div></li>';
          }).join('') + '</ul>' +
          '<p class="muted pf-sort-hint">' + t('port.reorder.hint') + '</p></section>'
        : '<div class="card empty-state"><div class="es-icon">🖼️</div><b>' + t('port.none') + '</b><p>' + t('port.none.desc') + '</p>' +
          '<button class="btn primary" data-new2>+ ' + t('port.new') + '</button></div>');

    function goNew() { location.hash = '#portfolio/new'; }
    $$('[data-new]', view).concat($$('[data-new2]', view)).forEach(function (b) { b.addEventListener('click', goNew); });
    $$('[data-edit]', view).forEach(function (b) { b.addEventListener('click', function () { location.hash = '#portfolio/edit/' + b.dataset.edit; }); });
    $$('[data-port-toggle]', view).forEach(function (b) {
      b.addEventListener('click', function () {
        var it = state.portfolio.find(function (x) { return x.id === b.dataset.portToggle; });
        if (!it) return;
        var next = !(it.active !== false);
        b.disabled = true;
        CW.store.savePortfolioItem({ id: it.id, active: next }).then(function () {
          it.active = next;
          b.classList.toggle('on', next);
          b.setAttribute('aria-checked', String(next));
          b.disabled = false;
        }).catch(function (err) {
          b.disabled = false;
          console.warn('[CW] No se pudo cambiar la visibilidad del trabajo:', err);
          CW.toast(t('set.save.error'), 'error');
        });
      });
    });
    $$('[data-del]', view).forEach(function (b) {
      b.addEventListener('click', function () {
        CW.confirm(t('port.confirm.delete'), function () {
          CW.store.deletePortfolioItem(b.dataset.del).then(function () { loadAll().then(route); });
        }, true);
      });
    });

    var listEl = $('[data-sortable]', view);
    if (listEl) enableSortable(listEl);
  }

  // Reordenar arrastrando (ratón, dedo o lápiz) sin escribir números.
  // Al soltar se guarda el nuevo orden de golpe, solo de los que han cambiado.
  function enableSortable(listEl) {
    var dragEl = null, pointerId = null, moved = false;

    function items() { return Array.prototype.slice.call(listEl.querySelectorAll('[data-sort-item]')); }

    // Devuelve el elemento delante del cual hay que insertar según la Y actual.
    function afterElement(y) {
      var best = null, bestOffset = -Infinity;
      items().forEach(function (el) {
        if (el === dragEl) return;
        var box = el.getBoundingClientRect();
        var offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > bestOffset) { bestOffset = offset; best = el; }
      });
      return best;
    }

    function persist() {
      var ordered = items().map(function (el) { return el.dataset.sortItem; });
      var current = state.portfolio.slice();
      var changes = [];
      ordered.forEach(function (id, i) {
        var it = current.find(function (x) { return x.id === id; });
        if (!it) return;
        if (Number(it.sort_order || 0) !== i) changes.push({ id: id, sort_order: i });
      });
      // Reordenamos también en memoria para que editar/eliminar usen el orden nuevo.
      state.portfolio = ordered.map(function (id, i) {
        var it = current.find(function (x) { return x.id === id; });
        return Object.assign({}, it, { sort_order: i });
      });
      if (!changes.length) return;
      Promise.all(changes.map(function (c) {
        return CW.store.savePortfolioItem(c).catch(function (err) {
          console.warn('[CW] No se pudo guardar el orden del porfolio:', err);
        });
      })).then(function () {
        CW.toast(t('port.reorder.saved'), 'ok');
      });
    }

    listEl.addEventListener('pointerdown', function (e) {
      var handle = e.target && e.target.closest ? e.target.closest('[data-drag]') : null;
      if (!handle || e.button === 2) return;
      e.preventDefault();
      dragEl = handle.closest('[data-sort-item]');
      pointerId = e.pointerId;
      moved = false;
      dragEl.classList.add('dragging');
      try { dragEl.setPointerCapture(pointerId); } catch (err) { /* navegadores antiguos */ }
    });

    listEl.addEventListener('pointermove', function (e) {
      if (!dragEl || e.pointerId !== pointerId) return;
      e.preventDefault();
      moved = true;
      var after = afterElement(e.clientY);
      if (after == null) listEl.appendChild(dragEl);
      else if (after !== dragEl.nextElementSibling) listEl.insertBefore(dragEl, after);
    });

    function endDrag() {
      if (!dragEl) return;
      try { dragEl.releasePointerCapture(pointerId); } catch (err) {}
      dragEl.classList.remove('dragging');
      dragEl = null; pointerId = null;
      if (moved) persist();
    }
    listEl.addEventListener('pointerup', endDrag);
    listEl.addEventListener('pointercancel', endDrag);

    // Teclado: con el asa enfocada, las flechas suben y bajan el trabajo.
    listEl.addEventListener('keydown', function (e) {
      var handle = e.target && e.target.closest ? e.target.closest('[data-drag]') : null;
      if (!handle) return;
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      var el = handle.closest('[data-sort-item]');
      if (e.key === 'ArrowUp' && el.previousElementSibling) listEl.insertBefore(el, el.previousElementSibling);
      else if (e.key === 'ArrowDown' && el.nextElementSibling) listEl.insertBefore(el.nextElementSibling, el);
      else return;
      handle.focus();
      persist();
    });
  }

  function renderPortfolioForm(view) {
    var editing = state.sub === 'edit' ? state.portfolio.find(function (x) { return x.id === state.param; }) : null;
    var it = editing || { title: '', description: '', image_url: '', sort_order: state.portfolio.length, active: true };
    view.innerHTML =
      '<div class="view-head"><div><span class="crumb-mini">' + t('port.list') + ' / ' + (editing ? t('common.edit') : t('port.new')) + '</span>' +
      '<h1>' + (editing ? t('port.edit') : t('port.new')) + '</h1></div>' +
      '<button class="btn ghost" data-back>← ' + t('common.back') + '</button></div>' +
      card(t('port.item'), '',
        field(t('common.name'), '<input data-f="title" maxlength="120" value="' + esc(it.title) + '" placeholder="Ej. Meuble TV sur mesure">') +
        field(t('port.desc'), '<textarea data-f="description" rows="3" maxlength="220">' + esc(it.description || '') + '</textarea><small class="muted">' + t('port.desc.hint') + '</small>') +
        field(t('port.details'), '<textarea data-f="details" rows="4" placeholder="Matériaux : chêne massif&#10;Dimensions : 2,4 m&#10;Finition : vernis mat">' + esc(it.details || '') + '</textarea><small class="muted">' + t('port.details.hint') + '</small>') +
        '<div class="two-col-inline">' +
          field(t('port.client'), '<input data-f="client" value="' + esc(it.client || '') + '">') +
          field(t('port.date'), '<input data-f="work_date" placeholder="2025" value="' + esc(it.work_date || '') + '">') +
        '</div>' +
        field(t('port.place'), '<input data-f="place" value="' + esc(it.place || '') + '">') +
        '<div class="two-col-inline">' +
          field(t('port.category'), '<input data-f="category" placeholder="Ej. Menuiserie" value="' + esc(it.category || '') + '">') +
          field(t('port.price'), '<input type="number" step="0.01" data-f="price" value="' + (it.price || '') + '">') +
        '</div>' +
        field(t('port.link'), '<input type="url" data-f="link" placeholder="https://…" value="' + esc(it.link || '') + '">')
      ) +
      trCard(it, [
        { key: 'title', label: t('common.name') },
        { key: 'description', label: t('port.desc'), type: 'area', rows: 3 },
        { key: 'details', label: t('port.details'), type: 'area', rows: 4 }
      ]) +
      card(t('port.image'), '',
        '<div class="img-slot ' + (it.image_url ? 'filled' : '') + '" data-item-img style="max-width:280px">' +
          (it.image_url ? '<img src="' + esc(it.image_url) + '">' : '<span>+</span>') + '</div>' +
        '<label class="check"><input type="checkbox" data-f="active"' + (it.active !== false ? ' checked' : '') + '> ' + t('common.active') + '</label>'
      ) +
      '<div class="form-sticky"><button class="btn ghost" data-back2>' + t('common.cancel') + '</button>' +
      '<button class="btn primary" data-save>✓ ' + t('port.save') + '</button></div>';

    function back() { location.hash = '#portfolio'; }
    var b1 = $('[data-back]', view); if (b1) b1.addEventListener('click', back);
    var b2 = $('[data-back2]', view); if (b2) b2.addEventListener('click', back);

    var imgSlot = $('[data-item-img]', view);
    if (imgSlot) imgSlot.addEventListener('click', function () {
      openImagePicker(1, function (urls) {
        if (!urls[0]) return;
        view._img = urls[0];
        var slot = $('[data-item-img]', view);
        slot.innerHTML = '<img src="' + esc(urls[0]) + '">';
        slot.classList.add('filled');
      });
    });
    try {
      bindTrAi(view, [
        { key: 'title', from: '[data-f="title"]' },
        { key: 'description', from: '[data-f="description"]' },
        { key: 'details', from: '[data-f="details"]' }
      ]);
    } catch (e) { console.warn('[CW] Traducción no disponible en el porfolio:', e); }

    $('[data-save]', view).addEventListener('click', function () {
      function val(f) { var el = $('[data-f="' + f + '"]', view); return el ? el.value : ''; }
      var title = val('title').trim();
      if (!title) { CW.toast(t('common.required'), 'error'); return; }
      var obj = {
        id: editing ? editing.id : undefined,
        business_id: state.biz.id,
        title: title,
        description: val('description').trim().slice(0, 220),
        image_url: view._img || it.image_url || '',
        category: val('category').trim(),
        price: val('price') === '' ? null : Number(val('price')),
        link: val('link').trim(),
        details: val('details').trim(),
        client: val('client').trim(),
        place: val('place').trim(),
        work_date: val('work_date').trim(),
        sort_order: editing ? Number(it.sort_order || 0) : state.portfolio.length,
        active: $('[data-f="active"]', view).checked
      };
      obj.i18n = trCollect(view, it);
      var btns = $$('[data-save]', view);
      btns.forEach(function (b) { b.disabled = true; });
      CW.store.savePortfolioItem(obj).then(function () {
        CW.toast(t('common.save'), 'ok');
        location.hash = '#portfolio';
        loadAll().then(route);
      }).catch(function (err) {
        btns.forEach(function (b) { b.disabled = false; });
        console.warn('[CW] No se pudo guardar el trabajo del porfolio:', err);
        CW.toast(t('set.save.error'), 'error');
      });
    });
  }

  // ---------------------------------------------------------------------
  // EQUIPO (profesionales con su propio horario)
  // ---------------------------------------------------------------------
  var DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  function renderTeam(view) {
    if (state.sub === 'new' || state.sub === 'edit') return renderTeamForm(view);
    view.innerHTML = '<div class="view-head"><div><h1>' + t('team.title') + '</h1><p class="muted">' + t('team.sub') + '</p></div>' +
      '<button class="btn primary" data-new>+ ' + t('team.new') + '</button></div>' +
      (state.team.length
        ? '<section class="card"><ul class="pf-sort">' + state.team.map(function (m) {
            var days = (m.work_days || [1,2,3,4,5,6]).slice().sort().map(function (d) { return DAYS[d]; }).join(' ');
            return '<li class="pf-sort-item"><div class="row-thumb ph">👤</div>' +
              '<div class="pf-sort-main"><b>' + esc(m.name) + (m.role ? ' · <span class="muted">' + esc(m.role) + '</span>' : '') + '</b>' +
              '<small class="muted">' + esc(days) + ' · ' + esc(m.open_time || '09:00') + '–' + esc(m.close_time || '18:00') + '</small></div>' +
              '<button class="switch' + (m.active !== false ? ' on' : '') + '" data-team-toggle="' + m.id + '"></button>' +
              '<div class="pf-sort-actions"><button class="btn ghost small" data-edit="' + m.id + '">' + t('common.edit') + '</button>' +
              '<button class="btn ghost small danger" data-del="' + m.id + '">' + t('common.delete') + '</button></div></li>';
          }).join('') + '</ul></section>'
        : '<div class="card empty-state"><div class="es-icon">👤</div><b>' + t('team.none') + '</b><p>' + t('team.none.desc') + '</p></div>');

    $$('[data-new]', view).forEach(function (b) { b.addEventListener('click', function () { location.hash = '#team/new'; }); });
    $$('[data-edit]', view).forEach(function (b) { b.addEventListener('click', function () { location.hash = '#team/edit/' + b.dataset.edit; }); });
    $$('[data-team-toggle]', view).forEach(function (b) {
      b.addEventListener('click', function () {
        var m = state.team.find(function (x) { return x.id === b.dataset.teamToggle; });
        var next = !(m.active !== false);
        CW.store.saveProfessional({ id: m.id, active: next }).then(function () { m.active = next; b.classList.toggle('on', next); });
      });
    });
    $$('[data-del]', view).forEach(function (b) {
      b.addEventListener('click', function () {
        CW.confirm(t('team.confirm.delete'), function () {
          CW.store.deleteProfessional(b.dataset.del).then(function () { loadAll().then(route); });
        }, true);
      });
    });
  }

  function renderTeamForm(view) {
    var editing = state.sub === 'edit' ? state.team.find(function (x) { return x.id === state.param; }) : null;
    var m = editing || { name: '', role: '', active: true, work_days: [1,2,3,4,5,6], open_time: '09:00', close_time: '18:00', slot_minutes: 30 };
    var days = (m.work_days || []).slice();

    view.innerHTML = '<div class="view-head"><div><span class="crumb-mini">' + t('team.title') + ' / ' + (editing ? t('common.edit') : t('team.new')) + '</span>' +
      '<h1>' + (editing ? t('common.edit') : t('team.new')) + '</h1></div>' +
      '<button class="btn ghost" data-back>← ' + t('common.back') + '</button></div>' +
      card(t('team.data'), '',
        field(t('common.name'), '<input data-f="name" value="' + esc(m.name) + '" placeholder="Ej. Youssef">') +
        field(t('team.role'), '<input data-f="role" value="' + esc(m.role || '') + '" placeholder="Ej. Peluquero">') +
        field(t('team.days'), '<div class="days-row" data-days>' + DAYS.map(function (d, i) {
          return '<button type="button" class="day' + (days.indexOf(i) >= 0 ? ' on' : '') + '" data-day="' + i + '">' + d + '</button>';
        }).join('') + '</div>') +
        '<div class="two-col-inline">' +
          field(t('team.from'), '<input type="time" data-f="open_time" value="' + esc(m.open_time || '09:00') + '">') +
          field(t('team.to'), '<input type="time" data-f="close_time" value="' + esc(m.close_time || '18:00') + '">') +
        '</div>' +
        '<div class="two-col-inline">' +
          field(t('team.slot'), '<input type="number" data-f="slot_minutes" value="' + (m.slot_minutes || 30) + '">') +
          '<label class="check" style="align-self:end"><input type="checkbox" data-f="active"' + (m.active !== false ? ' checked' : '') + '> ' + t('common.active') + '</label>' +
        '</div>') +
      '<div class="form-sticky"><button class="btn ghost" data-back2>' + t('common.cancel') + '</button>' +
      '<button class="btn primary" data-save>✓ ' + t('common.save') + '</button></div>';

    $$('[data-day]', view).forEach(function (b) {
      b.addEventListener('click', function () {
        var d = Number(b.dataset.day), i = days.indexOf(d);
        if (i >= 0) { days.splice(i, 1); b.classList.remove('on'); }
        else { days.push(d); b.classList.add('on'); }
      });
    });
    $('[data-back]', view).addEventListener('click', function () { location.hash = '#team'; });
    $('[data-back2]', view).addEventListener('click', function () { location.hash = '#team'; });
    $('[data-save]', view).addEventListener('click', function () {
      function val(f) { var el = $('[data-f="' + f + '"]', view); return el ? el.value : ''; }
      if (!val('name').trim()) { CW.toast(t('common.required'), 'error'); return; }
      var obj = {
        id: editing ? editing.id : undefined,
        business_id: state.biz.id,
        name: val('name').trim(),
        role: val('role').trim(),
        work_days: days.sort(),
        open_time: val('open_time') || '09:00',
        close_time: val('close_time') || '18:00',
        slot_minutes: Number(val('slot_minutes') || 30),
        active: $('[data-f="active"]', view).checked
      };
      CW.store.saveProfessional(obj).then(function () {
        CW.toast(t('common.save'), 'ok');
        location.hash = '#team';
        loadAll().then(route);
      }).catch(function (err) {
        console.warn('[CW] No se pudo guardar el profesional:', err);
        CW.toast(t('set.save.error'), 'error');
      });
    });
  }

  // ---------------------------------------------------------------------
  // BIBLIOTECA + selector de imágenes
  // ---------------------------------------------------------------------
  function renderLibrary(view) {
    view.innerHTML = '<div class="view-head"><div><h1>' + t('nav.library') + '</h1></div>' +
      '<label class="btn primary">+ ' + t('common.add') + '<input type="file" accept="image/*" multiple data-upload hidden></label></div>' +
      '<div class="lib-drop" data-drop>' +
        '<span class="lib-drop-ico">⬇️</span>' +
        '<b>' + t('lib.drop') + '</b><small>' + t('lib.drop.hint') + '</small>' +
      '</div>' +
      '<div class="lib-grid" data-lib>' + libCards() + '</div>';
    function libCards() {
      if (!state.library.length) return '<div class="card empty-state" style="grid-column:1/-1"><div class="es-icon">🖼️</div><b>' + t('common.none') + '</b></div>';
      return state.library.map(function (i) {
        return '<div class="lib-item"><img src="' + esc(i.url) + '" alt=""><button class="lib-del" data-del="' + i.id + '">✕</button></div>';
      }).join('');
    }
    function uploadFiles(files) {
      files = Array.prototype.slice.call(files || []).filter(function (f) { return /^image\//.test(f.type); });
      if (!files.length) { CW.toast(t('lib.onlyimages'), 'warn'); return; }
      CW.toast(t('common.loading'));
      Promise.all(files.map(function (f) { return CW.store.uploadImage(state.biz.id, f); })).then(function () {
        CW.toast(t('common.save'), 'ok'); loadAll().then(function () { $('[data-lib]', view).innerHTML = libCards(); bindLib(); });
      }).catch(function (err) {
        console.warn('[CW] Error al subir imágenes:', err);
        CW.toast(t('set.save.error'), 'error');
      });
    }
    $('[data-upload]', view).addEventListener('change', function (e) { uploadFiles(e.target.files); });

    // Arrastrar y soltar imágenes sobre la biblioteca (o sobre el recuadro).
    var drop = $('[data-drop]', view), grid = $('[data-lib]', view);
    [drop, grid].forEach(function (zone) {
      if (!zone) return;
      var depth = 0;
      ['dragenter', 'dragover'].forEach(function (ev) {
        zone.addEventListener(ev, function (e) {
          e.preventDefault(); e.stopPropagation();
          if (ev === 'dragenter') depth++;
          zone.classList.add('over');
        });
      });
      ['dragleave', 'drop'].forEach(function (ev) {
        zone.addEventListener(ev, function (e) {
          e.preventDefault(); e.stopPropagation();
          if (ev === 'dragleave') { depth--; if (depth > 0) return; }
          depth = 0;
          zone.classList.remove('over');
          if (ev === 'drop' && e.dataTransfer && e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
        });
      });
    });
    // Sin esto, soltar fuera de la zona abre la imagen en el navegador.
    ['dragover', 'drop'].forEach(function (ev) {
      document.addEventListener(ev, function (e) { e.preventDefault(); });
    });
    function bindLib() {
      $$('[data-del]', view).forEach(function (b) {
        b.addEventListener('click', function () {
          var item = state.library.find(function (x) { return x.id === b.dataset.del; });
          CW.store.deleteLibraryItem(item).then(function () { loadAll().then(function () { $('[data-lib]', view).innerHTML = libCards(); bindLib(); }); });
        });
      });
    }
    bindLib();
  }

  // Selector modal con marcas claras y barra fija.
  function openImagePicker(max, onDone) {
    max = max || 5;
    var selected = [];
    var m = CW.modal({
      className: 'picker-modal',
      title: t('nav.library'),
      html:
        '<div class="picker-actions"><label class="btn ghost small">+ ' + t('common.add') + '<input type="file" accept="image/*" multiple data-pick-upload hidden></label></div>' +
        '<div class="lib-grid picker" data-pick-grid></div>' +
        '<div class="picker-bar"><span data-pick-count>0 ' + t('common.image') + '(s)</span>' +
        '<button class="btn primary" data-pick-ok>' + t('common.confirm') + '</button></div>'
    });
    function draw() {
      $('[data-pick-grid]', m.modal).innerHTML = state.library.length ? state.library.map(function (i) {
        var on = selected.indexOf(i.url) >= 0;
        return '<div class="lib-item pick' + (on ? ' selected' : '') + '" data-url="' + esc(i.url) + '"><img src="' + esc(i.url) + '" alt=""><span class="pick-check">✓</span></div>';
      }).join('') : '<p class="muted">' + t('common.none') + '</p>';
      $('[data-pick-count]', m.modal).textContent = selected.length + ' / ' + max;
      $$('[data-url]', m.modal).forEach(function (el) {
        el.addEventListener('click', function () {
          var u = el.dataset.url, i = selected.indexOf(u);
          if (i >= 0) selected.splice(i, 1);
          else if (selected.length < max) selected.push(u);
          else CW.toast('Máx. ' + max);
          draw();
        });
      });
    }
    draw();
    $('[data-pick-upload]', m.modal).addEventListener('change', function (e) {
      var files = Array.prototype.slice.call(e.target.files);
      Promise.all(files.map(function (f) { return CW.store.uploadImage(state.biz.id, f); })).then(function (items) {
        return CW.store.listLibrary(state.biz.id).then(function (lib) {
          state.library = lib; draw();
          items.forEach(function (it) { if (selected.length < max) selected.push(it.url); });
          draw();
        });
      });
    });
    $('[data-pick-ok]', m.modal).addEventListener('click', function () { onDone(selected); m.close(); });
  }

  // ---------------------------------------------------------------------
  // CONFIGURACIÓN (10 tarjetas + subvistas)
  // ---------------------------------------------------------------------
  var SETTINGS = [
    { id: 'info', icon: '🏢', title: 'set.info', desc: 'set.info.desc', check: function (b) { return !!b.name; } },
    { id: 'whatsapp', icon: '💬', title: 'set.whatsapp', desc: 'set.whatsapp.desc', check: function (b) { return !!b.whatsapp; } },
    { id: 'brand', icon: '🎨', title: 'set.brand', desc: 'set.brand.desc', check: function (b) { return !!b.logo_url; }, optional: true },
    { id: 'currency', icon: '💱', title: 'set.currency', desc: 'set.currency.desc', check: function (b) { return !!b.currency; } },
    { id: 'link', icon: '🔗', title: 'set.link', desc: 'set.link.desc', check: function (b) { return !!b.slug; } },
    { id: 'presentation', icon: '🖼️', title: 'set.presentation', desc: 'set.presentation.desc', check: function (b) { return !b.hero_enabled || (b.hero_title && b.hero_image); }, optional: true },
    { id: 'delivery', icon: '🚚', title: 'set.delivery', desc: 'set.delivery.desc', check: function (b) { return !!b.delivery; } },
    { id: 'payments', icon: '💳', title: 'set.payments', desc: 'set.payments.desc', check: function (b) { return (b.payments || []).length > 0; } },
    { id: 'hours', icon: '🕐', title: 'set.hours', desc: 'set.hours.desc', check: function (b) { return !!(b.open_time && b.close_time); } },
    { id: 'seo', icon: '🔍', title: 'set.seo', desc: 'set.seo.desc', check: function (b) { return !!b.seo_title; }, optional: true }
  ];

  function renderSettings(view) {
    if (state.sub) return renderSettingDetail(view, state.sub);
    view.innerHTML = '<div class="view-head"><div><h1>' + t('set.title') + '</h1><p class="muted">' + t('set.sub') + '</p></div>' +
      '<div class="segmented" data-filter><button data-f="all" class="active">' + t('common.all') + '</button>' +
      '<button data-f="configured">' + t('set.configured') + '</button><button data-f="pending">' + t('set.pending') + '</button>' +
      '<button data-f="optional">' + t('set.optional') + '</button></div></div><div class="set-grid" data-grid></div>';
    function draw(f) {
      var cards = SETTINGS.filter(function (s) {
        var ok = s.check(state.biz);
        if (f === 'configured') return ok;
        if (f === 'pending') return !ok && !s.optional;
        if (f === 'optional') return s.optional;
        return true;
      }).map(function (s) {
        var ok = s.check(state.biz);
        var tag = s.optional ? '<span class="tag">' + t('set.optional') + '</span>' : (ok ? '<span class="tag ok">✓ ' + t('set.configured') + '</span>' : '<span class="tag warn">● ' + t('set.pending') + '</span>');
        var btn = s.id === 'brand' || s.id === 'presentation' ? t('set.personalize') : s.id === 'link' ? t('set.choose') : t('set.configure');
        return '<article class="set-card"><div class="set-top"><span class="set-icon">' + s.icon + '</span>' + tag + '</div>' +
          '<h3>' + t(s.title) + '</h3><p>' + t(s.desc) + '</p>' +
          '<button class="btn ghost small" data-set="' + s.id + '">' + btn + ' ›</button></article>';
      }).join('');
      $('[data-grid]', view).innerHTML = cards;
      $$('[data-set]', view).forEach(function (b) { b.addEventListener('click', function () { location.hash = '#settings/' + b.dataset.set; }); });
    }
    $$('[data-filter] button', view).forEach(function (b) {
      b.addEventListener('click', function () { $$('[data-filter] button', view).forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); draw(b.dataset.f); });
    });
    draw('all');
  }

  function renderSettingDetail(view, id) {
    var b = state.biz;
    var body = '';
    var title = t(SETTINGS.find(function (s) { return s.id === id; }).title);
    if (id === 'info') body =
      card(t('set.info'), '', field(t('login.business'), '<input data-f="name" value="' + esc(b.name) + '">') +
        field(t('prod.desc'), '<textarea data-f="description" rows="3">' + esc(b.description || '') + '</textarea>') +
        '<div class="two-col-inline">' + field('País', '<select data-f="country">' + CW.api.countryOptions(b.country) + '</select>') +
        field(t('set.currency'), '<input value="' + esc(b.currency) + '" disabled> <button class="btn ghost small" data-gocur>Cambiar</button>') + '</div>' +
        '<div class="two-col-inline">' + field('Región', '<input data-f="region" value="' + esc(b.region || '') + '">') + field('Ciudad', '<input data-f="city" value="' + esc(b.city || '') + '">') + '</div>' +
        field(t('cat.alt'), '<input data-f="address" value="' + esc(b.address || '') + '">') +
        field('Zona horaria', '<input data-f="timezone" value="' + esc(b.timezone || '') + '">'));
    else if (id === 'whatsapp') {
      var ccode = CW.COUNTRY_CODES[b.country] || CW.COUNTRY_CODES.MA;
      body =
        '<div class="set-two">' +
          '<div class="card">' +
            '<span class="kicker">NÚMERO DE WHATSAPP</span>' +
            '<h3>Cambiar número de WhatsApp</h3>' +
            field('País o región', '<select data-f="wcountry">' + CW.api.countryOptions(b.country) + '</select>') +
            '<label class="field"><span>Número de WhatsApp</span>' +
              '<div class="phone-input"><span class="pi-prefix" data-pi-prefix>' + ccode.flag + ' +' + ccode.code + '</span>' +
              '<input data-f="wphone" inputmode="tel" value="' + esc(stripCountry(b.country, b.whatsapp)) + '" placeholder="670 96 40 30">' +
              '<span class="pi-wa">' + WA_ICON + '</span></div>' +
            '</label>' +
            '<p class="muted">Ingresa el número sin el código de país.</p>' +
            '<button type="button" class="btn primary block" data-wa-review>Revisar y confirmar</button>' +
          '</div>' +
          '<aside class="set-side">' +
            '<div class="card wa-current"><span class="kicker">NÚMERO DE WHATSAPP ACTUAL</span><b data-wa-current>' + (b.whatsapp ? '+' + esc(b.whatsapp) : 'Sin configurar') + '</b></div>' +
            '<div class="card"><div class="card-head"><h4 style="margin:0">Probar WhatsApp</h4><span class="wa-badge">' + WA_ICON + '</span></div>' +
              '<p class="muted">Abre el chat con el número actualmente guardado.</p>' +
              (b.whatsapp ? '<a class="btn wa-ghost small" target="_blank" rel="noopener" href="' + CW.api.waLink(b.whatsapp, 'Hola, quiero hacer un pedido.') + '">Abrir WhatsApp</a>' : '<span class="muted">Configura un número primero.</span>') +
            '</div>' +
            '<div class="card note-card"><b>Ten en cuenta</b><p class="muted">Probar WhatsApp solo abre una conversación con el número guardado. No verifica que el número te pertenezca.</p></div>' +
          '</aside>' +
        '</div>';
    }
    else if (id === 'brand') body =
      card(t('set.brand'), '', '<div class="logo-preview" data-logo>' + (b.logo_url ? '<img src="' + esc(b.logo_url) + '">' : '<span>' + esc((b.name || 'M').charAt(0)) + '</span>') + '</div>' +
        '<label class="btn ghost small">Seleccionar archivo<input type="file" accept="image/*" data-logo-file hidden></label>' +
        field('Color de marca', '<div class="color-row"><input type="color" data-f="brand_color" value="' + esc(b.brand_color || '#5B1A80') + '"><input data-f="brand_hex" value="' + esc(b.brand_color || '#5B1A80') + '"></div>') +
        '<div class="pro-lock">⭐ <b>' + t('plan.pro') + '</b> — ' + t('plan.pro.unavailable') + '</div>');
    else if (id === 'currency') body =
      card(t('set.currency'), '⚠️ Este cambio requiere revisión de precios.',
        field(t('set.currency'), '<select data-f="currency">' + CW.api.currencyList.map(function (c) { return '<option value="' + c.code + '"' + (c.code === b.currency ? ' selected' : '') + '>' + c.label + '</option>'; }).join('') + '</select>') +
        '<label class="check"><input type="checkbox" data-f="curconfirm"> Confirmo el cambio y que revisaré los precios.</label>');
    else if (id === 'link') body =
      card(t('set.link'), t('set.link.desc'),
        field(t('cat.slug'), '<div class="slug-row"><span>https://</span><input data-f="slug" value="' + esc(b.slug) + '"><span>.' + esc(CW.publicHost) + '</span></div><small class="muted" data-slug-msg></small>') +
        '<div class="url-line">' + esc(bizUrl()) + '</div><button class="btn ghost small" data-copy>' + t('common.copy') + '</button>');
    else if (id === 'presentation') body =
      card(t('set.presentation'), '',
        '<label class="check"><input type="checkbox" data-f="hero_enabled"' + (b.hero_enabled ? ' checked' : '') + '> Mostrar encabezado visual</label>' +
        field('Título', '<input data-f="hero_title" value="' + esc(b.hero_title || '') + '" placeholder="Ej. Todo para tu hogar">') +
        field(t('prod.desc'), '<textarea data-f="hero_desc" rows="3">' + esc(b.hero_desc || '') + '</textarea>') +
        field('Imagen del encabezado', '<div class="img-slot ' + (b.hero_image ? 'filled' : '') + '" data-hero style="max-width:260px">' + (b.hero_image ? '<img src="' + esc(b.hero_image) + '">' : '<span>+</span>') + '</div>'));
    else if (id === 'delivery') {
      var modes = (b.delivery && b.delivery !== 'whatsapp') ? String(b.delivery).split(',') : [];
      var isCustom = !!(b.delivery && b.delivery !== 'whatsapp');
      body =
        '<div class="card">' +
          '<span class="kicker">ENTREGA</span>' +
          '<h3>Modalidad de entrega</h3>' +
          '<p class="muted">Elige si coordinarás la entrega directamente por WhatsApp o si quieres definir las modalidades disponibles.</p>' +
          '<label class="opt-card"><input type="radio" name="dv" value="whatsapp"' + (isCustom ? '' : ' checked') + '>' +
            '<span class="opt-body"><b>Coordinar por WhatsApp</b><small>Los detalles de entrega o recojo se coordinarán directamente con el cliente por WhatsApp.</small></span></label>' +
          '<label class="opt-card"><input type="radio" name="dv" value="custom"' + (isCustom ? ' checked' : '') + '>' +
            '<span class="opt-body"><b>Definir modalidades de entrega</b><small>Selecciona las modalidades que estarán disponibles para el cliente.</small></span></label>' +
          '<div class="opt-modes" data-dv-modes' + (isCustom ? '' : ' hidden') + '>' +
            '<label class="opt-card sub"><input type="checkbox" data-dv-mode="pickup"' + (modes.indexOf('pickup') >= 0 ? ' checked' : '') + '>' +
              '<span class="opt-body"><b>Retiro</b><small>El cliente coordina el retiro de su pedido directamente con el negocio.</small></span></label>' +
            '<label class="opt-card sub"><input type="checkbox" data-dv-mode="delivery"' + (modes.indexOf('delivery') >= 0 ? ' checked' : '') + '>' +
              '<span class="opt-body"><b>Delivery</b><small>El cliente indica una dirección y coordina los detalles del delivery por WhatsApp.</small></span></label>' +
            '<div class="two-col-inline" style="margin-top:14px">' +
              field('Tarifa de entrega (' + b.currency + ')', '<input type="number" step="0.01" data-f="delivery_fee" value="' + (b.delivery_fee || 0) + '">') +
              field('Plazo estimado', '<input data-f="delivery_time" value="' + esc(b.delivery_time || '') + '" placeholder="24-48 h">') +
            '</div>' +
            field('Notas de entrega', '<textarea data-f="delivery_notes" rows="2">' + esc(b.delivery_notes || '') + '</textarea>') +
          '</div>' +
        '</div>';
    }
    else if (id === 'payments') body =
      card(t('set.payments'), t('set.payments.desc'),
        '<div class="chips" data-pays data-no-i18n>' + ['Efectivo', 'Transferencia bancaria', 'Tarjeta', 'Pago al recibir'].map(function (p) {
          var on = (b.payments || []).indexOf(p) >= 0;
          return '<button type="button" class="chip' + (on ? ' active' : '') + '" data-pay="' + esc(p) + '">' + p + '</button>';
        }).join('') + '</div>' + field('Notas', '<textarea data-f="payment_notes" rows="2">' + esc(b.payment_notes || '') + '</textarea>'));
    else if (id === 'hours') body =
      card(t('set.hours'), '', '<div class="days-row" data-days>' + ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(function (d, i) {
        var on = (b.work_days || []).indexOf(i) >= 0;
        return '<button type="button" class="chip' + (on ? ' active' : '') + '" data-day="' + i + '">' + d + '</button>';
      }).join('') + '</div><div class="two-col-inline">' +
        field('Apertura', '<input type="time" data-f="open_time" value="' + esc(b.open_time || '09:00') + '">') +
        field('Cierre', '<input type="time" data-f="close_time" value="' + esc(b.close_time || '18:00') + '">') + '</div>' +
        field('Intervalo de citas (min)', '<input type="number" data-f="slot_minutes" value="' + (b.slot_minutes || 30) + '">'));
    else if (id === 'seo') {
      var autoImg = (state.products[0] && state.products[0].images && state.products[0].images[0]) || b.hero_image || b.logo_url || '';
      var prevImg = b.seo_image || autoImg;
      var domain = String(CW.publicHost || '').toUpperCase();
      body =
        '<div class="set-two seo-two">' +
          '<div class="set-col">' +
            '<div class="card">' +
              '<span class="kicker">TU CATÁLOGO</span>' +
              '<h3>Título y descripción</h3>' +
              '<p class="muted">Explica en pocas palabras qué vendes y qué encontrará el cliente. Los colores son una guía, no una obligación.</p>' +
              '<label class="field"><span class="row-between-inline"><span>Título para buscadores y redes</span><small class="muted" data-c-seo-t></small></span>' +
                '<input data-f="seo_title" maxlength="70" value="' + esc(b.seo_title || '') + '" placeholder="' + esc(b.name) + '">' +
                '<small class="muted">Sugerencia: incluye tu nombre comercial y lo que vendes. Como guía visual, 30–60 caracteres suele ser una longitud clara. <span data-len-t></span></small>' +
              '</label>' +
              '<label class="field"><span class="row-between-inline"><span>Descripción</span><small class="muted" data-c-seo-d></small></span>' +
                '<textarea data-f="seo_description" rows="4" maxlength="170" placeholder="Describe tu catálogo en una o dos frases.">' + esc(b.seo_description || '') + '</textarea>' +
                '<small class="muted">Como guía, 120–160 caracteres suele dar un buen contexto. Google puede recortar o generar su propio fragmento según la búsqueda. <span data-len-d></span></small>' +
              '</label>' +
              '<div class="info-box">¿No sabes qué escribir todavía? Puedes dejar los campos vacíos. Usaremos automáticamente el nombre y la descripción de tu negocio para que el catálogo conserve información básica.</div>' +
            '</div>' +
            '<div class="card">' +
              '<span class="kicker">IMAGEN AL COMPARTIR</span>' +
              '<h3>Imagen para redes y mensajería</h3>' +
              '<p class="muted">Puedes elegir una imagen especial para compartir. Si no eliges una, solo utilizaremos la imagen destacada de tu catálogo si existe.</p>' +
              '<div data-seo-empty' + (b.seo_image ? ' hidden' : '') + '>' +
                '<b>Sin imagen personalizada</b>' +
                '<p class="muted">Puedes agregar una si quieres controlar exactamente qué imagen se comparte.</p>' +
              '</div>' +
              '<div class="img-slot ' + (b.seo_image ? 'filled' : '') + '" data-seo-img style="max-width:320px;margin:10px 0"' + (b.seo_image ? '' : ' hidden') + '>' + (b.seo_image ? '<img src="' + esc(b.seo_image) + '">' : '<span>+</span>') + '</div>' +
              '<b>Agregar imagen personalizada</b>' +
              '<p class="muted">Recomendado: 1200 × 630 px. JPG, PNG o WebP · máximo 5 MB. La optimizamos y la guardamos como JPEG progresivo 1200 × 630.</p>' +
              '<button type="button" class="btn soft small" data-seo-add>Agregar imagen</button>' +
              '<div class="auto-card"><div class="auto-thumb">' + (autoImg ? '<img src="' + esc(autoImg) + '">' : '🖼️') + '</div>' +
                '<div><span class="kicker">RESPALDO AUTOMÁTICO <span class="tag">AUTOMÁTICA</span></span><b>Imagen destacada del catálogo</b>' +
                '<p class="muted">Como no tienes una imagen SEO personalizada, esta imagen destacada se utilizará automáticamente cuando una plataforma solicite una imagen para tu catálogo.</p></div></div>' +
              '<div class="set-actions"><button type="button" class="btn primary" data-save>Guardar SEO</button></div>' +
            '</div>' +
          '</div>' +
          '<aside class="set-side">' +
            '<div class="card"><span class="kicker">VISTA PREVIA</span><h3>Así puede verse tu enlace</h3>' +
              '<p class="muted">La tarjeta cambia en tiempo real mientras escribes. Cada plataforma decide el diseño final.</p>' +
              '<div class="social-preview"><div class="sp-img" data-sp-img>' + (prevImg ? '<img src="' + esc(prevImg) + '">' : '<span>Sin imagen</span>') + '</div>' +
                '<div class="sp-body"><small data-sp-url>' + esc(domain) + '</small><b data-sp-title>' + esc(b.seo_title || b.name) + '</b><span data-sp-desc>' + esc(b.seo_description || b.description || '') + '</span></div></div>' +
            '</div>' +
            '<div class="card"><b>Hacemos la parte técnica</b><p class="muted">Generamos automáticamente título, meta descripción, URL canónica, Open Graph y tarjeta grande para X/Twitter. Tú solo completas el contenido.</p></div>' +
            '<div class="card note-card warn"><b>Si cambias el texto o la imagen</b><p class="muted">En tu catálogo el cambio queda activo al guardar. Google y las redes sociales pueden seguir mostrando durante un tiempo una versión anterior porque usan cachés propias. No necesitas limpiar la caché de la aplicación.</p></div>' +
          '</aside>' +
        '</div>';
    }

    if (id === 'info') {
      body += trCard(b, [
        { key: 'name', label: t('login.business') },
        { key: 'description', label: t('prod.desc'), type: 'area', rows: 3 },
        { key: 'hero_title', label: t('set.presentation') },
        { key: 'hero_desc', label: t('prod.desc'), type: 'area', rows: 2 }
      ]);
    }

    var hero = SET_HERO[id] || [title, ''];
    view.innerHTML =
      '<div class="crumb-mini"><span>' + t('set.title') + '</span> / <span>' + esc(hero[0]) + '</span></div>' +
      '<section class="set-hero"><h1>' + esc(hero[0]) + '</h1>' + (hero[1] ? '<p>' + esc(hero[1]) + '</p>' : '') + '</section>' +
      '<button type="button" class="btn ghost small set-back" data-back><span aria-hidden="true">‹</span> Volver a configuración</button>' +
      body +
      '<div class="set-back-row"><button type="button" class="btn ghost small" data-back3><span aria-hidden="true">‹</span> Volver a configuración</button></div>' +
      '<div class="form-sticky"><button type="button" class="btn ghost" data-back2>' + t('common.back') + '</button><button type="button" class="btn primary" data-save>✓ ' + t('set.save') + '</button></div>';

    $('[data-back]', view).addEventListener('click', function () { location.hash = '#settings'; });
    $('[data-back2]', view).addEventListener('click', function () { location.hash = '#settings'; });
    var b3 = $('[data-back3]', view); if (b3) b3.addEventListener('click', function () { location.hash = '#settings'; });

    function val(f) { var el = $('[data-f="' + f + '"]', view); return el ? el.value : ''; }

    bindTrAi(view, [
      { key: 'name', from: '[data-f="name"]' },
      { key: 'description', from: '[data-f="description"]' },
      { key: 'hero_title', from: '[data-f="hero_title"]' },
      { key: 'hero_desc', from: '[data-f="hero_desc"]' }
    ]);
    if (id === 'brand') {
      $('[data-f="brand_color"]', view).addEventListener('input', function (e) { $('[data-f="brand_hex"]', view).value = e.target.value; });
      $('[data-logo-file]', view).addEventListener('change', function (e) {
        CW.store.uploadImage(b.id, e.target.files[0]).then(function (item) {
          $('[data-logo]', view).innerHTML = '<img src="' + esc(item.url) + '">';
          state.biz.logo_url = item.url; CW.store.saveBusiness(b.id, { logo_url: item.url });
        });
      });
    }
    if (id === 'link') {
      var slug = $('[data-f="slug"]', view);
      slug.addEventListener('input', function () {
        var s = CW.store.slugify(slug.value);
        if (!s) return;
        CW.store.slugAvailable(s).then(function (ok) {
          $('[data-slug-msg]', view).textContent = ok ? '✓ ' + t('onb.available') : '✗ ' + t('onb.taken');
        });
      });
      $('[data-copy]', view).addEventListener('click', function () { CW.api.copy(bizUrl()); });
    }
    if (id === 'presentation') {
      $('[data-hero]', view).addEventListener('click', function () {
        openImagePicker(1, function (u) { if (u[0]) { $('[data-hero]', view).innerHTML = '<img src="' + esc(u[0]) + '">'; view._hero = u[0]; } });
      });
    }
    if (id === 'payments') {
      view._pays = (b.payments || []).slice();
      $$('[data-pay]', view).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var p = btn.dataset.pay, i = view._pays.indexOf(p);
          if (i >= 0) { view._pays.splice(i, 1); btn.classList.remove('active'); }
          else { view._pays.push(p); btn.classList.add('active'); }
        });
      });
    }
    if (id === 'hours') {
      view._days = (b.work_days || []).slice();
      $$('[data-day]', view).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var d = Number(btn.dataset.day), i = view._days.indexOf(d);
          if (i >= 0) { view._days.splice(i, 1); btn.classList.remove('active'); }
          else { view._days.push(d); btn.classList.add('active'); }
        });
      });
    }
    if (id === 'seo') {
      var tEl = $('[data-f="seo_title"]', view), dEl = $('[data-f="seo_description"]', view);
      function lenBadge(el, min, max) {
        var n = el.value.length;
        if (!n) return '';
        if (n < min) return '<span class="len-badge short">Corta</span>';
        if (n > max) return '<span class="len-badge long">Larga</span>';
        return '<span class="len-badge ok">Buena longitud</span>';
      }
      function upd() {
        $('[data-c-seo-t]', view).textContent = tEl.value.length + ' caracteres';
        $('[data-c-seo-d]', view).textContent = dEl.value.length + ' caracteres';
        $('[data-len-t]', view).innerHTML = lenBadge(tEl, 30, 60);
        $('[data-len-d]', view).innerHTML = lenBadge(dEl, 120, 160);
        var st = $('[data-sp-title]', view), sd = $('[data-sp-desc]', view);
        if (st) st.textContent = tEl.value || b.name;
        if (sd) sd.textContent = dEl.value || b.description || '';
      }
      tEl.addEventListener('input', upd); dEl.addEventListener('input', upd); upd();
      var addImg = $('[data-seo-add]', view);
      if (addImg) addImg.addEventListener('click', function () {
        openImagePicker(1, function (u) {
          if (!u[0]) return;
          view._seoImg = u[0];
          var si = $('[data-seo-img]', view); if (si) { si.innerHTML = '<img src="' + esc(u[0]) + '">'; si.classList.add('filled'); si.hidden = false; }
          var se = $('[data-seo-empty]', view); if (se) se.hidden = true;
          var spi = $('[data-sp-img]', view); if (spi) spi.innerHTML = '<img src="' + esc(u[0]) + '">';
          var stt = $('[data-seo-img-state]', view); if (stt) stt.textContent = 'Imagen personalizada';
        });
      });
    }
    if (id === 'whatsapp') {
      var wcSel = $('[data-f="wcountry"]', view);
      var pi = $('[data-pi-prefix]', view);
      wcSel.addEventListener('change', function () {
        var c = CW.COUNTRY_CODES[wcSel.value] || CW.COUNTRY_CODES.MA;
        pi.innerHTML = c.flag + ' +' + c.code;
      });
      $('[data-wa-review]', view).addEventListener('click', function () {
        var num = CW.api.normalizePhone(wcSel.value, $('[data-f="wphone"]', view).value);
        if (!num || num.length < 8) { CW.toast('Revisa el número de WhatsApp.'); return; }
        CW.confirm('¿Guardar +' + num + ' como el WhatsApp del negocio?', function () {
          CW.store.saveBusiness(b.id, { whatsapp: num, country: wcSel.value }).then(function (nb) {
            state.biz = nb || Object.assign({}, b, { whatsapp: num, country: wcSel.value });
            CW.toast(t('common.save')); loadAll().then(function () { location.hash = '#settings'; route(); });
          });
        });
      });
    }
    if (id === 'delivery') {
      var dvModes = $('[data-dv-modes]', view);
      $$('input[name=dv]', view).forEach(function (r) {
        r.addEventListener('change', function () {
          dvModes.hidden = ($('input[name=dv]:checked', view) || {}).value !== 'custom';
        });
      });
    }
    if (id === 'info') $('[data-gocur]', view).addEventListener('click', function () { location.hash = '#settings/currency'; });

    function doSave() {
      var patch = {};
      if (id === 'info') patch = { name: val('name'), description: val('description'), country: val('country'), region: val('region'), city: val('city'), address: val('address'), timezone: val('timezone') };
      else if (id === 'whatsapp') {
        var wc = val('wcountry');
        patch = { whatsapp: CW.api.normalizePhone(wc, val('wphone')), country: wc };
      }
      else if (id === 'brand') patch = { brand_color: val('brand_hex') };
      else if (id === 'currency') {
        if (!$('[data-f="curconfirm"]', view).checked) { CW.toast('Confirma el cambio de moneda.'); return; }
        patch = { currency: val('currency') };
      }
      else if (id === 'link') patch = { slug: CW.store.slugify(val('slug')) };
      else if (id === 'presentation') patch = { hero_enabled: $('[data-f="hero_enabled"]', view).checked, hero_title: val('hero_title'), hero_desc: val('hero_desc'), hero_image: view._hero || b.hero_image };
      else if (id === 'delivery') {
        var dv = ($('input[name=dv]:checked', view) || {}).value || 'whatsapp';
        if (dv === 'whatsapp') patch = { delivery: 'whatsapp' };
        else {
          var dmodes = $$('[data-dv-mode]', view).filter(function (c) { return c.checked; }).map(function (c) { return c.dataset.dvMode; });
          patch = { delivery: dmodes.length ? dmodes.join(',') : 'delivery', delivery_fee: Number(val('delivery_fee') || 0), delivery_time: val('delivery_time'), delivery_notes: val('delivery_notes') };
        }
      }
      else if (id === 'payments') patch = { payments: view._pays, payment_notes: val('payment_notes') };
      else if (id === 'hours') patch = { work_days: view._days, open_time: val('open_time'), close_time: val('close_time'), slot_minutes: Number(val('slot_minutes') || 30) };
      else if (id === 'seo') patch = { seo_title: val('seo_title'), seo_description: val('seo_description'), seo_keywords: val('seo_keywords'), seo_image: view._seoImg || b.seo_image };

      // Validaciones mínimas antes de enviar.
      if (id === 'info' && !String(patch.name || '').trim()) {
        var nameEl = $('[data-f="name"]', view);
        if (nameEl) { nameEl.classList.add('invalid'); nameEl.focus(); }
        CW.toast(t('set.name.required'), 'error');
        return;
      }
      if (id === 'link' && !patch.slug) { CW.toast(t('set.link.required'), 'error'); return; }

      var saveBtns = $$('[data-save]', view);
      saveBtns.forEach(function (x) { x.disabled = true; x.classList.add('is-saving'); });
      function release() { saveBtns.forEach(function (x) { x.disabled = false; x.classList.remove('is-saving'); }); }

      patch = trPatch(view, b, patch);
      CW.store.saveBusiness(b.id, patch).then(function (nb) {
        state.biz = nb || Object.assign({}, b, patch);
        renderBizChip();
        var crumbBiz = $('[data-crumb-business]'); if (crumbBiz) crumbBiz.textContent = state.biz.name;
        var dropped = CW.store.lastDroppedColumns ? CW.store.lastDroppedColumns() : [];
        if (dropped.length) {
          CW.toast(t('set.save.partial', { fields: dropped.join(', ') }), 'warn');
        } else {
          CW.toast(t('common.save'), 'ok');
        }
        loadAll().then(function () { location.hash = '#settings'; route(); });
      }).catch(function (err) {
        // Nunca fallar en silencio: antes la promesa se quedaba sin manejar y
        // el botón no daba ninguna señal de que el guardado había fallado.
        console.warn('[CW] No se pudo guardar «' + id + '»:', err);
        release();
        CW.toast(t('set.save.error'), 'error');
      });
    }
    $$('[data-save]', view).forEach(function (btn) { btn.addEventListener('click', doSave); });
    // Al escribir de nuevo, se limpia el estado de error del campo.
    $$('input, textarea, select', view).forEach(function (el) {
      el.addEventListener('input', function () { el.classList.remove('invalid'); });
    });
  }

  // ---------------------------------------------------------------------
  // PLAN
  // ---------------------------------------------------------------------
  function renderPlan(view) {
    var b = state.biz;
    var used = state.products.length, max = b.max_products || CW.config.freeMaxProducts;
    var storage = state.library.reduce(function (s, i) { return s + (i.size_bytes || 0); }, 0);
    var maxMb = b.max_storage_mb || CW.config.freeMaxStorageMb;
    function mb(bytes) { return (bytes / 1048576).toFixed(2) + ' MB'; }
    view.innerHTML = '<div class="view-head"><div><h1>' + t('plan.title') + '</h1><p class="muted">' + t('plan.sub') + '</p></div></div>' +
      '<section class="card plan-row">' +
        '<div class="plan-cell"><span class="kicker">' + t('plan.current').toUpperCase() + '</span><h3>' + t('plan.free') + ' <span class="tag">' + t('common.active') + '</span></h3><p class="muted">' + t('plan.free.desc') + '</p></div>' +
        '<div class="plan-cell"><span class="kicker">' + t('plan.products').toUpperCase() + '</span><div class="progress"><div style="width:' + Math.min(100, used / max * 100) + '%"></div></div><b>' + used + ' / ' + max + '</b></div>' +
        '<div class="plan-cell"><span class="kicker">' + t('plan.storage').toUpperCase() + '</span><div class="progress"><div style="width:' + Math.min(100, (storage / 1048576) / maxMb * 100) + '%"></div></div><b>' + mb(storage) + ' / ' + maxMb + ' MB</b></div>' +
      '</section>' +
      '<section class="card"><h3>' + t('plan.pro') + '</h3><p class="muted">' + t('plan.pro.unavailable') + '</p></section>' +
      '<section class="card"><h3>' + t('plan.includes') + '</h3><ul class="mini-list">' +
        ['Hasta ' + max + ' productos', maxMb + ' MB de imágenes', 'Pedidos por WhatsApp', '3 idiomas', 'Reservas y agenda', 'Exportación CSV'].map(function (x) { return '<li><span>' + x + '</span><b>✓</b></li>'; }).join('') + '</ul></section>';
  }

  // ---------------------------------------------------------------------
  // MI CUENTA
  // ---------------------------------------------------------------------
  function renderAccount(view) {
    view.innerHTML = '<div class="view-head"><div><h1>' + t('acc.title') + '</h1></div></div>' +
      card(t('acc.profile'), '', field(t('common.email'), '<input data-email value="' + esc(state.session.user.email) + '">') +
        '<button class="btn ghost small" data-save-email>' + t('common.save') + '</button>') +
      card(t('acc.changepass'), '', field(t('acc.newpass'), '<input type="password" data-pass>') +
        '<button class="btn ghost small" data-save-pass>' + t('common.save') + '</button>' +
        '<button class="btn ghost small" data-reset>' + t('acc.reset') + '</button>') +
      card(t('acc.export'), '', '<button class="btn ghost" data-export>⬇ ' + t('acc.export') + '</button>') +
      card(t('acc.delete'), '<span class="danger-text">' + t('acc.delete.hint') + '</span>',
        field('', '<input data-delword placeholder="ELIMINAR">') + '<button class="btn danger" data-delete>' + t('acc.delete') + '</button>');
    $('[data-save-email]', view).addEventListener('click', function () {
      CW.store.updateEmail($('[data-email]', view).value).then(function () { CW.toast(t('common.save')); });
    });
    $('[data-save-pass]', view).addEventListener('click', function () {
      CW.store.updatePassword($('[data-pass]', view).value).then(function () { CW.toast(t('common.save')); });
    });
    $('[data-reset]', view).addEventListener('click', function () { CW.store.resetPassword(state.session.user.email).then(function () { CW.toast('Enviado'); }); });
    $('[data-export]', view).addEventListener('click', function () {
      CW.store.exportMyData().then(function (data) { CW.api.download('mis-datos.json', JSON.stringify(data, null, 2), 'application/json'); });
    });
    $('[data-delete]', view).addEventListener('click', function () {
      if ($('[data-delword]', view).value.trim().toUpperCase() !== 'ELIMINAR') { CW.toast(t('acc.delete.hint')); return; }
      CW.store.deleteBusiness(state.biz.id).then(function () { location.replace(CW.url('login.html')); });
    });
  }

  // ---------------------------------------------------------------------
  // ADMINISTRACIÓN + COBERTURA
  // ---------------------------------------------------------------------
  function renderAdmin(view) {
    var tabs = ['accounts', 'coverage', 'appearance', 'demo', 'metrics', 'superadmins', 'audit'];
    var TAB_LABEL = { accounts: 'adm.accounts', coverage: 'adm.coverage', appearance: 'adm.appearance', demo: 'adm.demo', metrics: 'adm.metrics', superadmins: 'adm.superadmins', audit: 'adm.audit' };
    view.innerHTML = '<div class="view-head"><div><h1>🛡️ ' + t('adm.title') + '</h1><p class="muted">' + t('adm.sub') + '</p></div></div>' +
      '<div class="segmented tabs" data-atab>' + tabs.map(function (x) {
        return '<button data-at="' + x + '" class="' + (x === 'accounts' ? 'active' : '') + '">' + t(TAB_LABEL[x]) + '</button>';
      }).join('') + '</div><div data-admin-body></div>';
    function draw(tab) {
      var body = $('[data-admin-body]', view);
      if (tab === 'accounts') return adminAccounts(body);
      if (tab === 'coverage') return adminCoverage(body);
      if (tab === 'appearance') return adminAppearance(body);
      if (tab === 'demo') return adminDemo(body);
      if (tab === 'metrics') return adminMetrics(body);
      if (tab === 'superadmins') return adminSuperadmins(body);
      if (tab === 'audit') return adminAudit(body);
    }
    $$('[data-at]', view).forEach(function (b) {
      b.addEventListener('click', function () { $$('[data-at]', view).forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); draw(b.dataset.at); });
    });
    draw('accounts');
  }

  function adminAccounts(body) {
    body.innerHTML = '<p class="muted">' + t('common.loading') + '</p>';
    CW.store.listAllBusinesses().then(function (list) {
      body.innerHTML = '<section class="card"><div class="card-head"><h3>' + t('adm.accounts') + '</h3>' +
        '<input class="search" data-aq placeholder="' + t('common.search') + '…"></div><div data-atbl></div></section>';
      function draw(q) {
        var rows = list.filter(function (b) { return !q || (b.name || '').toLowerCase().includes(q.toLowerCase()) || (b.owner_email || '').toLowerCase().includes(q.toLowerCase()) || (b.slug || '').includes(q); });
        $('[data-atbl]', body).innerHTML = '<div class="table-wrap"><table class="data-table"><thead><tr>' +
          '<th>' + t('common.name') + '</th><th>' + t('adm.owner') + '</th><th>' + t('adm.state') + '</th><th>' + t('home.products') + '</th><th>' + t('home.orders') + '</th><th>' + t('adm.storage') + '</th><th></th></tr></thead><tbody>' +
          rows.map(function (b) {
            return '<tr><td><b>' + esc(b.name) + '</b><br><small class="muted">/' + esc(b.slug) + '</small></td>' +
              '<td>' + esc(b.owner_email || '—') + '</td>' +
              '<td><span class="tag ' + (b.published ? 'ok' : 'warn') + '">' + (b.published ? t('adm.published') : t('adm.hidden')) + '</span></td>' +
              '<td>' + (b._products != null ? b._products : '—') + '</td><td>' + (b._orders != null ? b._orders : '—') + '</td>' +
              '<td>' + (b._storage != null ? (b._storage / 1048576).toFixed(1) + ' MB' : '—') + '</td>' +
              '<td class="row-actions"><button class="btn ghost small" data-detail="' + b.id + '">' + t('adm.detail') + '</button>' +
              '<button class="btn ghost small" data-pub="' + b.id + '">' + (b.published ? t('adm.hide') : t('adm.publish')) + '</button>' +
              '<button class="btn ghost small danger" data-adel="' + b.id + '">' + t('common.delete') + '</button></td></tr>';
          }).join('') + '</tbody></table></div>';
        $$('[data-pub]', body).forEach(function (x) {
          x.addEventListener('click', function () {
            var b = list.find(function (y) { return y.id === x.dataset.pub; });
            CW.store.adminSaveBusiness(b.id, { published: !b.published }).then(function () { b.published = !b.published; draw(q); });
          });
        });
        $$('[data-detail]', body).forEach(function (x) { x.addEventListener('click', function () { adminBusinessDetail(list.find(function (y) { return y.id === x.dataset.detail; })); }); });
        $$('[data-adel]', body).forEach(function (x) {
          x.addEventListener('click', function () { CW.confirm('¿Eliminar este negocio y todos sus datos?', function () { CW.store.adminDeleteBusiness(x.dataset.adel).then(function () { adminAccounts(body); }); }, true); });
        });
      }
      $('[data-aq]', body).addEventListener('input', function (e) { draw(e.target.value); });
      draw('');
    });
  }

  // Detalle de negocio + COBERTURA de usuarios
  function adminBusinessDetail(b) {
    if (!b) return;
    var m = CW.modal({
      title: b.name,
      html:
        '<div class="detail-block"><b>' + t('adm.owner') + '</b><p>' + esc(b.owner_email || '—') + '</p>' +
        '<b>' + t('adm.plan') + '</b><p>' + esc(b.plan || 'free') + ' · ' + (b.max_products || 15) + ' ' + t('home.products').toLowerCase() + ' · ' + (b.max_storage_mb || 100) + ' MB</p></div>' +
        '<div class="field"><span>' + t('adm.plan') + '</span><select data-f="plan"><option value="free"' + (b.plan === 'free' ? ' selected' : '') + '>Free</option><option value="pro"' + (b.plan === 'pro' ? ' selected' : '') + '>Pro</option></select></div>' +
        '<div class="two-col-inline"><label class="field"><span>' + t('adm.limit') + ' ' + t('home.products') + '</span><input type="number" data-f="max_products" value="' + (b.max_products || 15) + '"></label>' +
        '<label class="field"><span>' + t('adm.limit') + ' MB</span><input type="number" data-f="max_storage_mb" value="' + (b.max_storage_mb || 100) + '"></label></div>' +
        '<button class="btn primary small" data-save-biz>' + t('common.save') + '</button>' +
        '<hr><h4>' + t('adm.members') + '</h4>' +
        '<div data-members><p class="muted">' + t('common.loading') + '</p></div>' +
        '<div class="coverage-add"><input data-m-email placeholder="' + t('adm.member.email') + '">' +
        '<select data-m-role><option value="support">' + t('adm.member.support') + '</option><option value="manager">' + t('adm.member.manager') + '</option></select>' +
        '<button class="btn ghost small" data-m-add>+ ' + t('adm.member.add') + '</button></div>' +
        '<div class="coverage-transfer"><input data-t-email placeholder="' + t('adm.member.email') + '"><button class="btn ghost small" data-transfer>' + t('adm.transfer') + '</button></div>'
    });
    function loadMembers() {
      CW.store.listMembers(b.id).then(function (ms) {
        $('[data-members]', m.modal).innerHTML = ms.length ? '<ul class="mini-list">' + ms.map(function (x) {
          return '<li><span>' + esc(x.email) + ' <span class="tag">' + t('adm.member.' + (x.role === 'manager' ? 'manager' : x.role === 'owner' ? 'owner' : 'support')) + '</span></span>' +
            '<button class="icon-btn" data-m-del="' + x.id + '">✕</button></li>';
        }).join('') + '</ul>' : '<p class="muted">' + t('common.none') + '</p>';
        $$('[data-m-del]', m.modal).forEach(function (x) {
          x.addEventListener('click', function () { CW.store.removeMember(x.dataset.mDel).then(loadMembers); });
        });
      });
    }
    loadMembers();
    $('[data-save-biz]', m.modal).addEventListener('click', function () {
      CW.store.adminSaveBusiness(b.id, {
        plan: $('[data-f="plan"]', m.modal).value,
        max_products: Number($('[data-f="max_products"]', m.modal).value || 15),
        max_storage_mb: Number($('[data-f="max_storage_mb"]', m.modal).value || 100)
      }).then(function () { CW.toast(t('common.save')); });
    });
    $('[data-m-add]', m.modal).addEventListener('click', function () {
      var email = $('[data-m-email]', m.modal).value.trim();
      if (!email) return;
      CW.store.addMember(b.id, email, $('[data-m-role]', m.modal).value).then(function () { $('[data-m-email]', m.modal).value = ''; loadMembers(); CW.toast(t('adm.member.add')); });
    });
    $('[data-transfer]', m.modal).addEventListener('click', function () {
      var email = $('[data-t-email]', m.modal).value.trim();
      if (!email) return;
      CW.confirm('¿Transferir la propiedad de ' + b.name + ' a ' + email + '?', function () {
        CW.store.transferOwnership(b.id, email).then(function () { CW.toast(t('common.save')); });
      });
    });
  }

  // Pestaña de cobertura global: todos los negocios y sus colaboradores
  function adminCoverage(body) {
    body.innerHTML = '<p class="muted">' + t('common.loading') + '</p>';
    CW.store.listAllBusinesses().then(function (list) {
      body.innerHTML = '<section class="card"><div class="card-head"><div><h3>' + t('adm.coverage') + '</h3><p class="muted">' + t('adm.member.add') + '</p></div></div>' +
        '<div data-cov></div></section>';
      $('[data-cov]', body).innerHTML = list.map(function (b) {
        return '<div class="cov-row"><div class="cov-biz"><b>' + esc(b.name) + '</b><small class="muted">' + esc(b.owner_email || '') + '</small></div>' +
          '<button class="btn ghost small" data-cov-open="' + b.id + '">' + t('adm.members') + ' ›</button></div>';
      }).join('');
      $$('[data-cov-open]', body).forEach(function (x) {
        x.addEventListener('click', function () { adminBusinessDetail(list.find(function (y) { return y.id === x.dataset.covOpen; })); });
      });
    });
  }

  // Pestaña de apariencia: imágenes de la home
  function adminAppearance(body) {
    body.innerHTML = '<section class="card"><div class="card-head"><div><h3>Imágenes de la home</h3>' +
      '<p class="muted">Sube o cambia las imágenes de cada sección de la página de inicio. Se aplican al guardar.</p></div>' +
      '<button class="btn primary small" data-hi-save>Guardar</button></div>' +
      '<div class="home-img-grid" data-hi-grid><p class="muted">' + t('common.loading') + '</p></div></section>';

    CW.store.getSiteSettings().then(function (s) {
      body._imgs = Object.assign({}, (s && s.home_images) || {});
      drawGrid();
    });

    function drawGrid() {
      var imgs = body._imgs;
      $('[data-hi-grid]', body).innerHTML = HOME_IMAGES.map(function (slot) {
        var url = imgs[slot.key] || '';
        return '<div class="hi-item"><div class="hi-thumb ' + (url ? 'has' : '') + '" data-hi-pick="' + slot.key + '">' +
          (url ? '<img src="' + esc(url) + '">' : '<span>+</span>') + '</div>' +
          '<small>' + esc(slot.label) + '</small>' +
          (url ? '<button class="btn ghost small danger" data-hi-del="' + slot.key + '">Quitar</button>' : '') +
          '</div>';
      }).join('');
      $$('[data-hi-pick]', body).forEach(function (el) {
        el.addEventListener('click', function () {
          openImagePicker(1, function (u) {
            if (!u[0]) return;
            body._imgs[el.dataset.hiPick] = u[0];
            drawGrid();
          });
        });
      });
      $$('[data-hi-del]', body).forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          delete body._imgs[b.dataset.hiDel];
          drawGrid();
        });
      });
    }

    $('[data-hi-save]', body).addEventListener('click', function () {
      CW.store.saveSiteSettings('home_images', body._imgs).then(function () {
        CW.toast(t('common.save'));
      }).catch(function () { CW.toast('No se pudo guardar (¿ejecutaste actualizacion.sql?)'); });
    });
  }

  // ---------------------------------------------------------------------
  // ADMINISTRACIÓN · Contenido de la página de demostración
  // ---------------------------------------------------------------------
  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function setPath(obj, path, value) {
    var parts = path.split('.');
    var last = parts.pop();
    var target = parts.reduce(function (o, k) {
      if (o[k] == null || typeof o[k] !== 'object') o[k] = /^\d+$/.test(k) ? [] : {};
      return o[k];
    }, obj);
    target[last] = value;
  }

  function adminDemo(body) {
    body.innerHTML = '<section class="card"><div class="card-head"><div><h3>' + t('demo.title') + '</h3>' +
      '<p class="muted">' + t('demo.hint') + '</p></div>' +
      '<div class="head-actions"><a class="btn ghost small" href="' + esc(CW.url('catalogo.html') + '?b=demo') + '" target="_blank" rel="noopener">' + t('demo.view') + ' ↗</a>' +
      '<button class="btn soft small" data-demo-ai>✨ ' + t('demo.ai') + '</button>' +
      '<button class="btn ghost small" data-demo-reset>' + t('demo.reset') + '</button>' +
      '<button class="btn primary small" data-demo-save>' + t('common.save') + '</button></div></div>' +
      '<p class="tr-status" data-demo-ai-status role="status" aria-live="polite" hidden></p>' +
      '<div data-demo-body><p class="muted">' + t('common.loading') + '</p></div></section>';

    CW.store.getSiteSettings().then(function (s) {
      body._demo = CW.demoCatalogMerged(s && s.demo_catalog);
      draw();
    });

    function inp(path, label, opts) {
      opts = opts || {};
      var v = getPath(body._demo, path);
      var ctrl;
      if (opts.type === 'area') {
        ctrl = '<textarea rows="' + (opts.rows || 2) + '" data-d="' + path + '">' + esc(v || '') + '</textarea>';
      } else if (opts.type === 'select') {
        ctrl = '<select data-d="' + path + '">' + opts.options.map(function (o) {
          return '<option value="' + esc(o.v) + '"' + (String(o.v) === String(v) ? ' selected' : '') + '>' + esc(o.label) + '</option>';
        }).join('') + '</select>';
      } else if (opts.type === 'color') {
        ctrl = '<input type="color" data-d="' + path + '" value="' + esc(v || '#5B1A80') + '">';
      } else {
        ctrl = '<input type="' + (opts.type || 'text') + '" data-d="' + path + '" value="' + esc(v == null ? '' : v) + '">';
      }
      return '<label class="field' + (opts.wide ? ' wide' : '') + '"><span>' + label + '</span>' + ctrl + '</label>';
    }

    // Dos campos (FR / AR) para un campo traducible de la demo.
    function dtr(base, field, label) {
      return '<div class="demo-tr"><span>' + esc(label) + '</span>' +
        ['fr', 'ar'].map(function (L) {
          var v = getPath(body._demo, base + '.i18n.' + L + '.' + field) || '';
          return '<input data-d="' + base + '.i18n.' + L + '.' + field + '" value="' + esc(v) + '" placeholder="' + L.toUpperCase() + '" dir="' + (L === 'ar' ? 'rtl' : 'ltr') + '">';
        }).join('') + '</div>';
    }

    function draw() {
      var d = body._demo;
      var cats = d.cats || [], items = d.products || [], works = d.portfolio || [];

      $('[data-demo-body]', body).innerHTML =
        '<h4 class="demo-h">' + t('demo.business') + '</h4>' +
        '<div class="demo-grid">' +
          inp('biz.name', t('login.business')) +
          inp('biz.whatsapp', t('common.phone')) +
          inp('biz.currency', t('set.currency')) +
          inp('biz.brand_color', t('set.brand'), { type: 'color' }) +
          inp('biz.hero_title', t('set.presentation')) +
          inp('biz.delivery_time', t('cat.public.delivery')) +
        '</div>' +
        inp('biz.description', t('prod.desc'), { type: 'area', rows: 2 }) +
        inp('biz.hero_desc', t('set.presentation') + ' · ' + t('prod.desc'), { type: 'area', rows: 2 }) +
        dtr('biz', 'name', t('common.name')) +
        dtr('biz', 'description', t('prod.desc')) +
        '<div class="demo-grid">' +
          inp('biz.delivery_fee', t('cat.public.fee'), { type: 'number' }) +
          inp('biz.open_time', t('cat.public.date'), { type: 'time' }) +
          inp('biz.close_time', t('cat.public.time'), { type: 'time' }) +
          inp('biz.slot_minutes', t('cat.public.appt'), { type: 'number' }) +
        '</div>' +

        '<h4 class="demo-h">' + t('demo.cats') + ' <button class="btn ghost small" data-add="cats">+ ' + t('common.add') + '</button></h4>' +
        '<div class="demo-rows">' + (cats.map(function (c, i) {
          return '<div class="demo-row">' +
            '<input data-d="cats.' + i + '.name" value="' + esc(c.name) + '" placeholder="' + t('common.name') + '">' +
            '<select data-d="cats.' + i + '.kind">' +
              '<option value="product"' + (c.kind !== 'service' ? ' selected' : '') + '>📦 ' + t('prod.type.product') + '</option>' +
              '<option value="service"' + (c.kind === 'service' ? ' selected' : '') + '>🔧 ' + t('prod.type.service') + '</option>' +
            '</select>' +
            '<button class="icon-btn" data-del="cats.' + i + '" aria-label="' + t('common.delete') + '">✕</button>' +
            '</div>' + dtr('cats.' + i, 'name', t('common.name'));
        }).join('') || '<p class="muted">—</p>') + '</div>' +

        '<h4 class="demo-h">' + t('demo.items') + ' <button class="btn ghost small" data-add="products">+ ' + t('common.add') + '</button></h4>' +
        '<div class="demo-rows">' + (items.map(function (p, i) {
          var img = (p.images && p.images[0]) || '';
          return '<div class="demo-item">' +
            '<div class="demo-thumb' + (img ? ' has' : '') + '" data-demo-img="products.' + i + '.images.0">' +
              (img ? '<img src="' + esc(img) + '" alt="">' : '<span>+</span>') + '</div>' +
            '<div class="demo-item-body">' +
              '<div class="demo-grid tight">' +
                inp('products.' + i + '.name', t('common.name')) +
                inp('products.' + i + '.price', t('common.price'), { type: 'number' }) +
                inp('products.' + i + '.promo_price', t('prod.promo'), { type: 'number' }) +
                '<label class="field"><span>' + t('common.category') + '</span><select data-d="products.' + i + '.category_id">' +
                  cats.map(function (c) { return '<option value="' + esc(c.id) + '"' + (c.id === p.category_id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') +
                '</select></label>' +
                '<label class="field"><span>' + t('prod.type') + '</span><select data-d="products.' + i + '.kind">' +
                  '<option value="product"' + (p.kind !== 'service' ? ' selected' : '') + '>📦 ' + t('prod.type.product') + '</option>' +
                  '<option value="service"' + (p.kind === 'service' ? ' selected' : '') + '>🔧 ' + t('prod.type.service') + '</option>' +
                '</select></label>' +
              '</div>' +
              inp('products.' + i + '.short_desc', t('prod.shortdesc')) +
              inp('products.' + i + '.description', t('prod.desc'), { type: 'area', rows: 2 }) +
              dtr('products.' + i, 'name', t('common.name')) +
              dtr('products.' + i, 'short_desc', t('prod.shortdesc')) +
            '</div>' +
            '<button class="icon-btn" data-del="products.' + i + '" aria-label="' + t('common.delete') + '">✕</button>' +
          '</div>';
        }).join('') || '<p class="muted">—</p>') + '</div>' +

        '<h4 class="demo-h">' + t('demo.portfolio') + ' <button class="btn ghost small" data-add="portfolio">+ ' + t('common.add') + '</button></h4>' +
        '<div class="demo-rows">' + (works.map(function (it, i) {
          var img = it.image_url || '';
          return '<div class="demo-item">' +
            '<div class="demo-thumb' + (img ? ' has' : '') + '" data-demo-img="portfolio.' + i + '.image_url">' +
              (img ? '<img src="' + esc(img) + '" alt="">' : '<span>+</span>') + '</div>' +
            '<div class="demo-item-body">' +
              inp('portfolio.' + i + '.title', t('common.name')) +
              inp('portfolio.' + i + '.description', t('port.desc'), { type: 'area', rows: 2 }) +
              dtr('portfolio.' + i, 'title', t('common.name')) +
              dtr('portfolio.' + i, 'description', t('port.desc')) +
            '</div>' +
            '<button class="icon-btn" data-del="portfolio.' + i + '" aria-label="' + t('common.delete') + '">✕</button>' +
          '</div>';
        }).join('') || '<p class="muted">—</p>') + '</div>' +

        '<p class="muted demo-note">' + t('demo.note') + '</p>';

      bind();
    }

    function bind() {
      // Escritura en cualquier campo
      $$('[data-d]', body).forEach(function (el) {
        var ev = el.tagName === 'SELECT' || el.type === 'color' ? 'change' : 'input';
        el.addEventListener(ev, function () {
          var v = el.type === 'number' ? Number(el.value || 0) : el.value;
          setPath(body._demo, el.dataset.d, v);
        });
      });
      // Imágenes: elegir de la biblioteca
      $$('[data-demo-img]', body).forEach(function (el) {
        el.addEventListener('click', function () {
          openImagePicker(1, function (urls) {
            if (!urls[0]) return;
            var path = el.dataset.demoImg;
            if (/\.images\.0$/.test(path)) {
              var base = path.replace(/\.images\.0$/, '');
              setPath(body._demo, base + '.images', [urls[0]]);
            } else {
              setPath(body._demo, path, urls[0]);
            }
            draw();
          });
        });
      });
      $$('[data-add]', body).forEach(function (b) {
        b.addEventListener('click', function () {
          var what = b.dataset.add;
          var list = body._demo[what];
          if (what === 'cats') list.push({ id: 'c' + Date.now(), name: 'Nueva categoría', slug: 'nueva', kind: 'product', sort_order: list.length + 1, active: true });
          if (what === 'products') list.push({ id: 'p' + Date.now(), category_id: (list[0] && list[0].category_id) || (body._demo.cats[0] || {}).id || '', name: 'Nuevo artículo', description: '', short_desc: '', price: 0, images: [], kind: 'product', active: true, sort_order: list.length + 1 });
          if (what === 'portfolio') list.push({ id: 'w' + Date.now(), title: 'Nuevo trabajo', description: '', details: '', image_url: '', sort_order: list.length + 1, active: true });
          draw();
        });
      });
      $$('[data-del]', body).forEach(function (b) {
        b.addEventListener('click', function () {
          var parts = b.dataset.del.split('.');
          var idx = Number(parts[1]);
          body._demo[parts[0]].splice(idx, 1);
          draw();
        });
      });
    }

    // Quita traducciones vacías antes de guardar para no ensuciar el JSON.
    function pruneI18n(node) {
      if (!node || typeof node !== 'object') return;
      Object.keys(node).forEach(function (k) {
        var v = node[k];
        if (k === 'i18n' && v && typeof v === 'object') {
          Object.keys(v).forEach(function (L) {
            if (!v[L] || typeof v[L] !== 'object') { delete v[L]; return; }
            Object.keys(v[L]).forEach(function (f) {
              if (!String(v[L][f] == null ? '' : v[L][f]).trim()) delete v[L][f];
            });
            if (!Object.keys(v[L]).length) delete v[L];
          });
          if (!Object.keys(v).length) delete node.i18n;
        } else if (Array.isArray(v)) { v.forEach(pruneI18n); }
        else if (v && typeof v === 'object') pruneI18n(v);
      });
    }

    $('[data-demo-save]', body).addEventListener('click', function () {
      var btn = $('[data-demo-save]', body);
      btn.disabled = true;
      pruneI18n(body._demo);
      CW.store.saveSiteSettings('demo_catalog', body._demo).then(function () {
        btn.disabled = false;
        CW.toast(t('common.save'), 'ok');
      }).catch(function (err) {
        btn.disabled = false;
        console.warn('[CW] No se pudo guardar la demo:', err);
        CW.toast(t('set.save.error'), 'error');
      });
    });

    $('[data-demo-ai]', body).addEventListener('click', function () {
      var btn = $('[data-demo-ai]', body);
      var note = $('[data-demo-ai-status]', body);
      if (btn.dataset.busy === '1') return;               // ya está traduciendo
      if (navigator.onLine === false) { CW.toast(t('tr.ai.offline'), 'error'); return; }

      var d = body._demo;

      // Todo el texto base que se puede traducir, con su ruta exacta.
      var list = [];
      function add(base, field, text) {
        var v = String(text == null ? '' : text).trim();
        if (!v) return;
        ['fr', 'ar'].forEach(function (L) { list.push({ base: base, field: field, lang: L, text: v }); });
      }
      add('biz', 'name', d.biz.name);
      add('biz', 'description', d.biz.description);
      add('biz', 'hero_title', d.biz.hero_title);
      add('biz', 'hero_desc', d.biz.hero_desc);
      (d.cats || []).forEach(function (c, i) { add('cats.' + i, 'name', c.name); });
      (d.products || []).forEach(function (p, i) {
        add('products.' + i, 'name', p.name);
        add('products.' + i, 'short_desc', p.short_desc);
        add('products.' + i, 'description', p.description);
      });
      (d.portfolio || []).forEach(function (w, i) {
        add('portfolio.' + i, 'title', w.title);
        add('portfolio.' + i, 'description', w.description);
      });

      if (!list.length) { CW.toast(t('tr.ai.empty'), 'warn'); return; }

      var total = list.length, i = 0, filled = 0, failed = 0;
      btn.dataset.busy = '1';
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      btn.innerHTML = '⏳ 0/' + total;

      function status(txt, isError) {
        if (!note) return;
        note.hidden = !txt;
        note.textContent = txt || '';
        note.classList.toggle('error', !!isError);
      }
      status(t('tr.ai.progress', { done: 0, total: total }));

      var guard = setTimeout(function () {
        if (btn.dataset.busy !== '1') return;
        finish(true);
      }, (Number(CW.config.translateTimeout || 12000) + 5000) * Math.max(1, list.length / 2));

      function finish(aborted) {
        clearTimeout(guard);
        btn.dataset.busy = '';
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        btn.innerHTML = '✨ ' + t('demo.ai');
        draw();
        if (aborted) {
          status(t('tr.ai.error'), true);
          CW.toast(t('tr.ai.error'), 'error');
          return;
        }
        if (!filled) {
          status(t('tr.ai.error'), true);
          CW.toast(t('tr.ai.error'), 'error');
          return;
        }
        if (failed) {
          status(t('tr.ai.partial', { n: filled, failed: failed }), true);
          CW.toast(t('tr.ai.partial', { n: filled, failed: failed }), 'warn');
          return;
        }
        status('');
        CW.toast(t('tr.ai.done', { n: filled }), 'ok');
      }

      (function next() {
        if (i >= list.length) return finish(false);
        var job = list[i++];
        var path = job.base + '.i18n.' + job.lang + '.' + job.field;
        if (String(getPath(body._demo, path) || '').trim()) {   // no pisa lo escrito
          btn.innerHTML = '⏳ ' + i + '/' + total;
          status(t('tr.ai.progress', { done: i, total: total }));
          return next();
        }
        CW.translate.text(job.text, job.lang, CW.config.defaultLang || 'es').then(function (out) {
          if (out) { setPath(body._demo, path, out); filled++; } else failed++;
          btn.innerHTML = '⏳ ' + i + '/' + total;
          status(t('tr.ai.progress', { done: i, total: total }));
          next();
        }).catch(function () {
          failed++;
          btn.innerHTML = '⏳ ' + i + '/' + total;
          status(t('tr.ai.progress', { done: i, total: total }));
          next();
        });
      })();
    });

    $('[data-demo-reset]', body).addEventListener('click', function () {
      CW.confirm(t('demo.reset.confirm'), function () {
        CW.store.saveSiteSettings('demo_catalog', {}).then(function () {
          body._demo = CW.demoCatalogMerged({});
          draw();
          CW.toast(t('demo.reset.ok'), 'ok');
        });
      }, true);
    });
  }

  function adminMetrics(body) {
    CW.store.listAllBusinesses().then(function (list) {
      var byMonth = {};
      list.forEach(function (b) { var m = (b.created_at || '').slice(0, 7); if (m) byMonth[m] = (byMonth[m] || 0) + 1; });
      var months = Object.keys(byMonth).sort();
      var maxM = Math.max.apply(null, months.map(function (m) { return byMonth[m]; }).concat([1]));
      body.innerHTML = '<div class="two-col">' +
        '<section class="card"><h3>' + t('adm.metrics.signups') + '</h3>' +
          (months.length ? '<div class="bars">' + months.map(function (m) {
            return '<div class="bar-col"><div class="bar" style="height:' + (byMonth[m] / maxM * 100) + '%"></div><small>' + m.slice(5) + '</small></div>';
          }).join('') + '</div>' : '<p class="muted">—</p>') + '</section>' +
        '<section class="card"><h3>' + t('adm.metrics.ranking') + '</h3>' +
          '<ul class="mini-list">' + list.slice().sort(function (a, b) { return (b._orders || 0) - (a._orders || 0); }).slice(0, 10).map(function (b) {
            return '<li><span>' + esc(b.name) + '</span><b>' + (b._orders || 0) + '</b></li>';
          }).join('') + '</ul></section></div>' +
        '<section class="card"><h3>' + t('adm.metrics.topviews') + '</h3><div data-topviews><p class="muted">' + t('common.loading') + '</p></div></section>';
      CW.store.topViewed(10).then(function (ps) {
        var host = $('[data-topviews]', body); if (!host) return;
        host.innerHTML = ps.length ? '<ul class="mini-list">' + ps.map(function (p) {
          return '<li><span>' + esc(p.name) + '</span><b>👁 ' + (p.views || 0) + '</b></li>';
        }).join('') + '</ul>' : '<p class="muted">—</p>';
      });
    });
  }

  function adminSuperadmins(body) {
    body.innerHTML = '<section class="card"><div class="card-head"><h3>' + t('adm.superadmins') + '</h3></div>' +
      '<div data-adm-list></div><div class="coverage-add"><input data-adm-email placeholder="' + t('common.email') + '">' +
      '<button class="btn ghost small" data-adm-add>+ ' + t('adm.addadmin') + '</button></div></section>';
    function load() {
      CW.store.listAdmins().then(function (list) {
        $('[data-adm-list]', body).innerHTML = list.length ? '<ul class="mini-list">' + list.map(function (a) {
          return '<li><span>' + esc(a.email || a.user_id) + '</span>' + (a.user_id ? '<button class="icon-btn" data-adm-del="' + a.user_id + '">✕</button>' : '') + '</li>';
        }).join('') + '</ul>' : '<p class="muted">' + t('common.none') + '</p>';
        $$('[data-adm-del]', body).forEach(function (x) { x.addEventListener('click', function () { CW.store.removeAdmin(x.dataset.admDel).then(load); }); });
      });
    }
    load();
    $('[data-adm-add]', body).addEventListener('click', function () {
      var e = $('[data-adm-email]', body).value.trim(); if (!e) return;
      CW.store.addAdmin(e).then(function () { $('[data-adm-email]', body).value = ''; load(); CW.toast(t('adm.addadmin')); });
    });
  }

  function adminAudit(body) {
    CW.store.listAudit().then(function (list) {
      body.innerHTML = '<section class="card"><h3>' + t('adm.audit') + '</h3>' +
        (list.length ? '<ul class="mini-list">' + list.map(function (a) {
          return '<li><span>' + esc(a.action) + ' · <small class="muted">' + esc(a.target || '') + '</small></span><small class="muted">' + CW.api.dateTime(a.created_at) + '</small></li>';
        }).join('') + '</ul>' : '<p class="muted">' + t('common.none') + '</p>') + '</section>';
    });
  }

  // ---------------------------------------------------------------------
  // ASISTENTE DE CONFIGURACIÓN (5 pasos)
  // ---------------------------------------------------------------------
  function showOnboarding() {
    var onb = $('[data-onboarding]'); onb.hidden = false;
    $('[data-app]').classList.add('blurred');
    var b = state.biz, step = 0, total = 5;
    var draft = { name: b.name, description: b.description || '', country: b.country || 'MA', currency: b.currency || 'MAD', whatsapp: b.whatsapp || '', brand_color: b.brand_color || '#5B1A80', logo_url: b.logo_url || '', slug: b.slug || '', delivery: b.delivery || 'whatsapp', delivery_fee: b.delivery_fee || 0, delivery_time: b.delivery_time || '', payments: b.payments || [] };

    function drawProgress() {
      $('[data-onb-progress]').innerHTML = Array.from({ length: total }).map(function (_, i) {
        return '<span class="' + (i <= step ? 'on' : '') + '"></span>';
      }).join('');
    }
    function draw() {
      drawProgress();
      var body = $('[data-onb-body]');
      if (step === 0) body.innerHTML = onbHead('onb.business') +
        field(t('login.business'), '<input data-o="name" value="' + esc(draft.name) + '">') +
        field(t('prod.desc'), '<textarea data-o="description" rows="3">' + esc(draft.description) + '</textarea>') +
        '<div class="two-col-inline">' + field('País', '<select data-o="country">' + CW.api.countryOptions(draft.country) + '</select>') +
        field(t('set.currency'), '<select data-o="currency">' + CW.api.currencyList.map(function (c) { return '<option value="' + c.code + '"' + (c.code === draft.currency ? ' selected' : '') + '>' + c.label + '</option>'; }).join('') + '</select>') + '</div>';
      else if (step === 1) body.innerHTML = onbHead('onb.whatsapp') +
        field('País o región', '<select data-o="wcountry">' + CW.api.countryOptions(draft.country) + '</select>') +
        field(t('common.phone'), '<input data-o="wphone" value="' + esc(stripCountry(draft.country, draft.whatsapp)) + '" placeholder="987 654 321">') +
        '<div class="wa-preview">💬 ' + esc(draft.whatsapp || '—') + '</div>';
      else if (step === 2) body.innerHTML = onbHead('onb.brand') +
        '<div class="logo-preview" data-o-logo>' + (draft.logo_url ? '<img src="' + esc(draft.logo_url) + '">' : '<span>' + esc((draft.name || 'M').charAt(0)) + '</span>') + '</div>' +
        '<label class="btn ghost small">' + t('common.add') + ' logo<input type="file" accept="image/*" data-o-logo-file hidden></label>' +
        field('Color', '<div class="color-row"><input type="color" data-o="brand_color" value="' + esc(draft.brand_color) + '"><input data-o="brand_hex" value="' + esc(draft.brand_color) + '"></div>');
      else if (step === 3) body.innerHTML = onbHead('onb.link') +
        field(t('cat.slug'), '<div class="slug-row"><span>https://</span><input data-o="slug" value="' + esc(draft.slug) + '"><span>.' + esc(CW.publicHost) + '</span></div><small class="muted" data-o-slug></small>');
      else if (step === 4) body.innerHTML = onbHead('onb.delivery') +
        '<label class="radio"><input type="radio" name="odv" value="whatsapp"' + (draft.delivery !== 'custom' ? ' checked' : '') + '> ' + t('set.whatsapp') + '</label>' +
        '<label class="radio"><input type="radio" name="odv" value="custom"' + (draft.delivery === 'custom' ? ' checked' : '') + '> ' + t('set.delivery') + '</label>' +
        field('Tarifa (' + draft.currency + ')', '<input type="number" data-o="delivery_fee" value="' + draft.delivery_fee + '">') +
        field('Plazo', '<input data-o="delivery_time" value="' + esc(draft.delivery_time) + '">') +
        '<div class="chips" data-o-pays>' + ['Efectivo', 'Transferencia bancaria', 'Tarjeta', 'Pago al recibir'].map(function (p) {
          return '<button type="button" class="chip' + (draft.payments.indexOf(p) >= 0 ? ' active' : '') + '" data-op="' + esc(p) + '">' + p + '</button>';
        }).join('') + '</div>';
      else body.innerHTML = '<div class="onb-done"><div class="done-icon">🎉</div><h2>' + t('onb.done') + '</h2><p>' + t('onb.done.sub') + '</p>' +
        '<div class="url-line">' + esc(CW.catalogUrl(draft.slug)) + '</div>' +
        '<div class="onb-done-actions"><a class="btn primary" href="' + CW.url('dashboard.html') + '">' + t('onb.gotodash') + '</a>' +
        '<a class="btn ghost" target="_blank" href="' + CW.url('catalogo.html') + '?b=' + encodeURIComponent(draft.slug) + '">' + t('onb.viewcatalog') + '</a></div></div>';

      $('[data-onb-back]').style.visibility = step === 0 ? 'hidden' : 'visible';
      $('[data-onb-next]').textContent = step === total - 1 ? t('common.finish') : t('common.next');
      bindStep();
      CW.i18n.apply(body);
    }
    function onbHead(key) {
      return '<span class="kicker">' + t('onb.step') + ' ' + (step + 1) + ' ' + t('onb.of') + ' ' + total + '</span><h2>' + t(key) + '</h2>';
    }
    function collect() {
      function o(f) { var el = $('[data-o="' + f + '"]'); return el ? el.value : undefined; }
      if (o('name') !== undefined) draft.name = o('name');
      if (o('description') !== undefined) draft.description = o('description');
      if (o('country') !== undefined) draft.country = o('country');
      if (o('currency') !== undefined) draft.currency = o('currency');
      if (o('wphone') !== undefined) { var wc = o('wcountry') || draft.country; draft.whatsapp = CW.api.normalizePhone(wc, o('wphone')); draft.country = wc; }
      if (o('brand_hex') !== undefined) draft.brand_color = o('brand_hex');
      if (o('slug') !== undefined) draft.slug = CW.store.slugify(o('slug'));
      if (o('delivery_fee') !== undefined) draft.delivery_fee = Number(o('delivery_fee') || 0);
      if (o('delivery_time') !== undefined) draft.delivery_time = o('delivery_time');
      var dv = $('input[name=odv]:checked'); if (dv) draft.delivery = dv.value;
    }
    function bindStep() {
      var body = $('[data-onb-body]');
      if (step === 2) {
        var cc = $('[data-o="brand_color"]', body); if (cc) cc.addEventListener('input', function (e) { $('[data-o="brand_hex"]', body).value = e.target.value; });
        var lf = $('[data-o-logo-file]', body);
        if (lf) lf.addEventListener('change', function (e) {
          CW.store.uploadImage(b.id, e.target.files[0]).then(function (item) {
            draft.logo_url = item.url; $('[data-o-logo]', body).innerHTML = '<img src="' + esc(item.url) + '">';
          });
        });
      }
      if (step === 3) {
        var sl = $('[data-o="slug"]', body);
        sl.addEventListener('input', function () {
          var s = CW.store.slugify(sl.value); if (!s) return;
          CW.store.slugAvailable(s).then(function (ok) { $('[data-o-slug]', body).textContent = ok ? '✓ ' + t('onb.available') : '✗ ' + t('onb.taken'); });
        });
        CW.store.slugAvailable(CW.store.slugify(sl.value || draft.slug)).then(function (ok) { $('[data-o-slug]', body).textContent = ok ? '✓ ' + t('onb.available') : '✗ ' + t('onb.taken'); });
      }
      if (step === 4) {
        $$('[data-op]', body).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var p = btn.dataset.op, i = draft.payments.indexOf(p);
            if (i >= 0) { draft.payments.splice(i, 1); btn.classList.remove('active'); }
            else { draft.payments.push(p); btn.classList.add('active'); }
          });
        });
      }
    }
    $('[data-onb-back]').addEventListener('click', function () { if (step > 0) { collect(); step--; draw(); } });
    $('[data-onb-next]').addEventListener('click', function () {
      collect();
      if (step < total - 1) { step++; draw(); return; }
      // Guardar todo y terminar
      CW.store.saveBusiness(b.id, {
        name: draft.name, description: draft.description, country: draft.country, currency: draft.currency,
        whatsapp: draft.whatsapp, brand_color: draft.brand_color, logo_url: draft.logo_url, slug: draft.slug,
        delivery: draft.delivery, delivery_fee: draft.delivery_fee, delivery_time: draft.delivery_time,
        payments: draft.payments, onboarded: true, published: !!(draft.slug && draft.whatsapp)
      }).then(function (nb) {
        state.biz = nb || Object.assign({}, b, draft, { onboarded: true });
        onb.hidden = true;
        $('[data-app]').classList.remove('blurred');
        location.hash = '#home';
        renderBizChip(); loadAll().then(route);
      });
    });
    draw();
  }

  // ---------------------------------------------------------------------
  // Sidebar móvil
  // ---------------------------------------------------------------------
  function closeSidebar() {
    document.body.classList.remove('sidebar-open');
    var bd = document.querySelector('[data-sidebar-backdrop]');
    if (bd) bd.hidden = true;
  }
  document.addEventListener('DOMContentLoaded', function () {
    var open = $('[data-sidebar-open]'), close = $('[data-sidebar-close]');
    var bd = $('[data-sidebar-backdrop]');
    if (open) open.addEventListener('click', function () {
      document.body.classList.add('sidebar-open');
      if (bd) bd.hidden = false;
    });
    if (close) close.addEventListener('click', closeSidebar);
    if (bd) bd.addEventListener('click', closeSidebar);
    var lo = $('[data-logout]');
    if (lo) lo.addEventListener('click', function (e) { e.preventDefault(); CW.store.signOut().then(function () { location.replace(CW.url('login.html')); }); });
    window.addEventListener('cw:lang', function () { if (state.biz) route(); });
    boot();
  });
})(window, document);
