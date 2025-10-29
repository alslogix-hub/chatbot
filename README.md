WhatsApp Bot (whatsapp-web.js)

Overview
- Receives a message in WhatsApp.
- Extracts and formats the sender number as `(xx) xxxxx-xxxx`.
- GET `http://localhost:3001/chatbot/verify-number?number=(xx) xxxxx-xxxx`.
  - If `success` is `false`: replies with internal error.
  - If `success` is `true` and `data` is `false`: replies that the user is not part of the system.
  - If `success` is `true` and `data` is `true`: POST `http://localhost:3001/chatbot` with `{ input: <message body> }` and replies with `output` from the response.

Setup
- Requirements: Node.js 18+ and Chromium dependencies for Puppeteer.
- Install dependencies:
  - `npm install`
- Run the bot:
  - `npm start`
- Scan the QR code shown in the terminal using WhatsApp on your phone.

Notes
- Numbers are derived from `message.from` and normalized to the Brazilian format `(xx) xxxxx-xxxx` by taking the last 11 digits.
- Group messages are ignored by default. Remove the check in `src/index.js` if you want to handle groups.
- Expected verify-number response: `{ success: boolean, data: boolean }`.
- Expected chatbot response body: an object with at least an `output` field. If the service wraps responses (e.g., `{ data: { output: '...' } }`), the bot still attempts to read `data.output`.

