import { contactEmail, joinNames, paymentProviders, shippingProviders } from "./site";
import type { Locale } from "@/presentation/locale-provider";

type Section = { heading: string; paragraphs?: string[]; items?: string[]; after?: string[] };
type Policy = { title: string; updated: string; intro: string; sections: Section[]; questions: string };

const email = contactEmail;

const es: Policy = {
  title: "Política de Privacidad",
  updated: "Última actualización: octubre de 2026",
  intro: "En Banned Cards queremos que sepas, de forma clara y sin letra chica, qué datos tuyos usamos, para qué y cómo puedes controlarlos.",
  sections: [
    {
      heading: "Responsable del tratamiento",
      paragraphs: [
        "Banned Cards, tienda en línea de cartas coleccionables de Magic: The Gathering con operación en Chile, es la responsable de los datos personales que se recogen a través de este sitio web.",
        "Tratamos tus datos conforme a la Ley N° 19.628 sobre Protección de la Vida Privada y a la Ley N° 19.496 sobre Protección de los Derechos de los Consumidores.",
        `Contacto: ${email}`,
      ],
    },
    {
      heading: "Datos que recopilamos",
      paragraphs: ["Según cómo uses la tienda, podemos recibir los siguientes datos:"],
      items: [
        "Cuenta: nombre, correo electrónico y contraseña. La contraseña se guarda cifrada y nadie del equipo puede verla. Te enviamos un correo para confirmar que la dirección es tuya.",
        "Inicio de sesión con Google: el nombre y el correo verificados de tu cuenta de Google. No accedemos a tu contraseña de Google ni a otra información de tu cuenta.",
        "Pedidos: productos comprados, montos, estado del pedido, teléfono y dirección de despacho (solo si los entregas).",
        "Venta de cartas a la tienda: tus datos de contacto y el detalle de las cartas que nos ofreces, si decides escribirnos para venderlas.",
        "Mensajes: lo que nos escribes cuando pides ayuda o soporte.",
        "Datos técnicos mínimos: dirección IP, tipo de dispositivo y navegador, y registros de errores o seguridad necesarios para que el sitio funcione y se mantenga protegido.",
      ],
      after: [
        `No almacenamos números de tarjeta ni otros datos de pago. Los pagos son procesados por ${joinNames(paymentProviders, "es")}, que aplica sus propias políticas de seguridad y privacidad.`,
      ],
    },
    {
      heading: "Para qué usamos tus datos",
      paragraphs: ["Usamos tus datos únicamente para:"],
      items: [
        "Crear y mantener tu cuenta y tu carrito de compras.",
        "Gestionar, preparar y despachar tus pedidos.",
        "Enviarte confirmaciones y avisos relacionados con tu compra.",
        "Atender consultas, reclamos y servicio postventa.",
        "Prevenir fraudes y proteger la seguridad del sitio.",
        "Cumplir obligaciones legales y tributarias, como la emisión de boletas o facturas.",
      ],
      after: ["No usamos tus datos para publicidad de terceros ni los vendemos."],
    },
    {
      heading: "Base del tratamiento",
      paragraphs: [
        "Tratamos tus datos porque son necesarios para cumplir la compra que haces con nosotros, porque nos diste tu autorización (por ejemplo, al crear una cuenta o iniciar sesión con Google), porque la ley nos lo exige o por nuestro interés legítimo en mantener el sitio seguro. Puedes retirar tu autorización cuando quieras escribiéndonos.",
      ],
    },
    {
      heading: "Con quién compartimos tus datos",
      paragraphs: ["Compartimos solo lo estrictamente necesario con:"],
      items: [
        `${joinNames(paymentProviders, "es")}: procesamiento seguro de los pagos.`,
        `Empresas de transporte (${joinNames(shippingProviders, "es")}): para entregar tu pedido. Reciben tu nombre, dirección y teléfono de contacto.`,
        "Google: únicamente si eliges iniciar sesión con tu cuenta de Google.",
        "Proveedor de envío de correo electrónico: para enviarte el mensaje de confirmación de tu cuenta y avisos de tus pedidos. Recibe tu correo y el contenido del mensaje.",
        "Proveedores de infraestructura tecnológica: alojamiento y respaldos del sitio, que tratan los datos por cuenta nuestra y bajo nuestras instrucciones.",
        "Autoridades: cuando una ley o una orden judicial nos obligue.",
      ],
      after: ["No compartimos tus datos con nadie más."],
    },
    {
      heading: "Transferencias fuera de Chile",
      paragraphs: [
        "Algunos de los proveedores mencionados pueden procesar datos en servidores ubicados fuera de Chile. En esos casos elegimos proveedores reconocidos que aplican medidas de seguridad adecuadas y solo les enviamos los datos necesarios para prestar el servicio.",
      ],
    },
    {
      heading: "Almacenamiento y seguridad",
      paragraphs: [
        "Tus datos se guardan en servidores con acceso restringido y conexión cifrada (HTTPS). Solo el personal autorizado puede entrar al panel de administración, y cada persona tiene permisos limitados a lo que necesita.",
        "Hacemos copias de seguridad cifradas todos los días y las conservamos 14 días. Si eliminas tu cuenta, tus datos pueden permanecer en esas copias hasta que se eliminen automáticamente al cumplirse ese plazo.",
        "Aplicamos medidas técnicas razonables contra accesos no autorizados, pérdida o alteración. Si ocurriera un incidente que afecte tus datos de forma relevante, te avisaremos oportunamente.",
      ],
    },
    {
      heading: "Cuánto tiempo conservamos tus datos",
      items: [
        "Datos de la cuenta: mientras tu cuenta esté activa o hasta que pidas eliminarla.",
        "Datos de pedidos y documentos de venta: durante el plazo que exige la normativa tributaria y comercial (actualmente, hasta seis años).",
        "Mensajes de soporte: el tiempo necesario para resolver tu consulta y atender posibles reclamos.",
      ],
      after: ["Cuando ya no los necesitemos, los eliminamos o los anonimizamos."],
    },
    {
      heading: "Cookies y almacenamiento del navegador",
      paragraphs: [
        "Este sitio no usa cookies publicitarias, de seguimiento ni herramientas de analítica de terceros. Solo utilizamos elementos técnicos que el sitio necesita:",
      ],
      items: [
        "Una cookie de sesión para mantenerte con tu cuenta iniciada.",
        "El identificador de tu carrito, guardado en tu navegador para que no lo pierdas al recargar o volver más tarde.",
        "Tus preferencias de idioma y de tema visual, que se recuerdan por hasta un año.",
      ],
      after: [
        "Puedes borrar estos datos desde la configuración de tu navegador. Si lo haces, tendrás que iniciar sesión de nuevo y tu carrito podría vaciarse.",
      ],
    },
    {
      heading: "Tus derechos",
      paragraphs: ["Conforme a la Ley N° 19.628, puedes en cualquier momento:"],
      items: [
        "Acceder a los datos personales que tenemos sobre ti.",
        "Rectificar datos incorrectos, incompletos o desactualizados.",
        "Eliminar tu cuenta y los datos asociados, salvo los que debamos conservar por ley.",
        "Oponerte al uso de tus datos o pedir su bloqueo temporal.",
      ],
      after: [
        `Para ejercer estos derechos escríbenos a ${email} indicando qué necesitas y el correo de tu cuenta. Podemos pedirte confirmar tu identidad para proteger tu información. Responderemos en un máximo de 15 días hábiles.`,
        "La Ley N° 21.719 sobre protección de datos personales, que comienza a regir en diciembre de 2026, reforzará estos derechos (por ejemplo, con la portabilidad de datos). Cuando entre en vigencia adaptaremos nuestras prácticas a sus exigencias.",
      ],
    },
    {
      heading: "Menores de edad",
      paragraphs: [
        "La tienda no está dirigida a menores de 14 años y no recopilamos sus datos de forma intencional. Si eres menor de 18 años, te pedimos comprar con la autorización de una persona adulta. Si crees que un menor nos entregó datos sin permiso, escríbenos y los eliminaremos.",
      ],
    },
    {
      heading: "Reclamos",
      paragraphs: [
        `Si crees que no respetamos tus derechos, escríbenos primero a ${email} para que podamos resolverlo. También puedes recurrir al Servicio Nacional del Consumidor (SERNAC) por temas de consumo o a los tribunales de justicia, según corresponda.`,
      ],
    },
    {
      heading: "Cambios en esta política",
      paragraphs: [
        "Podemos actualizar esta política cuando cambie nuestra forma de operar o la ley. Publicaremos la versión vigente en esta página con su fecha de actualización y, si el cambio es importante, te lo avisaremos por correo o en la tienda. Te recomendamos revisarla de vez en cuando.",
      ],
    },
  ],
  questions: `¿Tienes dudas? Escríbenos a ${email}`,
};

