const sqlite3 = require('sqlite3').verbose();

// Cambia la ruta si tu base de datos está en otro lugar
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
