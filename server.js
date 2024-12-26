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

// Обслуживание статических файлов (например, auth.html)
app.use(express.static(path.join(__dirname, 'public')));

// Маршрут для обработки авторизации
app.get('/auth', (req, res) => {
    const data = req.query;

    console.log('Полученные данные от Telegram:', data);

    if (!data.hash || !checkTelegramAuth(data, data.hash)) {
        console.error('Неверная подпись данных');
        return res.status(403).send('Invalid signature');
    }

    // Проверка, зарегистрирован ли пользователь
    db.get(`SELECT * FROM users WHERE telegram_id = ?`, [data.id], (err, row) => {
        if (err) {
            console.error('Ошибка при поиске пользователя:', err.message);
            return res.status(500).json({ message: 'Ошибка сервера.' });
        }

        if (row) {
            res.json({ message: 'Вы уже авторизованы.', username: row.username });
        } else {
            res.json({ message: 'Авторизация успешна. Введите ваш никнейм.', telegram_id: data.id });
        }
    });
});

// Маршрут для Webhook
app.post('/webhook', (req, res) => {
    const data = req.body;

    console.log('Получены данные от Telegram:', JSON.stringify(data, null, 2));

    if (data.message) {
        const chatId = data.message.chat.id;
        const text = data.message.text;

        console.log(`Получено сообщение: "${text}" от chatId: ${chatId}`);

        if (text === '/start') {
            sendMessage(chatId, 'Добро пожаловать! Пожалуйста, введите ваш никнейм в игре.');
        } else {
            sendMessage(chatId, `Вы сказали: "${text}"`);
        }
    }

    res.status(200).send('OK');
});

// Маршрут для сохранения никнейма
app.post('/set-nickname', (req, res) => {
    const { telegram_id, username } = req.body;

    // Проверка: ник должен содержать только буквы и цифры, длина от 3 до 10 символов
    const nicknameRegex = /^[a-zA-Zа-яА-Я0-9]{3,10}$/;

    if (!nicknameRegex.test(username)) {
        return res.status(400).json({ message: 'Никнейм может содержать только буквы и цифры. Длина от 3 до 10 символов.' });
    }

    const query = `INSERT INTO users (telegram_id, username, registration_date) VALUES (?, ?, ?)`;
    const params = [telegram_id, username, new Date().toISOString()];

    db.run(query, params, function (err) {
        if (err) {
            console.error('Ошибка сохранения пользователя:', err.message);
            return res.status(500).json({ message: 'Ошибка сохранения пользователя.' });
        }
        res.status(200).json({ message: 'Никнейм успешно сохранён.' });
    });
});

// Маршрут для получения информации о пользователе
app.get('/get-user/:telegram_id', (req, res) => {
    const telegram_id = req.params.telegram_id;

    db.get(`SELECT * FROM users WHERE telegram_id = ?`, [telegram_id], (err, row) => {
        if (err) {
            console.error('Ошибка при поиске пользователя:', err.message);
        }

        if (row) {
            res.status(200).json(row);
        } else {
            res.status(404).json({ message: 'Пользователь не найден.' });
        }
    });
});

// Запускаем сервер
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
