import express from 'express';

console.log('Starting minimal server...');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Minimal server working' });
});

app.get('/api/system/status', (req, res) => {
  res.json({ hasAdminUser: false, message: 'Minimal mode' });
});

app.listen(8000, () => {
  console.log('✅ Minimal server running on http://localhost:8000/');
});