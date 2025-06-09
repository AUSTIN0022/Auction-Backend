import { cert, initializeApp } from 'firebase-admin/app';

// Format the private key properly
const formatPrivateKey = (key) => {
  if (!key) return null;
  // Handle Railway's single-line format
  return key.replace(/\\n/g, '\n').trim();
};

const app = initializeApp({
  credential: cert({
    type: "service_account",
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: formatPrivateKey(process.env.PRIVATE_KEY),
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.CLIENT_X509_CERT_URL
  })
});

export default app;