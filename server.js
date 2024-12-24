const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
app.use(bodyParser.json());

// Получаем токен бота из переменной окружения
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

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
        console.log('Ответ от Telegram:', data); // Логируем ответ от Telegram
        if (!data.ok) {
            console.error('Ошибка при отправке сообщения в Telegram:', data);
        }
    })
    .catch(err => console.error('Ошибка при отправке сообщения:', err));
};

// Обрабатываем запросы от Telegram
app.post('/webhook', (req, res) => {
    const data = req.body;
    console.log('Получены данные от Telegram:', JSON.stringify(data, null, 2));

    try {
        if (data.message) {
            const chatId = data.message.chat.id;
            const text = data.message.text;

            // Логика обработки сообщений
            if (text === '/start') {
                sendMessage(chatId, 'Добро пожаловать в нашего бота!');
            } else {
                sendMessage(chatId, `Вы сказали: "${text}"`);
            }
        }

        res.status(200).send('OK'); // Telegram ожидает ответ "OK"
    } catch (error) {
        console.error('Ошибка при обработке запроса:', error);
        res.status(500).send('Ошибка сервера');
    }
});

// Запускаем сервер
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));

