import firebase from "firebase-admin";
import "dotenv/config";

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: (process.env.PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  universe_domain: process.env.UNIVERSE_DOMAIN,
};

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount as firebase.ServiceAccount),
});

type ProviderData = {
  uid?: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  providerId?: string;
};

type StackUserPayload = {
  is_anonymous: boolean;
  display_name?: string;
  profile_image_url?: string;
  client_metadata: Record<string, unknown>;
  client_read_only_metadata: Record<string, unknown>;
  server_metadata: Record<string, unknown>;
  primary_email?: string;
  primary_email_verified: boolean;
  primary_email_auth_enabled: boolean;
  password?: string;
  password_hash?: string;
};

async function migrateUsers() {
  try {
    const list = await firebase.auth().listUsers();

    for (const user of list.users) {
      const payload: StackUserPayload = {
        is_anonymous: false,
        display_name: user.displayName || undefined,
        profile_image_url: user.photoURL || undefined,
        client_metadata: {},
        client_read_only_metadata: {},
        server_metadata: {},
        primary_email: user.email || undefined,
        primary_email_verified: user.emailVerified,
        primary_email_auth_enabled: true,
      };

      const response = await fetch("https://auth.purrquinox.com/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Stack-Access-Type": "server",
          "X-Stack-Secret-Server-Key": "ssk_vvktygh8v089gpaszbhamkh4dypjvk8nrk9mj1zanxnt0",
          "X-Stack-Project-Id": "26ee7b79-26fb-4e79-82ef-901f63164df6",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log(result);
    }
  } catch (error) {
    console.error("Error migrating users:", error);
  }
}

migrateUsers();
