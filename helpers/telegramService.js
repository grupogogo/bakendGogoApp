const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { jsPDF } = require('jspdf');
const autoTablePlugin = require('jspdf-autotable');

const autoTable = autoTablePlugin.default || autoTablePlugin;

/**
 * Servicio de notificaciones y remisiones a Telegram para Bodega
 * 1. Envío de mensaje único inteligente y ultra compacto para alistamiento
 * 2. Envío de documento PDF "Hoja de Alistamiento y Control de Bodega" organizada por categorías con paneles diferenciadores
 */

/**
 * Mapeo de nombres legibles para las categorías de productos
 */
const buscarNombreCategoria = (categoria) => {
    if (!categoria) return 'GENERAL';
    const cat = String(categoria).toUpperCase().trim();
    switch (cat) {
        case 'KCG': return 'KIT COMUNIÓN GRANDE';
        case 'KCP': return 'KIT COMUNIÓN PEQUEÑO';
        case 'KCE': return 'KIT COMUNIÓN ECONÓMICO';
        case 'KB': return 'KIT DE BAUTIZO';
        case 'CC': return 'CIRIO DE COMUNIÓN';
        case 'CCON': return 'CIRIO DE CONFIRMACIÓN';
        case 'CB': return 'CIRIO DE BAUTIZO';
        case 'BLANCOS':
        case 'GUANTES-BLANCOS':
        case 'GB': return 'GUANTES BLANCOS';
        case 'NEGROS':
        case 'GUANTES-NEGROS':
        case 'GN': return 'GUANTES NEGROS';
        case 'MITON':
        case 'GUANTES-MITON':
        case 'GM': return 'GUANTES MITÓN';
        case 'GUANTES': return 'GUANTES';
        case 'OTR': return 'OTROS PRODUCTOS';
        case 'G': return 'GENERAL';
        default: return categoria;
    }
};

/**
 * Diccionario y helper para obtener el emoji representativo de cada categoría
 */
const ICONOS_CATEGORIA = {
    // Guantes (manos con tono de piel según el color del guante)
    'GB': '🖐🏻',
    'BLANCOS': '🖐🏻',
    'GUANTES-BLANCOS': '🖐🏻',
    'GN': '🖐🏿',
    'NEGROS': '🖐🏿',
    'GUANTES-NEGROS': '🖐🏿',
    'GM': '🧤',
    'MITON': '🧤',
    'GUANTES-MITON': '🧤',
    'GUANTES': '🧤',

    // Kits y Cirios con identidad visual propia
    'KB': '📂',
    'KCG': '📁',
    'KCP': '🗂️',
    'KCE': '📁',
    'CCON': '🕯️',
    'CC': '🕯️',
    'CB': '🕯️',

    // Otros / Accesorios
    'OTR': '📦'
};

const obtenerIconoCategoria = (codigoOCategoria) => {
    if (!codigoOCategoria) return '📦';
    const cat = String(codigoOCategoria).toUpperCase().trim();
    return ICONOS_CATEGORIA[cat] || '📦';
};

/**
 * Caché en memoria para los placeholders vectoriales convertidos a PNG base64
 */
const CACHE_PLACEHOLDERS_BASE64 = {};

/**
 * Retorna el dataURI base64 (PNG) del icono placeholder vectorial correspondiente según categoría
 */
const obtenerPlaceholderImagen = async (codigoOCategoria) => {
    const raw = String(codigoOCategoria || '').toUpperCase().trim();

    let iconFileName = 'product-box.svg';
    if (['GB', 'BLANCOS', 'GUANTES-BLANCOS'].includes(raw)) {
        iconFileName = 'glove-white.svg';
    } else if (['GN', 'NEGROS', 'GUANTES-NEGROS'].includes(raw)) {
        iconFileName = 'glove-black.svg';
    } else if (['GM', 'MITON', 'GUANTES-MITON', 'GUANTES'].includes(raw)) {
        iconFileName = 'glove-mitten.svg';
    } else if (['OTR', 'CAJA', 'ACCESORIO', 'ACCESORIOS'].includes(raw)) {
        iconFileName = 'box.svg';
    }

    if (CACHE_PLACEHOLDERS_BASE64[iconFileName]) {
        return CACHE_PLACEHOLDERS_BASE64[iconFileName];
    }

    try {
        const svgPath = path.join(__dirname, '../assets/icons', iconFileName);
        if (fs.existsSync(svgPath)) {
            const svgBuffer = fs.readFileSync(svgPath);
            const pngBuffer = await sharp(svgBuffer)
                .resize(120, 120, { fit: 'contain' })
                .png()
                .toBuffer();

            const dataUri = 'data:image/png;base64,' + pngBuffer.toString('base64');
            CACHE_PLACEHOLDERS_BASE64[iconFileName] = dataUri;
            return dataUri;
        }
        return null;
    } catch (err) {
        console.error('⚠️ [telegramService] Error al generar placeholder PNG desde SVG:', err.message || err);
        return null;
    }
};

/**
 * Mapeo de carpeta de imágenes locales según categoría y género
 */
const obtenerCarpetaImagen = (categoria, genero) => {
    const cat = String(categoria || '').toUpperCase().trim();
    if (cat === 'KCE') return 'economico-unisex';
    if (cat === 'CCON') return 'confirmacion';
    if (['KCG', 'KCP', 'CC'].includes(cat)) {
        return (genero === 0 || genero === '0') ? 'comunion-nino' : 'comunion-nina';
    }
    if (['KB', 'CB'].includes(cat)) {
        return (genero === 0 || genero === '0') ? 'bautizo-nino' : 'bautizo-nina';
    }
    return null;
};

/**
 * Escapar caracteres HTML reservados para parse_mode: 'HTML' de Telegram
 */
