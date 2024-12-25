const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(bodyParser.json());

// Токен Telegram бота
const TELEGRAM_BOT_TOKEN = '7821768437:AAEJf-c-O7AwwuCbQRh8I7QEOchx4pNT3f8';

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

    // Авторизация прошла успешно
    console.log('Авторизация успешна для пользователя:', data.username);

    res.send(`Добро пожаловать, ${data.first_name}!`);
});

// Маршрут для Webhook
app.post('/webhook', (req, res) => {
    const data = req.body;

    console.log('Получены данные от Telegram:', JSON.stringify(data, null, 2));

    // Проверяем, содержит ли сообщение данные
    if (data.message) {
        const chatId = data.message.chat.id;
        const text = data.message.text;

        console.log(`Получено сообщение: "${text}" от chatId: ${chatId}`);

        // Обработка команды /start
        if (text === '/start') {
            sendMessage(chatId, 'Добро пожаловать в нашего бота!');
        } else {
            sendMessage(chatId, `Вы сказали: "${text}"`);
        }
    }

    // Telegram ожидает ответ 200 OK
    res.status(200).send('OK');
});

// Запускаем сервер
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
