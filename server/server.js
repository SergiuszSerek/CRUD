require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT
});

const app = 'https://crud-1t5h.onrender.com'();
app.use(cors());
app.use(bodyParser.json());

//Serwowanie frontendowych plików statycznych
app.use(express.static(path.join(__dirname, 'public')));

// Funkcja walidacji encji
function validateEntity(p) {
    const errors = [];
    if (!p.name || typeof p.name !== 'string' || p.name.trim() === '') errors.push("name required");
    if (p.amount === undefined || isNaN(Number(p.amount))) errors.push("amount must be number");
    return errors;
}

//API: GET all
app.get('/entities', async (req, res) => {
    try {
        const q = await pool.query("SELECT * FROM entities ORDER BY id DESC");
        res.json(q.rows);
    } catch (e) { res.status(500).json({ error: "db error" }); }
});

// GET by id
app.get('/entities/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const q = await pool.query("SELECT * FROM entities WHERE id=$1", [id]);
        if (q.rows.length === 0) return res.status(404).json({ error: "not found" });
        res.json(q.rows[0]);
    } catch (e) { res.status(500).json({ error: "db error" }); }
});

// POST
app.post('/entities', async (req, res) => {
    const b = req.body || {};
    const errors = validateEntity(b);
    if (errors.length) return res.status(400).json({ errors });
    try {
        const q = await pool.query(
            "INSERT INTO entities (name, amount, description) VALUES ($1,$2,$3) RETURNING *",
            [b.name, Number(b.amount), b.description || null]
        );
        res.status(201).json(q.rows[0]);
    } catch (e) { res.status(500).json({ error: "db error" }); }
});

// PUT
app.put('/entities/:id', async (req, res) => {
    const id = Number(req.params.id);
    const b = req.body || {};
    const errors = validateEntity(b);
    if (errors.length) return res.status(400).json({ errors });
    try {
        const exists = await pool.query("SELECT id FROM entities WHERE id=$1", [id]);
        if (exists.rows.length === 0) return res.status(404).json({ error: "not found" });
        const q = await pool.query(
            "UPDATE entities SET name=$1, amount=$2, description=$3 WHERE id=$4 RETURNING *",
            [b.name, Number(b.amount), b.description || null, id]
        );
        res.json(q.rows[0]);
    } catch (e) { res.status(500).json({ error: "db error" }); }
});

// DELETE
app.delete('/entities/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
        const exists = await pool.query("SELECT id FROM entities WHERE id=$1", [id]);
        if (exists.rows.length === 0) return res.status(404).json({ error: "not found" });
        await pool.query("DELETE FROM entities WHERE id=$1", [id]);
        res.status(204).send();
    } catch (e) { res.status(500).json({ error: "db error" }); }
});

//Wszystkie inne GET kierujemy na frontend (index.html)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//tart serwera
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
