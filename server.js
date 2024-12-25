const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());

// Токен Telegram бота
const TELEGRAM_BOT_TOKEN = '7821768437:AAEJf-c-O7AwwuCbQRh8I7QEOchx4pNT3f8';

// Функция проверки подписи Telegram
const checkTelegramAuth = (data, hash) => {
    const secretKey = crypto.createHash('sha256').update(TELEGRAM_BOT_TOKEN).digest();
    const sortedData = Object.keys(data).sort().map(key => `${key}=${data[key]}`).join('\n');
    const hmac = crypto.createHmac('sha256', secretKey).update(sortedData).digest('hex');
    return hmac === hash;
};

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

// Запускаем сервер
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
