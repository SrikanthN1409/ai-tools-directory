import fs from 'fs/promises';
import path from 'path';

const filePath = path.resolve('src/aiLinks.json');

export async function writeCache(data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function readCache() {
  try {
    const text = await fs.readFile(filePath, 'utf8');
    return JSON.parse(text);
  } catch {
    return null;
  }
}
