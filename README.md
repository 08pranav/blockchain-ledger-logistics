# Blockchain Ledger – Logistics Accounting System
### Developer: © Pranav Koradiya

A complete full-stack blockchain simulation web application for financial accounting in logistics and supply chain companies.

## 🚀 Features

- **Dashboard**: Live blockchain visualization and transaction overview
- **Ledger Module**: Record financial transactions with automatic block creation
- **Blockchain Explorer**: Explore blocks and verify chain integrity
- **Smart Contract Simulator**: Issue payment contracts with digital signatures
- **User Authentication**: Role-based access (Accountant/Auditor)
- **Audit Log**: Immutable record of all system actions

## 🛠️ Tech Stack

- **Frontend**: React + Vite + TailwindCSS + Axios
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: MongoDB (with SQLite fallback)
- **Blockchain**: Custom in-memory simulation

## 📦 Installation

```bash
# Install all dependencies
npm run install-all

# Start development servers (both frontend & backend)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🌐 Deployment

The app can be deployed on:
- Vercel (frontend)
- Render/Railway (backend)
- MongoDB Atlas (database)

## 📝 API Endpoints

- `GET /api/dashboard` - Dashboard statistics
- `GET /api/blocks` - All blockchain blocks
- `POST /api/transactions` - Create new transaction
- `POST /api/contracts` - Create smart contract
- `POST /api/auth/login` - User authentication
- `GET /api/audit` - Audit log entries

---

**Created by © Pranav Koradiya**