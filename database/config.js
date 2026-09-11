const dns = require('dns');
const mongoose = require('mongoose');

// Usar DNS de Google para resolver correctamente MongoDB Atlas
dns.setServers(['8.8.8.8', '8.8.4.4']);

const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.DB_CNN);
        console.log('DB Online');
    } catch (error) {
        console.log(error);
        throw new Error('Error al iniciar BD');
    }
};

module.exports = {
    dbConnection
};