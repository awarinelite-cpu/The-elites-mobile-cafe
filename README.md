# The Elites Mobile Cafe 🎓

Research writing marketplace connecting clients with writers. React + Firebase + Vite, deployed on Render, payments via Monnify.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <your-repo>
cd elites-mobile-cafe
npm install
```

### 2. Configure Firebase
```bash
cp .env.example .env
```
Fill in Firebase project values from **Firebase Console → Project Settings → Your Apps**.

### 3. Configure Monnify
Add your Monnify credentials to `.env`:
```
VITE_MONNIFY_API_KEY=MK_PROD_xxxxxxxxxx
VITE_MONNIFY_CONTRACT=xxxxxxxxxx
VITE_MONNIFY_TEST=false
```
Note: `paystackService.js` is a legacy filename. It now calls the Monnify SDK internally so existing `loadPaystack` / `initiatePayment` imports elsewhere in the app keep working unchanged.

### 4. Run Locally
```bash
npm run dev
```
Visit `http://localhost:5173`

---

## 🔥 Firebase Setup

### Enable Services
1. **Authentication** → Email/Password
2. **Firestore Database**
3. **Storage**

### Deploy Security Rules
```bash
npm install -g firebase-tools
firebase login
firebase init   # select Firestore + Storage + your project
firebase deploy --only firestore:rules,storage
```

### Roles
Roles are resolved in `AuthContext.jsx` on login:
- **Admin**: hardcoded emails in `ADMIN_EMAILS`, or `isAdmin: true` / `role: 'Admin'` on the user doc
- **Writer**: `isWriter: true` or `role: 'writer'` on the user doc
- **Client**: default for everyone else

To promote a user, edit their document in **Firestore → users collection**.

---

## 🌐 Deploy to Render

1. Push code to GitHub
2. [render.com](https://render.com) → New → Static Site → connect repo
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Add all `VITE_*` environment variables in Render dashboard

`render.yaml` handles SPA routing (fallback to `index.html`).

---

## 📁 Project Structure

```
src/
├── firebase/
│   ├── config.js             # Firebase init
│   ├── authService.js        # Auth functions
│   ├── orderService.js       # Orders, topics, messages, order chat
│   ├── paystackService.js    # Payment SDK (Monnify under the hood)
│   ├── storageService.js     # File uploads (drafts, finals)
│   └── notificationService.js
├── context/
│   └── AuthContext.jsx       # Auth state + role resolution
├── components/
│   ├── layout/ (Navbar, Footer)
│   ├── auth/ProtectedRoute.jsx
│   ├── PWAWrapper.jsx
│   └── BackButtonProvider.jsx
├── pages/
│   ├── HomePage, LoginPage, RegisterPage, ForgotPasswordPage
│   ├── TopicsPage.jsx          # Browse research topics
│   ├── ServicesPage.jsx        # Browse service categories
│   ├── services/                # Per-service request pages
│   ├── RequestPage.jsx          # Submit a service request
│   ├── DashboardPage.jsx        # Client portal: orders, chat, payment
│   ├── WriterPage.jsx           # Writer portal: assigned jobs, wallet
│   ├── AdminPage.jsx            # Admin panel: orders, quotes, users
│   ├── AdminDashboard.jsx       # Admin overview/stats
│   ├── WithdrawalsTab.jsx       # Admin approves writer payouts
│   ├── NMCNAdminView.jsx
│   └── AIResearchWriterPage.jsx # Chapter-by-chapter AI writing assistant
└── main.jsx
```

---

## 🔒 Order & Payment Flow

Orders live in Firestore's `serviceRequests` collection (the old `orders` collection is unused).

| Status | Description |
|--------|-------------|
| `pending` | Order submitted, awaiting admin quote |
| `quoted` | Admin sent price, awaiting client acceptance |
| `advance_paid` | 50% received via Monnify, work starts |
| `in_progress` | Writer working on the document |
| `preview_ready` | Watermarked draft uploaded |
| `final_paid` | Full payment received, download unlocked |

Firebase Storage rules enforce that `/orders/{id}/final/` files are **only readable** when `paymentStatus === 'final_paid'`, this is enforced server-side, not just hidden in the UI.

---

## 💬 Messaging

Two separate chat systems:
- `adminMessages/{userId}/messages`: general client ↔ admin thread
- `orderChats/{orderId}/messages`: per-order thread for client, writer, and admin

---

## 💸 Writer Payouts

Writers submit withdrawal requests with bank details. Admin reviews them in `WithdrawalsTab.jsx`, marking as paid or rejected. Either action fires a Firestore notification to the writer.

---

## 🤖 AI Research Writer

`AIResearchWriterPage.jsx` walks a client or writer through a project chapter by chapter (Introduction, Literature Review, Methodology, Results, Discussion), with a separate chapter set for Client Care projects (swaps in a Nursing Care Plan chapter). It can also render bar charts to canvas and export them as PNGs for results sections.

---

## 🏗 Architectural Notes

- Firestore queries generally avoid combining `where` with `orderBy` to sidestep composite index requirements; sorting happens client-side instead.
- `subscribeToClientOrders` runs two parallel listeners (`clientId` and `userId` fields) and merges/dedupes results, since orders have historically been written with either field.
