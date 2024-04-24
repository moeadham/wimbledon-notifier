# Wimbledon Notifier

Looking for resale tickets for Wimbledon? This should hopefully text you when some become available.

## Requirements

- Chrome
- a 2captcha account that is funded
- a twilio account

## Installation:

```
cp .auth.js.template .auth.js
```

Now open auth.js and fill out your api keys and other details.

```
npm install
npm start
```

## TODO

Right now it doesn't log back in and get new credentials when polling fails, I just run the script again. Would be nice if it could fix itself. PR's welcome.