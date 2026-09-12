const fs = require('fs');
const path = require('path');
const { generarPlantillaHtmlPedido } = require('./emailService');

const mockData = {
    pedido: {
        _id: '67c1e5a8f09b12a3456789ab',
        fechaCreacion: '11 de septiembre de 2026 21:15'
    },
    cliente: {
        nombre: 'Librería y Distribuidora Santa María',
        nitCC: '900.123.456-7',
        ciudad: 'Medellín',
        direccion: 'Calle 50 # 45-23 Centro',
        telefono: '310 987 6543',
        distribuidor: true
    },
    usuario: {
        name: 'Leonardo Asesor',
        email: 'asesor.leonardo@gogo.com'
    },
    info: {
        fechaActual: '11 de septiembre de 2026 21:15',
        costoEnvio: 18000,
        tipoDespacho: 'Inter Rapidísimo',
        formaPago: 'Crédito a 30 días',
        detalleGeneral: 'Por favor despachar en horas de la mañana. Empacar con protección adicional para cirios.',
        detalleEstado: ''
    },
    listadoPedido: {
        KCG: {
            detalleGeneral: 'Kits para ceremonia especial',
            pedido: [
                {
                    nombreInput: 'motivo-3',
                    motivo: '3',
                    genero: '0',
                    talla: 'Talla 8',
                    cantidad: 15,
                    precioUnitario: 45000
                },
                {
                    nombreInput: 'motivo-5',
                    motivo: '5',
                    genero: '1',
                    talla: 'Talla 10',
                    cantidad: 10,
                    precioUnitario: 45000
                },
                {
                    nombreInput: 'inputSurtidoNino',
                    motivo: '',
                    talla: 'Talla 6',
                    cantidad: 5,
                    precioUnitario: 43000
                }
            ]
        },
        CC: {
            detalleGeneral: 'Cirios decorados',
            pedido: [
                {
                    nombreInput: 'motivo-2',
                    motivo: '2',
                    genero: '0',
                    talla: '-',
                    cantidad: 20,
                    precioUnitario: 18000
                },
                {
                    nombreInput: 'motivo-4',
                    motivo: '4',
                    genero: '1',
                    talla: '-',
                    cantidad: 20,
                    precioUnitario: 18000
                }
            ]
        },
        GUANTES: {
            detalleGeneral: 'Guantes bordados',
            pedido: [
                {
                    producto: 'Guante Blanco Bordado Cáliz',
                    nombreInput: 'Talla 8',
                    talla: 'Talla 8',
                    cantidad: 25,
                    precioUnitario: 12000
                }
            ]
        }
    }
};

try {
    const html = generarPlantillaHtmlPedido(mockData);
    const outputPath = path.join(__dirname, '../test-preview-pedido.html');
    fs.writeFileSync(outputPath, html, 'utf-8');
    console.log('✅ Plantilla HTML generada exitosamente en:', outputPath);
    console.log(`Asunto esperado: "📦 Nuevo pedido #${String(mockData.pedido._id).slice(-8).toUpperCase()} | ${mockData.cliente.nombre} | ${mockData.usuario.name}"`);
} catch (err) {
    console.error('❌ Error al generar la plantilla HTML:', err);
    process.exit(1);
}
