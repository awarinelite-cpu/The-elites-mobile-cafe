# The Elites Mobile Cafe 🎓

Premium research writing platform — React + Firebase + Render + Paystack.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <your-repo>
cd elites-mobile-cafe
npm install
```

### 2. Configure Firebase
Copy the env template and fill in your Firebase credentials:
```bash
cp .env.example .env
```

Open `.env` and paste your Firebase project values from **Firebase Console → Project Settings → Your Apps**.

### 3. Configure Paystack
Add your Paystack public key to `.env`:
```
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxx
```

### 4. Run Locally
```bash
npm run dev
```
Visit `http://localhost:5173`

---

## 🔥 Firebase Setup

### Enable Services
1. **Authentication** → Sign-in method → Enable **Email/Password**
2. **Firestore Database** → Create database (start in test mode, then apply rules)
3. **Storage** → Get started

### Deploy Security Rules
```bash
npm install -g firebase-tools
firebase login
firebase init   # select Firestore + Storage + your project
firebase deploy --only firestore:rules,storage
```

### Create Admin User
1. Register normally on the site
2. Go to **Firebase Console → Firestore → users collection**
3. Find your user document
4. Change `role` from `"client"` to `"admin"`

---

## 🌐 Deploy to Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Static Site
3. Connect your GitHub repo
4. Build command: `npm install && npm run build`
5. Publish directory: `dist`
6. Add all `VITE_*` environment variables in Render dashboard
7. Deploy!

The `render.yaml` file handles routing (SPA fallback to `index.html`).

---

## 📁 Project Structure

```
src/
├── firebase/
│   ├── config.js          # Firebase init
│   └── authService.js     # Auth functions
├── context/
│   └── AuthContext.jsx    # Auth state provider
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx
│   │   └── Footer.jsx
│   └── auth/
│       └── ProtectedRoute.jsx
├── pages/
│   ├── HomePage.jsx       # Landing page
│   ├── LoginPage.jsx      # Sign in
│   ├── RegisterPage.jsx   # Sign up
│   ├── DashboardPage.jsx  # Client portal (next phase)
│   └── AdminPage.jsx      # Admin panel (next phase)
├── styles/
│   └── globals.css        # Design tokens + animations
└── main.jsx
```

---

## 🔒 Payment Flow

| Status | Description |
|--------|-------------|
| `pending` | Order submitted, awaiting admin quote |
| `quoted` | Admin sent price, awaiting client acceptance |
| `advance_paid` | 50% received, work starts |
| `in_progress` | Writer working on the document |
| `preview_ready` | Draft uploaded (watermarked) |
| `final_paid` | Full payment received — **download unlocked** |

Firebase Storage rules enforce that `/orders/{id}/final/` files are **only readable** when `paymentStatus === 'final_paid'`.

---

## 🛠 Next Steps (Phase 2)

- [ ] Client Dashboard (order tracking, messaging)
- [ ] Admin Dashboard (order management, file upload, quote sending)
- [ ] Topics browse page
- [ ] Custom request form
- [ ] Paystack integration (advance + final payment)
- [ ] Download gate component
- [ ] Email notifications (Firebase Functions)
