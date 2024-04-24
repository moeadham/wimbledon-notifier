import auth from './.auth.js';
import puppeteer from "puppeteer";
import request from "request-promise-native";
import { default as poll } from "promise-poller";
import fs from "fs";
import Captcha from "2captcha";

const solver = new Captcha.Solver(auth.captchaApiKey);

const siteDetails = {
  pageurl: "https://ticketsale.wimbledon.com/content",
};

const credentials = {
  email: auth.wimbledonEmail,
  password: auth.wimbledonPass
}

const chromeOptions = {
  executablePath: auth.chromePath,
  headless: false,
  slowMo: 10,
  defaultViewport: null,
};

async function getTokens() {
  const browser = await puppeteer.launch(chromeOptions);
  const page = await browser.newPage();
  await page.goto(siteDetails.pageurl);

  // Wait for the image to load
  const pageTitle = await page.title();
  if (pageTitle === "Waiting Room") {
    console.log("Currently in the Waiting Room. Solving Captcha...");
    await solveCaptcha(page);
  }
  console.log('No longer in waiting room.')

  await loginToWimbledon(page);
  console.log("Logged into myWimbledon");
  let tokens = await getCsrfAndCookie(page);
  console.log(tokens);
  await browser.close();
  console.log('Browser closed. Exiting Puppeteer session.');  
  return tokens;
}


async function solveCaptcha(page, attempt=0) {
    await page.waitForSelector("#img_captcha", { visible: true });
    await page.waitForFunction(
      () =>
        document.getElementById("img_captcha").complete &&
        document.getElementById("img_captcha").naturalHeight !== 0
    );
    const captchaImageBase64 = await page.evaluate(() => {
      const imgElement = document.getElementById("img_captcha");
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;
      context.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/png").split(",")[1]; // Get the base64 part
    });
    const solution = await solveImage(captchaImageBase64);
    console.log(`Captcha solution: ${solution.data}`);    
    let sol = solution.data;

    // TEST TEST TEST
    // if(attempt==0){
    //     sol="43445"
    // }
    await page.type('input[name="secret"]', sol);

    // Slowly click the button with ID 'submit_button'
    await page.waitForSelector("#submit_button", { visible: true });
    await page.click("#submit_button", { delay: 100 }); // Delay in milliseconds to simulate a slow click

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 5 seconds
    const errorElement = await page.waitForSelector('#error', { timeout: 3000 }).catch(() => null);
    if (errorElement) {
      console.log("found error element.")
      const errorMessage = await page.evaluate(el => el.textContent, errorElement);
      if (errorMessage.includes("The entered value is incorrect.")) {
        console.log("Captcha was incorrect. Retrying...");
        attempt = attempt+1;
        await solveCaptcha(page, attempt); // Recursively call solveCaptcha to handle the captcha again
      }
    }

    // Page title=Waiting Room
    // button id=actionButton
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds
    let pageTitle = await page.title();
    let attempts = 0;
    const maxAttempts = 30;
    while (pageTitle === "Waiting Room" && attempts < maxAttempts) {
      const actionButtonVisible = await page.waitForSelector("#actionButton", { visible: true, timeout: 2000 }).catch(() => null);
      if (actionButtonVisible) {
        await page.click("#actionButton");
        break; // Exit the loop if the button is clicked
      } else {
        console.log("Waiting for action button to appear...");
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before checking again
        pageTitle = await page.title(); // Refresh the page title to check if still in Waiting Room
      }
      attempts++;
    }
    if (attempts >= maxAttempts) {
      throw new Error("Maximum attempts reached while waiting in the Waiting Room.");
    }
    // Now we login to wimbledon:
    // If we get into a waiting room, wait, and then click
}

async function solveImage(base64Image) {
  try {
    const res = await solver.imageCaptcha(base64Image);
    // Logs the image text
    return res;
  } catch (err) {
    console.error(err.message);
  }
}

async function getCsrfAndCookie(page) {
    const tokens = await page.evaluate(() => {
        const scriptContent = [...document.querySelectorAll("script")]
          .map((script) => script.innerHTML)
          .find((s) =>
            s.includes("window.secutix = window.secutix|| {};secutix.__APP__={")
          );
        if (scriptContent) {
          const sessionDataMatch = scriptContent.match(
            /"session":\{"sessionToken":"(.*?)","csrfToken":"(.*?)"\}/
          );
          if (sessionDataMatch && sessionDataMatch.length >= 3) {
            return {
              sessionToken: sessionDataMatch[1],
              csrfToken: sessionDataMatch[2],
            };
          }
        }
        return { sessionToken: null, csrfToken: null };
      });
    
      console.log("Session Token:", tokens.sessionToken);
      console.log("CSRF Token:", tokens.csrfToken);
    
      const apiKey = await page.evaluate(() => {
        const scriptContent = [...document.querySelectorAll("script")]
          .map((script) => script.innerHTML)
          .find((s) => s.includes("STX.Widgets.start"));
        if (scriptContent) {
          const apiKeyMatch = scriptContent.match(/apiKey:'(.*?)'/);
          if (apiKeyMatch && apiKeyMatch.length >= 2) {
            return apiKeyMatch[1];
          }
        }
        return null;
      });
    
      console.log("API Key:", apiKey);
    
      // Get cookies
      const cookies = await page.cookies();
      const cookieString = cookies
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; ");
      console.log("Cookie String:", cookieString);
      return {cookie: cookieString, csrf: tokens.csrfToken, apiKey: apiKey}
}

async function loginToWimbledon(page) {
    // Wait for the new page to load and loginID to be visible

    // page title should start with "myWimbledon"
    //   await page.waitForNavigation({ waitUntil: 'networkidle0' });
    //   const currentPageTitle = await page.title();
    //   if (currentPageTitle.startsWith("myWimbledon")) {
    //     console.log("Successfully reached the myWimbledon page.");
    //   } else {
    //     console.log("Failed to reach the myWimbledon page.");
    //   }
    await page.waitForSelector("#loginID", { visible: true, timeout: 30000 });
    // email input id=loginID
    await page.type("#loginID", credentials.email);
    // password input id=password
    await page.type("#password", credentials.password);
    // submit input value="LOGIN", class="gigya-input-submit"
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 seconds
    await page.waitForSelector(
      '[data-screenset-element-id^="__gig_template_element_7_"][value="LOGIN"][data-screenset-roles="instance"]'
    );
    console.log("Found data-screenset-element-id");
    try {
      await page.click(
        '[data-screenset-element-id^="__gig_template_element_7_"][value="LOGIN"][data-screenset-roles="instance"]'
      );
    } catch (error) {
      console.error("Failed to click on the login button:", error);
    }
  
    await new Promise((resolve) => setTimeout(resolve, 15000)); // Wait for 15 seconds
}

const timeout = (millis) =>
  new Promise((resolve) => setTimeout(resolve, millis));

  export { getTokens };
