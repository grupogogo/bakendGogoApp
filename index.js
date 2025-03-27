const express = require('express');
require('dotenv').config();
const cors = require('cors');
const path = require('path'); // <-- Faltaba importar esto
const { dbConnection } = require('./database/config');

// Crear el servidor de express
const app = express();

// Base de datos
dbConnection();

// CORS (Siempre antes de definir rutas)
app.use(cors());

// Lectura y parseo del body
app.use(express.json());

// Rutas API (antes de servir React para evitar conflictos)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/pedidos', require('./routes/pedidos'));
app.use('/api/products', require('./routes/products'));
app.use('/api/gastos', require('./routes/gastos'));

// Servir archivos estáticos de React después de las rutas API
app.use(express.static(path.join(__dirname, "public")));

// Middleware para manejar rutas de React (Siempre devolver index.html)
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Escuchar peticiones
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
