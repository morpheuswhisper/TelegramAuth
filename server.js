const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const crypto = require('crypto');
const path = require('path');
const sqlite3 = require('sqlite3').verbose(); // Подключаем SQLite

const app = express();
app.use(bodyParser.json());

// Токен Telegram бота
const TELEGRAM_BOT_TOKEN = '7821768437:AAEJf-c-O7AwwuCbQRh8I7QEOchx4pNT3f8';

// Инициализация базы данных
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

// Функция отправки сообщений
const sendMessage = (chatId, text) => {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = { chat_id: chatId, text };

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
        .then(response => response.json())
        .then(data => {
            if (!data.ok) {
                console.error('Ошибка при отправке сообщения:', data);
            } else {
                console.log('Сообщение успешно отправлено:', data.result.text);
            }
        })
        .catch(err => console.error('Ошибка запроса:', err));
};

// Функция проверки подписи Telegram
const checkTelegramAuth = (data, hash) => {
    const secretKey = crypto.createHash('sha256').update(TELEGRAM_BOT_TOKEN).digest();
    const sortedData = Object.keys(data)
        .filter(key => key !== 'hash')
        .sort()
        .map(key => `${key}=${data[key]}`)
        .join('\n');
    const hmac = crypto.createHmac('sha256', secretKey).update(sortedData).digest('hex');
    return hmac === hash;
};

// Маршрут для сохранения никнейма
app.post('/set-nickname', (req, res) => {
    const { telegram_id, username } = req.body;

    console.log('Полученные данные для сохранения:', { telegram_id, username }); // Логирование данных

    // Проверка: ник должен содержать только буквы и цифры, длина от 3 до 10 символов
    const nicknameRegex = /^[a-zA-Zа-яА-Я0-9]{3,10}$/;

    if (!telegram_id || !username) {
        console.error('Ошибка: telegram_id или username отсутствует.');
        return res.status(400).json({ message: 'Не передан telegram_id или username.' });
    }

    if (!nicknameRegex.test(username)) {
        return res.status(400).json({ message: 'Никнейм может содержать только буквы и цифры. Длина от 3 до 10 символов.' });
    }

    const query = `INSERT INTO users (telegram_id, username, registration_date) VALUES (?, ?, ?)`;
    const params = [telegram_id, username, new Date().toISOString()];

    console.log('Параметры для сохранения в базе данных:', params); // Логирование параметров

    db.run(query, params, function (err) {
        if (err) {
            console.error('Ошибка сохранения пользователя:', err.message);
            return res.status(500).json({ message: 'Ошибка сохранения пользователя.' });
        }
        res.status(200).json({ message: 'Никнейм успешно сохранён.' });
    });
});

// Запускаем сервер
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
