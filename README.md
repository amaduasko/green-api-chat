# GREEN-API Chat

Веб-интерфейс для отправки и получения текстовых сообщений через [GREEN-API](https://green-api.com).
Пользователь выбирает мессенджер — **MAX**, **WhatsApp** или **Telegram** — и входит с учетными данными своего инстанса.
Внешний вид основан на [web.max.ru](https://web.max.ru/).

## Возможности

- Вход по `idInstance` и `apiTokenInstance` с проверкой состояния инстанса (`getStateInstance`)
- Создание чата по номеру телефона получателя (`+7 900 123-45-67`, `8 900...`, `79001234567`)
- Отправка текстовых сообщений методом [SendMessage](https://green-api.com/v3/docs/api/sending/SendMessage/)
- Получение сообщений по технологии [HTTP API](https://green-api.com/v3/docs/api/receiving/technology-http-api/):
  `ReceiveNotification` → обработка → `DeleteNotification`
- Статусы отправки (отправляется / отправлено / ошибка), счетчик непрочитанных, адаптивная верстка, темная тема

## Стек

React 18, TypeScript, Vite, Vitest. Без бэкенда и без сторонних UI-библиотек — приложение обращается к GREEN-API напрямую из браузера.

## Локальный запуск

Нужен Node.js 18+.

```bash
npm install
npm run dev        # http://localhost:5173
```

Другие команды:

```bash
npm test           # юнит-тесты
npm run build      # production-сборка в dist/
npm run preview    # просмотр сборки
```

## Подготовка инстанса GREEN-API

1. Создайте инстанс в [консоли GREEN-API](https://console.green-api.com) для нужного мессенджера и авторизуйте его.
2. В настройках инстанса включите получение входящих сообщений (incoming webhooks) и **оставьте поле webhookUrl пустым** —
   иначе уведомления уйдут на вебхук и не попадут в очередь HTTP API.
3. Скопируйте `idInstance`, `apiTokenInstance` и `apiUrl` из консоли и введите их на экране входа.

## Как это работает

```
src/
  api/greenApi.ts           клиент GREEN-API (sendMessage, receiveNotification, deleteNotification, getStateInstance)
  api/messengers.ts         настройки MAX / WhatsApp / Telegram
  hooks/useNotifications.ts цикл long polling очереди уведомлений
  lib/notifications.ts      преобразование уведомлений в сообщения (только текст)
  lib/chatStore.ts          состояние чатов (reducer), дедупликация сообщений
  lib/chatId.ts             номер телефона → chatId
  components/               экран входа, список чатов, окно чата
```

- Каждое полученное уведомление удаляется из очереди, даже если оно не текстовое, чтобы очередь не останавливалась.
- Сообщение может прийти дважды (ответ `sendMessage` и уведомление `outgoingAPIMessageReceived`) — дубликаты отбрасываются по `idMessage`.
- Сообщения отображаются в порядке поступления: время сервера имеет точность до секунды и может расходиться с часами браузера.

## Безопасность

- Учетные данные хранятся только в `sessionStorage` и удаляются при закрытии вкладки или выходе.
- История чатов хранится в `localStorage` браузера, отдельно для каждого инстанса.
- Токен отправляется только в GREEN-API.
