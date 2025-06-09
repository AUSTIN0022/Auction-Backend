import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Function to properly format the private key
function formatPrivateKey(privateKey) {
  if (!privateKey) return null;
  
  // Handle Railway's format: single line with literal \n
  if (privateKey.includes('\\n')) {
    return privateKey.replace(/\\n/g, '\n');
  }
  
  // Handle single-line format without \n separators
  if (!privateKey.includes('\n') && privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    // Split the key into proper lines
    let formatted = privateKey;
    
    // Add newline after BEGIN marker
    formatted = formatted.replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n');
    
    // Add newline before END marker
    formatted = formatted.replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
    
    // Split the middle content into 64-character lines
    const beginIndex = formatted.indexOf('\n') + 1;
    const endIndex = formatted.lastIndexOf('\n');
    const middleContent = formatted.substring(beginIndex, endIndex);
    
    // Split into 64-character chunks
    const chunks = middleContent.match(/.{1,64}/g) || [];
    const formattedMiddle = chunks.join('\n');
    
    formatted = '-----BEGIN PRIVATE KEY-----\n' + formattedMiddle + '\n-----END PRIVATE KEY-----';
    
    return formatted;
  }
  
  // Return as-is if already properly formatted
  return privateKey;
}

// Firebase Admin SDK service account configuration
const serviceAccountConfig = {
  type: "service_account",
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: formatPrivateKey(process.env.PRIVATE_KEY), // Fix newline formatting
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
const formattedKey = formatPrivateKey(process.env.PRIVATE_KEY);
if (!formattedKey || !formattedKey.includes('-----BEGIN PRIVATE KEY-----')) {
  console.error('❌ Invalid private key format. Make sure it includes the BEGIN/END markers.');
  console.error('Current private key preview:', process.env.PRIVATE_KEY?.substring(0, 50) + '...');
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
  
} catch (error) {
  console.error('❌ Failed to generate service account key:', error.message);
  process.exit(1);
}