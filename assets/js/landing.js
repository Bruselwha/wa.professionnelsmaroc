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
    tienda: {
      title: 'Tienda', icon: '🛒',
      intro: 'Catálogo general con stock variado: lo importante es que el cliente encuentre rápido y vea el precio final.',
      cats: ['Novedades', 'Ofertas', 'Accesorios', 'Pack regalo'],
      tips: ['Categorías activas/inactivas para temporadas', 'Precio de oferta con descuento visible', 'Entrega o retiro configurables']
    },
    moda: {
      title: 'Moda', icon: '👗',
      intro: 'Ropa y complementos donde la talla y el color deciden la compra. La foto manda.',
      cats: ['Mujer', 'Hombre', 'Niños', 'Rebajas'],
      tips: ['Hasta 5 fotos por artículo', 'Variantes en la descripción (talla, color)', 'Pedido por WhatsApp con cantidades']
    },
    calzado: {
      title: 'Calzado', icon: '👟',
      intro: 'Zapatería con tallas limitadas: conviene dejar claro qué hay y qué se encarga.',
      cats: ['Deportivo', 'Casual', 'Niños', 'Outdoor'],
      tips: ['Descripción corta con talla y material', 'Artículos ocultos cuando no hay stock', 'Pedidos con nota de talla']
    },
    abarrotes: {
      title: 'Abarrotes', icon: '🧺',
      intro: 'Compra diaria y pedidos repetidos: el catálogo ahorra decenas de mensajes.',
      cats: ['Frescos', 'Despensa', 'Bebidas', 'Limpieza'],
      tips: ['Carrito con cantidades', 'Tarifa de entrega por zona', 'Categorías por pasillo']
    },
    limpieza: {
      title: 'Limpieza', icon: '🧴',
      intro: 'Productos de limpieza y también servicios de limpieza a domicilio.',
      cats: ['Hogar', 'Industrial', 'Servicios', 'Packs'],
      tips: ['Mezcla productos y servicios en un catálogo', 'Servicios con reserva y calendario', 'Formas de pago configurables']
    },
    belleza: {
      title: 'Belleza', icon: '💅',
      intro: 'Peluquería, estética o uñas: el cliente elige servicio, día y hora desde el catálogo.',
      cats: ['Cortes', 'Color', 'Manicura', 'Tratamientos'],
      tips: ['Reserva con calendario y horas reales', 'Duración por servicio', 'Agenda con las citas del día']
    },
    tecnologia: {
      title: 'Tecnología', icon: '📱',
      intro: 'Móviles, accesorios y reparaciones conviven en el mismo catálogo.',
      cats: ['Móviles', 'Accesorios', 'Reparaciones', 'Segunda mano'],
      tips: ['Productos con promo y precio anterior tachado', 'Servicio técnico con reserva', 'Ficha con especificaciones']
    },
    electricidad: {
      title: 'Electricidad', icon: '⚡',
      intro: 'Servicios técnicos con desplazamiento: hay que pedir dirección y describir la avería.',
      cats: ['Instalaciones', 'Reparaciones', 'Urgencias', 'Materiales'],
      tips: ['Servicio a domicilio con dirección en la reserva', 'Detalles para el profesional', 'Contacto guardado como lead']
    },
    juguetes: {
      title: 'Juguetes', icon: '🧸',
      intro: 'Juguetes y regalos con picos de venta en fechas concretas.',
      cats: ['Educativos', 'Peluches', 'Exterior', 'Regalos'],
      tips: ['Categorías que se activan por campaña', 'Packs y precios de oferta', 'Fotos grandes para mostrar el producto']
    },
    libreria: {
      title: 'Librería', icon: '📚',
      intro: 'Libros, papelería y material escolar; el buscador es la herramienta clave.',
      cats: ['Libros', 'Papelería', 'Escolar', 'Arte'],
      tips: ['Buscador por nombre y descripción', 'Categorías por curso o género', 'Pedidos con nota (título, autor)']
    },
    mascotas: {
      title: 'Mascotas', icon: '🐾',
      intro: 'Piensos, accesorios y servicios como peluquería canina.',
      cats: ['Alimentación', 'Accesorios', 'Peluquería', 'Salud'],
      tips: ['Suscripción de pienso vía pedidos repetidos', 'Servicios con cita', 'Peso y formato en la descripción']
    },
    deportes: {
      title: 'Deportes', icon: '⚽',
      intro: 'Material deportivo y clases o entrenamientos con horario.',
      cats: ['Fútbol', 'Gimnasio', 'Running', 'Clases'],
      tips: ['Productos y clases en el mismo catálogo', 'Reserva de sesiones con calendario', 'Horarios de atención visibles']
    }
  };

  function open(type) {
    var d = TYPES[type];
    if (!d) return;
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
