/* ==========================================================================
   WA Professionnels Maroc · policies.js
   Políticas del pie de página en español, francés y árabe.
   Cada enlace [data-policy] abre un pop-up con la información.
   Texto base: adáptalo a tu negocio.
   ========================================================================== */
(function (window, document) {
  'use strict';
  var CW = window.CW;

  var POLICIES = {
    /* ------------------------------------------------------------------ ES */
    es: {
      legal: {
        title: 'Aviso legal',
        body:
          '<p class="policy-meta">Última actualización: enero de 2026</p>' +
          '<p>Este catálogo es un escaparate digital. La venta se realiza directamente entre el cliente y el negocio, que es el único responsable de los productos o servicios, sus precios, su disponibilidad y su entrega.</p>' +
          '<h4>Identificación del negocio</h4><p>Los datos del negocio (nombre comercial, teléfono y, cuando corresponda, dirección y datos fiscales) figuran en la ficha del catálogo y en la conversación de WhatsApp.</p>' +
          '<h4>Uso del catálogo</h4><p>El contenido es informativo y puede cambiar sin previo aviso. Los precios mostrados no constituyen una oferta contractual hasta que el negocio confirme el pedido.</p>' +
          '<h4>Propiedad intelectual</h4><p>Las imágenes y textos son responsabilidad del negocio, que declara tener derecho a usarlos.</p>' +
          '<h4>Responsabilidad</h4><p>La plataforma no interviene en la transacción ni en el pago. Cualquier reclamación debe dirigirse al negocio.</p>'
      },
      privacy: {
        title: 'Política de privacidad',
        body:
          '<p class="policy-meta">Última actualización: enero de 2026</p>' +
          '<p>Explica qué datos personales se recogen cuando usas el catálogo y el asistente, con qué finalidad y cuáles son tus derechos.</p>' +
          '<h4>Datos que recogemos</h4><ul><li>Datos del pedido: nombre, teléfono y, si los facilitas, dirección, ciudad y notas.</li><li>Datos del asistente: nombre, teléfono y lo que necesitas.</li><li>Datos técnicos: preferencia de idioma y carrito.</li></ul>' +
          '<h4>Para qué los usamos</h4><p>Para gestionar tu pedido o consulta, contactarte por WhatsApp y hacer seguimiento. No vendemos ni cedemos tus datos con fines publicitarios.</p>' +
          '<h4>Base legal</h4><p>Tu consentimiento al enviar el pedido o dejar tus datos, y el interés legítimo del negocio en atender tu solicitud.</p>' +
          '<h4>Conservación</h4><p>Durante el tiempo necesario para atender el pedido y los plazos legales aplicables.</p>' +
          '<h4>Tus derechos</h4><p>Acceso, rectificación, supresión, oposición, limitación y portabilidad. Puedes ejercerlos contactando con el negocio por su WhatsApp.</p>' +
          '<h4>Seguridad</h4><p>Aplicamos medidas técnicas razonables con acceso restringido al negocio titular del catálogo.</p>'
      },
      cookies: {
        title: 'Política de cookies',
        body:
          '<p class="policy-meta">Última actualización: enero de 2026</p>' +
          '<p>Este sitio usa el almacenamiento local del navegador para recordar tus preferencias. No usamos cookies publicitarias ni de seguimiento de terceros.</p>' +
          '<h4>Qué guardamos</h4><ul><li>Idioma: para mantener el que elegiste.</li><li>Carrito y sesión: para conservar tu pedido mientras navegas.</li><li>Caché de la aplicación: para cargar más rápido sin conexión.</li></ul>' +
          '<h4>Cómo desactivarlas</h4><p>Puedes borrar estos datos desde la configuración de tu navegador. Si lo haces, perderás el carrito y tus preferencias.</p>'
      },
      terms: {
        title: 'Términos y condiciones',
        body:
          '<p class="policy-meta">Última actualización: enero de 2026</p>' +
          '<h4>1. Objeto</h4><p>Regulan el uso del catálogo digital y la realización de pedidos por WhatsApp.</p>' +
          '<h4>2. Pedidos</h4><p>El pedido es una solicitud y queda confirmado cuando el negocio lo acepta. El negocio puede rechazarlo por falta de stock, error de precio o indisponibilidad.</p>' +
          '<h4>3. Precios</h4><p>Se muestran en la moneda del negocio. Los gastos de entrega, si existen, se muestran antes de enviar el pedido.</p>' +
          '<h4>4. Pago</h4><p>Se acuerda directamente con el negocio por los medios indicados. La plataforma no procesa pagos.</p>' +
          '<h4>5. Disponibilidad</h4><p>Las imágenes son orientativas y el resultado final puede variar ligeramente.</p>' +
          '<h4>6. Responsabilidad</h4><p>El negocio es responsable del cumplimiento de la normativa aplicable a sus productos o servicios.</p>'
      },
      returns: {
        title: 'Política de devoluciones',
        body:
          '<p class="policy-meta">Última actualización: enero de 2026</p>' +
          '<h4>Plazo</h4><p>Salvo que la ley indique otro plazo, dispones de 14 días naturales desde la recepción para solicitar la devolución de un producto no perecedero.</p>' +
          '<h4>Condiciones</h4><ul><li>Producto sin usar y en su embalaje original.</li><li>Conserva el comprobante o la conversación del pedido.</li><li>No aplica a productos personalizados, perecederos o de higiene abiertos.</li></ul>' +
          '<h4>Cómo solicitarla</h4><p>Escribe al WhatsApp del negocio indicando tu nombre, el producto y el motivo.</p>' +
          '<h4>Reembolso</h4><p>Se realiza por el mismo medio de pago acordado, una vez verificado el estado del producto.</p>'
      },
      shipping: {
        title: 'Política de envíos y entrega',
        body:
          '<p class="policy-meta">Última actualización: enero de 2026</p>' +
          '<h4>Modalidades</h4><p>Entrega a domicilio, recogida en tienda o coordinación directa por WhatsApp, según lo configurado en el catálogo.</p>' +
          '<h4>Zonas y plazos</h4><p>Se acuerdan con el negocio al confirmar el pedido. Los plazos son orientativos.</p>' +
          '<h4>Costes</h4><p>Si existe una tarifa de entrega, se muestra en el catálogo y se suma al total antes de enviar el pedido.</p>' +
          '<h4>Recepción</h4><p>Revisa el pedido al recibirlo y comunica cualquier incidencia por WhatsApp lo antes posible.</p>'
      }
    },

    /* ------------------------------------------------------------------ FR */
    fr: {
      legal: {
        title: 'Mentions légales',
        body:
          '<p class="policy-meta">Dernière mise à jour : janvier 2026</p>' +
          '<p>Ce catalogue est une vitrine numérique. La vente se conclut directement entre le client et le commerce, seul responsable des produits ou services, de leurs prix, de leur disponibilité et de leur livraison.</p>' +
          '<h4>Identification du commerce</h4><p>Les informations du commerce (nom commercial, téléphone et, le cas échéant, adresse et données fiscales) figurent sur la fiche du catalogue et dans la conversation WhatsApp.</p>' +
          '<h4>Utilisation du catalogue</h4><p>Le contenu est informatif et peut changer sans préavis. Les prix affichés ne constituent pas une offre contractuelle tant que le commerce n’a pas confirmé la commande.</p>' +
          '<h4>Propriété intellectuelle</h4><p>Les images et textes relèvent de la responsabilité du commerce, qui déclare en avoir le droit d’usage.</p>' +
          '<h4>Responsabilité</h4><p>La plateforme n’intervient ni dans la transaction ni dans le paiement. Toute réclamation doit être adressée au commerce.</p>'
      },
      privacy: {
        title: 'Politique de confidentialité',
        body:
          '<p class="policy-meta">Dernière mise à jour : janvier 2026</p>' +
          '<p>Cette politique explique quelles données personnelles sont collectées lors de l’utilisation du catalogue et de l’assistant, dans quel but et quels sont vos droits.</p>' +
          '<h4>Données collectées</h4><ul><li>Commande : nom, téléphone et, si vous les fournissez, adresse, ville et notes.</li><li>Assistant : nom, téléphone et votre besoin.</li><li>Données techniques : préférence de langue et panier.</li></ul>' +
          '<h4>Finalités</h4><p>Gérer votre commande ou demande, vous contacter par WhatsApp et assurer le suivi. Aucune revente ni cession à des fins publicitaires.</p>' +
          '<h4>Base légale</h4><p>Votre consentement lors de l’envoi de la commande ou de vos coordonnées, et l’intérêt légitime du commerce à traiter votre demande.</p>' +
          '<h4>Conservation</h4><p>Pendant la durée nécessaire au traitement de la commande et les délais légaux applicables.</p>' +
          '<h4>Vos droits</h4><p>Accès, rectification, effacement, opposition, limitation et portabilité. Exercez-les en contactant le commerce via son WhatsApp.</p>' +
          '<h4>Sécurité</h4><p>Des mesures techniques raisonnables sont appliquées, avec un accès restreint au commerce titulaire du catalogue.</p>'
      },
      cookies: {
        title: 'Politique de cookies',
        body:
          '<p class="policy-meta">Dernière mise à jour : janvier 2026</p>' +
          '<p>Ce site utilise le stockage local du navigateur pour mémoriser vos préférences. Aucun cookie publicitaire ni de suivi tiers n’est utilisé.</p>' +
          '<h4>Ce que nous stockons</h4><ul><li>Langue : pour conserver celle que vous avez choisie.</li><li>Panier et session : pour garder votre commande pendant la navigation.</li><li>Cache de l’application : pour un chargement plus rapide.</li></ul>' +
          '<h4>Comment les désactiver</h4><p>Vous pouvez effacer ces données depuis les réglages de votre navigateur. Vous perdrez alors le panier et vos préférences.</p>'
      },
      terms: {
        title: 'Conditions générales',
        body:
          '<p class="policy-meta">Dernière mise à jour : janvier 2026</p>' +
          '<h4>1. Objet</h4><p>Elles régissent l’utilisation du catalogue numérique et la passation de commandes via WhatsApp.</p>' +
          '<h4>2. Commandes</h4><p>La commande est une demande ; elle est confirmée lorsque le commerce l’accepte. Il peut la refuser pour rupture de stock, erreur de prix ou indisponibilité.</p>' +
          '<h4>3. Prix</h4><p>Affichés dans la devise du commerce. Les frais de livraison, s’il y en a, sont indiqués avant l’envoi de la commande.</p>' +
          '<h4>4. Paiement</h4><p>Convenu directement avec le commerce par les moyens indiqués. La plateforme ne traite aucun paiement.</p>' +
          '<h4>5. Disponibilité</h4><p>Les images sont indicatives et le rendu final peut varier légèrement.</p>' +
          '<h4>6. Responsabilité</h4><p>Le commerce est responsable du respect de la réglementation applicable à ses produits ou services.</p>'
      },
      returns: {
        title: 'Politique de retours',
        body:
          '<p class="policy-meta">Dernière mise à jour : janvier 2026</p>' +
          '<h4>Délai</h4><p>Sauf disposition légale contraire, vous disposez de 14 jours calendaires à compter de la réception pour demander le retour d’un produit non périssable.</p>' +
          '<h4>Conditions</h4><ul><li>Produit non utilisé et dans son emballage d’origine.</li><li>Conservez le justificatif ou la conversation de la commande.</li><li>Exclu : produits personnalisés, périssables ou d’hygiène ouverts.</li></ul>' +
          '<h4>Comment demander</h4><p>Écrivez au WhatsApp du commerce en indiquant votre nom, le produit et le motif.</p>' +
          '<h4>Remboursement</h4><p>Effectué par le même moyen de paiement convenu, après vérification de l’état du produit.</p>'
      },
      shipping: {
        title: 'Politique de livraison',
        body:
          '<p class="policy-meta">Dernière mise à jour : janvier 2026</p>' +
          '<h4>Modalités</h4><p>Livraison à domicile, retrait en boutique ou coordination directe par WhatsApp, selon la configuration du catalogue.</p>' +
          '<h4>Zones et délais</h4><p>Convenus avec le commerce à la confirmation de la commande. Les délais sont indicatifs.</p>' +
          '<h4>Frais</h4><p>S’il existe des frais de livraison, ils sont affichés dans le catalogue et ajoutés au total avant l’envoi.</p>' +
          '<h4>Réception</h4><p>Vérifiez la commande à la réception et signalez toute anomalie par WhatsApp dès que possible.</p>'
      }
    },

    /* ------------------------------------------------------------------ AR */
    ar: {
      legal: {
        title: 'إشعار قانوني',
        body:
          '<p class="policy-meta">آخر تحديث: يناير 2026</p>' +
          '<p>هذا الكتالوج واجهة عرض رقمية. تتم عملية البيع مباشرة بين العميل والمتجر، وهو المسؤول الوحيد عن المنتجات أو الخدمات وأسعارها وتوفرها وتوصيلها.</p>' +
          '<h4>بيانات المتجر</h4><p>تظهر بيانات المتجر (الاسم التجاري والهاتف والعنوان والبيانات الضريبية عند الاقتضاء) في صفحة الكتالوج وفي محادثة واتساب.</p>' +
          '<h4>استخدام الكتالوج</h4><p>المحتوى إعلامي وقد يتغير دون إشعار. الأسعار المعروضة لا تشكّل عرضًا تعاقديًا حتى يؤكد المتجر الطلب.</p>' +
          '<h4>الملكية الفكرية</h4><p>الصور والنصوص مسؤولية المتجر، الذي يقر بحقه في استخدامها.</p>' +
          '<h4>المسؤولية</h4><p>لا تتدخل المنصة في البيع أو الدفع. تُوجَّه أي شكوى إلى المتجر.</p>'
      },
      privacy: {
        title: 'سياسة الخصوصية',
        body:
          '<p class="policy-meta">آخر تحديث: يناير 2026</p>' +
          '<p>توضح هذه السياسة البيانات الشخصية التي نجمعها عند استخدام الكتالوج والمساعد، والغرض منها، وحقوقك.</p>' +
          '<h4>البيانات التي نجمعها</h4><ul><li>بيانات الطلب: الاسم والهاتف والعنوان والمدينة والملاحظات إن قدمتها.</li><li>بيانات المساعد: الاسم والهاتف وما تحتاجه.</li><li>بيانات تقنية: تفضيل اللغة وسلة الطلبات.</li></ul>' +
          '<h4>الغرض</h4><p>إدارة طلبك أو استفسارك، والتواصل معك عبر واتساب، والمتابعة. لا نبيع بياناتك ولا نشاركها لأغراض إعلانية.</p>' +
          '<h4>الأساس القانوني</h4><p>موافقتك عند إرسال الطلب أو بياناتك، والمصلحة المشروعة للمتجر في معالجة طلبك.</p>' +
          '<h4>مدة الحفظ</h4><p>طوال المدة اللازمة لمعالجة الطلب والمهل القانونية المعمول بها.</p>' +
          '<h4>حقوقك</h4><p>الاطلاع والتصحيح والحذف والاعتراض والتقييد ونقل البيانات. يمكنك ممارستها بالتواصل مع المتجر عبر واتساب.</p>' +
          '<h4>الأمان</h4><p>نطبق تدابير تقنية معقولة مع تقييد الوصول إلى المتجر صاحب الكتالوج.</p>'
      },
      cookies: {
        title: 'سياسة ملفات تعريف الارتباط',
        body:
          '<p class="policy-meta">آخر تحديث: يناير 2026</p>' +
          '<p>يستخدم هذا الموقع التخزين المحلي في المتصفح لتذكر تفضيلاتك. لا نستخدم ملفات إعلانية أو تتبعًا من أطراف ثالثة.</p>' +
          '<h4>ما نحفظه</h4><ul><li>اللغة: للحفاظ على اللغة التي اخترتها.</li><li>السلة والجلسة: للحفاظ على طلبك أثناء التنقل.</li><li>ذاكرة التطبيق: لتحميل أسرع.</li></ul>' +
          '<h4>كيفية إلغائها</h4><p>يمكنك حذف هذه البيانات من إعدادات المتصفح، وستفقد عندها السلة وتفضيلاتك.</p>'
      },
      terms: {
        title: 'الشروط والأحكام',
        body:
          '<p class="policy-meta">آخر تحديث: يناير 2026</p>' +
          '<h4>1. الغرض</h4><p>تنظّم استخدام الكتالوج الرقمي وإرسال الطلبات عبر واتساب.</p>' +
          '<h4>2. الطلبات</h4><p>الطلب مجرد طلب، ويُعتبر مؤكدًا عند قبول المتجر له. ويمكن للمتجر رفضه لنفاد المخزون أو خطأ في السعر أو عدم التوفر.</p>' +
          '<h4>3. الأسعار</h4><p>تُعرض بعملة المتجر. وتظهر رسوم التوصيل، إن وُجدت، قبل إرسال الطلب.</p>' +
          '<h4>4. الدفع</h4><p>يُتفق عليه مباشرة مع المتجر بالوسائل المذكورة. ولا تعالج المنصة أي مدفوعات.</p>' +
          '<h4>5. التوفر</h4><p>الصور إرشادية وقد يختلف المنتج النهائي قليلًا.</p>' +
          '<h4>6. المسؤولية</h4><p>المتجر مسؤول عن الالتزام بالأنظمة المطبقة على منتجاته أو خدماته.</p>'
      },
      returns: {
        title: 'سياسة الإرجاع',
        body:
          '<p class="policy-meta">آخر تحديث: يناير 2026</p>' +
          '<h4>المدة</h4><p>ما لم ينص القانون على غير ذلك، لديك 14 يومًا من الاستلام لطلب إرجاع منتج غير قابل للتلف.</p>' +
          '<h4>الشروط</h4><ul><li>أن يكون المنتج غير مستعمل وبعبوته الأصلية.</li><li>الاحتفاظ بإثبات الطلب أو المحادثة.</li><li>لا يشمل المنتجات المخصصة أو القابلة للتلف أو منتجات النظافة المفتوحة.</li></ul>' +
          '<h4>كيفية الطلب</h4><p>راسل واتساب المتجر مبيّنًا اسمك والمنتج والسبب.</p>' +
          '<h4>الاسترداد</h4><p>يتم بنفس وسيلة الدفع المتفق عليها بعد التحقق من حالة المنتج.</p>'
      },
      shipping: {
        title: 'سياسة التوصيل',
        body:
          '<p class="policy-meta">آخر تحديث: يناير 2026</p>' +
          '<h4>الطرق</h4><p>توصيل إلى المنزل أو استلام من المتجر أو تنسيق مباشر عبر واتساب، حسب إعداد الكتالوج.</p>' +
          '<h4>المناطق والمهل</h4><p>تُتفق مع المتجر عند تأكيد الطلب، والمهل تقديرية.</p>' +
          '<h4>التكاليف</h4><p>إن وُجدت رسوم توصيل تظهر في الكتالوج وتُضاف إلى المجموع قبل إرسال الطلب.</p>' +
          '<h4>الاستلام</h4><p>راجع طلبك عند الاستلام وأبلغ عن أي مشكلة عبر واتساب في أقرب وقت.</p>'
      }
    }
  };

  function open(key) {
    var lang = (CW.i18n && CW.i18n.lang) || 'es';
    var pack = POLICIES[lang] || POLICIES.es;
    var p = pack[key] || POLICIES.es[key];
    if (!p) return;
    CW.modal({
      className: 'policy-modal',
      title: p.title,
      html: p.body,
      footer: '<button class="btn primary" data-close>' + CW.i18n.t('common.close') + '</button>'
    });
  }

  CW.policies = { open: open, list: POLICIES };

  // Delegación de eventos: los pies que se generan después del arranque
  // (catálogo público, login, paneles) abren el pop-up sin volver a enlazar.
  document.addEventListener('click', function (e) {
    var node = e.target;
    while (node && node !== document) {
      if (node.getAttribute && node.getAttribute('data-policy')) {
        e.preventDefault();
        open(node.getAttribute('data-policy'));
        return;
      }
      node = node.parentNode;
    }
  });
})(window, document);
