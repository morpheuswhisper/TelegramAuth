const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());

// Вставьте свой токен Telegram бота здесь
const TELEGRAM_BOT_TOKEN = '7821768437:AAEJf-c-O7AwwuCbQRh8I7QEOchx4pNT3f8';

// Функция отправки сообщений
const sendMessage = (chatId, text) => {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = { chat_id: chatId, text };

    console.log('Отправка сообщения:', payload);

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Ответ от Telegram:', data);
        if (!data.ok) {
            console.error('Ошибка при отправке сообщения:', data.description);
        } else {
            console.log('Сообщение успешно отправлено');
        }
    })
    .catch(err => console.error('Ошибка при отправке сообщения:', err));
};

// Проверка данных Telegram
const isTelegramDataValid = (data) => {
    const secretKey = crypto.createHash('sha256').update(TELEGRAM_BOT_TOKEN).digest();
    const checkString = Object.keys(data)
        .filter(key => key !== 'hash')
        .sort()
        .map(key => `${key}=${data[key]}`)
        .join('\n');

    const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
    return hmac === data.hash;
};

// Генерация JWT
const createToken = (user) => {
    return jwt.sign({ id: user.id, username: user.username }, 'your_secret_key', { expiresIn: '1h' });
};

// Маршрут для авторизации через Telegram
app.get('/auth', (req, res) => {
    const telegramData = req.query;

    // Проверяем корректность данных от Telegram
    if (!isTelegramDataValid(telegramData)) {
        return res.status(403).json({ message: 'Invalid Telegram data' });
    }

    // Создаём объект пользователя
    const user = {
        id: telegramData.id,
        firstName: telegramData.first_name,
        username: telegramData.username,
        photoUrl: telegramData.photo_url,
    };

    // Генерируем токен
    const token = createToken(user);

    // Возвращаем токен клиенту
    res.json({ message: 'Authorization successful', token });
});

// Обрабатываем запросы от Telegram
app.post('/webhook', (req, res) => {
    const data = req.body;
    console.log('Получены данные от Telegram:', JSON.stringify(data, null, 2));

    if (data.message) {
        const chatId = data.message.chat.id;
        const text = data.message.text;

        console.log('Получено сообщение от пользователя:', text);
        console.log('chatId:', chatId);

        // Логика обработки сообщений
        if (text === '/start') {
            sendMessage(chatId, 'Добро пожаловать в нашего бота!');
        } else {
            sendMessage(chatId, `Вы сказали: "${text}"`);
        }
    } else {
        console.log('В сообщении нет данных о сообщении');
    }

    res.status(200).send('OK');
});

// Запускаем сервер
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
