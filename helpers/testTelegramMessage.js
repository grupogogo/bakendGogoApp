const { 
    generarMensajeCompactoTelegram, 
    generarPdfRemision, 
    enviarNotificacionTelegramPedido 
} = require('./telegramService');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mockData = {
    pedido: {
        _id: '67c1e5a8f09b12a3456789ab',
        fechaCreacion: '17 de octubre de 2026 13:00'
    },
    cliente: {
        nombre: 'María Del Carmen Ramírez',
        nitCC: '68289151',
        ciudad: 'Arauca Arauca',
        direccion: 'Carrera 22 N 17-68',
        telefono: '3134881121',
        distribuidor: true
    },
    usuario: {
        name: 'Leonardo Gómez',
        email: 'Leonardo@gmail.com'
    },
    info: {
        fechaActual: '17 de octubre de 2026 13:00',
        tipoDespacho: 'Envío Inter Rapidísimo',
        formaPago: 'Crédito',
        detalleGeneral: 'Empacar con cuidado los cirios y sellar con cinta de seguridad',
        detalleEstado: ''
    },
    listadoPedido: {
        GN: {
            detalleGeneral: '',
            pedido: [
                { producto: 'Guantes Negros', nombreInput: 'T7', talla: '7', cantidad: 2 },
                { producto: 'Guantes Negros', nombreInput: 'T8', talla: '8', cantidad: 2 },
                { producto: 'Guantes Negros', nombreInput: 'T9', talla: '9', cantidad: 2 },
                { producto: 'Guantes Negros', nombreInput: 'T10', talla: '10', cantidad: 2 },
                { producto: 'Guantes Negros', nombreInput: 'T11', talla: '11', cantidad: 2 },
                { producto: 'Guantes Negros', nombreInput: 'T12', talla: '12', cantidad: 2 }
            ]
        },
        KB: {
            detalleGeneral: 'Revisar moños',
            pedido: [
                { nombreInput: 'KB-2O', motivo: '2', genero: '0', talla: 't0', cantidad: 6 },
                { nombreInput: 'KB-1A', motivo: '1', genero: '1', talla: 't0', cantidad: 6 }
            ]
        },
        KCG: {
            detalleGeneral: 'Kits grandes con tallas',
            pedido: [
                { nombreInput: 'KCG-6O8', motivo: '6', genero: '0', talla: '8', cantidad: 2 },
                { nombreInput: 'inputSurtidoNino', motivo: '', genero: '0', talla: 't0', cantidad: 3 },
                { nombreInput: 'inputSurtidoNina', motivo: '', genero: '1', talla: 't0', cantidad: 5 }
            ]
        },
        CCON: {
            detalleGeneral: '',
            pedido: [
                { nombreInput: 'CCON-1', motivo: '1', genero: '0', talla: 't0', cantidad: 2 },
                { nombreInput: 'CCON-2', motivo: '2', genero: '0', talla: 't0', cantidad: 4 }
            ]
        },
        OTR: {
            detalleGeneral: '',
            pedido: [
                { producto: 'Caja vacía kit bautizo', cantidad: 3 }
            ]
        }
    }
};

async function test() {
    console.log('===============================================================');
    console.log('🧪 PRUEBA 1: GENERACIÓN DEL MENSAJE COMPACTO DE TELEGRAM');
    console.log('===============================================================\n');

    const resultadoTexto = generarMensajeCompactoTelegram(mockData);
    console.log(resultadoTexto.mensaje);
    console.log('\nTotal Unidades:', resultadoTexto.totalUnidades);
    console.log('Total Categorías:', resultadoTexto.totalCategorias);

    console.log('\n===============================================================');
    console.log('🧪 PRUEBA 2: GENERACIÓN DEL PDF DE REMISIÓN CON CHECKBOXES Y FOTOS');
    console.log('===============================================================\n');

    const pdfBuffer = await generarPdfRemision(mockData);
    const outputPath = path.join(__dirname, 'test-remision.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`✅ PDF generado exitosamente (${pdfBuffer.length} bytes) en: ${outputPath}`);

    console.log('\n===============================================================');
    console.log('🧪 PRUEBA 3: ENVÍO REAL A TELEGRAM (SI TOKEN Y CHAT_ID ESTÁN CONFIGURADOS)');
    console.log('===============================================================\n');

    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        console.log(`Conectando con Telegram con Chat ID: ${process.env.TELEGRAM_CHAT_ID}...`);
        const envio = await enviarNotificacionTelegramPedido(mockData);
        console.log('Resultado del envío:', envio);
    } else {
        console.log('⚠️ No hay TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID en .env, omitiendo envío HTTP real.');
    }
}

test().catch(err => {
    console.error('❌ Error en test:', err);
});
