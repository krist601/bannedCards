import { contactEmail, instagramHandle, instagramUrl, joinNames, paymentProviders, shippingProviders, siteName } from "./site";
import type { Locale } from "@/presentation/locale-provider";

export type PageSection = { id?: string; heading: string; paragraphs?: string[]; items?: string[]; after?: string[]; links?: { label: string; href: string }[] };
export type PageContent = { title: string; updated?: string; intro?: string; sections: PageSection[]; questions?: string; numbered?: boolean };
export type SitePageKey = "about" | "terms" | "contact";

const email = contactEmail;

const aboutEs: PageContent = {
  title: "Acerca de nosotros",
  intro: "Una tienda en línea de cartas coleccionables hecha por jugadores, para jugadores.",
  numbered: false,
  sections: [
    {
      heading: "¿Quiénes somos?",
      paragraphs: [
        `${siteName} es una pequeña empresa familiar chilena dedicada a las cartas coleccionables, con foco en Magic: The Gathering. Nacimos del hobby: de armar mazos, buscar esa carta que falta y compartir la pasión por el juego.`,
        "Hoy atendemos a jugadores y coleccionistas de todo Chile con un catálogo ordenado, precios claros y stock real, para que compres exactamente lo que ves.",
      ],
    },
    {
      heading: "¿Qué ofrecemos?",
      items: [
        "Cartas sueltas de Magic: The Gathering, con su condición, idioma y acabado indicados en cada ficha.",
        "Productos sellados: sobres, cajas, mazos preconstruidos y más.",
        "Productos hechos por nosotros: mazos personalizados y packs de tokens.",
        "Accesorios para jugar: fundas, dados y complementos.",
        "Compramos tu colección: si quieres darle un nuevo hogar a tus cartas, revisa nuestras tarifas de compra.",
      ],
    },
    {
      heading: "¿Por qué elegirnos?",
      items: [
        "Stock real: lo que ves disponible es lo que tenemos, y lo reservamos cuando compras.",
        "Descripciones honestas: informamos la condición de cada carta para que no haya sorpresas.",
        `Despacho a todo Chile con ${joinNames(shippingProviders, "es")}.`,
        "Atención cercana: somos jugadores y con gusto te asesoramos.",
      ],
    },
    {
      heading: "Contáctanos",
      paragraphs: ["Estamos para ayudarte con tus compras, dudas sobre una carta o ventas de colecciones."],
      links: [{ label: email, href: `mailto:${email}` }, { label: instagramHandle, href: instagramUrl }],
    },
  ],
};

const aboutEn: PageContent = {
  title: "About us",
  intro: "An online collectible card store made by players, for players.",
  numbered: false,
  sections: [
    {
      heading: "Who we are",
      paragraphs: [
        `${siteName} is a small Chilean family business dedicated to collectible cards, focused on Magic: The Gathering. We grew out of the hobby: building decks, hunting for that missing card and sharing the love of the game.`,
        "Today we serve players and collectors all over Chile with a tidy catalogue, clear prices and real stock, so you buy exactly what you see.",
      ],
    },
    {
      heading: "What we offer",
      items: [
        "Magic: The Gathering singles, with condition, language and finish shown on every listing.",
        "Sealed products: booster packs, boxes, preconstructed decks and more.",
        "Products made by us: custom decks and token packs.",
        "Accessories for playing: sleeves, dice and extras.",
        "We buy your collection: if you want to give your cards a new home, check our buying rates.",
      ],
    },
    {
      heading: "Why choose us",
      items: [
        "Real stock: what you see as available is what we have, and we reserve it when you buy.",
        "Honest descriptions: we state each card's condition so there are no surprises.",
        `Delivery across Chile with ${joinNames(shippingProviders, "en")}.`,
        "Friendly service: we are players too and happy to advise you.",
      ],
    },
    {
      heading: "Contact us",
      paragraphs: ["We are here to help with your purchases, questions about a card or selling your collection."],
      links: [{ label: email, href: `mailto:${email}` }, { label: instagramHandle, href: instagramUrl }],
    },
  ],
};

