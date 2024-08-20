var mysql = require('mysql');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPrismaConnection() {
    try {
        await prisma.$connect();
        console.log('Connected to database by Prisma');
    } catch (error) {
        console.error('Failed to connect to Prisma database:', error);
    } finally {
        await prisma.$disconnect();
    }
}
    
checkPrismaConnection();

var db_conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kopiapp'
});

db_conn.connect((err) => {
    if (err) throw err;
    console.log('Connected to kopiapp server!');
});

module.exports = db_conn;