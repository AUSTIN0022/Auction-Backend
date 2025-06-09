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
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC4iDqjUWBtlxt2\neZQwkvkiS7SFtYdVM+JdrKBmL4mYbPn9ifLMqpwE3jqU7XJgu9rNHzgDJVv5VG6s\nD0wNdHNm6G9TCiIPkZwKHGhXhw8MaKEo/rS1oJkvuqzEXmdHvNjjg5xzKqnb0/r1\n8gymznBP6bbNjQ/2/NP4qRIwh2ANGmvz2qg6e6vfsnD5UD9UXGCGsOdRpevyozsI\ng6aeGk037QRWlHQ5e3zPGW92fHQaIpILMDtutP4YIvUVhL+fhb82aHqtQDKGKQ37\neWKjMK7RoqyJrl/joNX91WDTtxlmgmar9zez4atCKgixVSPFIL3r08nu+QfK/Uvn\npZri64F/AgMBAAECggEAQfNaNa1rT6+OPqEEH/ofNS0mZxUyOXbSI9WC/BJoVEQ6\ncm1fi9s76Jd+C2TzmHP7Jo1OSP2MqgcNiMvsy/A/IFvZEa4Q70yEnq55cjLQY4hv\ndMXXUwSDSyYmAgaVVfO99k4+14A7ddgEnOr1r5YfWMg4L62HM6g3n+rZF+QCJZwc\n9C8HxNHlD2sltr5gw13nuCs0tZCTOWjHX1QLeEaef2251X0bh1UllX140TOE/Zpv\nEDNI8/oGEx12RY1vCPZ7TTDtAW6ak47Lxf0GrSdqfUawtOW/RaUMNGVwpShAOAb3\ngV6fUP122/hOhCS6pvJbR/zQzhWHXNEibGEWvytlTQKBgQDbSDf8zSPCDwQ2slFm\nDJtxds289ge+1jWE/Q+aIrdtg9hPlc5JqpB8MnRWoBvCnyyGopPATDwEDPzqVth3\n3FGD/anqXYujoLm9MUYNES5thTDKA4iUi3+vyeT7KnWkFpHAaHajNLHsbxiGMcat\nBQINM6YueaPAZj6J4Uu6D6DQWwKBgQDXbmnBAmZ9RlSljZsHMAo3Xc5E75SddQvV\nOdQqmcI/oIlEnikVv7TBAVbairrWyveRQ0LDYHoO5rsGgmj4E1LgDjK9CBfMpwtT\n0dkXehrI/mTpWqXo8swO2Mi6OnUXYTT1oZa/tL0gsHwxwB7sZqCyNopWNu0zppoT\nSWS8R3pcrQKBgFDhkW0YiWDxwv8dxLJcYhV22aoiIXc9cZ4s7U1QEtI9OFMakW1Q\nkVyOC6VMBxFBPt4mJ1NdiyF/XOZexBdp11NVBBBjErd2+CuVeh4lwTc6UmWg6gbI\ncX94e5I89glhHb+XiHLoY9wumiAdSgfVeg0+iMRJr6Gu1NBsnk7xpsJTAoGAerGS\nn29Libudh/A/Q/ezSdcuHArK/GZmB9l4oY6SmARJSYA+a/mT63xkx/DM+nn8R4ok\nIvv2aDg2ej2ZpPf0clEDyq8qRs84X1ObrYhIawKf3FtZNHPbjfUfVRjoCRm+vMp7\n/dDlChIZmYgO1JqamQUBApsjuw/+nk9lhOm8ob0CgYBgfrV+f/ZipDOb9/x0CglT\nla2F4yQq17DfwKXSqBFxu7XTyrpqeZ7foCPweHpt9InRMAzpwViJ1SFPsPhIh+Rh\nuFy8cEUwHyq+509a442DtT13TUxjKcFvCusc555RuE/hvy7sBZ6PeebE8khKPS5e\nQPOWl8r0QFh8k0JEUGcPZg==\n-----END PRIVATE KEY-----\n", // Fix newline formatting
  client_email: "firebase-adminsdk-fbsvc@auction-3b256.iam.gserviceaccount.com",
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