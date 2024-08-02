var mysql = require('mysql');

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