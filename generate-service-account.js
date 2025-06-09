import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Function to properly format the private key
function formatPrivateKey(privateKey) {
  if (!privateKey) return null;
  
  // Remove quotes if present
  let cleanKey = privateKey.trim();
  if ((cleanKey.startsWith('"') && cleanKey.endsWith('"')) || 
      (cleanKey.startsWith("'") && cleanKey.endsWith("'"))) {
    cleanKey = cleanKey.slice(1, -1);
  }
  
  // Handle Railway's format: single line with literal \n
  if (cleanKey.includes('\\n')) {
    cleanKey = cleanKey.replace(/\\n/g, '\n');
  }
  
  // If it already has proper newlines, return as-is
  if (cleanKey.includes('\n') && cleanKey.includes('-----BEGIN PRIVATE KEY-----')) {
    return cleanKey;
  }
  
  // Handle single-line format without proper newlines
  if (!cleanKey.includes('\n') && cleanKey.includes('-----BEGIN PRIVATE KEY-----')) {
    // Extract the key content between BEGIN and END markers
    const beginMarker = '-----BEGIN PRIVATE KEY-----';
    const endMarker = '-----END PRIVATE KEY-----';
    
    const beginIndex = cleanKey.indexOf(beginMarker);
    const endIndex = cleanKey.indexOf(endMarker);
    
    if (beginIndex === -1 || endIndex === -1) {
      console.error('❌ Invalid private key format: missing BEGIN or END markers');
      return null;
    }
    
    // Extract the middle content (the actual key data)
    const middleContent = cleanKey.substring(beginIndex + beginMarker.length, endIndex).trim();
    
    // Split into 64-character lines (standard PEM format)
    const chunks = middleContent.match(/.{1,64}/g) || [];
    const formattedMiddle = chunks.join('\n');
    
    // Reconstruct the properly formatted key
    const formatted = `${beginMarker}\n${formattedMiddle}\n${endMarker}`;
    
    return formatted;
  }
  
  // Return as-is if already properly formatted or unrecognized format
  return cleanKey;
}

// Firebase Admin SDK service account configuration
const serviceAccountConfig = {
  type: "service_account",
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: formatPrivateKey(process.env.PRIVATE_KEY), // Use env variable, not hardcoded
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
  'PRIVATE_KEY', // Added this
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
const privateKey = formatPrivateKey(process.env.PRIVATE_KEY);
if (!privateKey || !privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
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
  
  // Log private key format for debugging (first and last few characters only)
  if (privateKey) {
    console.log(`🔑 Private key format: ${privateKey.substring(0, 30)}...${privateKey.substring(privateKey.length - 30)}`);
  }
  
} catch (error) {
  console.error('❌ Failed to generate service account key:', error.message);
  process.exit(1);
}