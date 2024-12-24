const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch'); // Если нужна отправка запросов

const app = express();
app.use(bodyParser.json());

require('dotenv').config();
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Обработка запросов от Telegram
app.post('/webhook', (req, res) => {
    const data = req.body;
    console.log('Получены данные:', data);

    if (data.message) {
        const chatId = data.message.chat.id;
        const text = 'Привет! Вы успешно авторизовались через Telegram.';
        sendMessage(chatId, text);
    }

    res.sendStatus(200);
});

// Функция отправки сообщения
const sendMessage = (chatId, text) => {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = { chat_id: chatId, text };

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }).catch(err => console.error(err));
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
