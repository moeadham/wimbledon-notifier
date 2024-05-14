# Wimbledon Notifier

Looking for resale tickets for Wimbledon? This should hopefully text you when some become available.

## Requirements

- Chrome
- a 2captcha account that is funded
- a twilio account

# Installation:

## Dev evironment

You are going to need git, nodejs and Google chrome to get going.

If you are on a mac, I recommend installing [homebrew](https://brew.sh/) to get things going. Then open a [terminal](https://support.apple.com/en-gb/guide/terminal/apd5265185d-f365-44cb-8b09-71a064a42125/mac) and:
```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install git
brew install node
# If you don't already have google chrome:
brew install --cask google-chrome
```

## Accounts setup

- You need to add a small balance to your 2captcha account, then get your API key [here](https://2captcha.com/setting)
- You need a small balance on your twilio account, and [purchase a phone number](https://console.twilio.com/develop/phone-numbers/manage/search) to send SMS messages. Then copy your account SID and Auth Token from [here](https://console.twilio.com/account/keys-credentials/api-keys)

## Setup wimbledon notifier

```
git clone git@github.com:moeadham/wimbledon-notifier.git
cd wimbledon-notifier
cp .auth.js.template .auth.js
open -e .auth.js
```

Now open auth.js and fill out your api keys and other details. 
| Parameter        | Value                                                                                                                                                     |
|------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| twilioAccountSid | From [here](https://console.twilio.com/account/keys-credentials/api-keys)                                                                                 |
| twilioAuthToken  | From [here](https://console.twilio.com/account/keys-credentials/api-keys)                                                                                 |
| twilioSendFrom   | The phone number you purchased from Twilio to send SMS messages (Starting with +...)                                                                      |
| twilioSendTo     | The phone number you want to get notified when a ticket is available (Starting with a +...)                                                               |
| captchaApiKey    | 2captcha API key from [here](https://2captcha.com/setting)                                                                                                |
| wimbledonEmail   | Your email address for Wimbledon                                                                                                                          |
| wimbledonPass    | Your password for Wimbledon                                                                                                                               |
| chromePath       | The path to your google chrome. If you're on a mac, keep the default. Otherwise you can try running [this](https://stackoverflow.com/a/61620017/1528493)  |

Save & Close.

## Run the app

Finally you can run the application.
```
npm install
npm start
```

Keep the terminal window open.

## TODO

Right now it doesn't log back in and get new credentials when polling fails, I just run the script again. Would be nice if it could fix itself. PR's welcome.
