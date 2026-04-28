import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

const app = express();
const port = process.env.PORT || 3000;
const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
const anthropicKey = process.env['ANTHROPIC_API_KEY'];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.join(__dirname, 'index.html');

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.post('/api/complete', async (req, res) => {
  try {
    const { prompt, max_tokens } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt.' });
    }

    if (!anthropicKey) {
      return res.status(500).json({ error: 'Missing Anthropic key on the server.' });
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey });

    const message = await anthropic.messages.create({
      model,
      max_tokens: Number.isFinite(max_tokens) ? max_tokens : 1800,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const text = (message.content || [])
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('\n')
      .trim();

    return res.json({ text });
  } catch (error) {
    console.error('Anthropic API error:', error);
    const status = error?.status || error?.statusCode || 500;
    const message = error?.message || 'Anthropic request failed.';
    return res.status(status).json({ error: message });
  }
});

app.use(express.static(__dirname, { index: false }));

app.get('*', async (req, res) => {
  try {
    const html = await readFile(indexPath, 'utf8');
    const withExtensions = html.replace(
      '<script type="text/babel" src="screens.jsx"></script>',
      '<script type="text/babel" src="screens.jsx"></script>\n  <script type="text/babel" src="workshop-artifacts-extension.jsx"></script>'
    );
    res.type('html').send(withExtensions);
  } catch (error) {
    console.error('Failed to serve Candle Desk index:', error);
    res.status(500).send('Candle Desk could not load.');
  }
});

app.listen(port, () => {
  console.log(`Candle Desk running on port ${port}`);
});
