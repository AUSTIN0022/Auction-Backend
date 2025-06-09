import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Function to properly format the private key for Railway deployment
function formatPrivateKey(privateKey) {
  if (!privateKey) {
    console.error('❌ Private key is undefined or empty');
    return null;
  }
  
  console.log('🔧 Processing private key from Railway environment...');
  
  // Remove outer quotes if present (Railway format)
  let cleanKey = privateKey.trim();
  if ((cleanKey.startsWith('"') && cleanKey.endsWith('"')) || 
      (cleanKey.startsWith("'") && cleanKey.endsWith("'"))) {
    cleanKey = cleanKey.slice(1, -1);
    console.log('✅ Removed outer quotes from private key');
  } else {
    console.log('ℹ️ No outer quotes found to remove');
  }
  
  // Railway stores the key with actual newlines, not \n escape sequences
  // So we don't need to convert anything, just validate
  
  // Validate the key has proper PEM structure
  if (!cleanKey.includes('-----BEGIN PRIVATE KEY-----')) {
    console.error('❌ Missing -----BEGIN PRIVATE KEY----- header');
    return null;
  }
  
  if (!cleanKey.includes('-----END PRIVATE KEY-----')) {
    console.error('❌ Missing -----END PRIVATE KEY----- footer');
    return null;
  }
  
  // Check if it has proper newlines (Railway should already have these)
  if (cleanKey.includes('\n')) {
    console.log('✅ Private key has proper newline formatting');
    return cleanKey;
  } else {
    console.log('⚠️ Private key appears to be on a single line, this might cause issues');
    return cleanKey;
  }
}

console.log('🚀 Starting service account key generation for Railway deployment...');

// Don't log the actual private key for security - just validate it exists
if (!process.env.PRIVATE_KEY) {
  console.error('❌ PRIVATE_KEY environment variable is not set');
  process.exit(1);
}

console.log('✅ PRIVATE_KEY environment variable found');
const privateKey = formatPrivateKey(process.env.PRIVATE_KEY);

if (!privateKey) {
  console.error('❌ Failed to format private key');
  process.exit(1);
}

// Firebase Admin SDK service account configuration
const serviceAccountConfig = {
  type: "service_account",
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: privateKey,
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL
};

// Validate required environment variables
const requiredEnvVars = [
  'PROJECT_ID',
  'PRIVATE_KEY_ID',
  'PRIVATE_KEY',
  'CLIENT_EMAIL',
  'CLIENT_ID',
  'CLIENT_X509_CERT_URL'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  process.exit(1);
}

// Validate private key format
if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || 
    !privateKey.includes('-----END PRIVATE KEY-----')) {
  console.error('❌ Invalid private key format. Make sure PRIVATE_KEY environment variable contains a valid PEM key.');
  process.exit(1);
}

// Create the service account key file
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

try {
  fs.writeFileSync(serviceAccountPath, JSON.stringify(serviceAccountConfig, null, 2));
  console.log('✅ Service account key generated successfully at:', serviceAccountPath);
  
  // Verify the file was created and is valid JSON
  const generatedContent = fs.readFileSync(serviceAccountPath, 'utf8');
  JSON.parse(generatedContent); // This will throw if invalid JSON
  
  console.log('✅ Service account key file validated successfully');
  console.log(`📝 Project ID: ${serviceAccountConfig.project_id}`);
  console.log(`📧 Client Email: ${serviceAccountConfig.client_email}`);
  console.log('🔑 Private key format: [VALID PEM FORMAT]');
  
} catch (error) {
  console.error('❌ Failed to generate service account key:', error.message);
  process.exit(1);
}