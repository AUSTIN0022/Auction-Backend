import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

dotenv.config();
const serviceAccountConfig = {
  type: "service_account",
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY,
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  universe_domain: "googleapis.com"
};


console.log(`\n\n\nServiceAcccountConfig: \n\n${JSON.stringify(serviceAccountConfig)}\n\n\n`);

// const serviceAccount = require('../serviceAccountKey.json');

// console.log(`\n\n\nServiceAcccount: \n\n${JSON.stringify(serviceAccount)}\n\n\n`);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountConfig)
  });
}

export default admin;
