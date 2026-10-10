# GREEN-API Chat

Веб-интерфейс для отправки и получения текстовых сообщений через [GREEN-API](https://green-api.com).
Пользователь выбирает мессенджер — **MAX**, **WhatsApp** или **Telegram** — и входит с учетными данными своего инстанса.
Внешний вид основан на [web.max.ru](https://web.max.ru/).

**Демо:** https://amaduasko.github.io/green-api-chat/

## Возможности

- Вход по `idInstance` и `apiTokenInstance` с проверкой состояния инстанса (`getStateInstance`)
- Создание чата по номеру телефона получателя (`+7 900 123-45-67`, `8 900...`, `79001234567`), в Telegram также по `@username`
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

## Идентификатор чата в разных мессенджерах

| Мессенджер | Как номер превращается в `chatId` | Пример |
|---|---|---|
| WhatsApp | номер + `@c.us` | `79001234567@c.us` |
| MAX | метод [CheckAccount](https://green-api.com/v3/docs/api/service/CheckAccount/) возвращает числовой `chatId`; поддерживаются только номера +7 и +375 | `10000000` |
| Telegram | метод [CheckAccount](https://green-api.com/telegram/docs/api/service/CheckAccount/) по номеру или `@username` | `10000000` |

Входящие уведомления MAX и Telegram приходят с тем же числовым `chatId`, поэтому ответ попадает в тот же чат.
Если `chatId` ответа всё же отличается, чат объединяется по номеру телефона отправителя (`senderPhoneNumber`).

## Как это работает

```
src/
  api/greenApi.ts           клиент GREEN-API (sendMessage, receiveNotification, deleteNotification, getStateInstance)
  api/messengers.ts         настройки MAX / WhatsApp / Telegram
  hooks/useNotifications.ts цикл long polling очереди уведомлений
  lib/notifications.ts      преобразование уведомлений в сообщения (только текст)
  lib/chatStore.ts          состояние чатов (reducer), дедупликация сообщений
  lib/resolveChat.ts        номер / @username → chatId для выбранного мессенджера
  lib/chatId.ts             разбор номера телефона, подписи чатов
  components/               экран входа, список чатов, окно чата
```

- Каждое полученное уведомление удаляется из очереди, даже если оно не текстовое, чтобы очередь не останавливалась.
- Сообщения, отправленные из приложения, показываются по ответу `sendMessage`; уведомления `outgoingAPIMessageReceived` игнорируются.
  Сообщения, отправленные с телефона (`outgoingMessageReceived`), тоже отображаются. Повторно доставленные уведомления отбрасываются по `idMessage`.
- Сообщения отображаются в порядке поступления: время сервера имеет точность до секунды и может расходиться с часами браузера.

## Деплой

При каждом push в `main` GitHub Actions проверяет типы, запускает тесты, собирает проект и публикует его на GitHub Pages
(`.github/workflows/ci.yml`).

## Безопасность

- Учетные данные хранятся только в `sessionStorage` и удаляются при закрытии вкладки или выходе.
- История чатов хранится в `localStorage` браузера, отдельно для каждого инстанса.
- Токен отправляется только в GREEN-API.
