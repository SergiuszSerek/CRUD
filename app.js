const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { body, param, validationResult } = require('express-validator');
const cors = require('cors');
const path = require('path');

const DB_FILE = './db.sqlite';
const db = new sqlite3.Database(DB_FILE);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helpers
function runQuery(sql, params=[]) {
  return new Promise((res, rej) => {
    db.all(sql, params, (err, rows) => {
      if (err) rej(err);
      else res(rows);
    });
  });
}
function getOne(sql, params=[]) {
  return new Promise((res, rej) => {
    db.get(sql, params, (err, row) => {
      if (err) rej(err);
      else res(row);
    });
  });
}
function execSql(sql, params=[]) {
  return new Promise((res, rej) => {
    db.run(sql, params, function(err) {
      if (err) rej(err);
      else res(this);
    });
  });
}

// Endpoints

// GET all
app.get('/entities', async (req, res) => {
  try {
    const rows = await runQuery('SELECT * FROM entities ORDER BY id DESC');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal server error' });
  }
});

// GET by id
app.get('/entities/:id',
  param('id').isInt({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const row = await getOne('SELECT * FROM entities WHERE id = ?', [req.params.id]);
      if (!row) return res.status(404).json({ error: 'not found' });
      res.json(row);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'internal server error' });
    }
  });

// POST create
app.post('/entities',
  body('name').isString().isLength({ min: 1, max: 200 }),
  body('type').isString().isLength({ min: 1, max: 100 }),
  body('description').optional().isString(),
  body('extra_text').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, type, description = null, extra_text = null } = req.body;
      const result = await execSql(
        'INSERT INTO entities (name, type, description, extra_text) VALUES (?, ?, ?, ?)',
        [name, type, description, extra_text]
      );
      const id = result.lastID;
      const created = await getOne('SELECT * FROM entities WHERE id = ?', [id]);
      res.status(201).json(created);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'internal server error' });
    }
  });

// PUT update
app.put('/entities/:id',
  param('id').isInt({ min: 1 }),
  body('name').optional().isString().isLength({ min: 1, max: 200 }),
  body('type').optional().isString().isLength({ min: 1, max: 100 }),
  body('description').optional().isString(),
  body('extra_text').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const id = req.params.id;
      const existing = await getOne('SELECT * FROM entities WHERE id = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'not found' });

      const name = req.body.name ?? existing.name;
      const type = req.body.type ?? existing.type;
      const description = req.body.description ?? existing.description;
      const extra_text = req.body.extra_text ?? existing.extra_text;

      await execSql(
        'UPDATE entities SET name = ?, type = ?, description = ?, extra_text = ? WHERE id = ?',
        [name, type, description, extra_text, id]
      );
      const updated = await getOne('SELECT * FROM entities WHERE id = ?', [id]);
      res.json(updated);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'internal server error' });
    }
  });

// DELETE
app.delete('/entities/:id',
  param('id').isInt({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const id = req.params.id;
      const existing = await getOne('SELECT * FROM entities WHERE id = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'not found' });
      await execSql('DELETE FROM entities WHERE id = ?', [id]);
      res.status(204).send();
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'internal server error' });
    }
  });

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));
