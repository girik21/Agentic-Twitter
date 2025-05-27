# 🤖 Agentic Twitter Bot (V2)

A smart autonomous Twitter bot powered by Google Gemini, Supabase, and the Twitter API. It automatically fetches trending tech articles, crafts viral tweets, checks for semantic duplicates, and posts the most unique one daily.

---

## 🔧 Features

- ✅ Pulls articles from **TechCrunch**, **Hacker News**, and more
- 🧠 Uses **Gemini LLM** to craft high-quality, concise tweets
- 🔍 Uses **LLM-based semantic verification** to avoid reposting similar content
- 🗃️ Stores posted tweet metadata in **Supabase**
- 📈 Pulls and incorporates **real-time trending hashtags** from Trends24
- 🐦 Posts to Twitter using the **Twitter v2 API**
- 🕒 Designed for **cron job automation** — posts once and exits

---

## 📁 Project Structure

```bash
.
├── agents/
│   ├── contentAgent.js       # Generates tweet candidates using Gemini
│   └── marketingAgent.js     # Verifies tweet originality with LLM
├── scrapers/
│   ├── techCrunch/           # Scraper for TechCrunch articles
│   ├── twitterTrends/        # Trends24 trending hashtags
│   └── hackerNews/           # Hacker News top stories
├── utils/
│   ├── database/             # Supabase client + storage utils
│   ├── parseTweets/          # Zod validation + sanitization
│   └── twitterClient.js      # Twitter v2 API client
├── zodSchemas/               # All Zod schema validations
├── .env                      # API keys and secrets
└── index.js                  # Entry point, runs the cron agent
