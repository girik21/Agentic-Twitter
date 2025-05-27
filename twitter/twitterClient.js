import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config();

// Debug function to check your credentials
const debugTwitterCredentials = () => {
    console.log("🔍 Debugging Twitter API Credentials:");
    console.log("API Key exists:", !!process.env.TWITTER_API_KEY);
    console.log("API Secret exists:", !!process.env.TWITTER_API_SECRET); 
    console.log("Access Token exists:", !!process.env.TWITTER_ACCESS_TOKEN);
    console.log("Access Secret exists:", !!process.env.TWITTER_ACCESS_SECRET);
    
    // Show partial keys for verification (first 4 chars only)
    console.log("API Key starts with:", process.env.TWITTER_API_KEY?.substring(0, 4));
    console.log("Access Token starts with:", process.env.TWITTER_ACCESS_TOKEN?.substring(0, 4));
};

const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

export const tweetContent = async (text) => {
    try {
        // Debug credentials first
        debugTwitterCredentials();
        
        // Test API connection first
        console.log("🔍 Testing Twitter API connection...");
        const me = await twitterClient.v2.me();
        console.log("✅ Connected as:", me.data.username);
        
        // Then try to tweet
        console.log("📝 Attempting to tweet:", text.substring(0, 50) + "...");
        const response = await twitterClient.v2.tweet({ text });
        console.log("✅ Tweet posted successfully:", response.data.id);
        return response;
        
    } catch (error) {
        console.error("❌ Twitter API Error Details:");
        console.error("Status:", error.code);
        console.error("Message:", error.message);
        console.error("Data:", error.data);
        
        // Specific error handling
        if (error.code === 403) {
            console.error("🚨 403 Error - Possible causes:");
            console.error("1. App permissions not set to 'Read and Write'");
            console.error("2. Invalid or expired access tokens");
            console.error("3. Account suspended or restricted");
            console.error("4. Tweet content violates Twitter rules");
        }
        
        return null;
    }
};