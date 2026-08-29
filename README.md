# VeyraHR — Enterprise Workforce & Attendance Management Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-purple.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An AI-driven Human Resource & Smart Attendance Platform featuring Multi-Method Biometric Verification, Anti-Spoof Dynamic Kiosk Terminal, Geofencing, Shift Rostering, AI Insights powered by Groq LLaMA-3.3, and Role-Based Portals.

---

## 🌟 Core Features

### 1. Smart Kiosk Terminal & Multi-Method Attendance
- **Side-by-Side Dual Kiosk**:
  - **Method 1 (Mobile QR)**: Rolling dynamic cryptographic tokens (cycles every 3s) for smartphone camera check-in.
  - **Method 2 (Optical Badge Scanner)**: Continuous live camera feed detecting physical ID badges and mobile QR passes.
  - **Method 3 (1-Tap Hardware Biometrics)**: WebAuthn FIDO2 Face ID / Fingerprint with GPS geofence radius check.
- **Smart Toggle**: First scan records **Check-In (Present)**; second scan records **Check-Out (Shift Complete)**.

### 2. Multi-Role Portals
- **Employee Portal**: Today's shift timer, live presence breakdown, leave management, payslip downloads, daily mood pulse check.
- **HR Operations Portal**: Live attendance map, geofence radius visualizer, employee directory, leave approval workflows, payroll processing.
- **Administrator Portal**: System security configurations, audit logs, terminal management.

### 3. AI Intelligence (Powered by Groq)
- Real-time multimodal vision OCR for ID badges (`llama-3.2-11b-vision-preview`).
- Ultra-fast HR policy assistant & compliance chatbot (`llama-3.3-70b-versatile`).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm / yarn / pnpm

### Installation

```bash
# Clone repository
git clone https://github.com/cmmanikandan/VeyraHR.git

# Navigate to project directory
cd VeyraHR

# Install dependencies
npm install

# Start local development server
npm run dev
```

### Build for Production

```bash
npm run build
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion
- **Build Tool**: Vite 6
- **AI Engine**: Groq Cloud SDK (`llama-3.3-70b`, `llama-3.2-11b-vision`)
- **Backend / Database**: Supabase, Firebase Auth
- **Asset Storage**: Cloudinary CDN
