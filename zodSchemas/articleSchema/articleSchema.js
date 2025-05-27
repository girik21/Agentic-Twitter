import { z } from "zod";

const TweetSchema = z.object({
  original_title: z.string().min(5),
  original_link: z.string().url(),
  crafted_tweet_text: z.string().max(280),
  estimated_character_count: z.number().int().lte(280),
  engagement_rationale: z.string().min(5)
});

export const TweetsSchema = z.array(TweetSchema);