const termsEs: PageContent = {
  title: "Términos y Condiciones",
  updated: "Última actualización: octubre de 2026",
  intro: `Estas condiciones regulan el uso del sitio web de ${siteName} y las compras que realices en él. Léelas con calma: son parte de tu contrato con nosotros.`,
  sections: [
    {
      heading: "Aceptación de los términos",
      paragraphs: ["Al usar este sitio y al comprar en él aceptas estos Términos y Condiciones. Si no estás de acuerdo con alguna parte, te pedimos que no utilices el sitio."],
    },
    {
      heading: "Productos, precios y disponibilidad",
      paragraphs: [
        "Todos los precios están expresados en pesos chilenos (CLP). Podemos modificarlos en cualquier momento, pero el precio que ves al confirmar tu pedido es el que se aplica a esa compra.",
        "Cada carta se vende en la condición indicada en su ficha (por ejemplo Near Mint, Lightly Played, etc.), con el idioma y el acabado (normal o foil) que se muestran. Las imágenes son referenciales.",
        "Los productos están sujetos a disponibilidad. Reservamos el stock al realizar tu pedido; si por un error de inventario un producto no pudiera entregarse, te contactaremos a la brevedad para ofrecerte un reembolso completo o un producto equivalente.",
      ],
    },
    {
      heading: "Cuenta de usuario y proceso de compra",
      paragraphs: [
        "Para comprar necesitas una cuenta. Al crearla debes entregar datos verdaderos y confirmar tu correo electrónico mediante el enlace que te enviamos. Eres responsable de mantener la confidencialidad de tu contraseña y de la actividad realizada con tu cuenta.",
        "Una vez realizado el pedido recibirás un correo con el resumen de tu compra. La compra queda confirmada cuando el pago ha sido aprobado.",
      ],
    },
    {
      heading: "Medios de pago",
      paragraphs: [
        `Los pagos se realizan a través de ${joinNames(paymentProviders, "es")}, que permite pagar con tarjetas de débito y crédito de forma segura. ${siteName} no almacena datos de tarjetas ni información financiera de los clientes.`,
      ],
    },
    {
      id: "envios",
      heading: "Despacho y envíos",
      paragraphs: [
        `Los despachos se realizan a todo Chile a través de ${joinNames(shippingProviders, "es")}. Los plazos de entrega son estimativos y pueden variar según la zona y la disponibilidad de la empresa de transporte.`,
        "El costo de despacho depende del destino y se informa antes de pagar. Preparamos tu pedido con cuidado para que las cartas lleguen protegidas.",
        "Una vez entregado el pedido a la empresa de transporte, las demoras o extravíos son de su responsabilidad; te apoyaremos en el proceso de reclamo si es necesario.",
      ],
    },
    {
      id: "cambios",
      heading: "Cambios, devoluciones y retracto",
      paragraphs: ["Puedes solicitar un cambio o una devolución en los siguientes casos:"],
      items: [
        "Producto equivocado: si recibes un producto distinto al que compraste, lo cambiamos o reembolsamos sin costo para ti.",
        "Producto dañado o distinto a la descripción: avísanos dentro de los primeros días tras recibir tu pedido, con fotos, y lo resolveremos.",
        "Anulación antes del despacho: puedes pedir la anulación de tu pedido mientras no haya sido enviado.",
        "Derecho de retracto: en las compras a distancia, la Ley N° 19.496 reconoce un plazo para desistir del contrato en los casos y condiciones que ella establece. Escríbenos y revisaremos tu caso.",
      ],
      after: [`Para iniciar una solicitud escríbenos a ${email} indicando tu número de pedido y el motivo.`],
    },
    {
      heading: "Compra de cartas a clientes",
      paragraphs: [
        "Si nos ofreces tus cartas, las evaluamos según su condición y demanda y te enviamos una oferta. No hay obligación de aceptarla. Solo compramos cartas de las que seas legítimo dueño o dueña.",
      ],
    },
    {
      heading: "Propiedad intelectual",
      paragraphs: [
        `Los textos, el diseño y los logotipos de este sitio pertenecen a ${siteName}. Magic: The Gathering, sus cartas, nombres e ilustraciones son propiedad de Wizards of the Coast LLC y de sus respectivos titulares; ${siteName} no está afiliada ni patrocinada por ellos. Las imágenes de cartas se muestran solo para identificar los productos a la venta.`,
      ],
    },
    {
      heading: "Limitación de responsabilidad",
      paragraphs: [
        `${siteName} no responde por interrupciones del servicio ajenas a su control ni por demoras imputables a terceros, como empresas de transporte o procesadores de pago. Esto no limita los derechos que la ley reconoce a los consumidores.`,
      ],
    },
    {
      heading: "Ley aplicable y reclamos",
      paragraphs: [
        "Estos términos se rigen por las leyes de la República de Chile, en especial la Ley N° 19.496 sobre Protección de los Derechos de los Consumidores. Cualquier controversia se someterá a los tribunales competentes. Antes de acudir a ellos, escríbenos para intentar resolverlo; también puedes dirigirte al Servicio Nacional del Consumidor (SERNAC).",
      ],
    },
    {
      heading: "Cambios en estos términos",
      paragraphs: ["Podemos actualizar estos términos. Publicaremos la versión vigente en esta página con su fecha. Las compras ya realizadas se rigen por los términos vigentes al momento de comprar."],
    },
  ],
  questions: `¿Tienes dudas? Escríbenos a ${email}`,
};

