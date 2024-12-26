const sqlite3 = require('sqlite3').verbose();

// Подключаемся к базе данных или создаём её, если она не существует
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Подключено к базе данных SQLite.');
    }
});

// Создаём таблицу для пользователей
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id TEXT UNIQUE NOT NULL,
            username TEXT NOT NULL,
            registration_date TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('Ошибка создания таблицы:', err.message);
        } else {
            console.log('Таблица пользователей готова.');
        }
    });
});

module.exports = db;
