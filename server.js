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

    console.log('Отправка сообщения:', payload);  // Логируем данные, которые отправляем

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Ответ от Telegram:', data);  // Логируем ответ от Telegram
        if (!data.ok) {
            console.error('Ошибка при отправке сообщения:', data);
        } else {
            console.log('Сообщение успешно отправлено');
        }
    })
    .catch(err => console.error('Ошибка при отправке сообщения:', err));
};

// Обрабатываем запросы от Telegram
app.post('/webhook', (req, res) => {
    const data = req.body;
    console.log('Получены данные от Telegram:', JSON.stringify(data, null, 2));  // Логируем полученные данные

    if (data.message) {
        const chatId = data.message.chat.id;
        const text = data.message.text;

        console.log('Получено сообщение от пользователя:', text);  // Логируем текст сообщения
        console.log('chatId:', chatId);  // Логируем chatId

        // Логика обработки сообщений
        if (text === '/start') {
            sendMessage(chatId, 'Добро пожаловать в нашего бота!');
        } else {
            sendMessage(chatId, `Вы сказали: "${text}"`);
        }
    } else {
        console.log('В сообщении нет данных о сообщении');
    }

    res.send('OK');  // Telegram ожидает ответ "OK"
});

// Запускаем сервер
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
