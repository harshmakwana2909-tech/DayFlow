const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// --- DATABASE SETUP ---
const db = new sqlite3.Database('./dayflow.db', (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    // 1. Users
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, password TEXT, role TEXT, phone TEXT DEFAULT '', address TEXT DEFAULT '', job_title TEXT DEFAULT 'Employee', salary INTEGER DEFAULT 50000
    )`);

    // 2. Attendance
    db.run(`CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_email TEXT, date TEXT, status TEXT, time_in TEXT, time_out TEXT
    )`);

    // 3. Leaves
    db.run(`CREATE TABLE IF NOT EXISTS leaves (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_email TEXT, name TEXT, type TEXT, start_date TEXT, end_date TEXT, remarks TEXT, status TEXT
    )`);

    // 4. NOTIFICATIONS (NEW TABLE)
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_email TEXT, message TEXT, date TEXT, is_read INTEGER DEFAULT 0
    )`);

    // Seed Admin
    const stmt = db.prepare("INSERT OR IGNORE INTO users (name, email, password, role, job_title, salary) VALUES (?, ?, ?, ?, ?, ?)");
    stmt.run("Admin User", "admin@dayflow.com", "admin123", "admin", "HR Manager", 80000);
    stmt.run("John Doe", "employee@dayflow.com", "123456", "employee", "Software Engineer", 60000);
    stmt.finalize();
});

// --- ROUTES ---

// Auth
app.post('/api/register', (req, res) => {
    const { name, email, password, role } = req.body;
    db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", [name, email, password, role], function(err) {
        if (err) return res.status(400).json({ success: false, message: "Email exists" });
        res.json({ success: true });
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, row) => {
        if (row) res.json({ success: true, user: row });
        else res.status(401).json({ success: false, message: "Invalid credentials" });
    });
});

// Profile
app.get('/api/users', (req, res) => {
    if(req.query.role !== 'admin') return res.status(403).json([]);
    db.all("SELECT id, name, email, role, job_title, salary FROM users", [], (err, rows) => res.json(rows));
});
app.put('/api/profile', (req, res) => {
    const { email, phone, address } = req.body;
    db.run("UPDATE users SET phone = ?, address = ? WHERE email = ?", [phone, address, email], (err) => res.json({ success: true }));
});

// Attendance
app.get('/api/attendance', (req, res) => {
    const { role, email } = req.query;
    let sql = "SELECT * FROM attendance ORDER BY id DESC";
    let params = [];
    if (role === 'employee') {
        sql = "SELECT * FROM attendance WHERE user_email = ? ORDER BY id DESC";
        params = [email];
    }
    db.all(sql, params, (err, rows) => res.json(rows));
});
app.post('/api/attendance', (req, res) => {
    const { user_email, date, status, time_in, time_out } = req.body;
    if (time_out !== '-') {
        db.run("UPDATE attendance SET time_out = ?, status = 'Present' WHERE user_email = ? AND date = ?", [time_out, user_email, date], (err) => res.json({ success: true }));
    } else {
        db.run("INSERT INTO attendance (user_email, date, status, time_in, time_out) VALUES (?, ?, ?, ?, ?)", [user_email, date, status, time_in, time_out], (err) => res.json({ success: true }));
    }
});

// Leaves (Updated with Notifications)
app.get('/api/leaves', (req, res) => {
    const { role, email } = req.query;
    let sql = "SELECT * FROM leaves ORDER BY id DESC";
    let params = [];
    if (role === 'employee') {
        sql = "SELECT * FROM leaves WHERE user_email = ? ORDER BY id DESC";
        params = [email];
    }
    db.all(sql, params, (err, rows) => res.json(rows));
});

app.post('/api/leaves', (req, res) => {
    const { user_email, name, type, start_date, end_date, remarks } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    db.run("INSERT INTO leaves (user_email, name, type, start_date, end_date, remarks, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [user_email, name, type, start_date, end_date, remarks, 'Pending'],
        function(err) {
            // NOTIFY ADMIN
            db.run("INSERT INTO notifications (user_email, message, date) VALUES (?, ?, ?)", 
                ['admin@dayflow.com', `New ${type} Request from ${name}`, today]);
            res.json({ success: true });
    });
});

app.put('/api/leaves/:id', (req, res) => {
    const { status } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // 1. Get the leave details to find who asked for it
    db.get("SELECT * FROM leaves WHERE id = ?", [req.params.id], (err, row) => {
        if(row) {
            // 2. Update Status
            db.run("UPDATE leaves SET status = ? WHERE id = ?", [status, req.params.id], (err) => {
                // 3. NOTIFY EMPLOYEE
                db.run("INSERT INTO notifications (user_email, message, date) VALUES (?, ?, ?)", 
                    [row.user_email, `Your leave request was ${status}`, today]);
                res.json({ success: true });
            });
        }
    });
});

// Notifications (New Endpoint)
app.get('/api/notifications', (req, res) => {
    const { email } = req.query;
    db.all("SELECT * FROM notifications WHERE user_email = ? ORDER BY id DESC LIMIT 10", [email], (err, rows) => {
        res.json(rows);
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));