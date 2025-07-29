import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const cachePath = path.join(process.cwd(), 'data', 'aiLinks.json');

export async function fetchAILinks() {
  const prompt = `Give me a list of 50 useful AI websites or tools in JSON format. Each tool must include:
- name
- description
- category
- pricing (Free, Freemium, Paid)
- link (a valid http/https URL)

Return only the JSON array in this format:
[{"name": "", "description": "", "category": "", "pricing": "", "link": ""}, ...]`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);
const validTools = parsed.filter(t => 
  typeof t.link === 'string' &&
  t.link.startsWith('http') &&
  typeof t.name === 'string' && t.name.trim() !== ''
);
    if (!Array.isArray(parsed)) throw new Error('OpenAI response is not a valid array');

    // ✅ Save to aiLinks.json
    await fs.writeFile(cachePath, JSON.stringify(parsed, null, 2), 'utf-8');
    console.log('✅ Fetched and saved new AI tools list to aiLinks.json');
    return parsed;

  } catch (err) {
    console.error('❌ Failed to fetch/save AI tools:', err);
    return [];
  }
}
