import dotenv from 'dotenv';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { Auction, Bid, Category, Log, Payment, User } from './model/DBModel.js';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sampleDataPath = path.join(__dirname, 'js', 'Data', 'sample-data.json');
const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'))

try {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log('MongoDB connected successfully');
} catch (error) {
  console.error('MongoDB connection error:', error);
  process.exit(1);
}

// Clear existing data
async function clearCollections() {
  console.log('Clearing existing data...');
  await User.deleteMany({});
  await Category.deleteMany({});
  await Auction.deleteMany({});
  await Bid.deleteMany({});
  await Payment.deleteMany({});
  await Log.deleteMany({});
  console.log('All collections cleared');
}


async function importWithIds(Model, items) {
  console.log(`Importing ${items.length} ${Model.collection.collectionName}...`);
  
  const results = await Promise.all(
    items.map(async (item) => {

      const doc = new Model({
        ...item
      });
      
      return doc.save({ validateBeforeSave: false });
    })
  );
  
  console.log(`Successfully imported ${results.length} ${Model.collection.collectionName}`);
  return results;
}


async function importData() {
  try {
    
    await clearCollections();
    
    // Import in order to handle references
    // Categories and Users 
    await importWithIds(Category, sampleData.categories);
    await importWithIds(User, sampleData.users);
    
    // Auctions
    await importWithIds(Auction, sampleData.auctions);
    
    // Bids
    await importWithIds(Bid, sampleData.bids);
    
    // Payments
    await importWithIds(Payment, sampleData.payments);
    
    // Logs
    await importWithIds(Log, sampleData.logs);
    
    console.log('All data imported successfully!');
  } catch (error) {
    console.error('Error importing data:', error);
  } finally {
    
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the import
importData();