const termsEn: PageContent = {
  title: "Terms and Conditions",
  updated: "Last updated: October 2026",
  intro: `These terms govern the use of the ${siteName} website and the purchases you make on it. Please read them carefully: they are part of your agreement with us.`,
  sections: [
    {
      heading: "Acceptance of the terms",
      paragraphs: ["By using this site and buying on it you accept these Terms and Conditions. If you disagree with any part, please do not use the site."],
    },
    {
      heading: "Products, prices and availability",
      paragraphs: [
        "All prices are in Chilean pesos (CLP). We may change them at any time, but the price you see when you confirm your order is the one that applies to that purchase.",
        "Each card is sold in the condition shown on its listing (for example Near Mint, Lightly Played), with the language and finish (regular or foil) displayed. Images are for reference.",
        "Products are subject to availability. We reserve the stock when you place your order; if, because of an inventory error, a product cannot be delivered, we will contact you promptly to offer a full refund or an equivalent product.",
      ],
    },
    {
      heading: "User account and purchase process",
      paragraphs: [
        "You need an account to buy. When creating it you must provide true information and confirm your email through the link we send you. You are responsible for keeping your password confidential and for activity under your account.",
        "After you place an order you will receive an email with your purchase summary. The purchase is confirmed once payment has been approved.",
      ],
    },
    {
      heading: "Payment methods",
      paragraphs: [
        `Payments are made through ${joinNames(paymentProviders, "en")}, which lets you pay securely with debit and credit cards. ${siteName} does not store card data or customers' financial information.`,
      ],
    },
    {
      id: "envios",
      heading: "Delivery and shipping",
      paragraphs: [
        `We deliver across Chile through ${joinNames(shippingProviders, "en")}. Delivery times are estimates and may vary by area and carrier availability.`,
        "The shipping cost depends on the destination and is shown before you pay. We prepare your order carefully so the cards arrive protected.",
        "Once the order has been handed to the carrier, delays or losses are the carrier's responsibility; we will support you with the claim if needed.",
      ],
    },
    {
      id: "cambios",
      heading: "Exchanges, returns and withdrawal",
      paragraphs: ["You can request an exchange or a return in these cases:"],
      items: [
        "Wrong product: if you receive a different product from the one you bought, we exchange or refund it at no cost to you.",
        "Damaged product or different from the description: tell us within the first days after receiving your order, with photos, and we will sort it out.",
        "Cancellation before dispatch: you can ask to cancel your order as long as it has not been shipped.",
        "Right of withdrawal: for distance purchases, Law No. 19.496 recognises a period to withdraw from the contract in the cases and conditions it sets out. Write to us and we will review your case.",
      ],
      after: [`To start a request write to ${email} with your order number and the reason.`],
    },
    {
      heading: "Buying cards from customers",
      paragraphs: [
        "If you offer us your cards, we assess them by condition and demand and send you an offer. You are not obliged to accept it. We only buy cards you legitimately own.",
      ],
    },
    {
      heading: "Intellectual property",
      paragraphs: [
        `The texts, design and logos of this site belong to ${siteName}. Magic: The Gathering, its cards, names and artwork are the property of Wizards of the Coast LLC and their respective owners; ${siteName} is not affiliated with or endorsed by them. Card images are shown only to identify the products for sale.`,
      ],
    },
    {
      heading: "Limitation of liability",
      paragraphs: [
        `${siteName} is not responsible for service interruptions beyond its control or for delays caused by third parties such as carriers or payment processors. This does not limit the rights the law gives consumers.`,
      ],
    },
    {
      heading: "Governing law and complaints",
      paragraphs: [
        "These terms are governed by the laws of the Republic of Chile, especially Law No. 19.496 on Consumer Rights Protection. Any dispute will be submitted to the competent courts. Before going to court, write to us so we can try to resolve it; you may also contact the National Consumer Service (SERNAC).",
      ],
    },
    {
      heading: "Changes to these terms",
      paragraphs: ["We may update these terms. We will publish the current version on this page with its date. Purchases already made are governed by the terms in force when you bought."],
    },
  ],
  questions: `Questions? Write to us at ${email}`,
};

