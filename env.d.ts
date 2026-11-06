declare namespace Cloudflare {
  interface Env {
    CLERK_SECRET_KEY: string
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string
    NEXT_PUBLIC_APP_URL?: string
    CLERK_JWT_KEY?: string
  }
}
