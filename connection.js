const morgan = require('morgan');
const express = require('express');
const router = require('express-promise-router')();
const oracledb = require('oracledb');
oracledb.initOracleClient();
const cors = require('cors');

const app = express();
app.use(cors());
app.options('*', cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(router);

oracledb.outFormat = oracledb.OBJECT;

let connection = undefined;

async function initializeConnection() {
    if (connection === undefined) {
        try {
            connection = await oracledb.getConnection({
                user: 'hr',
                password: 'hr',
                connectString: 'localhost:1521/XE'
            });
        } catch (error) {
            console.error('Error establishing database connection:', error);
        }
    }
}

async function closeConnection() {
    if (connection) {
        try {
            await connection.close();
            console.log('Connection closed.');
        } catch (error) {
            console.error('Error closing connection:', error);
        }
    }
}

module.exports = { initializeConnection, closeConnection, getConnection: () => connection };
