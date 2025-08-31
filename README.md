# AI Browser Automation Agent

This project is an AI-powered browser automation agent built with **Node.js**, **Express**, **Puppeteer**, and **Google Gemini AI**.  
The agent can read a natural language prompt, convert it into browser actions, and execute them like a human on a website.



https://github.com/user-attachments/assets/fb421b5c-21c7-4970-9d85-27f632ab1723


---

## Features

- Converts user instructions into JSON browser actions using Gemini AI.
- Supports actions like `goto`, `click`, `type`, `findAndClickText`, and `wait`.
- Human-like typing with Puppeteer.
- Keeps the browser open for demonstration purposes.
- Easy API integration for testing via Postman.

---

## Prerequisites

- Node.js >= 18.x
- npm or yarn
- Google Gemini API key

---

## Setup

1. Clone the repository:

```bash
git clone https://github.com/charu1603/browser-automation
```

2.install dependencies

```bash
npm i
```

3.create .env

```bash
GEMINI_API_KEY=
```

4. run the server

```bash
npm start
```

### API Endpoint

POST /agent

1) Open postman
2) Open Postman and Select POST method.
Enter URL:

```bash
http://localhost:3000/agent
```
3) Go to the Body tab → select raw → JSON.
4) 
```bash
{
  "prompt": "Go to ui.chaicode.com, click on Sign Up, and fill the form with sample details"
}
```
