# Google sign-in setup

Google sign-in is implemented but stays disabled until all three backend variables are configured. Email/password continues to work.

## Google Cloud

1. Open https://console.cloud.google.com/ and select or create a project for Banned Cards.
2. Open **Google Auth Platform**. Configure **Branding** (app name, support email, contact email) and **Audience**. Choose External for customers outside your Google Workspace organization. While testing, add your Google account under test users if requested.
3. Under **Clients**, create an OAuth client with application type **Web application**.
4. Add this exact **Authorized redirect URI**:
   `http://localhost:3000/auth/google/callback`
   This is the storefront callback, not port 9000. The current server redirect flow does not require a JavaScript origin. If one is requested, use `http://localhost:3000`.
5. Copy the client ID and secret into the backend environment file below. Keep the secret out of chat, source control, and frontend `NEXT_PUBLIC_*` variables.

## Backend configuration

Edit `../bannedCards-server/.env`:

```dotenv
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

For the local HTTP server, set `LOCAL_HTTP_SESSION=true`. This enables HttpOnly, SameSite=Lax cookies without Secure only when all Store/Auth CORS origins are HTTP loopback addresses. Never enable it for a deployed server.

Restart the Medusa backend (`pnpm dev` in `bannedCards-server`). Refresh the storefront. No extra npm package or database migration is needed: the installed Medusa version includes the Google provider.

For production, register the exact HTTPS storefront callback (for example `https://your-domain/auth/google/callback`) and set `GOOGLE_CALLBACK_URL` to it. Set `STORE_CORS` and `AUTH_CORS` to your actual storefront origin and configure secure session cookies for the deployment. Complete Google's app publishing/branding requirements before opening sign-in to customers. Development credentials should be kept separate from production.

## Customer flow

- New customer: menu → Log in → Continue with Google → choose Google account → returns to the original storefront page. A customer account is created from the verified Google profile.
- Existing Google customer: the same button logs in and restores the saved customer cart. Profile shows the existing Medusa order history.
- Existing email/password customer: sign in with the password → Profile → Link Google account → choose Google with the **same email**. Both methods then access the same customer, cart, and orders. Matching email alone never automatically links accounts.
- Cancelling, expired/mismatched state, or a callback opened without starting sign-in shows an error and a return link. Start again from login.
- The Google callback stores no JWT in local/session storage. Only the short-lived OAuth state and return path are stored in sessionStorage. Native Medusa verifies Google's token; a fresh token is exchanged for the existing HttpOnly session mechanism.
- Language/theme preferences remain browser cookies and survive the redirect. Checkout stays disabled.

## Verification still required after credentials are installed

Test Google registration, returning Google login, linking an email/password customer, cancellation, and cart restoration with a real Google test account. Credentials and consent are required for this live round trip; automated checks cannot replace it.

References: [Medusa Google provider](https://docs.medusajs.com/resources/commerce-modules/auth/auth-providers/google), [Google OAuth web-server setup](https://developers.google.com/identity/protocols/oauth2/web-server).
