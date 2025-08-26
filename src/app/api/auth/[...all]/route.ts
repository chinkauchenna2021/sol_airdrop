import { auth } from "@/lib/better-auth-enhanced"
import { toNextJsHandler } from "better-auth/next-js";
 
export const { POST, GET } = toNextJsHandler(auth);