const escapeHtml = (text) => {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

/**
 * Paleta de 10 Colores Temáticos para Identificación Visual de Pedidos en Bodega (Máximo 10 rotativos)
 */
const PALETA_COLORES_PEDIDO = [
    {
        nombre: 'ROJO',
        circulo: '🔴',
        cuadrado: '🟥',
        icono: '🏮',
        rgb: [220, 38, 38],           // #dc2626
        badgeBg: [153, 27, 27],       // #991b1b
        subtituloRgb: [254, 202, 202] // #fecaca
    },
    {
        nombre: 'VERDE',
        circulo: '🟢',
        cuadrado: '🟩',
        icono: '🌲',
        rgb: [22, 163, 74],           // #16a34a
        badgeBg: [20, 83, 45],        // #14532d
        subtituloRgb: [187, 247, 208] // #bbf7d0
    },
    {
        nombre: 'AZUL',
        circulo: '🔵',
        cuadrado: '🟦',
        icono: '🔷',
        rgb: [37, 99, 235],           // #2563eb
        badgeBg: [30, 58, 138],       // #1e3a8a
        subtituloRgb: [191, 219, 254] // #bfdbfe
    },
    {
        nombre: 'AMARILLO',
        circulo: '🟡',
        cuadrado: '🟨',
        icono: '⭐',
        rgb: [217, 119, 6],           // #d97706
        badgeBg: [146, 64, 14],       // #92400e
        subtituloRgb: [254, 240, 138] // #fef08a
    },
    {
        nombre: 'MORADO',
        circulo: '🟣',
        cuadrado: '🟪',
        icono: '🔮',
        rgb: [147, 51, 234],          // #9333ea
        badgeBg: [88, 28, 135],       // #581c87
        subtituloRgb: [233, 213, 255] // #e9d5ff
    },
    {
        nombre: 'NARANJA',
        circulo: '🟠',
        cuadrado: '🟧',
        icono: '🎃',
        rgb: [234, 88, 12],           // #ea580c
        badgeBg: [154, 52, 18],       // #9a3412
        subtituloRgb: [254, 215, 170] // #fed7aa
    },
    {
        nombre: 'CELESTE',
        circulo: '🩵',
        cuadrado: '🟦',
        icono: '❄️',
        rgb: [2, 132, 199],           // #0284c7
        badgeBg: [3, 105, 161],       // #0369a1
        subtituloRgb: [186, 230, 253] // #bae6fd
    },
    {
        nombre: 'ROSA',
        circulo: '🩷',
        cuadrado: '🟪',
        icono: '🌸',
        rgb: [219, 39, 119],          // #db2777
        badgeBg: [157, 23, 77],       // #9d174d
        subtituloRgb: [251, 207, 232] // #fbcfe8
    },
    {
        nombre: 'CAFÉ',
        circulo: '🟤',
        cuadrado: '🟫',
        icono: '📦',
        rgb: [133, 77, 14],           // #854d0e
        badgeBg: [113, 63, 18],       // #713f12
        subtituloRgb: [254, 240, 138] // #fef08a
    },
    {
        nombre: 'GRIS',
        circulo: '🩶',
        cuadrado: '⬛',
        icono: '🛡️',
        rgb: [71, 85, 105],           // #475569
        badgeBg: [30, 41, 59],        // #1e293b
        subtituloRgb: [203, 213, 225] // #cbd5e1
    }
];

/**
 * Asigna deterministamente uno de los 10 colores rotativos según el ID del pedido
 */
const obtenerColorPedido = (idRemision, pedidoId) => {
    const raw = String(idRemision || pedidoId || '0').trim();
    let sum = 0;
    for (let i = 0; i < raw.length; i++) {
        sum = (sum * 31 + raw.charCodeAt(i)) >>> 0;
    }
    const index = sum % PALETA_COLORES_PEDIDO.length; // Ciclo rotativo de máximo 10 colores
    return PALETA_COLORES_PEDIDO[index];
};

/**
 * Limpia y normaliza el identificador de talla para visualización compacta
 */
const formatearTallaCorta = (talla) => {
    if (!talla || talla === '-' || talla === 'null' || talla === 'undefined') return 'SURTIDA';
    const t = String(talla).trim();
    if (t.toLowerCase() === 't0' || t.toLowerCase() === 'surtida') return 'SURTIDA';
    // Si viene como "T-8" o "Talla 8", simplificar a "T8"
    const matchNum = t.match(/\d+/);
    if (matchNum) return `T${matchNum[0]}`;
    return t.toUpperCase();
};

/**
 * Genera el mensaje único ultra compacto para el alistamiento en Telegram
 */
const generarMensajeCompactoTelegram = ({ pedido, cliente, usuario, listadoPedido, info }) => {
    const idRemision = String(pedido?._id || pedido?.pedido_id || 'NUEVO').slice(-6).toUpperCase();
    const color = obtenerColorPedido(idRemision, pedido?._id);
    const clienteNombre = escapeHtml(cliente?.nombre || 'Cliente sin nombre');
    const ciudad = escapeHtml(cliente?.ciudad || 'No especificada');
    const transportadora = escapeHtml(info?.tipoDespacho || pedido?.tipoDespacho || 'Punto');
    const formaPago = escapeHtml(info?.formaPago || pedido?.formaPago || 'Crédito');
    const asesorNombre = escapeHtml(usuario?.name || 'Asesor comercial');

    const detalleGeneral = String(
        info?.detalleGeneral || 
        info?.detalle || 
        pedido?.detalleGeneral || 
        pedido?.detalle || 
        cliente?.detalle || 
        ''
    ).trim();

    const detalleEstado = String(
        info?.detalleEstado || 
        pedido?.detalleEstado || 
        ''
    ).trim();

    const rawItems = listadoPedido || (pedido?.itemPedido?.[0]?.itemPedido) || {};

    let totalUnidades = 0;
    let totalCategorias = 0;
    const bloquesCategorias = [];

    Object.entries(rawItems).forEach(([categoriaKey, catData]) => {
        const items = Array.isArray(catData?.pedido) ? catData.pedido : (Array.isArray(catData) ? catData : []);
        if (items.length === 0) return;

        totalCategorias += 1;
        const nombreCat = buscarNombreCategoria(categoriaKey);
        const detalleCat = String(catData?.detalleGeneral || catData?.detalle || '').trim();
        const codeCat = categoriaKey.toUpperCase();

        let cantTotalCat = 0;

        // ----------------------------------------------------
        // CASO 1: GUANTES (GB, GN, GM, GUANTES)
        // Agrupar tallas de forma consecutiva: └ T7: 2 ┆ T8: 2 ┆ ...
        // ----------------------------------------------------
        if (['GUANTES', 'GB', 'GN', 'GM', 'BLANCOS', 'NEGROS', 'MITON'].includes(codeCat)) {
            const subgrupos = {};

            items.forEach(item => {
                const cant = Number(item?.cantidad) || 0;
                cantTotalCat += cant;

                // Determinar subcategoría de guante
                let subcat = item.categoria || '';
                const prodUpper = String(item.producto || '').toUpperCase();
                if (!subcat) {
                    if (prodUpper.includes('NEGRO') || codeCat === 'GN' || codeCat === 'NEGROS') subcat = 'NEGROS';
                    else if (prodUpper.includes('MITON') || prodUpper.includes('MITÓN') || codeCat === 'GM' || codeCat === 'MITON') subcat = 'MITON';
                    else subcat = 'BLANCOS';
                }

                const talla = formatearTallaCorta(item.talla || item.nombreInput);

                if (!subgrupos[subcat]) subgrupos[subcat] = { total: 0, tallas: {} };
                subgrupos[subcat].total += cant;
                subgrupos[subcat].tallas[talla] = (subgrupos[subcat].tallas[talla] || 0) + cant;
            });

            totalUnidades += cantTotalCat;

            Object.entries(subgrupos).forEach(([subcatKey, subData]) => {
                let codeRef = 'GUANTES';
                let nombreRef = 'GUANTES';
                if (subcatKey === 'NEGROS') { codeRef = 'GN'; nombreRef = 'GUANTES NEGROS'; }
                else if (subcatKey === 'MITON') { codeRef = 'GM'; nombreRef = 'GUANTES MITÓN'; }
                else if (subcatKey === 'BLANCOS') { codeRef = 'GB'; nombreRef = 'GUANTES BLANCOS'; }

                // Ordenar tallas lógicamente (T6, T7, T8...)
                const tallasStr = Object.entries(subData.tallas)
                    .sort(([a], [b]) => {
                        const numA = parseInt(a.replace(/\D/g, ''), 10) || 99;
                        const numB = parseInt(b.replace(/\D/g, ''), 10) || 99;
                        return numA - numB;
                    })
                    .map(([talla, c]) => `${talla}: ${c}`)
                    .join('  ┆  ');

                const iconoGuante = obtenerIconoCategoria(codeRef);
                let bloque = `${iconoGuante} <b>【 ${nombreRef} [${codeRef}] 】</b> <i>(Total: ${subData.total})</i>`;
                if (detalleCat) bloque += `\n   <i>Nota: ${escapeHtml(detalleCat)}</i>`;
                bloque += `\n<pre>└ ${tallasStr}</pre>`;
                bloquesCategorias.push(bloque);
            });
            return;
        }

        // ----------------------------------------------------
        // CASO 2: OTROS PRODUCTOS / ACCESORIOS (OTR)
        // Listar en una línea limpia: └ Caja vacía kit bautizo: 3
        // ----------------------------------------------------
        if (codeCat === 'OTR') {
            const lineasOtr = [];
            items.forEach(item => {
                const cant = Number(item?.cantidad) || 0;
                cantTotalCat += cant;
                const prodNom = String(item.producto || 'Accesorio').trim();
                lineasOtr.push(`${prodNom}: ${cant}`);
            });

            totalUnidades += cantTotalCat;

            const iconoOtr = obtenerIconoCategoria('OTR');
            let bloque = `${iconoOtr} <b>【 ${nombreCat} [OTR] 】</b> <i>(Total: ${cantTotalCat})</i>`;
            if (detalleCat) bloque += `\n   <i>Nota: ${escapeHtml(detalleCat)}</i>`;
            bloque += `\n<pre>└ ${lineasOtr.join('  ┆  ')}</pre>`;
            bloquesCategorias.push(bloque);
            return;
        }

        // ----------------------------------------------------
        // CASO 3: KITS Y CIRIOS (KB, CB, KCG, KCP, CC, KCE, CCON, etc.)
        // Agrupar por género (NIÑO / NIÑA) con letras en corchetes [A], [B]...
        // ----------------------------------------------------
        const esCategoriaUnisex = ['KCE', 'CCON'].includes(codeCat);

        let cantNinos = 0;
        let cantNinas = 0;
        let cantUnisex = 0;

        const itemsNino = {};
        const itemsNina = {};
        const itemsUnisex = {};

        const obtenerEtiquetaMotivo = (item, inputStr) => {
            let motivoNum = item?.motivo || null;
            if (!motivoNum) {
                const parts = inputStr.split('-');
                if (parts.length > 1) {
                    const m = parts[1].match(/^\d+/);
                    if (m) motivoNum = m[0];
                }
            }

            const lowerInput = inputStr.toLowerCase();
            const prodStr = String(item?.producto || '').toLowerCase();
            const esSurtido = lowerInput.includes('surtid') || prodStr.includes('surtid') || !motivoNum;

            if (esSurtido || !motivoNum) {
                return '[SURTIDO]';
            }

            const str = String(motivoNum).trim();
            const num = parseInt(str, 10);
            if (!isNaN(num) && num >= 1 && num <= 26) {
                return `[${String.fromCharCode(64 + num)}]`;
            }

            const clean = str.replace(/^(mod-|modelo\s*)/i, '').trim().toUpperCase();
            if (/^[A-Z]$/.test(clean)) {
                return `[${clean}]`;
            }

            const letterMatch = clean.match(/[A-Z]/);
            if (letterMatch) {
                return `[${letterMatch[0]}]`;
            }

            return `[${clean}]`;
        };

        const ordenarItemsKits = (a, b) => {
            const aSurtido = a.includes('SURTIDO');
            const bSurtido = b.includes('SURTIDO');
            if (aSurtido && !bSurtido) return 1;
            if (!aSurtido && bSurtido) return -1;
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        };

        items.forEach(item => {
            const cant = Number(item?.cantidad) || 0;
            cantTotalCat += cant;

            const inputStr = String(item?.nombreInput || '');
            const talla = formatearTallaCorta(item?.talla || inputStr);
            const tieneTalla = talla && talla !== 'SURTIDA';

            const etiquetaMotivo = obtenerEtiquetaMotivo(item, inputStr);
            const itemKey = tieneTalla ? `${etiquetaMotivo} (${talla})` : etiquetaMotivo;

            if (esCategoriaUnisex) {
                cantUnisex += cant;
                itemsUnisex[itemKey] = (itemsUnisex[itemKey] || 0) + cant;
            } else {
                // Detectar género
                let esNina = (item?.genero === '1' || item?.genero === 1);
                if (!esNina && (item?.genero === '0' || item?.genero === 0)) {
                    esNina = false;
                } else if (!esNina) {
                    const lowerInput = inputStr.toLowerCase();
                    const prodStr = String(item?.producto || '').toLowerCase();
                    const parts = inputStr.split('-');
                    if (
                        lowerInput.includes('inputsurtidonina') ||
                        lowerInput.includes('nina') ||
                        lowerInput.includes('niña') ||
                        prodStr.includes('niña') ||
                        prodStr.includes('nina') ||
                        (parts[1] && parts[1].toUpperCase().includes('A'))
                    ) {
                        esNina = true;
                    }
                }

                if (esNina) {
                    cantNinas += cant;
                    itemsNina[itemKey] = (itemsNina[itemKey] || 0) + cant;
                } else {
                    cantNinos += cant;
                    itemsNino[itemKey] = (itemsNino[itemKey] || 0) + cant;
                }
            }
        });

        totalUnidades += cantTotalCat;

        const iconoCat = obtenerIconoCategoria(codeCat);
        let bloque = `${iconoCat} <b>【 ${nombreCat} [${codeCat}] 】</b> <i>(Total: ${cantTotalCat})</i>`;
        if (detalleCat) bloque += `\n   <i>Nota: ${escapeHtml(detalleCat)}</i>`;

        const formatearFila = (map) => {
            return Object.entries(map)
                .sort(([a], [b]) => ordenarItemsKits(a, b))
                .map(([k, c]) => `${k}: ${c}`)
                .join('  ┆  ');
        };

        if (esCategoriaUnisex) {
            const filaUnisex = formatearFila(itemsUnisex);
            bloque += `\n<pre>└ ${filaUnisex || `Total: ${cantTotalCat}`}</pre>`;
        } else {
            const partesPre = [];

            if (cantNinos > 0) {
                const filaNinos = formatearFila(itemsNino);
                partesPre.push(`👦🏻 NIÑO (${cantNinos} und):\n└ ${filaNinos}`);
            }

            if (cantNinas > 0) {
                const filaNinas = formatearFila(itemsNina);
                partesPre.push(`👧🏻 NIÑA (${cantNinas} und):\n└ ${filaNinas}`);
            }

            if (partesPre.length > 0) {
                bloque += `\n<pre>${partesPre.join('\n\n')}</pre>`;
            } else {
                bloque += `\n<pre>└ Total: ${cantTotalCat}</pre>`;
            }
        }

        bloquesCategorias.push(bloque);
    });

    // Ensamblar mensaje final en HTML con temática de color
    const cintillo = color.cuadrado.repeat(12);
    const clienteNombreUpper = escapeHtml(String(cliente?.nombre || 'CLIENTE').toUpperCase().trim());

    let blockquoteContent = `👤 <b>Cliente:</b> ${clienteNombre} (${ciudad})\n`;
    blockquoteContent += `🚚 <b>Despacho / Pago:</b> ${transportadora} | ${formaPago}\n`;
    blockquoteContent += `👨‍💼 <b>Asesor:</b> ${asesorNombre}`;
    if (detalleGeneral) {
        blockquoteContent += `\n📝 <b>Obs:</b> ${escapeHtml(detalleGeneral)}`;
    }
    if (detalleEstado) {
        blockquoteContent += `\n⚠️ <b>Novedad:</b> ${escapeHtml(detalleEstado)}`;
    }

    let mensaje = `${cintillo}\n`;
    mensaje += `${color.circulo} <b>PEDIDO ${clienteNombreUpper} • #${idRemision}</b>\n`;
    mensaje += `${cintillo}\n\n`;
    mensaje += `<blockquote>${blockquoteContent}</blockquote>\n\n`;

    mensaje += `📋 <b>ALISTAMIENTO DE BODEGA:</b>\n\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += bloquesCategorias.join('\n━━━━━━━━━━━━━━━━━━━━\n');
    mensaje += `\n━━━━━━━━━━━━━━━━━━━━\n\n`;

    mensaje += `📊 <b>TOTAL A ALISTAR: ${totalUnidades} unidades</b> en <b>${totalCategorias} categorías</b>\n`;
    mensaje += `📄 <i>Adjunto: Remisión completa con fotos para empaque.</i>`;

    return {
        mensaje,
        totalUnidades,
        totalCategorias,
        idRemision,
        color
    };
};

/**
 * Genera el documento PDF de la Hoja de Alistamiento y Control de Bodega
 * - Diseño optimizado a 2 columnas tipo grid para aprovechar al máximo el espacio
 * - Miniaturas de motivos ampliadas (18x18 mm con esquinas redondeadas)
 * - Agrupación horizontal de guantes por referencia (tallas compactas y total)
 * - Eliminación de columnas # y PACK (checkboxes)
 * - Título principal "HOJA DE ALISTAMIENTO Y CONTROL DE BODEGA"
 */
const generarPdfRemision = async ({ pedido, cliente, usuario, listadoPedido, info }) => {
    const idRemision = String(pedido?._id || pedido?.pedido_id || 'NUEVO').slice(-6).toUpperCase();
    const fecha = info?.fechaActual || pedido?.fechaCreacion || new Date().toLocaleString('es-CO');
    const clienteNombre = String(cliente?.nombre || 'Cliente sin nombre');
    const nit = String(cliente?.nitCC || cliente?.nit || 'No especificado');
    const ciudad = String(cliente?.ciudad || 'No especificada');
    const direccion = String(cliente?.direccion || 'No especificada');
    const telefono = String(cliente?.telefono || 'No especificado');
    const asesorNombre = String(usuario?.name || 'Asesor comercial');
    const transportadora = String(info?.tipoDespacho || pedido?.tipoDespacho || 'Punto');
    const formaPago = String(info?.formaPago || pedido?.formaPago || 'Crédito');

    const detalleGeneral = String(
        info?.detalleGeneral || 
        info?.detalle || 
        pedido?.detalleGeneral || 
        pedido?.detalle || 
        cliente?.detalle || 
        ''
    ).trim();

    const rawItems = listadoPedido || (pedido?.itemPedido?.[0]?.itemPedido) || {};

    // ----------------------------------------------------
    // PRE-PROCESAMIENTO: ORGANIZAR PRODUCTOS POR CATEGORÍA
    // ----------------------------------------------------
    const categoriasProcesadas = [];
    let totalUnidades = 0;
    let totalCategorias = 0;

    for (const [categoriaKey, catData] of Object.entries(rawItems)) {
        const items = Array.isArray(catData?.pedido) ? catData.pedido : (Array.isArray(catData) ? catData : []);
        if (items.length === 0) continue;

        totalCategorias += 1;
        const nombreCat = buscarNombreCategoria(categoriaKey);
        const detalleCat = String(catData?.detalleGeneral || catData?.detalle || '').trim();
        const codeCat = categoriaKey.toUpperCase();

        const catObj = {
            code: codeCat,
            nombre: nombreCat,
            detalle: detalleCat,
            totalUnidades: 0,
            items: []
        };

        // ----------------------------------------------------
        // CASO 1: GUANTES (GB, GN, GM, GUANTES, BLANCOS, NEGROS, MITON)
        // Agrupar en una sola tarjeta por referencia con tallas horizontales
        // ----------------------------------------------------
        if (['GUANTES', 'GB', 'GN', 'GM', 'BLANCOS', 'NEGROS', 'MITON'].includes(codeCat)) {
            const subgrupos = {};

            items.forEach(item => {
                const cant = Number(item?.cantidad) || 0;
                totalUnidades += cant;
                catObj.totalUnidades += cant;

                let subcat = item.categoria || '';
                const prodUpper = String(item.producto || '').toUpperCase();
                if (!subcat) {
                    if (prodUpper.includes('NEGRO') || codeCat === 'GN' || codeCat === 'NEGROS') subcat = 'NEGROS';
                    else if (prodUpper.includes('MITON') || prodUpper.includes('MITÓN') || codeCat === 'GM' || codeCat === 'MITON') subcat = 'MITON';
                    else subcat = 'BLANCOS';
                }

                const talla = formatearTallaCorta(item.talla || item.nombreInput);

                if (!subgrupos[subcat]) subgrupos[subcat] = { total: 0, tallas: {} };
                subgrupos[subcat].total += cant;
                subgrupos[subcat].tallas[talla] = (subgrupos[subcat].tallas[talla] || 0) + cant;
            });

            for (const [subcatKey, subData] of Object.entries(subgrupos)) {
                let codeRef = 'GUANTES';
                let nombreRef = 'GUANTES';
                if (subcatKey === 'NEGROS') { codeRef = 'GN'; nombreRef = 'GUANTES NEGROS'; }
                else if (subcatKey === 'MITON') { codeRef = 'GM'; nombreRef = 'GUANTES MITÓN'; }
                else if (subcatKey === 'BLANCOS') { codeRef = 'GB'; nombreRef = 'GUANTES BLANCOS'; }

                // Ordenar tallas lógicamente (T6, T7, T8...)
                const tallasStr = Object.entries(subData.tallas)
                    .sort(([a], [b]) => {
                        const numA = parseInt(a.replace(/\D/g, ''), 10) || 99;
                        const numB = parseInt(b.replace(/\D/g, ''), 10) || 99;
                        return numA - numB;
                    })
                    .map(([talla, c]) => `${talla}: ${c}`)
                    .join('   |   ');

                const placeholderImg = await obtenerPlaceholderImagen(codeRef);

                catObj.items.push({
                    tipo: 'GUANTES',
                    titulo: `${nombreRef} [${codeRef}]`,
                    subtitulo: tallasStr, // Bloque horizontal compacto de tallas
                    badgeCode: codeRef,
                    cant: subData.total,
                    imgBase64: placeholderImg,
                    nota: ''
                });
            }

            categoriasProcesadas.push(catObj);
            continue;
        }

        // ----------------------------------------------------
        // CASO 2: OTROS PRODUCTOS / ACCESORIOS (OTR)
        // ----------------------------------------------------
        if (codeCat === 'OTR') {
            for (const item of items) {
                const cant = Number(item?.cantidad) || 0;
                totalUnidades += cant;
                catObj.totalUnidades += cant;
                const prodStr = String(item?.producto || 'Accesorio / Producto').trim();
                const notaItem = String(item?.detalle || '').trim();

                const placeholderImg = await obtenerPlaceholderImagen('OTR');

                catObj.items.push({
                    tipo: 'OTR',
                    titulo: prodStr,
                    subtitulo: '',
                    badgeCode: 'OTR',
                    cant,
                    imgBase64: placeholderImg,
                    nota: notaItem
                });
            }
            categoriasProcesadas.push(catObj);
            continue;
        }

        // ----------------------------------------------------
        // CASO 3: KITS Y CIRIOS (KCG, KB, CB, CCON, CC, KCP, KCE, etc.)
        // ----------------------------------------------------
        for (const item of items) {
            const cant = Number(item?.cantidad) || 0;
            totalUnidades += cant;
            catObj.totalUnidades += cant;

            const inputStr = String(item?.nombreInput || '');
            const lowerInput = inputStr.toLowerCase();
            const prodStr = String(item?.producto || '');
            const lowerProd = prodStr.toLowerCase();

            // Surtido
            const esSurtidoNino = lowerInput.includes('inputsurtidonino') || 
                                  (lowerInput.includes('surtid') && (lowerInput.endsWith('o') || lowerProd.includes('niño') || lowerProd.includes('nino'))) ||
                                  (lowerProd.includes('surtid') && (lowerProd.includes('niño') || lowerProd.includes('nino')));

            const esSurtidoNina = lowerInput.includes('inputsurtidonina') || 
                                  (lowerInput.includes('surtid') && (lowerInput.endsWith('a') || lowerProd.includes('niña') || lowerProd.includes('nina'))) ||
                                  (lowerProd.includes('surtid') && (lowerProd.includes('niña') || lowerProd.includes('nina')));

            let titulo = '';
            let motivoNum = null;
            let genero = null;

            if (item?.genero !== undefined && item?.genero !== null && item?.genero !== '') {
                const g = String(item.genero).trim().toLowerCase();
                if (g === '0' || g === 'o' || g.includes('nino') || g.includes('niño')) genero = 0;
                else if (g === '1' || g === 'a' || g.includes('nina') || g.includes('niña')) genero = 1;
            }

            if (genero === null) {
                if (lowerInput.includes('nino') || lowerInput.includes('niño') || lowerInput.includes('inputsurtidonino')) genero = 0;
                else if (lowerInput.includes('nina') || lowerInput.includes('niña') || lowerInput.includes('inputsurtidonina')) genero = 1;
                else if (inputStr.split('-')[1]?.includes('O')) genero = 0;
                else if (inputStr.split('-')[1]?.includes('A')) genero = 1;
                else if (lowerProd.includes('niño') || lowerProd.includes('nino')) genero = 0;
                else if (lowerProd.includes('niña') || lowerProd.includes('nina')) genero = 1;
                else genero = 0;
            }

            if (esSurtidoNino) {
                titulo = 'Surtido - Niño';
            } else if (esSurtidoNina) {
                titulo = 'Surtido - Niña';
            } else {
                if (item?.motivo) {
                    motivoNum = String(item.motivo).trim();
                } else {
                    const parts = inputStr.split('-');
                    if (parts.length > 1) {
                        const m = parts[1].match(/^\d+/);
                        if (m) motivoNum = m[0];
                    }
                }
                if (!motivoNum) motivoNum = '1';

                const usaLetras = ['KCG', 'KCP', 'CC', 'KCE', 'KB', 'CB', 'CCON'].includes(codeCat);
                const num = parseInt(motivoNum, 10);
                const etiquetaMotivo = (usaLetras && !isNaN(num) && num >= 1 && num <= 26) ? String.fromCharCode(64 + num) : `#${motivoNum}`;
                const generoStr = (codeCat === 'KCE' || codeCat === 'CCON') ? '' : (genero === 0 ? ' (Niño)' : ' (Niña)');
                titulo = usaLetras ? `Modelo ${etiquetaMotivo}${generoStr}` : `Motivo #${motivoNum}${generoStr}`;
            }

            // Talla: ÚNICAMENTE cuando la categoría sea KCG
            let subtitulo = '';
            if (codeCat === 'KCG') {
                const rawTalla = String(item?.talla || inputStr).trim();
                const tallaLimpia = formatearTallaCorta(rawTalla);
                subtitulo = `Talla: ${tallaLimpia}`;
            }

            // Foto ampliada de alta calidad (120x120 px para renderizar en caja de 15.5x15.5 mm)
            let imgBase64 = null;
            const esSurtido = esSurtidoNino || esSurtidoNina || lowerProd.includes('surtid');
            if (!esSurtido && motivoNum && ['KCG', 'KCP', 'KCE', 'KB', 'CC', 'CB', 'CCON'].includes(codeCat)) {
                const carpeta = obtenerCarpetaImagen(codeCat, genero);
                if (carpeta) {
                    const imgPath = path.join(__dirname, '../public/images', carpeta, `${motivoNum}.webp`);
                    if (fs.existsSync(imgPath)) {
                        try {
                            const jpegBuffer = await sharp(fs.readFileSync(imgPath))
                                .resize(120, 120, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
                                .jpeg({ quality: 85 })
                                .toBuffer();
                            imgBase64 = 'data:image/jpeg;base64,' + jpegBuffer.toString('base64');
                        } catch (_) {}
                    }
                }
            }

            // Fallback visual si el producto no tiene fotoUrl o la imagen no existe
            if (!imgBase64) {
                imgBase64 = await obtenerPlaceholderImagen(codeCat);
            }

            const notaItem = String(item?.detalle || '').trim();

            catObj.items.push({
                tipo: codeCat,
                titulo,
                subtitulo,
                badgeCode: codeCat,
                cant,
                imgBase64,
                nota: notaItem
            });
        }

        categoriasProcesadas.push(catObj);
    }

    // ----------------------------------------------------
    // INICIAR CONSTRUCCIÓN DEL DOCUMENTO PDF
    // ----------------------------------------------------
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const color = obtenerColorPedido(idRemision, pedido?._id);

    const clienteTituloPdf = String(cliente?.nombre || 'CLIENTE').toUpperCase().trim();
    const tituloCortoPdf = clienteTituloPdf.length > 34 ? clienteTituloPdf.slice(0, 32) + '...' : clienteTituloPdf;

    // 1. Barra de Encabezado Superior con Color Temático del Pedido
    doc.setFillColor(...color.rgb);
    doc.rect(0, 0, 216, 18, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(255, 255, 255);
    doc.text('HOJA DE ALISTAMIENTO Y CONTROL DE BODEGA', 12, 7.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...color.subtituloRgb);
    doc.text(`GRUPO COMERCIAL GOGO  |  PEDIDO ${tituloCortoPdf}`, 12, 13.5);

    // Badge RM con tono oscuro de contraste
    doc.setFillColor(...color.badgeBg);
    doc.roundedRect(152, 3.5, 52, 11, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`REMISIÓN #RM-${idRemision}`, 155, 10.5);

    // 2. Tarjeta de Datos del Cliente y Despacho
    doc.setFillColor(248, 250, 252); // #f8fafc
    doc.setDrawColor(203, 213, 225); // #cbd5e1
    doc.setLineWidth(0.3);
    doc.roundedRect(12, 20.5, 192, 22, 2, 2, 'FD');

    // Columna Izquierda (Cliente y Despacho)
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);

    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE:', 16, 25.5);
    doc.setFont('helvetica', 'normal');
    const clienteTexto = `${clienteNombre} (NIT/CC: ${nit})`;
    doc.text(clienteTexto.length > 55 ? clienteTexto.slice(0, 52) + '...' : clienteTexto, 31, 25.5);

    doc.setFont('helvetica', 'bold');
    doc.text('CIUDAD / DIR:', 16, 30.5);
    doc.setFont('helvetica', 'normal');
    const dirTexto = `${ciudad} - ${direccion}`;
    doc.text(dirTexto.length > 52 ? dirTexto.slice(0, 50) + '...' : dirTexto, 37, 30.5);

    doc.setFont('helvetica', 'bold');
    doc.text('DESPACHO / PAGO:', 16, 35.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${transportadora}  |  ${formaPago}`, 45, 35.5);

    doc.setFont('helvetica', 'bold');
    doc.text('TELÉFONO:', 16, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(telefono, 33, 40);

    // Columna Derecha (Emisión, Asesor e ID)
    doc.setFont('helvetica', 'bold');
    doc.text('FECHA:', 130, 25.5);
    doc.setFont('helvetica', 'normal');
    doc.text(fecha, 142, 25.5);

    doc.setFont('helvetica', 'bold');
    doc.text('ASESOR:', 130, 30.5);
    doc.setFont('helvetica', 'normal');
    doc.text(asesorNombre, 144, 30.5);

    doc.setFont('helvetica', 'bold');
    doc.text('CONTROL:', 130, 35.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Doc #${idRemision}`, 147, 35.5);

    let currentY = 44.5;

    // 3. Cuadro de Observaciones si existen
    if (detalleGeneral) {
        doc.setFillColor(255, 251, 235); // #fffbeb
        doc.setDrawColor(245, 158, 11);  // #f59e0b
        doc.roundedRect(12, currentY, 192, 8.5, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(180, 83, 9);
        doc.text('OBSERVACIONES DEL PEDIDO:', 16, currentY + 3.2);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(120, 53, 15);
        const obsTruncada = detalleGeneral.length > 140 ? detalleGeneral.slice(0, 137) + '...' : detalleGeneral;
        doc.text(obsTruncada, 16, currentY + 6.8);

        currentY += 10.5;
    } else {
        currentY += 1.5;
    }

    // ----------------------------------------------------
    // 4. PANELES AGRUPADOS POR CATEGORÍA CON CONTORNO DIFERENCIADOR
    // ----------------------------------------------------
    const catGap = 3;            // Espacio entre contenedores de categoría (mm)
    const cardHeight = 19.5;     // Altura de tarjeta de producto (mm)
    const rowPitch = 22;         // Altura de fila + gap interno (19.5 + 2.5)
    const maxGridYPage1 = 238;   // Límite en página 1 para dar espacio a firmas
    const maxGridYPageN = 250;   // Límite en páginas siguientes

    let catY = currentY;
    let currentPage = 1;

    const dibujarHeaderCompacto = (pageNumber) => {
        doc.setFillColor(...color.rgb);
        doc.rect(0, 0, 216, 11, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text('HOJA DE ALISTAMIENTO Y CONTROL DE BODEGA', 12, 7);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...color.subtituloRgb);
        doc.text(`PEDIDO ${clienteTituloPdf}  |  #RM-${idRemision}  (Pág. ${pageNumber})`, 120, 7);
    };

    // Renderizar cada bloque de categoría
    for (const cat of categoriasProcesadas) {
        const esMonoproducto = cat.items.length === 1;
        const totalFilasCat = esMonoproducto ? 1 : Math.ceil(cat.items.length / 2);

        // Agrupar los items en filas
        const filas = [];
        if (esMonoproducto) {
            filas.push([cat.items[0]]);
        } else {
            for (let f = 0; f < cat.items.length; f += 2) {
                filas.push(cat.items.slice(f, f + 2));
            }
        }

        let filaIndex = 0;
        let esContinuacion = false;

        while (filaIndex < filas.length) {
            const maxY = currentPage === 1 ? maxGridYPage1 : maxGridYPageN;

            // Si no hay espacio ni para la cabecera + 1 fila, saltar de página
            if (catY + 30 > maxY) {
                doc.addPage();
                currentPage += 1;
                dibujarHeaderCompacto(currentPage);
                catY = 15;
            }

            // Calcular cuántas filas caben en el espacio disponible actual
            const espacioDisponible = maxY - catY - 6.5 - 3;
            const filasQueCaben = Math.max(1, Math.floor((espacioDisponible + 2.5) / rowPitch));
            const filasADibujar = Math.min(filas.length - filaIndex, filasQueCaben);
            const containerHeight = 6.5 + 1.5 + (filasADibujar * cardHeight) + ((filasADibujar - 1) * 2.5) + 1.5;

            // 1. Contorno Exterior Diferenciador de la Categoría
            doc.setFillColor(252, 253, 255); // Fondo sutil para distinguir el bloque
            doc.setDrawColor(...color.rgb);   // Borde con color temático
            doc.setLineWidth(0.4);
            doc.roundedRect(12, catY, 192, containerHeight, 2, 2, 'FD');

            // 2. Barra Superior de Título de la Categoría
            doc.setFillColor(...color.rgb);
            doc.roundedRect(12, catY, 192, 6.5, 2, 2, 'F');
            doc.rect(12, catY + 3.5, 192, 3, 'F'); // Empalme cuadrado inferior

            // Píldora gráfica blanca como indicador visual
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(15, catY + 1.8, 2, 2.9, 0.5, 0.5, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);
            const tituloCatBarra = `${cat.nombre.toUpperCase()} [${cat.code}]${esContinuacion ? ' (Cont.)' : ''}`;
            doc.text(tituloCatBarra, 18.5, catY + 4.5);

            // Resumen de unidades y nota de categoría
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(...color.subtituloRgb);
            let tagDerecho = `${cat.totalUnidades} UNIDADES`;
            if (cat.detalle && !esContinuacion) {
                const notaCorta = cat.detalle.length > 40 ? cat.detalle.slice(0, 37) + '...' : cat.detalle;
                tagDerecho += `  |  Nota: ${notaCorta}`;
            }
            doc.text(tagDerecho, 201, catY + 4.5, { align: 'right' });

            // 3. Renderizar las Tarjetas de Producto dentro del Contorno
            let itemRowY = catY + 8;

            for (let r = 0; r < filasADibujar; r++) {
                const filaItems = filas[filaIndex + r];

                if (esMonoproducto) {
                    // Tarjeta Ancha (186 mm) para guantes o productos únicos
                    const item = filaItems[0];
                    const cardX = 15;
                    const cardW = 186;

                    doc.setFillColor(255, 255, 255);
                    doc.setDrawColor(226, 232, 240);
                    doc.setLineWidth(0.3);
                    doc.roundedRect(cardX, itemRowY, cardW, cardHeight, 1.5, 1.5, 'FD');

                    // Barrita izquierda temática
                    doc.setFillColor(...color.rgb);
                    doc.roundedRect(cardX, itemRowY, 2.5, cardHeight, 1, 1, 'F');

                    // Recuadro icono / thumbnail
                    const imgX = cardX + 3.5;
                    const imgY = itemRowY + 2;
                    const imgSize = 15.5;

                    doc.setFillColor(248, 250, 252);
                    doc.setDrawColor(226, 232, 240);
                    doc.roundedRect(imgX, imgY, imgSize, imgSize, 1.5, 1.5, 'FD');

                    if (item.imgBase64) {
                        const imgType = item.imgBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                        doc.addImage(item.imgBase64, imgType, imgX + 0.5, imgY + 0.5, imgSize - 1, imgSize - 1);
                    } else {
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(8.5);
                        doc.setTextColor(...color.rgb);
                        doc.text(item.badgeCode || 'REF', imgX + (imgSize / 2), imgY + 9.5, { align: 'center' });
                    }

                    // Textos
                    const textX = cardX + 22;
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8.5);
                    doc.setTextColor(15, 23, 42);
                    doc.text(item.titulo, textX, itemRowY + 6.5);

                    if (item.subtitulo) {
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(7.2);
                        doc.setTextColor(51, 65, 85);
                        doc.text(item.subtitulo, textX, itemRowY + 12);
                    }

                    if (item.nota) {
                        doc.setFont('helvetica', 'italic');
                        doc.setFontSize(6);
                        doc.setTextColor(180, 83, 9);
                        doc.text(`Nota: ${item.nota}`, textX, itemRowY + 16.5);
                    }

                    // Badge de Cantidad
                    const badgeX = cardX + cardW - 17;
                    const badgeY = itemRowY + 2;
                    const badgeW = 14.5;
                    const badgeH = 15.5;

                    doc.setFillColor(248, 250, 252);
                    doc.setDrawColor(203, 213, 225);
                    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, 'FD');

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(5.5);
                    doc.setTextColor(100, 116, 139);
                    doc.text('CANT', badgeX + (badgeW / 2), badgeY + 4, { align: 'center' });

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10.5);
                    doc.setTextColor(...color.rgb);
                    doc.text(String(item.cant), badgeX + (badgeW / 2), badgeY + 10, { align: 'center' });

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(5.5);
                    doc.setTextColor(100, 116, 139);
                    doc.text('UND', badgeX + (badgeW / 2), badgeY + 13.5, { align: 'center' });

                } else {
                    // Tarjetas en 2 Columnas (91 mm cada una)
                    const cardW = 91;

                    filaItems.forEach((item, colIdx) => {
                        const cardX = colIdx === 0 ? 15 : 110;

                        doc.setFillColor(255, 255, 255);
                        doc.setDrawColor(226, 232, 240);
                        doc.setLineWidth(0.3);
                        doc.roundedRect(cardX, itemRowY, cardW, cardHeight, 1.5, 1.5, 'FD');

                        // Barrita lateral con color temático
                        doc.setFillColor(...color.rgb);
                        doc.roundedRect(cardX, itemRowY, 2.5, cardHeight, 1, 1, 'F');

                        // Recuadro miniatura ampliada
                        const imgX = cardX + 3.5;
                        const imgY = itemRowY + 2;
                        const imgSize = 15.5;

                        doc.setFillColor(248, 250, 252);
                        doc.setDrawColor(226, 232, 240);
                        doc.roundedRect(imgX, imgY, imgSize, imgSize, 1.5, 1.5, 'FD');

                        if (item.imgBase64) {
                            const imgType = item.imgBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                            doc.addImage(item.imgBase64, imgType, imgX + 0.5, imgY + 0.5, imgSize - 1, imgSize - 1);
                        } else {
                            doc.setFont('helvetica', 'bold');
                            doc.setFontSize(8.5);
                            doc.setTextColor(...color.rgb);
                            doc.text(item.badgeCode || 'REF', imgX + (imgSize / 2), imgY + 9.5, { align: 'center' });
                        }

                        // Textos descriptivos
                        const textX = cardX + 22;
                        const textMaxWidth = 50;

                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(8);
                        doc.setTextColor(15, 23, 42);
                        const tituloLines = doc.splitTextToSize(item.titulo, textMaxWidth);
                        doc.text(tituloLines[0], textX, itemRowY + 6);

                        let subY = itemRowY + 10.5;
                        if (item.subtitulo) {
                            doc.setFont('helvetica', 'bold');
                            doc.setFontSize(7);
                            doc.setTextColor(51, 65, 85);
                            doc.text(item.subtitulo, textX, subY);
                            subY += 4;
                        }

                        if (item.nota) {
                            doc.setFont('helvetica', 'italic');
                            doc.setFontSize(5.5);
                            doc.setTextColor(180, 83, 9);
                            const notaLines = doc.splitTextToSize(`Nota: ${item.nota}`, textMaxWidth);
                            doc.text(notaLines[0], textX, subY);
                        }

                        // Badge de Cantidad a la derecha
                        const badgeX = cardX + cardW - 16;
                        const badgeY = itemRowY + 2;
                        const badgeW = 13.5;
                        const badgeH = 15.5;

                        doc.setFillColor(248, 250, 252);
                        doc.setDrawColor(203, 213, 225);
                        doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, 'FD');

                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(5.5);
                        doc.setTextColor(100, 116, 139);
                        doc.text('CANT', badgeX + (badgeW / 2), badgeY + 4, { align: 'center' });

                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(10.5);
                        doc.setTextColor(...color.rgb);
                        doc.text(String(item.cant), badgeX + (badgeW / 2), badgeY + 10, { align: 'center' });

                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(5.5);
                        doc.setTextColor(100, 116, 139);
                        doc.text('UND', badgeX + (badgeW / 2), badgeY + 13.5, { align: 'center' });
                    });
                }

                itemRowY += rowPitch;
            }

            filaIndex += filasADibujar;
            catY += containerHeight + catGap;
            esContinuacion = true;
        }
    }

    // ----------------------------------------------------
    // 5. PIE DE PÁGINA DE CONTROL Y FIRMAS OPERATIVAS
    // ----------------------------------------------------
    // Verificar si queda espacio suficiente para el bloque de firmas (27 mm)
    if (catY + 27 > 270) {
        doc.addPage();
        currentPage += 1;
        dibujarHeaderCompacto(currentPage);
        catY = 18;
    } else {
        catY += 2;
    }

    // Bloque Consolidado de Resumen
    doc.setFillColor(241, 245, 249); // #f1f5f9
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(12, catY, 192, 8.5, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(
        `TOTAL A ALISTAR: ${totalUnidades} UNIDADES en ${totalCategorias} CATEGORÍAS  |  PEDIDO ${clienteTituloPdf}`,
        16,
        catY + 5.5
    );

    // Líneas de Firmas Operativas
    const lineY = catY + 18;
    doc.setDrawColor(148, 163, 184); // #94a3b8
    doc.setLineWidth(0.4);

    doc.line(16, lineY, 85, lineY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Alistado por (Bodega)', 16, lineY + 4.5);

    doc.line(125, lineY, 194, lineY);
    doc.text('Verificado y Despachado (Control)', 125, lineY + 4.5);

    // Numeración de páginas final
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text(`Página ${p} de ${totalPages}`, 192, 275, { align: 'right' });
    }

    return Buffer.from(doc.output('arraybuffer'));
};

