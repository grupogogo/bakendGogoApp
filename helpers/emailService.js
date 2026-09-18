const { Resend } = require('resend');

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
        case 'OTR': return 'OTROS PRODUCTOS / ACCESORIOS';
        case 'G': return 'GENERAL';
        default: return categoria;
    }
};

/**
 * Formateo de valores numéricos a pesos colombianos
 */
const formatearMoneda = (valor) => {
    const num = Number(valor) || 0;
    return `$ ${num.toLocaleString('es-CO')}`;
};

/**
 * Genera el cuerpo HTML completo del correo electrónico con diseño moderno y tablas detalladas
 */
const generarPlantillaHtmlPedido = ({ pedido, cliente, usuario, listadoPedido, info }) => {
    const idMostrar = String(pedido?._id || pedido?.pedido_id || 'NUEVO').slice(-8).toUpperCase();
    const fecha = info?.fechaActual || pedido?.fechaCreacion || new Date().toLocaleString('es-CO');
    const clienteNombre = cliente?.nombre || 'Cliente sin nombre';
    const clienteNit = cliente?.nitCC || cliente?.nit || 'No especificado';
    const clienteCiudad = cliente?.ciudad || 'No especificada';
    const clienteDireccion = cliente?.direccion || 'No especificada';
    const clienteTelefono = cliente?.telefono || 'No especificado';
    const esDistribuidor = cliente?.distribuidor ? 'Distribuidor' : 'Particular';

    const creadorNombre = usuario?.name || 'Asesor comercial';
    const creadorEmail = usuario?.email || '';

    const tipoDespacho = info?.tipoDespacho || pedido?.tipoDespacho || 'Punto';
    const formaPago = info?.formaPago || pedido?.formaPago || 'Crédito';
    const costoEnvio = Number(info?.costoEnvio || pedido?.costoEnvio) || 0;
    const detalleGeneral = info?.detalleGeneral || pedido?.detalleGeneral || '';
    const detalleEstado = info?.detalleEstado || pedido?.detalleEstado || '';

    // Estructura de items
    const rawItems = listadoPedido || (pedido?.itemPedido?.[0]?.itemPedido) || {};

    let totalProductos = 0;
    let subtotalGeneral = 0;
    let totalCategorias = 0;

    // Procesar categorías y filas
    let bloquesCategoriasHtml = '';

    Object.entries(rawItems).forEach(([categoriaKey, catData]) => {
        const items = Array.isArray(catData?.pedido) ? catData.pedido : (Array.isArray(catData) ? catData : []);
        if (items.length === 0) return;

        totalCategorias += 1;
        const nombreCat = buscarNombreCategoria(categoriaKey);
        const detalleCat = catData?.detalleGeneral || '';

        let subtotalCat = 0;
        let cantCat = 0;
        let filasHtml = '';

        items.forEach((item, idx) => {
            const cant = Number(item?.cantidad) || 0;
            const precioU = Number(item?.precioUnitario || item?.precio) || 0;
            const sub = cant * precioU;

            cantCat += cant;
            subtotalCat += sub;

            // Identificación y descripción del producto
            const inputStr = String(item?.nombreInput || '');
            let descripcion = '';

            if (categoriaKey === 'GUANTES') {
                descripcion = item?.producto || inputStr.split('-').pop() || 'Guantes';
            } else if (categoriaKey === 'OTR') {
                descripcion = item?.producto || 'Accesorio / Producto';
            } else if (inputStr.includes('inputSurtidoNino') || inputStr.endsWith('O')) {
                descripcion = 'Surtido - Niño';
            } else if (inputStr.includes('inputSurtidoNina') || inputStr.endsWith('A')) {
                descripcion = 'Surtido - Niña';
            } else {
                const numMotivo = inputStr.split('-')[1] || item?.motivo || '1';
                const generoStr = (item?.genero === '0' || item?.genero === 0) ? ' (Niño)' : (item?.genero === '1' || item?.genero === 1) ? ' (Niña)' : '';
                descripcion = `Motivo #${numMotivo}${generoStr}`;
            }

            // Talla si aplica
            const talla = item?.talla || (inputStr.includes('Talla') ? inputStr : (categoriaKey === 'KCG' || categoriaKey === 'GUANTES' ? (item?.talla || '-') : '-'));

            const bgFila = idx % 2 === 0 ? '#ffffff' : '#f8fafc';

            filasHtml += `
                <tr style="background-color: ${bgFila};">
                    <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b; font-weight: 500;">
                        ${descripcion}
                    </td>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #475569; text-align: center;">
                        ${talla}
                    </td>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a; font-weight: 700; text-align: center;">
                        ${cant}
                    </td>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #475569; text-align: right;">
                        ${formatearMoneda(precioU)}
                    </td>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a; font-weight: 600; text-align: right;">
                        ${formatearMoneda(sub)}
                    </td>
                </tr>
            `;
        });

        totalProductos += cantCat;
        subtotalGeneral += subtotalCat;

        bloquesCategoriasHtml += `
            <div style="margin-bottom: 22px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff;">
                <div style="background-color: #f1f5f9; padding: 10px 14px; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="font-size: 13px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px;">📁 ${nombreCat}</span>
                        ${detalleCat ? `<div style="font-size: 11px; color: #64748b; font-style: italic; margin-top: 2px;">Nota: ${detalleCat}</div>` : ''}
                    </div>
                    <div style="font-size: 12px; font-weight: 700; color: #0284c7; text-align: right;">
                        Subtotal: ${formatearMoneda(subtotalCat)} <span style="font-weight: 400; color: #64748b;">(${cantCat} und)</span>
                    </div>
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f8fafc;">
                            <th style="padding: 8px 12px; text-align: left; font-size: 11px; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Producto / Motivo</th>
                            <th style="padding: 8px 12px; text-align: center; font-size: 11px; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; width: 80px;">Talla</th>
                            <th style="padding: 8px 12px; text-align: center; font-size: 11px; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; width: 65px;">Cant.</th>
                            <th style="padding: 8px 12px; text-align: right; font-size: 11px; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; width: 110px;">Precio Unit.</th>
                            <th style="padding: 8px 12px; text-align: right; font-size: 11px; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; width: 115px;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filasHtml}
                    </tbody>
                </table>
            </div>
        `;
    });

    const granTotal = subtotalGeneral + costoEnvio;

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuevo Pedido - ${clienteNombre}</title>
</head>
<body style="margin: 0; padding: 20px 10px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        
        <!-- Header Principal -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 24px; color: #ffffff;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td valign="middle">
                        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #38bdf8; font-weight: 700; margin-bottom: 4px;">
                            GRUPO COMERCIAL GOGO
                        </div>
                        <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">
                            ¡Nuevo Pedido Creado!
                        </h1>
                    </td>
                    <td valign="middle" style="text-align: right;">
                        <span style="background-color: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); color: #ffffff; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-family: monospace; font-weight: bold;">
                            #${idMostrar}
                        </span>
                        <div style="color: #94a3b8; font-size: 11px; margin-top: 6px;">
                            ${fecha}
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Banner Asunto Resumen -->
        <div style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 14px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="font-size: 14px; color: #334155;">
                        <strong>Cliente:</strong> <span style="color: #0284c7; font-weight: 700;">${clienteNombre}</span>
                    </td>
                    <td style="font-size: 14px; color: #334155; text-align: right;">
                        <strong>Creado por:</strong> <span style="color: #0f172a; font-weight: 700;">${creadorNombre}</span>
                    </td>
                </tr>
            </table>
        </div>

        <div style="padding: 24px;">
            
            <!-- Tarjetas de Información: Cliente & Despacho -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                    <!-- Columna Cliente -->
                    <td width="50%" valign="top" style="padding-right: 10px;">
                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; height: 100%;">
                            <div style="font-size: 12px; font-weight: 800; color: #0284c7; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px;">
                                👤 Datos del Cliente
                            </div>
                            <div style="font-size: 14px; font-weight: bold; color: #0f172a; margin-bottom: 6px;">
                                ${clienteNombre}
                            </div>
                            <div style="font-size: 12px; color: #475569; line-height: 1.6;">
                                <div><strong>NIT/CC:</strong> ${clienteNit}</div>
                                <div><strong>Ciudad:</strong> ${clienteCiudad}</div>
                                <div><strong>Dirección:</strong> ${clienteDireccion}</div>
                                <div><strong>Teléfono:</strong> ${clienteTelefono}</div>
                                <div><strong>Tipo:</strong> <span style="background-color: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600;">${esDistribuidor}</span></div>
                            </div>
                        </div>
                    </td>

                    <!-- Columna Despacho & Pago -->
                    <td width="50%" valign="top" style="padding-left: 10px;">
                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; height: 100%;">
                            <div style="font-size: 12px; font-weight: 800; color: #059669; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px;">
                                🚚 Despacho y Pago
                            </div>
                            <div style="font-size: 12px; color: #475569; line-height: 1.6;">
                                <div><strong>Transportadora / Despacho:</strong> <span style="color: #0f172a; font-weight: 600;">${tipoDespacho}</span></div>
                                <div><strong>Forma de pago:</strong> <span style="color: #0f172a; font-weight: 600;">${formaPago}</span></div>
                                <div><strong>Costo de envío:</strong> <span style="color: ${costoEnvio > 0 ? '#b91c1c' : '#15803d'}; font-weight: 700;">${costoEnvio > 0 ? formatearMoneda(costoEnvio) : 'Incluido / $0'}</span></div>
                                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
                                    <strong>Asesor:</strong> ${creadorNombre}
                                    ${creadorEmail ? `<div style="font-size: 11px; color: #64748b;">${creadorEmail}</div>` : ''}
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            </table>

            <!-- Notas u Observaciones si existen -->
            ${(detalleGeneral || detalleEstado) ? `
                <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 14px; margin-bottom: 24px;">
                    <div style="font-size: 12px; font-weight: 800; color: #b45309; text-transform: uppercase; margin-bottom: 4px;">
                        📝 Observaciones del Pedido
                    </div>
                    ${detalleGeneral ? `<div style="font-size: 13px; color: #78350f; margin-bottom: 4px;"><strong>Detalle General:</strong> ${detalleGeneral}</div>` : ''}
                    ${detalleEstado ? `<div style="font-size: 13px; color: #78350f;"><strong>Novedad:</strong> ${detalleEstado}</div>` : ''}
                </div>
            ` : ''}

            <!-- Sección de Productos -->
            <div style="margin-bottom: 14px;">
                <div style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; border-bottom: 2px solid #0f172a; padding-bottom: 6px;">
                    📦 Detalle de Productos por Categoría
                </div>
                ${bloquesCategoriasHtml || '<div style="text-align: center; color: #94a3b8; padding: 20px;">Sin productos registrados.</div>'}
            </div>

            <!-- Resumen Financiero y Totales -->
            <div style="background-color: #0f172a; color: #ffffff; border-radius: 8px; padding: 18px 22px; margin-top: 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td valign="middle">
                            <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Resumen Consolidado</div>
                            <div style="font-size: 13px; color: #e2e8f0; margin-top: 4px;">
                                <strong>${totalProductos}</strong> unidades en <strong>${totalCategorias}</strong> categorías
                            </div>
                        </td>
                        <td valign="middle" style="text-align: right;">
                            <div style="font-size: 12px; color: #94a3b8;">Subtotal: ${formatearMoneda(subtotalGeneral)}</div>
                            ${costoEnvio > 0 ? `<div style="font-size: 12px; color: #94a3b8;">Envío: ${formatearMoneda(costoEnvio)}</div>` : ''}
                            <div style="font-size: 22px; font-weight: 800; color: #34d399; margin-top: 4px;">
                                TOTAL: ${formatearMoneda(granTotal)}
                            </div>
                        </td>
                    </tr>
                </table>
            </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #64748b;">
                Este correo fue generado automáticamente por <strong>GoG App</strong> al crear un nuevo pedido.
            </p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">
                Grupo Comercial Gogo • ${new Date().getFullYear()}
            </p>
        </div>

    </div>
</body>
</html>
    `;
};

/**
 * Función principal para enviar el correo de nuevo pedido mediante la API HTTPS de Resend
 */
const enviarCorreoNuevoPedido = async ({ pedido, cliente, usuario, listadoPedido, info }) => {
    try {
        const apiKey = process.env.RESEND_API_KEY;
        const emailTo = process.env.EMAIL_TO || 'grupocomercialgogo@gmail.com';
        const emailFrom = process.env.EMAIL_FROM || 'GogoApp - Pedidos <onboarding@resend.dev>';
        const idMostrar = String(pedido?._id || pedido?.pedido_id || 'NUEVO').slice(-8).toUpperCase();
        const clienteNombre = cliente?.nombre || 'Cliente';
        const creadorNombre = usuario?.name || 'Asesor';

        const subject = `ALERTA: 📦 Nuevo pedidito #${idMostrar} | CLIENTE: ${clienteNombre} | ASESOR: ${creadorNombre}`;

        if (!apiKey) {
            console.warn('\x1b[33m%s\x1b[0m', '⚠️  [emailService] RESEND_API_KEY no está configurada. El pedido se guardó correctamente pero no se envió correo.');
            return {
                ok: false,
                msg: 'RESEND_API_KEY no configurada'
            };
        }

        const resend = new Resend(apiKey);
        const htmlContent = generarPlantillaHtmlPedido({ pedido, cliente, usuario, listadoPedido, info });

        const { data, error } = await resend.emails.send({
            from: emailFrom,
            to: emailTo,
            subject: subject,
            html: htmlContent
        });

        if (error) {
            console.error('\x1b[31m%s\x1b[0m', '❌ [emailService] Error al enviar correo:\n', error);
            return {
                ok: false,
                error
            };
        }

        console.log('\x1b[32m%s\x1b[0m', `✅ [emailService] Correo enviado exitosamente a ${emailTo}`);
        console.log('\x1b[36m%s\x1b[0m', `📧 [emailService] Message ID: ${data?.id}`);
        return {
            ok: true,
            messageId: data?.id
        };
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', '❌ [emailService] Error al enviar correo:\n', error.message || error);
        return {
            ok: false,
            error: error.message || error
        };
    }
};

module.exports = {
    enviarCorreoNuevoPedido,
    generarPlantillaHtmlPedido,
    buscarNombreCategoria,
    formatearMoneda
};
