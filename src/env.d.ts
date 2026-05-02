/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type KVNamespace = import('@cloudflare/workers-types').KVNamespace;

type ENV = {
  REVIEWS_KV: KVNamespace;
  SITE_URL: string;
  ADMIN_EMAIL: string;
  EMAIL_FROM: string;
  RESEND_API_KEY: string;
  AUTH_SECRET: string;
  TOKEN_SECRET: string;
};

type Runtime = import('@astrojs/cloudflare').Runtime<ENV>;

declare namespace App {
  interface Locals extends Runtime {}
}
