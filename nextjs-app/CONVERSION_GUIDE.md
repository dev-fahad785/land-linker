# Next.js Conversion Guide - Dashboard Pages

## Quick Reference: Old React → New Next.js

### File Headers
```typescript
// Add to top of EVERY dashboard file
"use client";
```

### Imports
```typescript
// ❌ OLD React Router
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ✅ NEW Next.js
import { useRouter } from 'next/navigation';
import { useSession, signOut } from "next-auth/react";
```

### Auth & Session
```typescript
// ❌ OLD
const { user, logout } = useAuth();

// ✅ NEW
const { data: session, status } = useSession();
const user = session?.user;
// For logout: signOut({ callbackUrl: "/login" });
```

### Navigation
```typescript
// ❌ OLD
const navigate = useNavigate();
navigate('/buyer');

// ✅ NEW
const router = useRouter();
router.push('/buyer');
```

### API Calls
```typescript
// ❌ OLD
const API_URL = process.env.REACT_APP_BACKEND_URL;
axios.get(`${API_URL}/api/listings`, { withCredentials: true })

// ✅ NEW (session handled automatically by NextAuth)
fetch('/api/listings')
```

## Complete Example: Buyer Dashboard Conversion

### OLD (`/app/frontend/src/pages/BuyerDashboard.js`)
```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const BuyerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  useEffect(() => {
    fetchListings();
  }, []);
  
  const fetchListings = async () => {
    const { data } = await axios.get(`${API_URL}/api/listings`);
    // ...
  };
  
  return <div>Dashboard</div>;
};
```

### NEW (`/app/nextjs-app/app/buyer/page.tsx`)
```typescript
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from "next-auth/react";

export default function BuyerDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };
  
  useEffect(() => {
    fetchListings();
  }, []);
  
  const fetchListings = async () => {
    const response = await fetch('/api/listings');
    const data = await response.json();
    // ...
  };
  
  // Redirect if not authenticated
  if (status === "loading") {
    return <div>Loading...</div>;
  }
  
  if (!session || user?.role !== 'buyer') {
    router.push('/login');
    return null;
  }
  
  return <div>Dashboard</div>;
}
```

## Step-by-Step Conversion Process

### 1. Create New File
```bash
# For each dashboard:
touch /app/nextjs-app/app/buyer/page.tsx
touch /app/nextjs-app/app/seller/page.tsx
touch /app/nextjs-app/app/admin/page.tsx
touch /app/nextjs-app/app/messages/page.tsx
```

### 2. Copy Old Code
Copy entire content from old React file

### 3. Apply Changes (In Order)

#### A. Add "use client"
```typescript
"use client";  // Add at very top

import { useState } from 'react';
// rest of imports...
```

#### B. Update Imports
```typescript
// Remove these:
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { Link } from 'react-router-dom';

// Add these:
import { useRouter } from 'next/navigation';
import { useSession, signOut } from "next-auth/react";
import Link from 'next/link';
```

#### C. Update Component Declaration
```typescript
// ❌ OLD
export const BuyerDashboard = () => {

// ✅ NEW
export default function BuyerDashboard() {
```

#### D. Replace Auth Hook
```typescript
// ❌ OLD
const { user, logout } = useAuth();

// ✅ NEW
const { data: session, status } = useSession();
const user = session?.user;
```

#### E. Replace Navigation Hook
```typescript
// ❌ OLD
const navigate = useNavigate();
navigate('/somewhere');

// ✅ NEW
const router = useRouter();
router.push('/somewhere');
```

#### F. Update API Calls
```typescript
// ❌ OLD
const API_URL = process.env.REACT_APP_BACKEND_URL;
const { data } = await axios.get(`${API_URL}/api/listings`, {
  withCredentials: true
});

// ✅ NEW
const response = await fetch('/api/listings');
const data = await response.json();
```

#### G. Update Logout Function
```typescript
// ❌ OLD
const handleLogout = async () => {
  await logout();
  navigate('/login');
};

// ✅ NEW
const handleLogout = async () => {
  await signOut({ callbackUrl: "/login" });
};
```

#### H. Add Session Check (Optional but recommended)
```typescript
// Add near top of component
if (status === "loading") {
  return <div className="min-h-screen flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-[#2B4A3B] border-t-transparent rounded-full animate-spin"></div>
  </div>;
}

if (!session) {
  router.push('/login');
  return null;
}
```

### 4. Update Component Paths
```typescript
// ❌ OLD
import { Button } from '../components/ui/button';

// ✅ NEW
import { Button } from '@/components/ui/button';
```

## Common Patterns

### Fetching Data
```typescript
// GET request
const response = await fetch('/api/listings');
if (!response.ok) throw new Error('Failed to fetch');
const data = await response.json();

// POST request
const response = await fetch('/api/listings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title, price, ... })
});
const data = await response.json();

// PUT request
const response = await fetch(`/api/listings/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updateData)
});

// DELETE request
const response = await fetch(`/api/listings/${id}`, {
  method: 'DELETE'
});
```

### Error Handling
```typescript
try {
  const response = await fetch('/api/listings');
  if (!response.ok) {
    const error = await response.json();
    toast.error(error.error || 'Something went wrong');
    return;
  }
  const data = await response.json();
  // Success
} catch (error) {
  toast.error('Network error');
}
```

### Navigation Examples
```typescript
// Simple navigation
router.push('/messages');

// With state/refresh
router.push('/buyer');
router.refresh(); // Refresh server components

// Back navigation
router.back();

// Replace (no history)
router.replace('/login');
```

## Checklist for Each Dashboard

- [ ] Add `"use client"` at top
- [ ] Import `useRouter` from "next/navigation"
- [ ] Import `useSession, signOut` from "next-auth/react"
- [ ] Replace `useAuth()` with `useSession()`
- [ ] Replace `useNavigate()` with `useRouter()`
- [ ] Replace `logout()` with `signOut()`
- [ ] Remove `API_URL` and `withCredentials`
- [ ] Update all `axios` calls to `fetch`
- [ ] Change component export to `export default`
- [ ] Update import paths to use `@/`
- [ ] Test the page!

## Testing Each Dashboard

```bash
# Start dev server
cd /app/nextjs-app
npm run dev

# Visit each dashboard:
# http://localhost:3000/login
# http://localhost:3000/buyer
# http://localhost:3000/seller
# http://localhost:3000/admin
# http://localhost:3000/messages
```

## Helpful Commands

```bash
# Seed admin (if needed)
npm run seed

# Build for production
npm run build

# Start production server
npm start
```

---

**Remember**: The middleware at `/app/nextjs-app/middleware.ts` already handles route protection, so you don't need to manually check auth in each page (but it's good practice to show loading states).
