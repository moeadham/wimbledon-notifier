import auth from './.auth.js';
import fetch from 'node-fetch';
import twilio from 'twilio';
const client = twilio(auth.twilioAccountSid, auth.twilioAuthToken);
import { getTokens } from './login.js';

const url = "https://ticketsale.wimbledon.com/tnwr/v1/catalog?maxPerformances=100&maxTimeslots=100&maxPerformanceDays=10&maxTimeslotDays=10&includeMetadata=true";

let TEST = false;
let intervalId;

const options = {
  headers: {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-secutix-host": "ticketsale.wimbledon.com",
    "Referer": "https://ticketsale.wimbledon.com/secured/content",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  },
  "method": "GET"
};

(async () => {
  try {
    sendTextMessage(auth.twilioSendTo, "Wimbledon Notifier started.")
    const tokens = await getTokens();
    intervalId = setInterval(() => checkForNewTickets(tokens), 10000);
  } catch (error) {
    console.error('Failed to start the ticket checker:', error);
    sendTextMessage(auth.twilioSendTo, "Failed to start Wimbledon Notifier.");
  }
})();

async function checkForNewTickets(tokens) {
    try {
      console.log("===========CHECKING FOR NEW TICKETS===============");
      console.log("Getting new tokens");
      options.headers["x-api-key"] = tokens.apiKey;
      options.headers["x-csrf-token"] = tokens.csrf;
      options.headers["cookie"] = tokens.cookie;
      const response = await fetch(url, options);
      const data = await response.json();
      processData(data);
    } catch (error) {
      console.error('Error:', error);
      sendTextMessage(auth.twilioSendTo, "Wimbledon Notifier has stopped.");
      clearInterval(intervalId);
    }
  }
  

function processData(data) {
    if (data.sections && data.sections.length > 0) {
        data.sections.forEach(section => {
            console.log(`Section: ${section.name.en}`);
            if (section.clusters) {
                section.clusters.forEach(cluster => {
                    console.log(`Cluster: ${cluster.name.en}`);
                    if (cluster.items) {
                        cluster.items.forEach(item => {
                            console.log(`Performance: ${item.product.performances[0].name.en} - Availability: ${item.product.performances[0].availability}`);
                            if (item.product.performances[0].availability !== "NONE") {
                                sendTextMessage(auth.twilioSendTo, `WIMBLEDON TICKET AVAILABLE - GO GO GO!  ${item.product.performances[0].name.en}, https://ticketsale.wimbledon.com/content`);
                            }

                            if (TEST && item.product.performances[0].name.en === "No.2 Court Day 10") {
                                sendTextMessage(auth.twilioSendTo, `WIMBLEDON TICKET AVAILABLE - GO GO GO!  ${item.product.performances[0].name.en}, https://ticketsale.wimbledon.com/content`);
                            }
                        });
                    }
                });
            }
        });
    } else {
        console.error('API returned empty list.');
        sendTextMessage(auth.twilioSendTo, "Wimbledon Notifier has stopped.")
        clearInterval(intervalId);
    }
}



function sendTextMessage(to, body) {
  const from = auth.twilioSendFrom; // Replace with your Twilio phone number
  client.messages
    .create({
      body: body,
      to: to,
      from: from
    })
    .then(message => console.log(`Message sent with ID: ${message.sid}`))
    .catch(error => console.error('Failed to send SMS:', error));
}


