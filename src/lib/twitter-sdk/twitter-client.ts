// lib/twitter-client.ts
import { Client, auth } from "twitter-api-sdk";

let authClient: auth.OAuth2User | null = null;
let client: Client | null = null;

export function getTwitterAuthClient() {
  if (!authClient) {
    authClient = new auth.OAuth2User({
      client_id: process.env.TWITTER_CLIENT_ID as string,
      client_secret: process.env.TWITTER_CLIENT_SECRET as string,
      callback: `${process.env.NEXTAUTH_URL}/api/auth/callback/twitter`,
      scopes: ["tweet.read", "users.read", "offline.access", "like.read", "follows.read"],
    });
  }
  return authClient;
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
  
  if (!client) {
    client = new Client(process.env.TWITTER_BEARER_TOKEN as string);
  }
  return client;
}