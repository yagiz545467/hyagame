require('dotenv').config();
const express = require('express');
const { createClient } = require('@libsql/client');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function initDB() {
  await db.execute(`CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    banned INTEGER NOT NULL DEFAULT 0,
    date TEXT NOT NULL
  )`);
  await db.execute(`CREATE TABLE IF NOT EXISTS pending_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ekleyen TEXT NOT NULL,
    soru TEXT NOT NULL,
    siklar_a TEXT NOT NULL,
    siklar_b TEXT NOT NULL,
    siklar_c TEXT NOT NULL,
    siklar_d TEXT NOT NULL,
    cevap TEXT NOT NULL CHECK(cevap IN ('A','B','C','D')),
    tarih TEXT NOT NULL
  )`);
  await db.execute(`CREATE TABLE IF NOT EXISTS approved_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ekleyen TEXT NOT NULL,
    soru TEXT NOT NULL,
    siklar_a TEXT NOT NULL,
    siklar_b TEXT NOT NULL,
    siklar_c TEXT NOT NULL,
    siklar_d TEXT NOT NULL,
    cevap TEXT NOT NULL CHECK(cevap IN ('A','B','C','D')),
    tarih TEXT NOT NULL
  )`);
  console.log('✓ Turso veritabanı tabloları hazır');
}

initDB().catch(err => {
  console.error('❌ Turso bağlantı hatası:', err.message);
  process.exit(1);
});

app.get('/api/scores', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM scores ORDER BY score DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scores', async (req, res) => {
  try {
    const { name, score, banned, date } = req.body;
    const result = await db.execute({
      sql: 'INSERT INTO scores (name, score, banned, date) VALUES (?, ?, ?, ?)',
      args: [name, score, banned ? 1 : 0, date],
    });
    res.json({ id: Number(result.lastInsertRowid) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/scores', async (req, res) => {
  try {
    await db.execute('DELETE FROM scores');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/pending', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM pending_questions ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pending', async (req, res) => {
  try {
    const { ekleyen, soru, siklar, cevap, tarih } = req.body;
    const result = await db.execute({
      sql: 'INSERT INTO pending_questions (ekleyen, soru, siklar_a, siklar_b, siklar_c, siklar_d, cevap, tarih) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [ekleyen, soru, siklar.A, siklar.B, siklar.C, siklar.D, cevap, tarih],
    });
    res.json({ id: Number(result.lastInsertRowid) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/pending/:id', async (req, res) => {
  try {
    await db.execute({
      sql: 'DELETE FROM pending_questions WHERE id = ?',
      args: [Number(req.params.id)],
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/approved', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM approved_questions ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/approved', async (req, res) => {
  try {
    const { ekleyen, soru, siklar, cevap, tarih } = req.body;
    const result = await db.execute({
      sql: 'INSERT INTO approved_questions (ekleyen, soru, siklar_a, siklar_b, siklar_c, siklar_d, cevap, tarih) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [ekleyen, soru, siklar.A, siklar.B, siklar.C, siklar.D, cevap, tarih],
    });
    res.json({ id: Number(result.lastInsertRowid) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`🎯 HYA Game sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
