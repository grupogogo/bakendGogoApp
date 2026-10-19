const fs = require('fs');
const path = require('path');
const { generarPlantillaHtmlPedido } = require('./emailService');

const mockData = {
    pedido: {
        _id: '67c1e5a8f09b12a3456789ab',
        fechaCreacion: '17 de octubre de 2026 11:30'
    },
    cliente: {
        nombre: 'Elvia Lozano',
        nitCC: '22392865',
        ciudad: 'Barranquilla',
        direccion: 'Carrera 9f # 40 - 17 frente al parque botanico',
        telefono: '3116532818',
        distribuidor: true
    },
    usuario: {
        name: 'Leonardo Gómez',
        email: 'Leonardo@gmail.com'
    },
    info: {
        fechaActual: '17 de octubre de 2026 11:30',
        costoEnvio: 0,
        tipoDespacho: 'Envío',
        formaPago: 'Crédito',
        detalleGeneral: 'Sólo envío al cobro. Despachar urgente por favor.',
        detalleEstado: ''
    },
    listadoPedido: {
        KCE: {
            detalleGeneral: 'Kits económicos para evento',
            pedido: [
                {
                    nombreInput: 'KCE-6t0',
                    motivo: '6',
                    genero: '0',
                    talla: 't0',
                    cantidad: 6,
                    precioUnitario: 12500
                },
                {
                    nombreInput: 'KCE-3t0',
                    motivo: '3',
                    genero: '0',
                    talla: 't0',
                    cantidad: 3,
                    precioUnitario: 12500
                }
            ]
        },
        CB: {
            detalleGeneral: 'Cirios bautizo decorados',
            pedido: [
                {
                    nombreInput: 'CB-6O',
                    motivo: '6',
                    genero: '0',
                    talla: 't0',
                    cantidad: 5,
                    precioUnitario: 12000
                },
                {
                    nombreInput: 'CB-5A',
                    motivo: '5',
                    genero: '1',
                    talla: 't0',
                    cantidad: 5,
                    precioUnitario: 12000
                }
            ]
        },
        KCG: {
            detalleGeneral: 'Entre los niños 4 kits niño talla 9',
            pedido: [
                {
                    nombreInput: 'inputSurtidoNino',
                    motivo: '',
                    genero: '0',
                    talla: 't0',
                    cantidad: 20,
                    precioUnitario: 25500
                },
                {
                    nombreInput: 'inputSurtidoNina',
                    motivo: '',
                    genero: '1',
                    talla: 't0',
                    cantidad: 20,
                    precioUnitario: 25500
                }
            ]
        },
        OTR: {
            detalleGeneral: '6 unidades con cruz y 6 unidades con paloma',
            pedido: [
                {
                    producto: 'Cirio decorado de confirmación',
                    nombreInput: '',
                    talla: '-',
                    cantidad: 12,
                    precioUnitario: 12000
                }
            ]
        }
    }
};

try {
    const { html, attachments } = generarPlantillaHtmlPedido(mockData);
    const outputPath = path.join(__dirname, '../test-preview-pedido.html');
    fs.writeFileSync(outputPath, html, 'utf-8');
    console.log('✅ Plantilla HTML generada exitosamente en:', outputPath);
    console.log(`📎 Total imágenes adjuntas generadas (CID): ${attachments.length}`);
    attachments.forEach((att, i) => {
        console.log(`   [${i + 1}] cid: ${att.contentId} -> ${att.filename} (${att.contentType})`);
    });
    console.log(`Asunto esperado: "ALERTA: 📦 Nuevo pedidito #${String(mockData.pedido._id).slice(-8).toUpperCase()} | CLIENTE: ${mockData.cliente.nombre} | ASESOR: ${mockData.usuario.name}"`);
} catch (err) {
    console.error('❌ Error al generar la plantilla HTML:', err);
    process.exit(1);
}
