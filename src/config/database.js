import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'ventas',
    server: process.env.DB_SERVER || 'localhost',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// Pool de conexiones
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

pool.on('error', err => {
    console.error('Error en el pool de SQL:', err);
});

export const getConnection = async () => {
    try {
        await poolConnect;
        return pool;
    } catch (err) {
        console.error('Error al obtener conexión:', err);
        throw err;
    }
};

export const executeStoredProcedure = async (procedureName, parameters) => {
    try {
        const pool = await getConnection();
        const request = pool.request();

        // Agregar parámetros al request
        for (const [key, value] of Object.entries(parameters)) {
            request.input(key, value);
        }

        const result = await request.execute(procedureName);
        return result;
    } catch (err) {
        console.error(`Error ejecutando ${procedureName}:`, err);
        throw err;
    }
}; 