const mysql = require('mysql2/promise');
const { Client } = require('ssh2');
require('dotenv').config();

const sshConfig = {
    host: process.env.SSH_HOST || '79.143.88.223',
    port: parseInt(process.env.SSH_PORT || '22'),
    username: process.env.SSH_USER || 'root',
    password: process.env.SSH_PASS || 'Parkourwhat88',
    readyTimeout: 30000
};

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'paolovalle',
    password: process.env.DB_PASS || 'Parkourwhat88@AldoWeb&PeresPeres',
    database: process.env.DB_NAME || 'Tuletos'
};

let connection;

async function initDB() {
    if (connection) return connection;
    return new Promise((resolve, reject) => {
        const sshClient = new Client();
        sshClient.on('ready', () => {
            // Usamos el estilo de tu .exe para la conexión
            sshClient.forwardOut('127.0.0.1', 0, dbConfig.host, 3306, async (err, stream) => {
                if (err) {
                    sshClient.end();
                    return reject(err);
                }
                try {
                    connection = await mysql.createConnection({
                        ...dbConfig,
                        stream: stream
                    });
                    resolve(connection);
                } catch (e) {
                    if (e.code === 'ER_BAD_DB_ERROR') {
                        try {
                            connection = await mysql.createConnection({
                                host: dbConfig.host,
                                user: dbConfig.user,
                                password: dbConfig.password,
                                stream: stream
                            });
                            resolve(connection);
                        } catch (e2) {
                            reject(e2);
                        }
                    } else {
                        reject(e);
                    }
                }
            });
        }).on('error', (err) => {
            reject(err);
        }).connect(sshConfig);
    });
}

async function query(sql, params = []) {
    if (!connection) {
        await initDB();
    }
    const [rows, fields] = await connection.execute(sql, params);
    return rows;
}

module.exports = { query, initDB };