const contactEs: PageContent = {
  title: "Contacto",
  intro: "¿Tienes una consulta sobre un pedido, una carta o quieres venderme tu colección? Escríbenos, con gusto te ayudamos.",
  numbered: false,
  sections: [
    { heading: "Escríbenos", paragraphs: ["Respondemos los correos y mensajes lo antes posible."], links: [{ label: email, href: `mailto:${email}` }, { label: `Instagram ${instagramHandle}`, href: instagramUrl }] },
    { heading: "Cuando nos escribas por un pedido", items: ["Indica tu número de pedido y el correo de tu cuenta.", "Si es por un producto dañado o equivocado, adjunta fotos.", "Si quieres vendernos cartas, cuéntanos qué juego, cantidad aproximada y condición."] },
    { heading: "Información útil", links: [{ label: "Envíos y despachos", href: "/terminos-y-condiciones#envios" }, { label: "Cambios y devoluciones", href: "/terminos-y-condiciones#cambios" }, { label: "Política de privacidad", href: "/politica-de-privacidad" }] },
  ],
};

const contactEn: PageContent = {
  title: "Contact",
  intro: "Have a question about an order or a card, or want to sell us your collection? Write to us, we are happy to help.",
  numbered: false,
  sections: [
    { heading: "Write to us", paragraphs: ["We answer emails and messages as soon as we can."], links: [{ label: email, href: `mailto:${email}` }, { label: `Instagram ${instagramHandle}`, href: instagramUrl }] },
    { heading: "When you write about an order", items: ["Include your order number and the email of your account.", "For a damaged or wrong product, attach photos.", "If you want to sell us cards, tell us the game, approximate quantity and condition."] },
    { heading: "Useful information", links: [{ label: "Shipping and delivery", href: "/terminos-y-condiciones#envios" }, { label: "Exchanges and returns", href: "/terminos-y-condiciones#cambios" }, { label: "Privacy policy", href: "/politica-de-privacidad" }] },
  ],
};

const pages: Record<SitePageKey, Record<Locale, PageContent>> = {
  about: { es: aboutEs, en: aboutEn },
  terms: { es: termsEs, en: termsEn },
  contact: { es: contactEs, en: contactEn },
};
export const sitePage = (key: SitePageKey, locale: Locale): PageContent => pages[key][locale === "en" ? "en" : "es"];
