/* ==========================================================================
   WA Professionnels Maroc · store.js
   Capa de datos única. Usa Supabase si está configurado; si no, MODO DEMO
   con localStorage. Todas las funciones devuelven Promises.
   API pública: window.CW.store
   ========================================================================== */
(function (window) {
  'use strict';

  var CW = (window.CW = window.CW || {});
  var cfg = CW.config;

  // ---------------------------------------------------------------------
  // Utilidades internas
  // ---------------------------------------------------------------------
  function uid() {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }
  function code() {
    var s = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', out = 'CW-';
    for (var i = 0; i < 5; i++) out += s[Math.floor(Math.random() * s.length)];
    return out;
  }
  function slugify(t) {
    return String(t || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '').slice(0, 60);
  }
  function nowIso() { return new Date().toISOString(); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // --- Guardado tolerante a esquemas incompletos -----------------------
  // Cuando una columna no existe en Postgres, PostgREST rechaza TODA la
  // actualización (42703 / PGRST204). Igual que en productos y categorías,
  // aquí se detecta la columna que falta, se descarta, se reintenta y se
  // informa de lo que no se pudo guardar, en lugar de fallar en silencio.
  var lastDropped = [];

  function cleanPatch(patch) {
    var out = {};
    Object.keys(patch || {}).forEach(function (k) {
      var v = patch[k];
      if (v === undefined) return;
      if (typeof v === 'string') v = v.trim();
      out[k] = v;
    });
    return out;
  }

  function missingColumn(err) {
    if (!err) return null;
    var code = String(err.code || '');
    var msg = String(err.message || '') + ' ' + String(err.details || '');
    var known = code === '42703' || code === 'PGRST204' || /column .*does not exist/i.test(msg) || /Could not find the '.*' column/i.test(msg);
    if (!known) return null;
    var m = msg.match(/Could not find the '([a-zA-Z0-9_]+)' column/) || msg.match(/column "?([a-zA-Z0-9_]+)"? .*does not exist/i) || msg.match(/column "?([a-zA-Z0-9_]+)"?/i);
    return m ? m[1] : null;
  }

  // Reintenta una operación descartando las columnas que el servidor no
  // conoce (esquema sin actualizar). Así se puede guardar igualmente en lugar
  // de fallar con «No se pudo guardar».
  function tolerant(run, payload, dropped, depth) {
    dropped = dropped || [];
    depth = depth || 0;
    return run(payload).then(function (r) {
      if (r.error) {
        var col = missingColumn(r.error);
        if (col && Object.prototype.hasOwnProperty.call(payload, col) && depth < 12) {
          var rest = Object.assign({}, payload);
          delete rest[col];
          return tolerant(run, rest, dropped.concat(col), depth + 1);
        }
        throw r.error;
      }
      if (dropped.length) lastDropped = dropped;
      return r.data;
    });
  }

  function updateRow(table, id, patch) {
    patch = cleanPatch(patch);
    return tolerant(function (next) {
      return sb.from(table).update(next).eq('id', id).select().maybeSingle();
    }, patch, []);
  }

  function insertRow(table, row) {
    row = cleanPatch(row);
    return tolerant(function (next) {
      return sb.from(table).insert(next).select().maybeSingle();
    }, row, []);
  }

  // Almacén demo en localStorage
  var LS = {
    read: function (k, def) {
      try { var v = localStorage.getItem('cw_' + k); return v ? JSON.parse(v) : (def === undefined ? null : def); }
      catch (e) { return def === undefined ? null : def; }
    },
    write: function (k, v) { try { localStorage.setItem('cw_' + k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem('cw_' + k); } catch (e) {} }
  };

  // ---------------------------------------------------------------------
  // Cliente Supabase (carga diferida por CDN)
  // ---------------------------------------------------------------------
  var sb = null;

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = res; s.onerror = function () { rej(new Error('No se pudo cargar ' + src)); };
      document.head.appendChild(s);
    });
  }

  function demoSeed() {
    if (!LS.read('users')) LS.write('users', []);
    if (!LS.read('sessions')) LS.write('sessions', []);
    if (!LS.read('businesses')) LS.write('businesses', []);
    if (!LS.read('categories')) LS.write('categories', []);
    if (!LS.read('products')) LS.write('products', []);
    if (!LS.read('orders')) LS.write('orders', []);
    if (!LS.read('library')) LS.write('library', []);
    if (!LS.read('portfolio')) LS.write('portfolio', []);
    if (!LS.read('admins')) LS.write('admins', []);
    if (!LS.read('members')) LS.write('members', []);
    if (!LS.read('audit')) LS.write('audit', []);
  }

  // ---------------------------------------------------------------------
  // Autenticación
  // ---------------------------------------------------------------------
  var authListeners = [];

  function emitAuth() {
    store.getSession().then(function (sess) {
      authListeners.forEach(function (cb) { try { cb(sess); } catch (e) {} });
    });
  }

  var store = {
    slugify: slugify,
    uid: uid,
    newOrderCode: code,

    // ---- Inicialización -------------------------------------------------
    init: function () {
      if (store._initPromise) return store._initPromise;
      if (CW.isDemo) {
        demoSeed();
        store._initPromise = Promise.resolve({ demo: true });
      } else {
        store._initPromise = loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js')
          .then(function () {
            sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
            return { demo: false };
          });
      }
      return store._initPromise;
    },

    isDemo: function () { return CW.isDemo; },

    onAuth: function (cb) { authListeners.push(cb); return function () { authListeners = authListeners.filter(function (x) { return x !== cb; }); }; },

    // ---- Sesión ---------------------------------------------------------
    getSession: function () {
      if (CW.isDemo) {
        var sid = LS.read('session');
        if (!sid) return Promise.resolve(null);
        var users = LS.read('users', []);
        var u = users.find(function (x) { return x.id === sid; });
        if (!u) return Promise.resolve(null);
        var biz = (LS.read('businesses', []).find(function (b) { return b.owner_id === u.id; })) || null;
        return Promise.resolve({ user: { id: u.id, email: u.email }, business: biz, demo: true });
      }
      return sb.auth.getUser().then(function (r) {
        var u = r && r.data && r.data.user;
        if (!u) return null;
        return store.getMyBusiness().then(function (b) {
          return { user: { id: u.id, email: u.email }, business: b, demo: false };
        });
      });
    },

    signUp: function (opts) {
      var email = opts.email, password = opts.password;
      var businessName = opts.businessName || email.split('@')[0];
      var slug = opts.slug || slugify(businessName);
      if (CW.isDemo) {
        var users = LS.read('users', []);
        if (users.some(function (u) { return u.email.toLowerCase() === email.toLowerCase(); }))
          return Promise.reject(new Error('EMAIL_TAKEN'));
        var user = { id: uid(), email: email, pass: btoa(password), created_at: nowIso() };
        users.push(user); LS.write('users', users);
        var biz = store._blankBusiness(user, businessName, slug);
        var bizs = LS.read('businesses', []); bizs.push(biz); LS.write('businesses', bizs);
        var cats = LS.read('categories', []); cats.push({ id: uid(), business_id: biz.id, name: 'Otros', slug: 'otros', sort_order: 0, kind: 'product', created_at: nowIso() }); LS.write('categories', cats);
        LS.write('session', user.id);
        emitAuth();
        return Promise.resolve({ user: user, business: biz });
      }
      return sb.auth.signUp({
        email: email, password: password,
        options: { data: { business_name: businessName, slug: slug } }
      }).then(function (r) {
        if (r.error) throw r.error;
        return { user: r.data.user };
      });
    },

    _blankBusiness: function (user, name, slug) {
      return {
        id: uid(), owner_id: user.id, owner_email: user.email, name: name, slug: slug,
        description: '', whatsapp: '', country: 'MA', currency: cfg.defaultCurrency,
        timezone: 'Africa/Casablanca', brand_color: '#5B1A80', logo_url: '',
        hero_enabled: false, hero_title: '', hero_desc: '', hero_image: '',
        delivery: 'whatsapp', delivery_fee: 0, delivery_time: '', delivery_notes: '',
        payments: [], payment_notes: '', seo_title: '', seo_description: '', seo_keywords: '', seo_image: '',
        published: false, plan: 'free', max_products: cfg.freeMaxProducts, max_storage_mb: cfg.freeMaxStorageMb,
        open_time: '09:00', close_time: '18:00', slot_minutes: 30, work_days: [1, 2, 3, 4, 5, 6],
        onboarded: false, created_at: nowIso()
      };
    },

    signIn: function (opts) {
      if (CW.isDemo) {
        var users = LS.read('users', []);
        var u = users.find(function (x) { return x.email.toLowerCase() === opts.email.toLowerCase(); });
        if (!u || u.pass !== btoa(opts.password)) return Promise.reject(new Error('BAD_CREDENTIALS'));
        LS.write('session', u.id); emitAuth();
        return store.getSession();
      }
      return sb.auth.signInWithPassword({ email: opts.email, password: opts.password })
        .then(function (r) { if (r.error) throw r.error; return r.data; });
    },

    signOut: function () {
      if (CW.isDemo) { LS.del('session'); emitAuth(); return Promise.resolve(); }
      return sb.auth.signOut();
    },

    resetPassword: function (email) {
      if (CW.isDemo) return Promise.resolve({ demo: true });
      var redirect = CW.absUrl('login.html');
      return sb.auth.resetPasswordForEmail(email, { redirectTo: redirect }).then(function (r) { if (r.error) throw r.error; return r.data; });
    },

    updateEmail: function (email) {
      if (CW.isDemo) {
        var users = LS.read('users', []), sid = LS.read('session');
        users.forEach(function (u) { if (u.id === sid) u.email = email; }); LS.write('users', users);
        return Promise.resolve();
      }
      return sb.auth.updateUser({ email: email }).then(function (r) { if (r.error) throw r.error; return r.data; });
    },

    updatePassword: function (pw) {
      if (CW.isDemo) {
        var users = LS.read('users', []), sid = LS.read('session');
        users.forEach(function (u) { if (u.id === sid) u.pass = btoa(pw); }); LS.write('users', users);
        return Promise.resolve();
      }
      return sb.auth.updateUser({ password: pw }).then(function (r) { if (r.error) throw r.error; return r.data; });
    },

    // ---- Negocio --------------------------------------------------------
    getMyBusiness: function () {
      if (CW.isDemo) {
        var sid = LS.read('session');
        if (!sid) return Promise.resolve(null);
        return Promise.resolve(LS.read('businesses', []).find(function (b) { return b.owner_id === sid; }) || null);
      }
      return sb.auth.getUser().then(function (r) {
        var u = r && r.data && r.data.user;
        if (!u) return null;
        return sb.from('businesses').select('*').eq('owner_id', u.id).limit(1).maybeSingle().then(function (q) {
          if (q.error) throw q.error; return q.data;
        });
      });
    },

    getBusinessBySlug: function (slug) {
      if (CW.isDemo) {
        return Promise.resolve(LS.read('businesses', []).find(function (b) { return b.slug === slug; }) || null);
      }
      return sb.from('businesses').select('*').eq('slug', slug).maybeSingle().then(function (r) {
        if (r.error) throw r.error; return r.data;
      });
    },

    slugAvailable: function (slug) {
      if (CW.isDemo) {
        var taken = LS.read('businesses', []).some(function (b) { return b.slug === slug; });
        return Promise.resolve(!taken);
      }
      return sb.from('businesses').select('id').eq('slug', slug).maybeSingle().then(function (r) {
        return !r.data;
      });
    },

    // Devuelve las columnas que el servidor no pudo guardar en el último
    // saveBusiness (vacío si se guardó todo).
    lastDroppedColumns: function () { return lastDropped.slice(); },

    saveBusiness: function (id, patch) {
      patch = cleanPatch(patch);
      lastDropped = [];
      if (CW.isDemo) {
        var bizs = LS.read('businesses', []);
        for (var i = 0; i < bizs.length; i++) if (bizs[i].id === id) bizs[i] = Object.assign({}, bizs[i], patch);
        LS.write('businesses', bizs);
        return Promise.resolve(bizs.find(function (b) { return b.id === id; }));
      }
      function attempt(next, dropped, depth) {
        return sb.from('businesses').update(next).eq('id', id).select().maybeSingle().then(function (r) {
          if (r.error) {
            var col = missingColumn(r.error);
            if (col && Object.prototype.hasOwnProperty.call(next, col) && depth < 10) {
              var rest = Object.assign({}, next);
              delete rest[col];
              return attempt(rest, dropped.concat(col), depth + 1);
            }
            throw r.error;
          }
          lastDropped = dropped;
          return r.data;
        });
      }
      return attempt(patch, [], 0);
    },

    deleteBusiness: function (id) {
      if (CW.isDemo) {
        ['businesses', 'categories', 'products', 'orders', 'library'].forEach(function (k) {
          var arr = LS.read(k, []).filter(function (x) { return x.business_id !== id && x.id !== id; });
          LS.write(k, arr);
        });
        emitAuth();
        return Promise.resolve();
      }
      return sb.from('businesses').delete().eq('id', id).then(function (r) { if (r.error) throw r.error; });
    },

    // ---- Categorías -----------------------------------------------------
    listCategories: function (businessId) {
      if (CW.isDemo) {
        return Promise.resolve(LS.read('categories', [])
          .filter(function (c) { return c.business_id === businessId; })
          .sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); }));
      }
      return sb.from('categories').select('*').eq('business_id', businessId).order('sort_order', { ascending: true }).then(function (r) {
        if (r.error) throw r.error; return r.data || [];
      });
    },

    saveCategory: function (cat) {
      if (CW.isDemo) {
        var cats = LS.read('categories', []);
        if (cat.id) {
          cats = cats.map(function (c) { return c.id === cat.id ? Object.assign({}, c, cat) : c; });
        } else {
          cat.id = uid(); cat.created_at = nowIso(); cats.push(cat);
        }
        LS.write('categories', cats);
        return Promise.resolve(cat);
      }
      if (cat.id) return updateRow('categories', cat.id, cat);
      delete cat.id;
      return insertRow('categories', cat);
    },

    deleteCategory: function (id) {
      if (CW.isDemo) { LS.write('categories', LS.read('categories', []).filter(function (c) { return c.id !== id; })); return Promise.resolve(); }
      return sb.from('categories').delete().eq('id', id).then(function (r) { if (r.error) throw r.error; });
    },

    // ---- Porfolio -------------------------------------------------------
    listPortfolio: function (businessId, opts) {
      opts = opts || {};
      if (CW.isDemo) {
        return Promise.resolve(LS.read('portfolio', [])
          .filter(function (p) { return p.business_id === businessId && (!opts.activeOnly || p.active !== false); })
          .sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); }));
      }
      var sel = sb.from('portfolio').select('*').eq('business_id', businessId);
      if (opts.activeOnly) sel = sel.eq('active', true);
      return sel.order('sort_order', { ascending: true }).then(function (r) {
        if (r.error) throw r.error; return r.data || [];
      });
    },

    savePortfolioItem: function (item) {
      if (CW.isDemo) {
        var items = LS.read('portfolio', []);
        if (item.id) {
          items = items.map(function (x) { return x.id === item.id ? Object.assign({}, x, item) : x; });
        } else {
          item.id = uid(); item.created_at = nowIso(); items.push(item);
        }
        LS.write('portfolio', items);
        return Promise.resolve(item);
      }
      var payload = Object.assign({}, item);
      delete payload.id;
      if (item.id) return updateRow('portfolio', item.id, payload);
      return insertRow('portfolio', payload);
    },

    deletePortfolioItem: function (id) {
      if (CW.isDemo) { LS.write('portfolio', LS.read('portfolio', []).filter(function (x) { return x.id !== id; })); return Promise.resolve(); }
      return sb.from('portfolio').delete().eq('id', id).then(function (r) { if (r.error) throw r.error; });
    },

    // ---- Productos ------------------------------------------------------
    listProducts: function (businessId, opts) {
      opts = opts || {};
      if (CW.isDemo) {
        var arr = LS.read('products', []).filter(function (p) { return p.business_id === businessId; });
        if (opts.activeOnly) arr = arr.filter(function (p) { return p.active !== false; });
        arr.sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0) || new Date(b.created_at) - new Date(a.created_at); });
        return Promise.resolve(arr);
      }
      var q = sb.from('products').select('*').eq('business_id', businessId);
      if (opts.activeOnly) q = q.eq('active', true);
      return q.order('sort_order', { ascending: true }).then(function (r) { if (r.error) throw r.error; return r.data || []; });
    },

    getProduct: function (id) {
      if (CW.isDemo) { return Promise.resolve(LS.read('products', []).find(function (p) { return p.id === id; }) || null); }
      return sb.from('products').select('*').eq('id', id).maybeSingle().then(function (r) { if (r.error) throw r.error; return r.data; });
    },

    saveProduct: function (p) {
      if (CW.isDemo) {
        var arr = LS.read('products', []);
        if (p.id) arr = arr.map(function (x) { return x.id === p.id ? Object.assign({}, x, p) : x; });
        else { p.id = uid(); p.created_at = nowIso(); p.views = p.views || 0; arr.push(p); }
        LS.write('products', arr);
        return Promise.resolve(p);
      }
      if (p.id) return updateRow('products', p.id, p);
      delete p.id;
      return insertRow('products', p);
    },

    deleteProduct: function (id) {
      if (CW.isDemo) { LS.write('products', LS.read('products', []).filter(function (p) { return p.id !== id; })); return Promise.resolve(); }
      return sb.from('products').delete().eq('id', id).then(function (r) { if (r.error) throw r.error; });
    },

    incrementViews: function (id) {
      if (CW.isDemo) {
        var arr = LS.read('products', []);
        arr.forEach(function (p) { if (p.id === id) p.views = (p.views || 0) + 1; });
        LS.write('products', arr);
        return Promise.resolve();
      }
      // RPC opcional; si no existe, se ignora en silencio.
      return sb.rpc('increment_product_views', { pid: id }).then(function () {}).catch(function () {});
    },

    // ---- Pedidos --------------------------------------------------------
    listOrders: function (businessId) {
      if (CW.isDemo) {
        return Promise.resolve(LS.read('orders', [])
          .filter(function (o) { return o.business_id === businessId; })
          .sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); }));
      }
      return sb.from('orders').select('*').eq('business_id', businessId).order('created_at', { ascending: false }).then(function (r) {
        if (r.error) throw r.error; return r.data || [];
      });
    },

    createOrder: function (o) {
      o.code = o.code || code(); o.created_at = nowIso(); o.status = o.status || 'new';
      if (CW.isDemo) {
        var arr = LS.read('orders', []); if (!o.id) o.id = uid(); arr.push(o); LS.write('orders', arr);
        return Promise.resolve(o);
      }
      delete o.id;
      // Sin .select(): quien crea el pedido es el cliente (rol anon), que tiene
      // permiso de INSERT pero no de lectura sobre `orders`. Con RETURNING
      // PostgreSQL exigiría también privilegio de SELECT y el pedido fallaría.
      // Devolvemos el objeto que ya tenemos en memoria.
      return sb.from('orders').insert(o).then(function (r) {
        if (r.error) throw r.error; return o;
      });
    },

    // Horas ya ocupadas de un día (solo horas, nunca datos del cliente).
    // La función SQL es SECURITY DEFINER para que el catálogo público pueda
    // consultar la disponibilidad sin permiso de lectura sobre `orders`.
    busySlots: function (businessId, day) {
      if (!day) return Promise.resolve([]);
      if (CW.isDemo) {
        return Promise.resolve((LS.read('orders', []) || []).filter(function (o) {
          return o.business_id === businessId && o.appointment_at;
        }).map(function (o) {
          var d = new Date(o.appointment_at);
          if (isNaN(d)) return null;
          var ymd = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
          return ymd === day ? ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) : null;
        }).filter(Boolean));
      }
      return sb.rpc('busy_slots', { bid: businessId, day: day }).then(function (r) {
        if (r.error) throw r.error;
        return (r.data || []).map(function (x) { return typeof x === 'string' ? x : x.slot; });
      }).catch(function () { return []; });
    },

    updateOrderStatus: function (id, status) {
      if (CW.isDemo) {
        var arr = LS.read('orders', []); arr.forEach(function (o) { if (o.id === id) o.status = status; }); LS.write('orders', arr);
        return Promise.resolve();
      }
      return sb.from('orders').update({ status: status }).eq('id', id).then(function (r) { if (r.error) throw r.error; });
    },

    deleteOrder: function (id) {
      if (CW.isDemo) { LS.write('orders', LS.read('orders', []).filter(function (o) { return o.id !== id; })); return Promise.resolve(); }
      return sb.from('orders').delete().eq('id', id).then(function (r) { if (r.error) throw r.error; });
    },

    // ---- Biblioteca -----------------------------------------------------
    listLibrary: function (businessId) {
      if (CW.isDemo) {
        return Promise.resolve(LS.read('library', [])
          .filter(function (i) { return i.business_id === businessId; })
          .sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); }));
      }
      return sb.from('library').select('*').eq('business_id', businessId).order('created_at', { ascending: false }).then(function (r) {
        if (r.error) throw r.error; return r.data || [];
      });
    },

    // En demo guardamos el dataURL directamente (no hay Storage real).
    uploadImage: function (businessId, file) {
      if (CW.isDemo) {
        return new Promise(function (res, rej) {
          var fr = new FileReader();
          fr.onload = function () {
            var item = { id: uid(), business_id: businessId, url: fr.result, name: file.name, size_bytes: file.size || 0, created_at: nowIso() };
            var arr = LS.read('library', []); arr.push(item); LS.write('library', arr);
            res(item);
          };
          fr.onerror = rej;
          fr.readAsDataURL(file);
        });
      }
      var path = businessId + '/' + Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      return sb.storage.from('catalog-images').upload(path, file, { upsert: false }).then(function (r) {
        if (r.error) throw r.error;
        var url = sb.storage.from('catalog-images').getPublicUrl(path).data.publicUrl;
        var item = { business_id: businessId, url: url, name: file.name, size_bytes: file.size || 0 };
        return sb.from('library').insert(item).select().maybeSingle().then(function (r2) { if (r2.error) throw r2.error; return r2.data; });
      });
    },

    deleteLibraryItem: function (item) {
      if (CW.isDemo) { LS.write('library', LS.read('library', []).filter(function (i) { return i.id !== item.id; })); return Promise.resolve(); }
      return sb.from('library').delete().eq('id', item.id).then(function (r) { if (r.error) throw r.error; });
    },

    // ---- Administración / cobertura ------------------------------------
    isAdmin: function () {
      if (CW.isDemo) {
        var sid = LS.read('session');
        return Promise.resolve(!!sid && LS.read('admins', []).some(function (a) { return a.user_id === sid; }));
      }
      // Dos vías para no depender de una sola suposición:
      //  1) is_admin(): función SQL SECURITY DEFINER que filtra por auth.uid().
      //     Funciona aunque la tabla tenga varios administradores.
      //  2) Respaldo: consultar admins filtrando por el usuario de la sesión y
      //     con limit(1). Antes se usaba maybeSingle() sin filtro, que falla en
      //     cuanto existe más de una fila (PGRST116) y devolvía false: el menú
      //     de Administración desaparecía "de repente".
      function viaRpc() {
        return sb.rpc('is_admin').then(function (r) {
          if (r.error) throw r.error;
          return !!r.data;
        });
      }
      function viaTable() {
        return sb.auth.getUser().then(function (u) {
          var user = u && u.data && u.data.user;
          if (!user) return false;
          return sb.from('admins').select('user_id').eq('user_id', user.id).limit(1).then(function (r) {
            if (r.error) throw r.error;
            if (r.data && r.data.length) return true;
            // Tercera vía: filas añadidas por correo antes de que la cuenta
            // existiera (user_id todavía nulo). Se compara el correo de la
            // sesión, nunca un correo escrito por el usuario.
            if (!user.email) return false;
            return sb.from('admins').select('email').eq('email', user.email).limit(1).then(function (r2) {
              if (r2.error) return false;
              return !!(r2.data && r2.data.length);
            }).catch(function () { return false; });
          });
        });
      }
      return viaRpc().catch(function (err) {
        return viaTable().catch(function (err2) {
          console.warn('[CW] No se pudo comprobar si eres super administrador:',
            (err && err.message) || err, '|', (err2 && err2.message) || err2);
          return false;
        });
      });
    },

    listAllBusinesses: function () {
      if (CW.isDemo) {
        var bizs = clone(LS.read('businesses', []));
        var products = LS.read('products', []), orders = LS.read('orders', []), lib = LS.read('library', []);
        return Promise.resolve(bizs.map(function (b) {
          return Object.assign(b, {
            _products: products.filter(function (p) { return p.business_id === b.id; }).length,
            _orders: orders.filter(function (o) { return o.business_id === b.id; }).length,
            _storage: lib.filter(function (l) { return l.business_id === b.id; }).reduce(function (s, l) { return s + (l.size_bytes || 0); }, 0)
          });
        }).sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); }));
      }
      return sb.from('businesses').select('*').order('created_at', { ascending: false }).then(function (r) {
        if (r.error) throw r.error; return r.data || [];
      });
    },

    adminSaveBusiness: function (id, patch) {
      return store.saveBusiness(id, patch).then(function (b) {
        store.audit('admin_save_business', id, patch); return b;
      });
    },

    adminDeleteBusiness: function (id) {
      return store.deleteBusiness(id).then(function () { store.audit('admin_delete_business', id, {}); });
    },

    // Cobertura: quién tiene acceso a un negocio
    listMembers: function (businessId) {
      if (CW.isDemo) {
        return Promise.resolve(LS.read('members', []).filter(function (m) { return m.business_id === businessId; }));
      }
      return sb.from('business_members').select('*').eq('business_id', businessId).order('created_at', { ascending: true }).then(function (r) {
        if (r.error) throw r.error; return r.data || [];
      });
    },

    addMember: function (businessId, email, role, note) {
      var m = { business_id: businessId, email: email, role: role || 'support', note: note || '' };
      if (CW.isDemo) {
        var arr = LS.read('members', []);
        var users = LS.read('users', []);
        var u = users.find(function (x) { return x.email.toLowerCase() === email.toLowerCase(); });
        m.id = uid(); m.user_id = u ? u.id : null; m.created_at = nowIso();
        arr.push(m); LS.write('members', arr);
        store.audit('coverage_add', businessId, { email: email, role: role });
        return Promise.resolve(m);
      }
      return sb.from('business_members').insert(m).select().maybeSingle().then(function (r) {
        if (r.error) throw r.error; store.audit('coverage_add', businessId, m); return r.data;
      });
    },

    removeMember: function (id) {
      if (CW.isDemo) { LS.write('members', LS.read('members', []).filter(function (m) { return m.id !== id; })); return Promise.resolve(); }
      return sb.from('business_members').delete().eq('id', id).then(function (r) { if (r.error) throw r.error; });
    },

    // Transfiere la propiedad de un negocio a otro correo. Si el correo ya
    // figura como miembro (o tiene cuenta), enlaza su user_id como owner.
    transferOwnership: function (businessId, email) {
      return store.listMembers(businessId).then(function (ms) {
        var mem = (ms || []).find(function (m) { return (m.email || '').toLowerCase() === email.toLowerCase(); });
        var patch = { owner_email: email };
        if (mem && mem.user_id) patch.owner_id = mem.user_id;
        return store.saveBusiness(businessId, patch).then(function (b) {
          store.audit('transfer_ownership', businessId, { email: email, linked: !!(mem && mem.user_id) });
          return b;
        });
      });
    },

    // Lista de todos los super administradores
    listAdmins: function () {
      if (CW.isDemo) return Promise.resolve(clone(LS.read('admins', [])));
      return sb.from('admins').select('*').then(function (r) { if (r.error) throw r.error; return r.data || []; });
    },

    addAdmin: function (email) {
      if (CW.isDemo) {
        var users = LS.read('users', []); var u = users.find(function (x) { return x.email.toLowerCase() === email.toLowerCase(); });
        var admins = LS.read('admins', []);
        if (!admins.some(function (a) { return a.email.toLowerCase() === email.toLowerCase(); })) {
          admins.push({ user_id: u ? u.id : null, email: email, created_at: nowIso() }); LS.write('admins', admins);
        }
        return Promise.resolve();
      }
      return sb.rpc('make_admin', { admin_email: email }).then(function (r) {
        if (r.error) throw r.error;
      }).catch(function () {
        // Fallback: no hay RPC, insertamos directo (solo funciona si ya eres admin)
        return sb.from('admins').insert({ email: email }).then(function () {});
      });
    },

    removeAdmin: function (userId) {
      if (CW.isDemo) { LS.write('admins', LS.read('admins', []).filter(function (a) { return a.user_id !== userId; })); return Promise.resolve(); }
      return sb.from('admins').delete().eq('user_id', userId).then(function (r) { if (r.error) throw r.error; });
    },

    audit: function (action, target, detail) {
      if (CW.isDemo) {
        var arr = LS.read('audit', []);
        var sid = LS.read('session'); var users = LS.read('users', []);
        var u = users.find(function (x) { return x.id === sid; });
        arr.unshift({ id: uid(), admin_email: u ? u.email : 'demo', action: action, target: target, detail: detail || {}, created_at: nowIso() });
        LS.write('audit', arr.slice(0, 200));
        return Promise.resolve();
      }
      return sb.from('admin_audit').insert({ action: action, target: target, detail: detail || {} }).then(function () {}).catch(function () {});
    },

    listAudit: function () {
      if (CW.isDemo) return Promise.resolve(LS.read('audit', []));
      return sb.from('admin_audit').select('*').order('created_at', { ascending: false }).limit(100).then(function (r) { return r.data || []; });
    },

    // Productos más vistos (para métricas de administración).
    topViewed: function (limit) {
      limit = limit || 10;
      if (CW.isDemo) {
        return Promise.resolve(LS.read('products', []).slice()
          .sort(function (a, b) { return (b.views || 0) - (a.views || 0); })
          .slice(0, limit));
      }
      return sb.from('products').select('id,name,views,business_id').order('views', { ascending: false }).limit(limit)
        .then(function (r) { return r.data || []; }).catch(function () { return []; });
    },

    // ---- Ajustes globales del sitio (imágenes de la home) ---------------
    getSiteSettings: function () {
      if (CW.isDemo) return Promise.resolve(LS.read('site', {}));
      return sb.from('site_settings').select('*').then(function (r) {
        if (r.error) throw r.error;
        var out = {};
        (r.data || []).forEach(function (row) { out[row.key] = row.value; });
        return out;
      }).catch(function () { return {}; });
    },

    saveSiteSettings: function (key, value) {
      if (CW.isDemo) { var s = LS.read('site', {}); s[key] = value; LS.write('site', s); return Promise.resolve(); }
      return sb.from('site_settings').upsert({ key: key, value: value, updated_at: new Date().toISOString() }).then(function (r) { if (r.error) throw r.error; });
    },

    // ---- Exportar todos mis datos (JSON) -------------------------------
    exportMyData: function () {
      return store.getSession().then(function (sess) {
        if (!sess) throw new Error('NO_SESSION');
        var b = sess.business;
        if (!b) return { user: sess.user, business: null };
        return Promise.all([
          store.listCategories(b.id), store.listProducts(b.id), store.listOrders(b.id), store.listLibrary(b.id)
        ]).then(function (r) {
          return { exported_at: nowIso(), user: sess.user, business: b, categories: r[0], products: r[1], orders: r[2], library: r[3] };
        });
      });
    }
  };

  CW.store = store;
})(window);
