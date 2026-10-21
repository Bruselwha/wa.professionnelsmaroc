/* ==========================================================================
   WA Professionnels Maroc · panel-i18n.js
   Traducción del panel del negocio al francés y árabe.
   Funciona sobre los textos que aún están fijos en español: los detecta y los
   sustituye según el idioma activo, y los restaura al volver al español.
   No toca datos del usuario (tablas, campos, contenido marcado con data-no-i18n).
   Solo lo carga dashboard.html.
   ========================================================================== */
(function (window, document) {
  'use strict';
  var CW = window.CW;

  var DICT = {
    fr: {
      // Pedidos
      'Desde': 'Depuis', 'Hasta': 'Jusqu’à',
      // Ventas
      '7 días': '7 jours', '30 días': '30 jours', '365 días': '365 jours',
      'Facturado': 'Facturé', 'Pedidos': 'Commandes', 'Ticket medio': 'Panier moyen',
      'Pendientes': 'En attente', 'Ventas por día': 'Ventes par jour', 'Fecha': 'Date',
      'Total': 'Total', 'Productos más vendidos': 'Produits les plus vendus',
      // Productos y categorías
      '¿Eliminar este artículo?': 'Supprimer cet article ?',
      '¿Eliminar categoría?': 'Supprimer la catégorie ?',
      'Ej. Arroz extra 5 kg': 'Ex. Riz extra 5 kg', 'Ej. 2 horas': 'Ex. 2 heures',
      'Ej. A domicilio': 'Ex. À domicile', 'Ej. Abarrotes': 'Ex. Épicerie',
      'Información': 'Informations', 'Precios del producto': 'Prix du produit',
      'URL del producto': 'URL du produit', 'Seleccionar archivo': 'Choisir un fichier',
      'Color de marca': 'Couleur de la marque',
      // Ajustes · información
      'País': 'Pays', 'Región': 'Région', 'Ciudad': 'Ville', 'Zona horaria': 'Fuseau horaire',
      // Ajustes · WhatsApp
      'NÚMERO DE WHATSAPP': 'NUMÉRO WHATSAPP', 'Cambiar número de WhatsApp': 'Changer le numéro WhatsApp',
      'País o región': 'Pays ou région', 'Número de WhatsApp': 'Numéro WhatsApp',
      'Ingresa el número sin el código de país.': 'Saisissez le numéro sans l’indicatif du pays.',
      'Revisar y confirmar': 'Vérifier et confirmer',
      'NÚMERO DE WHATSAPP ACTUAL': 'NUMÉRO WHATSAPP ACTUEL', 'Sin configurar': 'Non configuré',
      'Probar WhatsApp': 'Tester WhatsApp',
      'Abre el chat con el número actualmente guardado.': 'Ouvre la discussion avec le numéro enregistré.',
      'Abrir WhatsApp': 'Ouvrir WhatsApp', 'Configura un número primero.': 'Configurez d’abord un numéro.',
      'Ten en cuenta': 'À savoir',
      'Probar WhatsApp solo abre una conversación con el número guardado. No verifica que el número te pertenezca.':
        'Tester WhatsApp ouvre seulement une discussion avec le numéro enregistré. Cela ne vérifie pas que le numéro vous appartient.',
      'Revisa el número de WhatsApp.': 'Vérifiez le numéro WhatsApp.',
      // Ajustes · moneda / enlace / presentación
      '⚠️ Este cambio requiere revisión de precios.': '⚠️ Ce changement nécessite une révision des prix.',
      'Confirmo el cambio y que revisaré los precios.': 'Je confirme le changement et je vérifierai les prix.',
      'Mostrar encabezado visual': 'Afficher un en-tête visuel', 'Título': 'Titre',
      'Imagen del encabezado': 'Image de l’en-tête',
      // Ajustes · entrega
      'ENTREGA': 'LIVRAISON', 'Modalidad de entrega': 'Mode de livraison',
      'Elige si coordinarás la entrega directamente por WhatsApp o si quieres definir las modalidades disponibles.':
        'Choisissez si vous coordonnez la livraison directement par WhatsApp ou si vous définissez les modalités disponibles.',
      'Coordinar por WhatsApp': 'Coordonner par WhatsApp',
      'Los detalles de entrega o recojo se coordinarán directamente con el cliente por WhatsApp.':
        'Les détails de livraison ou de retrait seront convenus directement avec le client par WhatsApp.',
      'Definir modalidades de entrega': 'Définir les modes de livraison',
      'Selecciona las modalidades que estarán disponibles para el cliente.':
        'Sélectionnez les modes disponibles pour le client.',
      'Retiro': 'Retrait',
      'El cliente coordina el retiro de su pedido directamente con el negocio.':
        'Le client coordonne le retrait de sa commande directement avec le commerce.',
      'Delivery': 'Livraison',
      'El cliente indica una dirección y coordina los detalles del delivery por WhatsApp.':
        'Le client indique une adresse et coordonne les détails de la livraison par WhatsApp.',
      'Tarifa de entrega': 'Frais de livraison', 'Plazo estimado': 'Délai estimé',
      'Notas de entrega': 'Notes de livraison',
      // Ajustes · SEO
      'TU CATÁLOGO': 'VOTRE CATALOGUE', 'Título y descripción': 'Titre et description',
      'Explica en pocas palabras qué vendes y qué encontrará el cliente. Los colores son una guía, no una obligación.':
        'Expliquez en quelques mots ce que vous vendez et ce que le client trouvera. Les couleurs sont indicatives.',
      'Título para buscadores y redes': 'Titre pour les moteurs et les réseaux',
      'caracteres': 'caractères',
      'Sugerencia: incluye tu nombre comercial y lo que vendes. Como guía visual, 30–60 caracteres suele ser una longitud clara.':
        'Conseil : incluez votre nom commercial et ce que vous vendez. À titre indicatif, 30–60 caractères est une longueur claire.',
      'Descripción': 'Description',
      'Como guía, 120–160 caracteres suele dar un buen contexto. Google puede recortar o generar su propio fragmento según la búsqueda.':
        'À titre indicatif, 120–160 caractères donnent un bon contexte. Google peut raccourcir ou générer son propre extrait.',
      '¿No sabes qué escribir todavía? Puedes dejar los campos vacíos. Usaremos automáticamente el nombre y la descripción de tu negocio para que el catálogo conserve información básica.':
        'Vous ne savez pas encore quoi écrire ? Laissez les champs vides. Nous utiliserons automatiquement le nom et la description de votre commerce.',
      'IMAGEN AL COMPARTIR': 'IMAGE DE PARTAGE', 'Imagen para redes y mensajería': 'Image pour les réseaux et la messagerie',
      'Puedes elegir una imagen especial para compartir. Si no eliges una, solo utilizaremos la imagen destacada de tu catálogo si existe.':
        'Vous pouvez choisir une image spéciale pour le partage. Sinon, nous utiliserons l’image principale de votre catalogue si elle existe.',
      'Sin imagen personalizada': 'Aucune image personnalisée',
      'Puedes agregar una si quieres controlar exactamente qué imagen se comparte.':
        'Vous pouvez en ajouter une pour contrôler exactement l’image partagée.',
      'Agregar imagen personalizada': 'Ajouter une image personnalisée',
      'Recomendado: 1200 × 630 px. JPG, PNG o WebP · máximo 5 MB. La optimizamos y la guardamos como JPEG progresivo 1200 × 630.':
        'Recommandé : 1200 × 630 px. JPG, PNG ou WebP · maximum 5 Mo. Nous l’optimisons et l’enregistrons en JPEG progressif 1200 × 630.',
      'Agregar imagen': 'Ajouter une image', 'RESPALDO AUTOMÁTICO': 'IMAGE DE SECOURS',
      'AUTOMÁTICA': 'AUTOMATIQUE', 'Imagen destacada del catálogo': 'Image principale du catalogue',
      'Como no tienes una imagen SEO personalizada, esta imagen destacada se utilizará automáticamente cuando una plataforma solicite una imagen para tu catálogo.':
        'Comme vous n’avez pas d’image SEO personnalisée, cette image principale sera utilisée automatiquement lorsqu’une plateforme demande une image.',
      'Guardar SEO': 'Enregistrer le SEO', 'VISTA PREVIA': 'APERÇU',
      'Así puede verse tu enlace': 'Voici à quoi peut ressembler votre lien',
      'La tarjeta cambia en tiempo real mientras escribes. Cada plataforma decide el diseño final.':
        'La carte change en temps réel pendant la saisie. Chaque plateforme décide de la mise en page finale.',
      'Sin imagen': 'Sans image',
      'Hacemos la parte técnica': 'Nous gérons la partie technique',
      'Generamos automáticamente título, meta descripción, URL canónica, Open Graph y tarjeta grande para X/Twitter. Tú solo completas el contenido.':
        'Nous générons automatiquement le titre, la méta description, l’URL canonique, Open Graph et la grande carte pour X/Twitter. Vous complétez le contenu.',
      'Si cambias el texto o la imagen': 'Si vous changez le texte ou l’image',
      'En tu catálogo el cambio queda activo al guardar. Google y las redes sociales pueden seguir mostrando durante un tiempo una versión anterior porque usan cachés propias. No necesitas limpiar la caché de la aplicación.':
        'Dans votre catalogue, le changement est actif dès l’enregistrement. Google et les réseaux peuvent afficher une ancienne version pendant un temps (caches propres). Vous n’avez pas à vider le cache de l’application.',
      'Volver a configuración': 'Retour à la configuration',
      // Países y monedas
      'Marruecos (+212)': 'Maroc (+212)', 'España (+34)': 'Espagne (+34)', 'Francia (+33)': 'France (+33)',
      'Argelia (+213)': 'Algérie (+213)', 'Túnez (+216)': 'Tunisie (+216)', 'Egipto (+20)': 'Égypte (+20)',
      'Arabia Saudí (+966)': 'Arabie saoudite (+966)', 'Emiratos Árabes (+971)': 'Émirats arabes unis (+971)',
      'Senegal (+221)': 'Sénégal (+221)', 'Costa de Marfil (+225)': 'Côte d’Ivoire (+225)',
      'Estados Unidos (+1)': 'États-Unis (+1)', 'Reino Unido (+44)': 'Royaume-Uni (+44)',
      'Alemania (+49)': 'Allemagne (+49)', 'Italia (+39)': 'Italie (+39)',
      'Bélgica (+32)': 'Belgique (+32)', 'Países Bajos (+31)': 'Pays-Bas (+31)',
      'dirham marroquí (MAD)': 'dirham marocain (MAD)', 'euro (EUR)': 'euro (EUR)',
      'dólar (USD)': 'dollar (USD)', 'dinar argelino (DZD)': 'dinar algérien (DZD)',
      'dinar tunecino (TND)': 'dinar tunisien (TND)', 'libra egipcia (EGP)': 'livre égyptienne (EGP)',
      'rial saudí (SAR)': 'riyal saoudien (SAR)', 'dirham de EAU (AED)': 'dirham des Émirats (AED)',
      'franco CFA (XOF)': 'franc CFA (XOF)',
      // Cabeceras de configuración
      'Información del negocio': 'Informations du commerce',
      'Nombre, descripción, ubicación y zona horaria.': 'Nom, description, localisation et fuseau horaire.',
      'WhatsApp del negocio': 'WhatsApp du commerce',
      'Define el número de WhatsApp al que tus clientes enviarán sus pedidos.': 'Définissez le numéro WhatsApp auquel vos clients enverront leurs commandes.',
      'Marca del negocio': 'Marque du commerce',
      'Elige el logotipo y el color principal de tu catálogo.': 'Choisissez le logo et la couleur principale de votre catalogue.',
      'Moneda': 'Devise',
      'Define la moneda con la que trabajará tu catálogo.': 'Définissez la devise de votre catalogue.',
      'Enlace del catálogo': 'Lien du catalogue',
      'El enlace que compartes para que tus clientes abran tu catálogo.': 'Le lien que vous partagez pour que vos clients ouvrent votre catalogue.',
      'Presentación del catálogo': 'Présentation du catalogue',
      'Título, descripción e imagen del encabezado público.': 'Titre, description et image de l’en-tête public.',
      'Entrega': 'Livraison',
      'Define cómo coordinarás la entrega o el retiro de los pedidos con tus clientes.': 'Définissez comment vous coordonnerez la livraison ou le retrait des commandes.',
      'Formas de pago': 'Moyens de paiement',
      'Opciones que el cliente puede indicar al hacer su pedido.': 'Options que le client peut indiquer lors de sa commande.',
      'Horarios': 'Horaires',
      'Días y horas en que atiendes.': 'Jours et heures d’ouverture.',
      'SEO y compartir': 'SEO et partage',
      'Mejora cómo se presenta tu catálogo en buscadores y cuando compartes tu enlace. Tú eliges el contenido; nosotros nos encargamos de las etiquetas técnicas.': 'Améliorez la présentation de votre catalogue dans les moteurs de recherche et lors du partage. Vous choisissez le contenu ; nous gérons les balises techniques.',
      // Admin
      '¿Eliminar este negocio y todos sus datos?': 'Supprimer ce commerce et toutes ses données ?',
      '¿Transferir la propiedad de': 'Transférer la propriété de',
      'a': 'à',
      'Plan': 'Forfait', 'Límite': 'Limite',
      // Plan
      'Hasta': 'Jusqu’à', 'productos': 'produits', 'MB de imágenes': 'Mo d’images',
      'Pedidos por WhatsApp': 'Commandes par WhatsApp', '3 idiomas': '3 langues',
      'Reservas y agenda': 'Réservations et agenda', 'Exportación CSV': 'Export CSV',
      // Cuenta
      'Enviado': 'Envoyé', 'ELIMINAR': 'SUPPRIMER',
      // Onboarding
      'Color': 'Couleur', 'Tarifa': 'Frais', 'Plazo': 'Délai', 'Región': 'Région',
      // Genéricos
      'Abrir chat': 'Ouvrir la discussion', 'Sin categoría': 'Sans catégorie',
      'Productos': 'Produits', 'Servicios': 'Services', 'Producto': 'Produit', 'Servicio': 'Service',
      'Activo': 'Actif', 'Inactivo': 'Inactif'
    },

    ar: {
      // Pedidos
      'Desde': 'من', 'Hasta': 'إلى',
      // Ventas
      '7 días': '7 أيام', '30 días': '30 يومًا', '365 días': '365 يومًا',
      'Facturado': 'المفوتر', 'Pedidos': 'الطلبات', 'Ticket medio': 'متوسط الطلب',
      'Pendientes': 'المعلّقة', 'Ventas por día': 'المبيعات اليومية', 'Fecha': 'التاريخ',
      'Total': 'المجموع', 'Productos más vendidos': 'الأكثر مبيعًا',
      // Productos y categorías
      '¿Eliminar este artículo?': 'هل تريد حذف هذا العنصر؟',
      '¿Eliminar categoría?': 'هل تريد حذف الفئة؟',
      'Ej. Arroz extra 5 kg': 'مثال: أرز إضافي 5 كغ', 'Ej. 2 horas': 'مثال: ساعتان',
      'Ej. A domicilio': 'مثال: إلى المنزل', 'Ej. Abarrotes': 'مثال: بقالة',
      'Información': 'معلومات', 'Precios del producto': 'أسعار المنتج',
      'URL del producto': 'رابط المنتج', 'Seleccionar archivo': 'اختيار ملف',
      'Color de marca': 'لون العلامة',
      // Ajustes · información
      'País': 'الدولة', 'Región': 'المنطقة', 'Ciudad': 'المدينة', 'Zona horaria': 'المنطقة الزمنية',
      // Ajustes · WhatsApp
      'NÚMERO DE WHATSAPP': 'رقم واتساب', 'Cambiar número de WhatsApp': 'تغيير رقم واتساب',
      'País o región': 'الدولة أو المنطقة', 'Número de WhatsApp': 'رقم واتساب',
      'Ingresa el número sin el código de país.': 'أدخل الرقم بدون رمز الدولة.',
      'Revisar y confirmar': 'مراجعة وتأكيد',
      'NÚMERO DE WHATSAPP ACTUAL': 'رقم واتساب الحالي', 'Sin configurar': 'غير مُعد',
      'Probar WhatsApp': 'تجربة واتساب',
      'Abre el chat con el número actualmente guardado.': 'يفتح المحادثة مع الرقم المحفوظ.',
      'Abrir WhatsApp': 'فتح واتساب', 'Configura un número primero.': 'قم بإعداد رقم أولًا.',
      'Ten en cuenta': 'خذ بالاعتبار',
      'Probar WhatsApp solo abre una conversación con el número guardado. No verifica que el número te pertenezca.':
        'تجربة واتساب تفتح محادثة مع الرقم المحفوظ فقط، ولا تتحقق من ملكيتك للرقم.',
      'Revisa el número de WhatsApp.': 'راجع رقم واتساب.',
      // Ajustes · moneda / enlace / presentación
      '⚠️ Este cambio requiere revisión de precios.': '⚠️ يتطلب هذا التغيير مراجعة الأسعار.',
      'Confirmo el cambio y que revisaré los precios.': 'أؤكد التغيير وأنني سأراجع الأسعار.',
      'Mostrar encabezado visual': 'إظهار ترويسة بصرية', 'Título': 'العنوان',
      'Imagen del encabezado': 'صورة الترويسة',
      // Ajustes · entrega
      'ENTREGA': 'التوصيل', 'Modalidad de entrega': 'طريقة التوصيل',
      'Elige si coordinarás la entrega directamente por WhatsApp o si quieres definir las modalidades disponibles.':
        'اختر ما إذا كنت ستنسّق التوصيل مباشرة عبر واتساب أو ستحدد الطرق المتاحة.',
      'Coordinar por WhatsApp': 'التنسيق عبر واتساب',
      'Los detalles de entrega o recojo se coordinarán directamente con el cliente por WhatsApp.':
        'سيتم تنسيق تفاصيل التوصيل أو الاستلام مباشرة مع العميل عبر واتساب.',
      'Definir modalidades de entrega': 'تحديد طرق التوصيل',
      'Selecciona las modalidades que estarán disponibles para el cliente.':
        'اختر الطرق المتاحة للعميل.',
      'Retiro': 'الاستلام',
      'El cliente coordina el retiro de su pedido directamente con el negocio.':
        'ينسّق العميل استلام طلبه مباشرة مع المتجر.',
      'Delivery': 'التوصيل',
      'El cliente indica una dirección y coordina los detalles del delivery por WhatsApp.':
        'يحدد العميل عنوانًا وينسّق تفاصيل التوصيل عبر واتساب.',
      'Tarifa de entrega': 'رسوم التوصيل', 'Plazo estimado': 'المدة التقديرية',
      'Notas de entrega': 'ملاحظات التوصيل',
      // Ajustes · SEO
      'TU CATÁLOGO': 'كتالوجك', 'Título y descripción': 'العنوان والوصف',
      'Explica en pocas palabras qué vendes y qué encontrará el cliente. Los colores son una guía, no una obligación.':
        'اشرح بإيجاز ما تبيعه وما سيجده العميل. الألوان إرشادية فقط.',
      'Título para buscadores y redes': 'العنوان لمحركات البحث والشبكات',
      'caracteres': 'حرفًا',
      'Sugerencia: incluye tu nombre comercial y lo que vendes. Como guía visual, 30–60 caracteres suele ser una longitud clara.':
        'اقتراح: أضف اسمك التجاري وما تبيعه. كدليل، 30–60 حرفًا طول واضح.',
      'Descripción': 'الوصف',
      'Como guía, 120–160 caracteres suele dar un buen contexto. Google puede recortar o generar su propio fragmento según la búsqueda.':
        'كدليل، 120–160 حرفًا تعطي سياقًا جيدًا. وقد يختصر Google أو يولّد مقتطفًا خاصًا.',
      '¿No sabes qué escribir todavía? Puedes dejar los campos vacíos. Usaremos automáticamente el nombre y la descripción de tu negocio para que el catálogo conserve información básica.':
        'لا تعرف ماذا تكتب بعد؟ يمكنك ترك الحقول فارغة. سنستخدم تلقائيًا اسم متجرك ووصفه للحفاظ على معلومات أساسية.',
      'IMAGEN AL COMPARTIR': 'صورة المشاركة', 'Imagen para redes y mensajería': 'صورة للشبكات والمراسلة',
      'Puedes elegir una imagen especial para compartir. Si no eliges una, solo utilizaremos la imagen destacada de tu catálogo si existe.':
        'يمكنك اختيار صورة خاصة للمشاركة. وإن لم تختر، سنستخدم الصورة الرئيسية لكتالوجك إن وُجدت.',
      'Sin imagen personalizada': 'لا توجد صورة مخصصة',
      'Puedes agregar una si quieres controlar exactamente qué imagen se comparte.':
        'يمكنك إضافتها إذا أردت التحكم بدقة في الصورة التي تُشارك.',
      'Agregar imagen personalizada': 'إضافة صورة مخصصة',
      'Recomendado: 1200 × 630 px. JPG, PNG o WebP · máximo 5 MB. La optimizamos y la guardamos como JPEG progresivo 1200 × 630.':
        'الموصى به: 1200 × 630 بكسل. JPG أو PNG أو WebP · بحد أقصى 5 ميغابايت. نقوم بتحسينها وحفظها بصيغة JPEG تدريجية 1200 × 630.',
      'Agregar imagen': 'إضافة صورة', 'RESPALDO AUTOMÁTICO': 'صورة احتياطية',
      'AUTOMÁTICA': 'تلقائية', 'Imagen destacada del catálogo': 'الصورة الرئيسية للكتالوج',
      'Como no tienes una imagen SEO personalizada, esta imagen destacada se utilizará automáticamente cuando una plataforma solicite una imagen para tu catálogo.':
        'بما أنه لا توجد صورة SEO مخصصة، ستُستخدم هذه الصورة الرئيسية تلقائيًا عندما تطلب منصة ما صورة لكتالوجك.',
      'Guardar SEO': 'حفظ SEO', 'VISTA PREVIA': 'معاينة',
      'Así puede verse tu enlace': 'هكذا قد يبدو رابطك',
      'La tarjeta cambia en tiempo real mientras escribes. Cada plataforma decide el diseño final.':
        'تتغير البطاقة فوريًا أثناء الكتابة، وكل منصة تحدد التصميم النهائي.',
      'Sin imagen': 'بدون صورة',
      'Hacemos la parte técnica': 'نتولى الجانب التقني',
      'Generamos automáticamente título, meta descripción, URL canónica, Open Graph y tarjeta grande para X/Twitter. Tú solo completas el contenido.':
        'نولّد تلقائيًا العنوان ووصف الميتا والرابط الأساسي وOpen Graph وبطاقة كبيرة لـ X/Twitter. وأنت تكمل المحتوى فقط.',
      'Si cambias el texto o la imagen': 'إذا غيّرت النص أو الصورة',
      'En tu catálogo el cambio queda activo al guardar. Google y las redes sociales pueden seguir mostrando durante un tiempo una versión anterior porque usan cachés propias. No necesitas limpiar la caché de la aplicación.':
        'في كتالوجك يصبح التغيير فعالًا عند الحفظ. وقد تعرض Google والشبكات نسخة قديمة لبعض الوقت بسبب ذاكرتها المؤقتة. لا حاجة لمسح ذاكرة التطبيق.',
      'Volver a configuración': 'الرجوع إلى الإعدادات',
      // Países y monedas
      'Marruecos (+212)': 'المغرب (+212)', 'España (+34)': 'إسبانيا (+34)', 'Francia (+33)': 'فرنسا (+33)',
      'Argelia (+213)': 'الجزائر (+213)', 'Túnez (+216)': 'تونس (+216)', 'Egipto (+20)': 'مصر (+20)',
      'Arabia Saudí (+966)': 'السعودية (+966)', 'Emiratos Árabes (+971)': 'الإمارات (+971)',
      'Senegal (+221)': 'السنغال (+221)', 'Costa de Marfil (+225)': 'ساحل العاج (+225)',
      'Estados Unidos (+1)': 'الولايات المتحدة (+1)', 'Reino Unido (+44)': 'المملكة المتحدة (+44)',
      'Alemania (+49)': 'ألمانيا (+49)', 'Italia (+39)': 'إيطاليا (+39)',
      'Bélgica (+32)': 'بلجيكا (+32)', 'Países Bajos (+31)': 'هولندا (+31)',
      'dirham marroquí (MAD)': 'درهم مغربي (MAD)', 'euro (EUR)': 'يورو (EUR)',
      'dólar (USD)': 'دولار (USD)', 'dinar argelino (DZD)': 'دينار جزائري (DZD)',
      'dinar tunecino (TND)': 'دينار تونسي (TND)', 'libra egipcia (EGP)': 'جنيه مصري (EGP)',
      'rial saudí (SAR)': 'ريال سعودي (SAR)', 'dirham de EAU (AED)': 'درهم إماراتي (AED)',
      'franco CFA (XOF)': 'فرنك أفريقي (XOF)',
      // Cabeceras de configuración
      'Información del negocio': 'معلومات المتجر',
      'Nombre, descripción, ubicación y zona horaria.': 'الاسم والوصف والموقع والمنطقة الزمنية.',
      'WhatsApp del negocio': 'واتساب المتجر',
      'Define el número de WhatsApp al que tus clientes enviarán sus pedidos.': 'حدّد رقم واتساب الذي سيرسل إليه عملاؤك طلباتهم.',
      'Marca del negocio': 'علامة المتجر',
      'Elige el logotipo y el color principal de tu catálogo.': 'اختر الشعار واللون الأساسي لكتالوجك.',
      'Moneda': 'العملة',
      'Define la moneda con la que trabajará tu catálogo.': 'حدّد عملة كتالوجك.',
      'Enlace del catálogo': 'رابط الكتالوج',
      'El enlace que compartes para que tus clientes abran tu catálogo.': 'الرابط الذي تشاركه ليفتح عملاؤك كتالوجك.',
      'Presentación del catálogo': 'عرض الكتالوج',
      'Título, descripción e imagen del encabezado público.': 'العنوان والوصف وصورة الترويسة العامة.',
      'Entrega': 'التوصيل',
      'Define cómo coordinarás la entrega o el retiro de los pedidos con tus clientes.': 'حدّد كيفية تنسيق التوصيل أو الاستلام مع عملائك.',
      'Formas de pago': 'طرق الدفع',
      'Opciones que el cliente puede indicar al hacer su pedido.': 'الخيارات التي يمكن للعميل تحديدها عند الطلب.',
      'Horarios': 'ساعات العمل',
      'Días y horas en que atiendes.': 'الأيام والساعات التي تستقبل فيها.',
      'SEO y compartir': 'SEO والمشاركة',
      'Mejora cómo se presenta tu catálogo en buscadores y cuando compartes tu enlace. Tú eliges el contenido; nosotros nos encargamos de las etiquetas técnicas.': 'حسّن ظهور كتالوجك في محركات البحث وعند مشاركة رابطك. أنت تختار المحتوى ونحن نتولى الوسوم التقنية.',
      // Admin
      '¿Eliminar este negocio y todos sus datos?': 'هل تريد حذف هذا المتجر وكل بياناته؟',
      '¿Transferir la propiedad de': 'نقل ملكية',
      'a': 'إلى',
      'Plan': 'الخطة', 'Límite': 'الحد',
      // Plan
      'Hasta': 'حتى', 'productos': 'منتجًا', 'MB de imágenes': 'ميغابايت من الصور',
      'Pedidos por WhatsApp': 'طلبات عبر واتساب', '3 idiomas': '3 لغات',
      'Reservas y agenda': 'الحجوزات والمواعيد', 'Exportación CSV': 'تصدير CSV',
      // Cuenta
      'Enviado': 'تم الإرسال', 'ELIMINAR': 'حذف',
      // Onboarding
      'Color': 'اللون', 'Tarifa': 'الرسوم', 'Plazo': 'المدة', 'Región': 'المنطقة',
      // Genéricos
      'Abrir chat': 'فتح المحادثة', 'Sin categoría': 'بدون فئة',
      'Productos': 'منتجات', 'Servicios': 'خدمات', 'Producto': 'منتج', 'Servicio': 'خدمة',
      'Activo': 'نشط', 'Inactivo': 'غير نشط'
    }
  };

  var SKIP = 'script,style,input,textarea,td,[data-no-i18n],.lang-dd,.asst,.pc-name,.item-body';
  var ATTRS = ['placeholder', 'aria-label', 'title'];

  function walk(root, fn) {
    var walker = document.createTreeWalker(root, window.NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        if (!p || !n.nodeValue || !n.nodeValue.trim()) return window.NodeFilter.FILTER_REJECT;
        if (p.closest(SKIP)) return window.NodeFilter.FILTER_REJECT;
        return window.NodeFilter.FILTER_ACCEPT;
      }
    });
    var out = [];
    while (walker.nextNode()) out.push(walker.currentNode);
    out.forEach(fn);
  }

  function apply(root) {
    root = root || document.body;
    if (!root || !root.querySelectorAll) return;
    var lang = (CW.i18n && CW.i18n.lang) || 'es';
    var pack = DICT[lang] || null;

    // 1) Texto
    walk(root, function (n) {
      if (n._es != null) { n.nodeValue = n._es; n._es = null; }
      if (!pack) return;
      var raw = n.nodeValue, key = raw.trim(), tr = pack[key];
      if (tr) { n._es = raw; n.nodeValue = raw.replace(key, tr); }
    });

    // 2) Atributos
    var els = root.querySelectorAll('[placeholder],[aria-label],[title]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.closest(SKIP)) continue;
      for (var j = 0; j < ATTRS.length; j++) {
        var a = ATTRS[j];
        var stored = el['_es_' + a];
        if (stored != null) { el.setAttribute(a, stored); el['_es_' + a] = null; }
        if (!pack) continue;
        var v = el.getAttribute(a);
        if (!v) continue;
        var k = v.trim(), tr2 = pack[k];
        if (tr2) { el['_es_' + a] = v; el.setAttribute(a, v.replace(k, tr2)); }
      }
    }
  }

  CW.panelI18n = { apply: apply, dict: DICT };

  document.addEventListener('DOMContentLoaded', function () {
    apply(document.body);
    // Traduce también lo que se añada después (modales, vistas, toasts)
    var obs = new MutationObserver(function (muts) {
      if (((CW.i18n && CW.i18n.lang) || 'es') === 'es') return;
      for (var i = 0; i < muts.length; i++) {
        var added = muts[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (n.nodeType === 1) apply(n);
        }
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    // Al cambiar de idioma, reaplica sobre todo
    window.addEventListener('cw:lang', function () { apply(document.body); });
  });
})(window, document);
