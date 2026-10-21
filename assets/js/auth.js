/* ==========================================================================
   WA Professionnels Maroc · auth.js
   Controla login.html: pestañas, registro, acceso, recuperación y redirección.
   ========================================================================== */
(function (window, document) {
  'use strict';
  var CW = window.CW;
  var $ = CW.$, $$ = CW.$$;

  function tab(name) {
    $$('.auth-tab').forEach(function (t) { t.classList.toggle('active', t.dataset.tab === name); });
    $$('[data-panel]').forEach(function (p) { p.hidden = p.dataset.panel !== name; });
    history.replaceState(null, '', '#' + name);
  }

  function showError(el, msg) {
    el.textContent = msg; el.hidden = false;
    setTimeout(function () { el.hidden = true; }, 5000);
  }

  function afterLogin() {
    CW.store.getMyBusiness().then(function (b) {
      if (b && !b.onboarded) location.replace(CW.url('dashboard.html') + '#onboarding');
      else location.replace(CW.url('dashboard.html'));
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    CW.store.init().then(function () {
      if (CW.isDemo) {
        var note = $('[data-demo-note]'); if (note) note.hidden = false;
      }
      // Si ya hay sesión, al panel.
      return CW.store.getSession().then(function (sess) {
        if (sess && sess.user) { afterLogin(); return; }
      });
    });

    // Pestañas
    $$('.auth-tab').forEach(function (t) {
      t.addEventListener('click', function () { tab(t.dataset.tab); });
    });
    tab(location.hash.replace('#', '') || 'signin');

    // Registro
    var signup = $('[data-form-signup]');
    if (signup) signup.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('[data-error-signup]');
      var name = signup.business.value.trim();
      var email = signup.email.value.trim();
      var pass = signup.password.value;
      if (!name || !email || pass.length < 6) { showError(err, 'Revisa los datos (contraseña ≥ 6).'); return; }
      var btn = signup.querySelector('button[type=submit]'); btn.disabled = true;
      CW.store.signUp({ businessName: name, email: email, password: pass })
        .then(function () { afterLogin(); })
        .catch(function (ex) {
          btn.disabled = false;
          showError(err, ex.message === 'EMAIL_TAKEN' ? 'Ese correo ya está registrado.' : 'No se pudo crear la cuenta. ' + (ex.message || ''));
        });
    });

    // Acceso
    var signin = $('[data-form-signin]');
    if (signin) signin.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('[data-error-signin]');
      var email = signin.email.value.trim(), pass = signin.password.value;
      var btn = signin.querySelector('button[type=submit]'); btn.disabled = true;
      CW.store.signIn({ email: email, password: pass })
        .then(function () { afterLogin(); })
        .catch(function () { btn.disabled = false; showError(err, 'Correo o contraseña incorrectos.'); });
    });

    // Recuperar contraseña
    var forgot = $('[data-form-forgot]');
    if (forgot) forgot.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = forgot.email.value.trim();
      CW.store.resetPassword(email).then(function () {
        CW.toast('Si el correo existe, recibirás un enlace.');
        tab('signin');
      }).catch(function () { CW.toast('No se pudo enviar el enlace.'); });
    });

    $$('[data-goto]').forEach(function (b) {
      b.addEventListener('click', function () { tab(b.dataset.goto); });
    });
  });
})(window, document);
