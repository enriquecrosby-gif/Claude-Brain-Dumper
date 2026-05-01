import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT) || 4173;

app.use(express.json({ limit: '4mb' }));
app.use(express.static(join(__dir, 'candle-desk/public')));

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env

app.post('/api/complete', async (req, res) => {
  const { prompt, max_tokens = 1800 } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens,
      messages: [{ role: 'user', content: prompt }],
    });
    res.json({ text: msg.content[0]?.text || '' });
  } catch (err) {
    console.error('Anthropic error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(join(__dir, 'candle-desk/index.html'));
});

app.listen(port, '0.0.0.0', () => console.log(`Candle Desk on :${port}`));
