# Planner — Daily Routine Tracker

A personal productivity tool built for self-directed growth. Track your daily habits through a **Mandal-art goal chart**, reward yourself with a **point system**, and monitor your progress over time.

---

## What is this?

Planner is a self-rewarding daily routine tracker inspired by the **Mandal-art** method — a Japanese goal-planning technique where you break one central goal into 8 sub-goals, and each sub-goal into 8 actionable tasks.

The idea is simple:
- Define what you want to become
- Break it into areas of your life
- Show up every day and check off what you did
- Earn points for completing tasks
- Spend points on rewards you set for yourself

---

## Features

- **Mandal-art chart** — 9×9 grid with your main goal at the center, 8 sub-goals, and 64 daily tasks
- **Point system (C$)** — earn 1 C$ per completed task
- **Reward shop** — define your own rewards and spend points on them
- **Point tracker** — daily log of earned and spent points, with PDF export
- **Backdate entry** — missed a day? Log it retroactively
- **To-do list** — daily tasks with priority levels and important date alerts
- **Course tracker** — track academic and self-study courses separately
- **Important dates** — calendar with pop-up warnings as deadlines approach

---

## Getting started

### Prerequisites
- Node.js 18+
- npm

### Setup

**1. Clone the repo**
```bash
git clone https://github.com/yjk82693/Planner-Online-Tool.git
cd Planner-Online-Tool
```

**2. Set up the backend**
```bash
cd backend
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

**3. Set up the frontend**
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

**4. Register your account**

Open `http://localhost:3002` — you'll be prompted to register. Your user ID is auto-generated from your name (e.g. `yjk8234`). Save it — you'll use it to log in.

---

## Philosophy

This tool is built around three principles:

**Growth-focused** — every task on the Mandal-art chart ties back to a life goal you defined. Nothing is busywork.

**Self-rewarding** — you set the rules. Earn points by showing up, spend them however motivates you.

**Pace tracking** — no streaks, no shame. The point tracker shows your history so you can see your own patterns over time, not compare yourself to an arbitrary standard.

---

## Tech stack

- **Frontend** — Next.js, TypeScript, Ant Design
- **Backend** — Node.js, Express, TypeScript
- **Database** — SQLite (via Prisma) — easily swappable to PostgreSQL
- **Auth** — JWT, bcrypt

---

## License

MIT
