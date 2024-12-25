const puppeteer = require('puppeteer');
const randomstring = require('randomstring');

// Constants
const URL = "https://portal.nexuscloud.shop/register";
const REFERRAL_CODE = "4f13FbXX";
const NUM_THREADS = 5;
const DELAY_BEFORE_SUBMIT = 5000; // Delay in milliseconds before clicking the submit button
const DELAY_BEFORE_CLICK = 3000; // Additional delay before clicking the Create Account button
const TOTAL_LOOPS = 10;

// Function to generate a random email
function generateRandomEmail() {
  const domains = ["gmail.com", "yahoo.com", "hotmail.com"];
  const randomDomain = domains[Math.floor(Math.random() * domains.length)];
  return `${randomstring.generate(10)}@${randomDomain}`;
}

// Function to generate a random password
function generateRandomPassword(length = 12) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?';
  return randomstring.generate({ length, charset: characters });
}

// Function to pause execution for a set time
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to handle user registration
async function registerUser(loop, thread) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  try {
    const randomUsername = randomstring.generate(8);
    const randomEmail = generateRandomEmail();
    const randomPassword = generateRandomPassword();

    await page.goto(URL, { waitUntil: 'load', timeout: 0 });

    // Fill out the registration form
    await page.type('#name', randomUsername);
    await page.type('#email', randomEmail);
    await page.type('input[name="password"]', randomPassword);
    await page.type('input[name="password_confirmation"]', randomPassword);
    await page.type('input[name="referral_code"]', REFERRAL_CODE);
    await page.click('input[name="terms"]');

    // Handle reCAPTCHA Test Mode
    console.log(`[INFO] Handling CAPTCHA in thread ${thread}`);
    const captchaFrame = await page.frames().find(frame => frame.url().includes('recaptcha'));
    const captchaCheckbox = await captchaFrame.$('.recaptcha-checkbox-border');
    await captchaCheckbox.click();

    // Wait for CAPTCHA to resolve
    await delay(5000); // Adjust delay based on CAPTCHA's response time

    // Delay before clicking the Create Account button
    console.log(`[INFO] Adding delay before clicking Create Account in thread ${thread}`);
    await delay(DELAY_BEFORE_CLICK);

    // Submit the form and wait for confirmation
    try {
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      console.log(`[SUCCESS] Registration complete for Username: ${randomUsername}, Email: ${randomEmail}`);
    } catch (err) {
      console.error(`[ERROR] Failed to complete registration: ${err.message}`);
    }

  } catch (err) {
    console.error(`[ERROR] Loop ${loop}, Thread ${thread}: ${err.message}`);
  } finally {
    await browser.close();
  }
}

// Main function to handle multithreading
(async () => {
  for (let loop = 1; loop <= TOTAL_LOOPS; loop++) {
    console.log(`Starting registration loop ${loop} with ${NUM_THREADS} threads...`);

    const promises = [];
    for (let thread = 1; thread <= NUM_THREADS; thread++) {
      promises.push(registerUser(loop, thread));
    }

    await Promise.all(promises);

    console.log(`Loop ${loop} completed!`);
    await delay(2000); // Delay between loops
  }

  console.log("All iterations completed!");
})();