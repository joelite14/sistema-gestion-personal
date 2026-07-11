import mysql from 'mysql2';

const db = mysql.createPool({
  host: 'localhost',
  user: 'root', 
  password: 'admin', // <--- LA QUE PUSISTE EN LA INSTALACIÓN
  database: 'sistema_ebn',
  port: 3306
});

export default db.promise();