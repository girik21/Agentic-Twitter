import { geminiContentAgent } from "../contentAgent/contentAgent.js";
import { GoogleGenAI } from "@google/genai";
import { getAllTweets, saveTweetToDatabase } from "../../utils/database/supabaseClient.js";
import { VerifierSchema } from "../../zodSchemas/marketingSchema/verifierSchema.js";
import { toGeminiSchema } from "gemini-zod";
import { tweetContent } from "../../twitter/twitterClient.js";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const geminiMarketingAgent = async () => {
  try {
    const allTweetsFromDB = await getAllTweets();

    if (!allTweetsFromDB) {
      console.error("❌ Could not fetch DB tweets.");
      return;
    }

    let offset = 0;
    const MAX_OFFSET = 30;

    while (offset < MAX_OFFSET) {
      const latestTweets = await geminiContentAgent(0, 1, offset);

      if (!latestTweets || latestTweets.length === 0) {
        console.warn("⚠️ No tweets generated, skipping...");
        offset += 5;
        continue;
      }

      console.log("Latest Tweets", latestTweets);
      console.log("Latest DB", allTweetsFromDB);

      const dbText = JSON.stringify(allTweetsFromDB, null, 2);
      const newTweetsText = JSON.stringify(latestTweets, null, 2);

      const prompt = `
You are a smart Tweet verifier. Compare the *essence* of each new tweet with previously posted ones and mark if it’s too similar.

**TASK:** For each tweet in the latest batch, compare it to the tweets in the database and decide whether it's a DUPLICATE (similar gist) or OK (unique). Consider tone, message, and call-to-action — not just exact text.

**PREVIOUS TWEETS:**
${dbText}

**NEWLY GENERATED TWEETS:**
${newTweetsText}

**RESPONSE FORMAT:** Respond with only a raw JSON array. No markdown, no explanation — just this:
[
  {
    "title": "Original title of the tweet",
    "status": "DUPLICATE" or "OK",
    "reason": "Short explanation why"
  }
]
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: toGeminiSchema(VerifierSchema.array()),
        },
      });

      let rawText = response.text.trim();

      if (rawText.startsWith("```json")) {
        rawText = rawText.replace(/^```json/, "").replace(/```$/, "").trim();
      }

      const json = JSON.parse(rawText);
      const flattened = Array.isArray(json[0]) ? json.flat() : json;

      const parsed = VerifierSchema.safeParse(flattened);

      if (!parsed.success) {
        console.error("❌ Verifier validation failed:", parsed.error.flatten());
        console.error("Raw text:", rawText);
        return;
      }

      const result = parsed.data;
      const firstOk = result.find(r => r.status === "OK");

      if (firstOk) {
        const approvedTweet = latestTweets.find(t => t.original_title === firstOk.title);

        console.log("Approved tweeet", approvedTweet)

        if (!approvedTweet) {
          console.error("❌ Approved tweet title not found in generated batch.");
          return;
        }

        const tweetText = `${approvedTweet.crafted_tweet_text}\n\n🔗 ${approvedTweet.original_link}`;

        console.log("tweeting",tweetText)


        // Post the tweet
        const tweetResponse = await tweetContent(tweetText);

        if (tweetResponse) {
          // Save to DB
          await saveTweetToDatabase({
            title: approvedTweet.original_title,
            url: approvedTweet.original_link,
            crafted_tweet_text: approvedTweet.crafted_tweet_text,
            character_count: approvedTweet.estimated_character_count,
          });

          console.log("✅ Tweet saved and posted successfully.");
          process.exit(0); // stop cron job
        } else {
          console.error("❌ Failed to tweet. Not saving.");
        }

        return;
      } else {
        console.log("🔁 All tweets were duplicates. Trying next batch...");
        offset += 5;
      }
    }

    console.error("❌ No non-duplicate tweet found after max attempts.");
  } catch (error) {
    console.error("❌ Marketing agent failed:", error.message);
  }
};
