/* ==========================================================================
   WA Professionnels Maroc · landing.js
   Pop-up informativo de «TIPOS DE NEGOCIO» en la home.
   Cada tarjeta abre una ficha con qué vender, qué categorías crear y qué
   opciones del catálogo le sacan más partido.
   ========================================================================== */
(function (window, document) {
  'use strict';
  var CW = window.CW;

  // Contenido por tipo de negocio. `cat` son categorías de ejemplo y `tips`
  // las funciones del catálogo que más le sirven a ese tipo de negocio.
  var TYPES = {
    tienda: { title: 'Boutique', icon: '🛒', fr: {
      intro: 'Catalogue général : le client doit trouver vite et voir le prix final.',
      cats: ['Nouveautés', 'Promotions', 'Accessoires', 'Coffrets'],
      tips: ['Catégories activables selon la saison', 'Prix barré sur les promotions', 'Livraison ou retrait configurables'] } },
    moda: { title: 'Mode', icon: '👗', fr: {
      intro: 'Vêtements et accessoires : la taille et la couleur décident de l’achat. La photo compte.',
      cats: ['Femme', 'Homme', 'Enfants', 'Soldes'],
      tips: ['Jusqu’à 5 photos par article', 'Tailles et couleurs dans la description', 'Commande WhatsApp avec quantités'] } },
    calzado: { title: 'Chaussures', icon: '👟', fr: {
      intro: 'Chaussures avec tailles limitées : montrez ce qui est disponible et ce qui se commande.',
      cats: ['Sport', 'Ville', 'Enfants', 'Outdoor'],
      tips: ['Description courte avec taille et matière', 'Articles masqués quand il n’y a plus de stock', 'Note de taille dans la commande'] } },
    abarrotes: { title: 'Épicerie', icon: '🧺', fr: {
      intro: 'Achats quotidiens et commandes répétées : le catalogue évite des dizaines de messages.',
      cats: ['Frais', 'Épicerie', 'Boissons', 'Entretien'],
      tips: ['Panier avec quantités', 'Frais de livraison par zone', 'Catégories par rayon'] } },
    limpieza: { title: 'Nettoyage', icon: '🧴', fr: {
      intro: 'Produits d’entretien et aussi prestations de nettoyage à domicile.',
      cats: ['Maison', 'Professionnel', 'Services', 'Packs'],
      tips: ['Produits et services dans un même catalogue', 'Services avec réservation et calendrier', 'Moyens de paiement configurables'] } },
    belleza: { title: 'Beauté', icon: '💅', fr: {
      intro: 'Coiffure, esthétique ou ongles : le client choisit la prestation, le jour et l’heure.',
      cats: ['Coupes', 'Couleur', 'Manucure', 'Soins'],
      tips: ['Réservation avec calendrier et vraies disponibilités', 'Durée par prestation', 'Agenda avec les rendez-vous du jour'] } },
    tecnologia: { title: 'Technologie', icon: '📱', fr: {
      intro: 'Téléphones, accessoires et réparations dans le même catalogue.',
      cats: ['Téléphones', 'Accessoires', 'Réparations', 'Occasion'],
      tips: ['Promotions avec ancien prix barré', 'Service technique avec réservation', 'Fiche avec caractéristiques'] } },
    electricidad: { title: 'Électricité', icon: '⚡', fr: {
      intro: 'Services techniques avec déplacement : il faut l’adresse et la description de la panne.',
      cats: ['Installations', 'Réparations', 'Urgences', 'Matériel'],
      tips: ['Service à domicile avec adresse dans la réservation', 'Détails pour le professionnel', 'Contact enregistré comme prospect'] } },
    juguetes: { title: 'Jouets', icon: '🧸', fr: {
      intro: 'Jouets et cadeaux avec des pics de ventes à certaines dates.',
      cats: ['Éducatifs', 'Peluches', 'Extérieur', 'Cadeaux'],
      tips: ['Catégories activées par campagne', 'Packs et prix promotionnels', 'Grandes photos pour montrer le produit'] } },
    libreria: { title: 'Librairie', icon: '📚', fr: {
      intro: 'Livres, papeterie et fournitures scolaires : la recherche est l’outil clé.',
      cats: ['Livres', 'Papeterie', 'Scolaire', 'Art'],
      tips: ['Recherche par nom et description', 'Catégories par niveau ou genre', 'Commande avec note (titre, auteur)'] } },
    mascotas: { title: 'Animaux', icon: '🐾', fr: {
      intro: 'Croquettes, accessoires et services comme le toilettage.',
      cats: ['Alimentation', 'Accessoires', 'Toilettage', 'Santé'],
      tips: ['Commandes répétées pour les croquettes', 'Services sur rendez-vous', 'Poids et format dans la description'] } },
    deportes: { title: 'Sport', icon: '⚽', fr: {
      intro: 'Matériel sportif et cours ou entraînements avec horaires.',
      cats: ['Football', 'Salle', 'Running', 'Cours'],
      tips: ['Produits et cours dans le même catalogue', 'Réservation de séances avec calendrier', 'Horaires d’ouverture visibles'] } }
  };

  function open(type) {
    var d = TYPES[type];
    if (!d) return;
    if (d.fr) d = { title: d.title, icon: d.icon, intro: d.fr.intro, cats: d.fr.cats, tips: d.fr.tips };
    var html =
      '<div class="bt-top"><span class="bt-ico">' + d.icon + '</span><div><h3>' + d.title + '</h3><p>' + d.intro + '</p></div></div>' +
      '<h4 class="bt-h">Categorías que suelen funcionar</h4>' +
      '<div class="bt-chips">' + d.cats.map(function (c) { return '<span>' + c + '</span>'; }).join('') + '</div>' +
      '<h4 class="bt-h">Qué le saca más partido al catálogo</h4>' +
      '<ul class="bt-list">' + d.tips.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
      '<p class="bt-note">Todo esto se configura desde el panel, sin tocar código.</p>';

    CW.modal({
      className: 'btype-modal',
      title: d.icon + ' ' + d.title,
      html: html,
      footer: '<a class="btn primary small" href="login.html#signup">Crear mi catálogo</a>' +
              '<a class="btn ghost small" href="catalogo.html?b=demo">Ver un ejemplo</a>' +
              '<button class="btn ghost small" data-close>Cerrar</button>'
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-type]').forEach(function (el) {
      el.addEventListener('click', function () { open(el.getAttribute('data-type')); });
    });
  });

  CW.businessTypes = TYPES;
})(window, document);
