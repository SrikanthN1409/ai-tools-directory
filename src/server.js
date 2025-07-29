// src/server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import fs from 'fs/promises';
import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';

import { fetchAILinks } from './fetchAiLinks.js';
import { readCache, writeCache } from './cache.js';

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set EJS and static folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/src', express.static('src'));
app.use(express.json());

// Serve API: /api/ai-tools
app.get('/api/ai-tools', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(__dirname, '../data/aiLinks.json'), 'utf-8');
    const links = JSON.parse(data);

    const normalizedLinks = links.map(link => ({
      name: link.name,
      description: link.description,
      category: link.category,
      pricing: link.pricing,
      url: link.url || link.link || '',
    }));

    res.json(normalizedLinks);
  } catch (err) {
    console.error('❌ Failed to load aiLinks.json:', err);
    res.status(500).json({ error: 'Failed to load AI tools' });
  }
});

// Homepage
app.get('/', async (req, res) => {
  let links = await readCache();

  if (!links) {
    try {
      links = await fetchAILinks();
      await writeCache(links);
    } catch (err) {
      console.error('❌ Fallback to empty list:', err.message);
      links = [];
    }
  }

  const normalizedLinks = links.map(link => ({
    name: link.name,
    description: link.description,
    category: link.category,
    pricing: link.pricing,
    url: link.url || link.link,
  }));

  const categorizedTools = normalizedLinks.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {});

  res.render('index', { categorizedTools });
});

// Manual refresh
app.get('/refresh', async (req, res) => {
  try {
    const links = await fetchAILinks();
    await writeCache(links);
    res.send('✅ AI tools list refreshed manually.');
  } catch (err) {
    res.status(500).send('❌ Failed to refresh: ' + err.message);
  }
});

// Daily 6 AM update
cron.schedule('0 6 * * *', async () => {
  console.log('⏰ Scheduled fetch at 6 AM...');
  try {
    const links = await fetchAILinks();
    if (links.length > 0) {
      await writeCache(links);
      console.log(`✅ Updated AI links cache (${links.length} tools)`);
    }
  } catch (err) {
    console.error('❌ Failed to update AI links cache:', err.message);
  }
});
app.post('/api/feedback', async (req, res) => {
  const { toolName, toolLink, toolNote } = req.body;
  if (!toolName || !toolLink || !toolNote) {
    return res.status(400).json({ error: 'All fields required' });
  }

  // const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    service: 'Yahoo',
    auth: {
      user: process.env.YAHOO_USER,
      pass: process.env.YAHOO_PASS,
    },
  });

  const mailOptions = {
    from: process.env.YAHOO_USER,
    to: process.env.YAHOO_USER,
    subject: '🧠 AI Tool Suggestion Received',
    text: `Tool: ${toolName}\nLink: ${toolLink}\nNotes: ${toolNote}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email failed:', err);
    res.status(500).json({ error: 'Email failed to send' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running: http://localhost:${PORT}`);
});