const en: Policy = {
  title: "Privacy Policy",
  updated: "Last updated: October 2026",
  intro: "At Banned Cards we want you to know, plainly and without fine print, what data of yours we use, why, and how you can control it.",
  sections: [
    {
      heading: "Who is responsible",
      paragraphs: [
        "Banned Cards, an online store for Magic: The Gathering collectible cards operating in Chile, is responsible for the personal data collected through this website.",
        "We process your data under Chilean Law No. 19.628 on the Protection of Private Life and Law No. 19.496 on Consumer Rights.",
        `Contact: ${email}`,
      ],
    },
    {
      heading: "Data we collect",
      paragraphs: ["Depending on how you use the store, we may receive:"],
      items: [
        "Account: name, email and password. The password is stored encrypted and nobody on our team can read it. We email you to confirm the address is yours.",
        "Sign in with Google: the verified name and email of your Google account. We never see your Google password or other account information.",
        "Orders: products bought, amounts, order status, phone number and delivery address (only if you provide them).",
        "Selling cards to the store: your contact details and the list of cards you offer, if you choose to write to us.",
        "Messages: what you write to us when you ask for help or support.",
        "Minimal technical data: IP address, device and browser type, and error or security logs needed to run and protect the site.",
      ],
      after: [
        `We do not store card numbers or other payment details. Payments are processed by ${joinNames(paymentProviders, "en")}, which applies its own security and privacy policies.`,
      ],
    },
    {
      heading: "What we use your data for",
      paragraphs: ["We use your data only to:"],
      items: [
        "Create and maintain your account and shopping cart.",
        "Manage, prepare and ship your orders.",
        "Send you confirmations and notices about your purchase.",
        "Answer questions and complaints and provide after-sales service.",
        "Prevent fraud and protect the security of the site.",
        "Meet legal and tax obligations, such as issuing receipts or invoices.",
      ],
      after: ["We do not use your data for third-party advertising and we never sell it."],
    },
    {
      heading: "Legal basis",
      paragraphs: [
        "We process your data because it is necessary to fulfil the purchase you make with us, because you gave us your consent (for example when creating an account or signing in with Google), because the law requires it, or because of our legitimate interest in keeping the site secure. You can withdraw your consent at any time by writing to us.",
      ],
    },
    {
      heading: "Who we share your data with",
      paragraphs: ["We share only what is strictly necessary with:"],
      items: [
        `${joinNames(paymentProviders, "en")}: secure payment processing.`,
        `Carriers (${joinNames(shippingProviders, "en")}): to deliver your order. They receive your name, address and contact phone.`,
        "Google: only if you choose to sign in with your Google account.",
        "Email delivery provider: to send you your account confirmation message and order notices. It receives your email address and the message content.",
        "Technology infrastructure providers: hosting and backups of the site, who process data on our behalf and under our instructions.",
        "Authorities: when required by law or a court order.",
      ],
      after: ["We do not share your data with anyone else."],
    },
    {
      heading: "Transfers outside Chile",
      paragraphs: [
        "Some of these providers may process data on servers located outside Chile. In those cases we choose reputable providers that apply appropriate security measures, and we send them only the data needed to provide the service.",
      ],
    },
    {
      heading: "Storage and security",
      paragraphs: [
        "Your data is kept on servers with restricted access and encrypted connections (HTTPS). Only authorised staff can enter the administration panel, and each person has permissions limited to what they need.",
        "We make encrypted backups every day and keep them for 14 days. If you delete your account, your data may remain in those backups until they are automatically removed at the end of that period.",
        "We apply reasonable technical measures against unauthorised access, loss or alteration. If an incident significantly affects your data, we will notify you promptly.",
      ],
    },
    {
      heading: "How long we keep your data",
      items: [
        "Account data: while your account is active or until you ask us to delete it.",
        "Order data and sales documents: for the period required by tax and commercial rules (currently up to six years).",
        "Support messages: as long as needed to resolve your request and handle possible complaints.",
      ],
      after: ["When we no longer need it, we delete or anonymise it."],
    },
    {
      heading: "Cookies and browser storage",
      paragraphs: [
        "This site does not use advertising or tracking cookies or third-party analytics tools. We only use technical items the site needs:",
      ],
      items: [
        "A session cookie to keep you signed in.",
        "Your cart identifier, saved in your browser so you do not lose it when you reload or come back later.",
        "Your language and theme preferences, remembered for up to one year.",
      ],
      after: [
        "You can clear this data from your browser settings. If you do, you will need to sign in again and your cart may be emptied.",
      ],
    },
    {
      heading: "Your rights",
      paragraphs: ["Under Law No. 19.628 you can at any time:"],
      items: [
        "Access the personal data we hold about you.",
        "Correct data that is wrong, incomplete or outdated.",
        "Delete your account and associated data, except what we must keep by law.",
        "Object to the use of your data or ask for it to be temporarily blocked.",
      ],
      after: [
        `To exercise these rights write to ${email} telling us what you need and the email of your account. We may ask you to confirm your identity to protect your information. We will reply within 15 business days.`,
        "Law No. 21.719 on personal data protection, which starts to apply in December 2026, will strengthen these rights (for example with data portability). When it takes effect we will adapt our practices to its requirements.",
      ],
    },
    {
      heading: "Minors",
      paragraphs: [
        "The store is not aimed at children under 14 and we do not intentionally collect their data. If you are under 18, please buy with the permission of an adult. If you believe a minor gave us data without permission, write to us and we will delete it.",
      ],
    },
    {
      heading: "Complaints",
      paragraphs: [
        `If you think we did not respect your rights, write to us first at ${email} so we can resolve it. You can also go to the National Consumer Service (SERNAC) for consumer matters, or to the courts, as appropriate.`,
      ],
    },
    {
      heading: "Changes to this policy",
      paragraphs: [
        "We may update this policy when the way we operate or the law changes. We will publish the current version on this page with its update date and, if the change is important, let you know by email or in the store. We recommend reviewing it from time to time.",
      ],
    },
  ],
  questions: `Questions? Write to us at ${email}`,
};

export const privacyPolicy = (locale: Locale): Policy => (locale === "en" ? en : es);
