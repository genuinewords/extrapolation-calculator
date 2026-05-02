/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_CONTACT_FORM_KEY: string;
  readonly PUBLIC_GOOGLE_VERIFICATION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
