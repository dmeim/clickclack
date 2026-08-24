/**
 * Clerk JWT provider for Convex `ctx.auth`.
 *
 * Convex dashboard env (NOT VITE_):
 *   CLERK_JWT_ISSUER_DOMAIN = https://<your-clerk-frontend-api>  (Issuer URL from Clerk JWT template)
 *
 * Clerk dashboard:
 *   Create a JWT template named "convex" (Convex docs).
 *
 * Frontend (owned by the frontend worker — do not skip this or ctx.auth is null):
 *   import { ConvexProviderWithClerk } from "convex/react-clerk";
 *   import { useAuth } from "@clerk/clerk-react";
 *   <ClerkProvider publishableKey={...}>
 *     <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
 *       ...
 *     </ConvexProviderWithClerk>
 *   </ClerkProvider>
 *
 * Never put ADMIN_PASSWORD or Clerk secrets in VITE_ variables.
 */
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
