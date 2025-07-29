import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Full data path
const fullDataPath = path.join(__dirname, '../data/aiLinks.json');
// Fallback dev data path
const fallbackPath = path.join(__dirname, './aiLinks.json');

let aiLinks = [];

try {
  if (fs.existsSync(fullDataPath)) {
    const rawData = fs.readFileSync(fullDataPath);
    aiLinks = JSON.parse(rawData);
    console.log('✅ Loaded full AI tools from data/aiLinks.json');
  } else {
    const rawData = fs.readFileSync(fallbackPath);
    aiLinks = JSON.parse(rawData);
    console.warn('⚠️ data/aiLinks.json not found. Loaded fallback from src/aiLinks.json');
  }
} catch (error) {
  console.error('❌ Failed to load AI tools JSON:', error);
}

export default aiLinks;
