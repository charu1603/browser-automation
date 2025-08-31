import express from "express";
import puppeteer from "puppeteer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function parsePrompt(prompt) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent(`
    You are a browser automation planner.
    Convert the user instruction into ONLY a JSON array of steps.
    - Do NOT add explanations
    - Do NOT add markdown fences
    - Just return a valid JSON array
    - If an element must be clicked by visible text (like "Authentication" or "Sign Up"),
      then use {"action":"findAndClickText","text":"Authentication"} instead of CSS selectors.
    - Always include enough steps until the goal is reached.
 Sidebar is already opened and the Authentication tab is also already opened in the Sidebar.
  - To open the Sign Up form, click the first Sign Up button in the sidebar using the CSS selector a[href="/auth/signup"].
  - Then fill up the form with the required inputs.
  - If Sign Up is not available, fallback to Login (these buttons have different routes).
  - Always include enough sequential steps until the goal is reached.
  - Always include selectors, prefer CSS selectors over text if available.
  - Always use actual selectors from the DOM
- For example, use {"action":"type","selector":"#firstName","text":"Chaitrali"} 
  instead of {"action":"type","selector":"input[name='firstName']","text":"Chaitrali"}
- The first name field has id="firstName", last name has id="lastName", etc.
- if it has confirm password field then retype the password (this is important)
- if no valur or text is provided in the prompt then use dummy text, email and password and everything accordingly
    Example:
    [
      {"action":"goto","url":"https://google.com"},
        {"action":"click","selector":"a[href='/auth/signup']"},
      {"action":"type","selector":"input[name='q']","text":"cats"},
      {"action":"click","selector":"input[type='submit']"},
      {"action":"findAndClickText","text":"Sign Up"}
    ]

    User request: "${prompt}"
  `);

  let text = result.response.text().trim();

  text = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("❌ Failed to parse AI output:", text);
    return [];
  }
}

async function executeActions(actions) {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  const page = await browser.newPage();

  for (const step of actions) {
    console.log("👉 Running step:", step);

    switch (step.action) {
      case "goto":
        await page.goto(step.url, { waitUntil: "networkidle2" });
        break;

      case "type":
        await page.waitForSelector(step.selector, { timeout: 10000 });
        await page.type(step.selector, step.text, { delay: 100 }); // human-like typing
        break;

      case "click":
        await page.waitForSelector(step.selector, { timeout: 10000 });
        await page.click(step.selector);

        break;

      case "findAndClickText":
        await page.evaluate((text) => {
          const el = [
            ...document.querySelectorAll("a, button, div, span"),
          ].find(
            (e) =>
              e.innerText &&
              e.innerText.trim().toLowerCase().includes(text.toLowerCase())
          );
          if (el) el.click();
        }, step.text);
        await page.waitForTimeout(2000);
        break;

      case "wait":
        await page.waitForTimeout(step.time || 2000);
        break;

      default:
        console.warn("⚠️ Unknown action:", step);
    }
  }
}

app.post("/agent", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "No prompt provided" });

  try {
    const actions = await parsePrompt(prompt);

    if (!actions.length) {
      return res.status(500).json({ error: "AI returned no valid actions" });
    }

    await executeActions(actions);
    console.log("✅ Automation completed successfully!");
    res.json({ success: true, actions });
  } catch (err) {
    console.error("❌ Execution failed:", err);
    res.status(500).json({ error: "Execution failed" });
  }
});

app.listen(3000, () =>
  console.log("🚀 AI Browser Agent running on http://localhost:3000")
);
