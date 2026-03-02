import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./sqlite.db');

db.serialize(() => {
  db.run('DELETE FROM Porcionado;', function(err) {
    if (err) {
      console.error('Error al eliminar datos de Porcionado:', err.message);
    } else {
      console.log('Todos los datos de Porcionado han sido eliminados.');
    }
  });
});

db.close();
