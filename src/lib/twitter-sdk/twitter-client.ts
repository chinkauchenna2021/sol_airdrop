// lib/twitter-client.ts
import { Client, auth } from "twitter-api-sdk";

// Store auth client per request to avoid state issues
export function getTwitterAuthClient() {
  return new auth.OAuth2User({
    client_id: process.env.TWITTER_CLIENT_ID as string,
    client_secret: process.env.TWITTER_CLIENT_SECRET as string,
    callback: `${process.env.NEXTAUTH_URL}/api/auth/callback/twitter`,
    scopes: ["tweet.read", "users.read", "offline.access", "like.read", "follows.read"],
  });
}

export function getTwitterClient(accessToken?: string) {
  if (accessToken) {
    const userAuthClient = new auth.OAuth2User({
      client_id: process.env.TWITTER_CLIENT_ID as string,
      client_secret: process.env.TWITTER_CLIENT_SECRET as string,
      callback: `${process.env.NEXTAUTH_URL}/api/auth/callback/twitter`,
      scopes: ["tweet.read", "users.read", "offline.access", "like.read", "follows.read"],
    });
    
    userAuthClient.token = {
      access_token: accessToken,
      token_type: "bearer",
    };
    
    return new Client(userAuthClient);
  }
  
  // Use bearer token for app-level access
  return new Client(process.env.TWITTER_BEARER_TOKEN as string);
}