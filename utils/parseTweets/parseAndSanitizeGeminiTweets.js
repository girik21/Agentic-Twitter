import { TweetsSchema } from "../../zodSchemas/articleSchema/articleSchema.js";

/**
 * Clean up newlines, remove markdown-style [links], trim whitespace.
 */
function sanitizeTweet(text) {
  return text
    .replace(/\[([^\]]+)\]/g, '$1')      // remove [link]
    .replace(/\s*\n+\s*/g, ' ')          // collapse newlines
    .replace(/\s{2,}/g, ' ')             // collapse multiple spaces
    .trim();
}

/**
 * Extract the first JSON array inside ```json ... ``` block or raw text.
 */
function extractJson(text) {
  const match = text.match(/```json\s*(\[\s*{[\s\S]+?}\s*])\s*```/);
  return match ? match[1] : text.trim();
}

/**
 * Parses and sanitizes the Gemini output.
 */
export function parseAndSanitizeGeminiTweets(rawText) {
  const jsonString = extractJson(rawText);

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    throw new Error("❌ Failed to parse JSON: " + e.message);
  }

  let tweets;
  try {
    tweets = TweetsSchema.parse(Array.isArray(parsed[0]) ? parsed[0] : parsed);
  } catch (err) {
    throw new Error("❌ Zod validation failed: " + JSON.stringify(err.errors, null, 2));
  }

  return tweets.map(tweet => ({
    ...tweet,
    crafted_tweet_text: sanitizeTweet(tweet.crafted_tweet_text)
  }));
}
