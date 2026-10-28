require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'appuser',
  password: process.env.DB_PASSWORD || 'apppassword',
  database: process.env.DB_NAME || 'taskdb',
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/tasks', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM tasks ORDER BY id DESC');
  res.json(rows);
});

app.post('/api/tasks', async (req, res) => {
  const [result] = await db.query('INSERT INTO tasks (title) VALUES (?)', [req.body.title]);
  res.status(201).json({ id: result.insertId, title: req.body.title, done: 0 });
});

app.put('/api/tasks/:id', async (req, res) => {
  const { title, done } = req.body;
  if (title !== undefined) await db.query('UPDATE tasks SET title = ? WHERE id = ?', [title, req.params.id]);
  if (done !== undefined) await db.query('UPDATE tasks SET done = ? WHERE id = ?', [done, req.params.id]);
  res.json({ updated: true });
});

app.delete('/api/tasks/:id', async (req, res) => {
  await db.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
  res.status(204).end();
});

async function start() {
  await db.query(`CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    done BOOLEAN DEFAULT FALSE
  )`);
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Backend running on port ${port}`));
}

start().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});
