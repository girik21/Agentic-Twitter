import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';


dotenv.config({ path: '../../.env' });

export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

export const getAllTweets = async () => {
    const { data, error } = await supabase
        .from('twitter_v2')
        .select('*');

    if (error) {
        console.error('❌ Supabase connection failed:', error.message);
    } 
    
    console.log('✅ Supabase connected');
    return data

};

export const saveTweetToDatabase = async (tweet) => {
  const { title, url, crafted_tweet_text, character_count } = tweet;

  const { data, error } = await supabase
    .from('twitter_v2')
    .insert([
      {
        title: title,
        url: url,
        crafted_tweet_text,
        character_count
      }
    ]);

  if (error) {
    console.error("❌ Failed to save tweet to database:", error.message);
    return null;
  }

  console.log("✅ Tweet saved to database:", data);
  return data;
};
