import { auth } from "@/lib/better-auth"
import { toNextJsHandler } from "better-auth/next-js"

const handler = toNextJsHandler(auth)

export { handler as GET, handler as POST }