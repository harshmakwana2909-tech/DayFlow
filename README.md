# Dayflow 🚀

This is **Dayflow**, a full-stack HR Management System I built for the Hackathon 2026. 

The goal was simple: build a system that handles the boring stuff (attendance, payroll, leaves) but make it actually look good and feel smooth to use. No complex frameworks—just solid, working code.

## 🌟 What it actually does

- **Dashboards that make sense:** Admins see everything (employees, approvals), while employees just see their own stats. Secure and separated.
- **One-Click Attendance:** You log in, click "Check In," and it captures the exact timestamp. Done.
- **Leave Requests:** Employees ask for time off, and Admins get a notification to approve or reject it instantly.
- **Payroll Generator:** This is the cool part—it calculates taxes and generates a **real PDF salary slip** that you can download.
- **Glassmorphism UI:** I spent extra time on the CSS to give it that modern, frosted-glass look without using heavy UI libraries.

## 🛠️ How I built it
- **Frontend:** HTML, CSS (Vanilla), JavaScript
- **Backend:** Node.js & Express
- **Database:** SQLite (Lightweight & fast)
- **Cool extras:** used `jspdf` for the salary slips.

## 💻 How to run it on your machine
1. Clone this repo.
2. Open the terminal and run `npm install` to get the dependencies.
3. Type `node server.js` to start the backend.
4. Go to `http://localhost:3000` and you're in!