/**
 * Función principal para despachar a Telegram:
 * 1. Envía el mensaje de texto ultra compacto con la estructura agrupada
 * 2. Genera y envía el PDF "Hoja de Alistamiento y Control de Bodega" con paneles agrupados por categoría
 */
const enviarNotificacionTelegramPedido = async ({ pedido, cliente, usuario, listadoPedido, info }) => {
    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            console.warn('\x1b[33m%s\x1b[0m', '⚠️  [telegramService] TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no están configurados en .env. Se omite notificación de Telegram.');
            return {
                ok: false,
                msg: 'Variables no configuradas'
            };
        }

        const { mensaje, idRemision, color } = generarMensajeCompactoTelegram({ pedido, cliente, usuario, listadoPedido, info });

        // 1. Enviar el Mensaje de Texto Único y Ultra Compacto
        const urlSendMessage = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const resText = await fetch(urlSendMessage, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: mensaje,
                parse_mode: 'HTML'
            })
        });

        const dataText = await resText.json();

        if (!dataText.ok) {
            console.error('\x1b[31m%s\x1b[0m', '❌ [telegramService] Error al enviar mensaje compacto a Telegram:\n', dataText.description || dataText);
        } else {
            console.log('\x1b[32m%s\x1b[0m', `✅ [telegramService] Resumen compacto (${color.nombre}) enviado exitosamente al chat ${chatId} (Message ID: ${dataText?.result?.message_id})`);
        }

        // 2. Generar y Enviar el PDF de la Remisión (sendDocument)
        try {
            const pdfBuffer = await generarPdfRemision({ pedido, cliente, usuario, listadoPedido, info });
            const urlSendDocument = `https://api.telegram.org/bot${botToken}/sendDocument`;

            const form = new FormData();
            const clienteNombreUpper = escapeHtml(String(cliente?.nombre || 'CLIENTE').toUpperCase().trim());
            form.append('chat_id', chatId);
            form.append('document', new Blob([pdfBuffer], { type: 'application/pdf' }), `Remision_${idRemision}.pdf`);
            form.append('caption', `📄 ${color.circulo} <b>Remisión #${idRemision} - PEDIDO ${clienteNombreUpper}</b>\n<i>Detalle gráfico y control de empaque para bodega.</i>`);
            form.append('parse_mode', 'HTML');

            const resDoc = await fetch(urlSendDocument, {
                method: 'POST',
                body: form
            });

            const dataDoc = await resDoc.json();

            if (!dataDoc.ok) {
                console.error('\x1b[31m%s\x1b[0m', '❌ [telegramService] Error al enviar PDF de remisión a Telegram:\n', dataDoc.description || dataDoc);
            } else {
                console.log('\x1b[32m%s\x1b[0m', `✅ [telegramService] Remisión PDF "Remision_${idRemision}.pdf" (${color.nombre}) enviada exitosamente a Telegram.`);
            }
        } catch (pdfErr) {
            console.error('\x1b[31m%s\x1b[0m', '❌ [telegramService] Excepción al generar o enviar PDF de remisión:\n', pdfErr.message || pdfErr);
        }

        return {
            ok: true,
            idRemision,
            color: color.nombre
        };
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', '❌ [telegramService] Excepción general en el servicio de Telegram:\n', error.message || error);
        return {
            ok: false,
            error: error.message || error
        };
    }
};

module.exports = {
    enviarNotificacionTelegramPedido,
    generarMensajeCompactoTelegram,
    generarPdfRemision,
    obtenerColorPedido,
    obtenerIconoCategoria,
    obtenerPlaceholderImagen,
    PALETA_COLORES_PEDIDO
};
