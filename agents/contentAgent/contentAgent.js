import { getTechCrunchArticles } from "../../scrapers/techCrunch/techCrunchScraper.js";
import { hackerNewsArticles } from "../../utils/hackerNewsApi/fetchHackerNews.js";
import { scrapeTrends24 } from "../../scrapers/twitterTrends/trends24Scraper.js";
import { GoogleGenAI } from "@google/genai";
import { TweetsSchema } from "../../zodSchemas/articleSchema/articleSchema.js";
import { toGeminiSchema } from "gemini-zod";
import { parseAndSanitizeGeminiTweets } from "../../utils/parseTweets/parseAndSanitizeGeminiTweets.js";

import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const geminiContentAgent = async (retryCount = 0, limit = 1, offset = 0) => {
  const MAX_RETRIES = 6;

  try {
    const [techCrunchArticles, hackerNews, hashtags] = await Promise.all([
      getTechCrunchArticles(),
      hackerNewsArticles(),
      scrapeTrends24()
    ]);

    const formattedArticles = [...techCrunchArticles, ...hackerNews]
      .slice(offset, offset + 35)
      .map((item, i) => `(${i + 1}) "${item.title}" → ${item.url}`)
      .join("\n");

    console.log("Formated Articles", formattedArticles);

    const trendingHashtags = [...new Set(
      hashtags
        .filter(tag => typeof tag === "string" && tag.length > 1)
        .map(tag => tag.startsWith("#") ? tag : `#${tag.replace(/\s+/g, '')}`)
    )].slice(0, 15);

    console.log("Formated Articles", trendingHashtags);


    const prompt = `
        **Role:** You are an expert Social Media Strategist and Viral Tech Content Creator.

        **TASK:** Based on the following tech stories and trending hashtags, select the top ${limit} stories which suits the current trends and lifestyle in 2025 and write viral tweets for them.

        **STORIES:**
        ${formattedArticles}

        **TRENDING HASHTAGS TO PICK FROM:**
        ${trendingHashtags}

        Each tweet must:
        - Use a strong hook (30–40 chars)
        - Deliver value (100–120 chars)
        - You must use at least the 3 hashtags on the tweet 
        - All 3 hashtags MUST be selected from the TRENDING HASHTAGS list above.
        - Do NOT invent or use any other hashtags (e.g., #AI, #OpenAI, etc.).
        - TOTAL must be under 150 characters

        **OUTPUT FORMAT (strict JSON array):**

        ${JSON.stringify(toGeminiSchema(TweetsSchema), null, 2)}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: toGeminiSchema(TweetsSchema.array()),
      },
    });

    const rawText = response.text.trim();

    try {
      const tweets = parseAndSanitizeGeminiTweets(rawText);
      return tweets;
    } catch (zodError) {
      console.warn("⚠️ Zod validation failed:", zodError.message);

      if (retryCount < MAX_RETRIES) {
        console.log(`🔁 Retrying tweet generation (${retryCount + 1}/${MAX_RETRIES})...`);
        limit += 1
        return await geminiContentAgent(retryCount + 1, limit + 1);
      } else {
        console.error("❌ Exceeded max retries for content generation.");
        return null;
      }
    }
  } catch (error) {
    console.error("❌ Gemini agent error:", error.message);
    return null;
  }
};
