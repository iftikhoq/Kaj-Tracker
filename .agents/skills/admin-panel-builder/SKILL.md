---
name: admin-panel-builder
description: Build premium executive admin panels and management consoles with responsive sidebar layouts, context-aware dynamic header banners, multi-layered depth card shading instead of hard borders, CSS transition animations, and theme-adaptive color palettes. Trigger on "build admin panel", "create admin dashboard", "make admin panel", "add management panel", "executive console", "build dashboard layout".
---

# Admin Panel & Executive Console Builder

This skill defines the blueprint for building high-end, luxury executive admin consoles and management dashboards. It incorporates responsive sidebar navigation, context-aware top banners with real-time clocks, multi-layered depth shading (replacing plain hard borders), interactive chart widgets, and CSS transition animations — automatically adapted to the host application's color theme and brand identity.

---

## 🎨 Design System & Theme Adaptation Rules

### 1. Theme-Adaptive Color Mapping
Before creating any admin panel component, analyze the target project's CSS variables (`index.css` / `globals.css`) or `tailwind.config.js` to derive the following tokens:

| Token Role | Description / Usage | Example (Muqam Warm Luxury) |
|---|---|---|
| `--color-primary` | Main dark contrast background (Sidebar & Banner base) | `#2D2722` (Dark Walnut) |
| `--color-secondary` | Secondary dark highlight | `#3D302A` / `#6B1E25` |
| `--color-accent` | Brand primary accent (Active nav pills, gold borders, buttons) | `#7E5638` / `#B8A48F` |
| `--color-surface-light` | Top gradient stop for cards and panels | `#FAF7F2` (Ivory Cream) |
| `--color-surface-dark` | Bottom gradient stop for cards and panels | `#EFEAE2` (Sand Warm) |
| `--color-text-primary` | Main body typography | `#2D2722` |
| `--color-text-muted` | Secondary labels and metadata | `#8E8377` |

### 2. Multi-Layered Depth Shading (No Plain Hard Borders)
Never use plain flat 1px solid borders (e.g. `border-gray-200`). Instead, apply **depth shading**:
* **Background Fill**: `bg-gradient-to-b from-[#FAF7F2] to-[#EFEAE2]` (or theme light gradients).
* **Multi-Layer Shadow**: `shadow-[0_10px_35px_-5px_rgba(45,39,34,0.1),0_4px_12px_-2px_rgba(45,39,34,0.05)]`.
* **Soft Translucent Border**: `border border-[rgba(184,164,143,0.25)]`.

---

## 🏛️ Architecture & Structural Layout

### 1. Layout Container (`AdminLayout.jsx`)
```jsx
import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, ClipboardList, MessageSquare, LogOut, Home, Lock, Award, Tag, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminBanner } from './AdminBanner';
import styles from './AdminLayout.module.css';

export const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, isAdmin } = useAuth();

  // Auth Protection Guard
  if (!currentUser || !isAdmin()) {
    return (
      <div className={styles.unauthorized}>
        <Lock size={28} />
        <h2>Staff Eyes Only</h2>
        <p>Authentication required as Administrator.</p>
        <Link to="/" className="btn-accent text-xs px-4 py-2">Return to Site</Link>
      </div>
    );
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { path: '/admin/products', label: 'Products', icon: <ShoppingBag size={18} /> },
    { path: '/admin/brands', label: 'Brands & Houses', icon: <Award size={18} /> },
    { path: '/admin/categories', label: 'Categories', icon: <Tag size={18} /> },
    { path: '/admin/orders', label: 'Orders', icon: <ClipboardList size={18} /> },
    { path: '/admin/users', label: 'Users & Staff', icon: <Users size={18} /> },
    { path: '/admin/reviews', label: 'Reviews', icon: <MessageSquare size={18} /> }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] min-h-screen bg-background">
      {/* Sticky Left Sidebar */}
      <aside className="bg-[#2D2722] text-[#FAF7F2] flex flex-col border-r-2 border-[#7E5638]/40 h-screen sticky top-0 p-4">
        <div className="pb-4 border-b border-[rgba(184,164,143,0.2)] mb-4">
          <h3 className="font-serif text-accent text-xl font-bold tracking-wider">[BRAND] Console</h3>
          <span className="text-[0.65rem] text-[rgba(247,242,231,0.5)] font-bold uppercase tracking-widest">v1.0 Executive</span>
        </div>

        <nav className="flex flex-col gap-1 flex-grow">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs transition-all ${
                  isActive 
                    ? 'bg-[#7E5638] text-[#FAF7F2] font-semibold shadow-md border-l-4 border-[#B8A48F]' 
                    : 'text-[rgba(247,242,231,0.75)] hover:bg-[rgba(247,242,231,0.05)] hover:text-[#B8A48F]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Actions */}
        <div className="pt-4 border-t border-[rgba(184,164,143,0.2)] flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <img src={currentUser.avatar} alt="Avatar" className="w-9 h-9 rounded-full border border-accent object-cover" />
            <div className="flex flex-col">
              <strong className="text-xs text-[#FAF7F2] font-semibold">{currentUser.name}</strong>
              <span className="text-[0.65rem] text-accent font-medium">Supervisor</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="flex-1 py-1.5 bg-[rgba(247,242,231,0.05)] hover:bg-[rgba(201,162,39,0.1)] text-[rgba(247,242,231,0.7)] hover:text-accent rounded-lg flex items-center justify-center transition-colors">
              <Home size={15} />
            </Link>
            <button onClick={logout} className="flex-1 py-1.5 bg-[rgba(247,242,231,0.05)] hover:bg-[rgba(107,30,37,0.2)] text-[rgba(247,242,231,0.7)] hover:text-red-400 rounded-lg flex items-center justify-center transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Viewport */}
      <main className="p-6 overflow-y-auto h-screen">
        <AdminBanner />
        <Outlet />
      </main>
    </div>
  );
};
```

---

## 👑 Component: Dynamic Executive Header Banner (`AdminBanner.jsx`)

The banner automatically adapts its icon, title, subtitle, and watermark script based on `location.pathname`:

```jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-[#2D2722]';
import { LayoutDashboard, ShoppingBag, Award, Tag, ClipboardList, Users, MessageSquare } from 'lucide-react';

const PAGE_META = {
  '/admin': {
    title: 'Executive Analytics Dashboard',
    subtitle: 'Live operational metrics, sales intelligence & performance analytics',
    icon: <LayoutDashboard size={28} />,
    watermark: 'DASHBOARD',
  },
  '/admin/products': {
    title: 'Catalog & Stock Management',
    subtitle: 'Manage product inventory, pricing tiers, and variations',
    icon: <ShoppingBag size={28} />,
    watermark: 'CATALOG',
  },
  '/admin/orders': {
    title: 'Order Fulfillment & Dispatch Queue',
    subtitle: 'Inspect customer orders, dispatch items, and manage delivery',
    icon: <ClipboardList size={28} />,
    watermark: 'ORDERS',
  },
  // Add other sub-panel metadata...
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good Night';
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="text-right hidden md:block">
      <div className="font-serif font-bold text-[#FAF7F2] text-xl tabular-nums tracking-wide">
        {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-[rgba(247,242,231,0.55)] text-xs mt-0.5">
        {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
}

export function AdminBanner() {
  const { currentUser } = useAuth();
  const { pathname } = useLocation();
  const meta = PAGE_META[pathname] || PAGE_META['/admin'];
  const greeting = getGreeting();

  return (
    <div className="relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-r from-[#2D2722] via-[#3d302a] to-[#7E5638] shadow-[0_8px_40px_-4px_rgba(45,39,34,0.35)]">
      {/* Decorative Radial Watermark Glows */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-radial from-[rgba(184,164,143,0.15)] to-transparent" />
        <div className="absolute right-20 -bottom-16 w-52 h-52 rounded-full bg-radial from-[rgba(126,86,56,0.2)] to-transparent" />
        
        {/* Subtle Watermark Text */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 font-serif text-7xl font-bold text-[rgba(184,164,143,0.06)] select-none pointer-events-none">
          {meta.watermark}
        </div>

        {/* Gold Hairline Bottom Accent */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#B8A48F] to-transparent opacity-80" />
      </div>

      {/* Banner Content */}
      <div className="relative z-10 flex items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(184,164,143,0.15)] border border-[rgba(184,164,143,0.25)] backdrop-blur-xs flex items-center justify-center text-[#B8A48F] shrink-0 shadow-lg">
            {meta.icon}
          </div>
          <div>
            <div className="text-[0.65rem] font-bold tracking-widest uppercase text-[rgba(184,164,143,0.8)] mb-0.5">
              {greeting}, {currentUser?.name?.split(' ')[0] || 'Admin'} · Executive Command
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#FAF7F2] tracking-tight leading-tight">
              {meta.title}
            </h1>
            <p className="text-xs text-[rgba(247,242,231,0.55)] mt-0.5">
              {meta.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 shrink-0">
          <LiveClock />
        </div>
      </div>
    </div>
  );
}
```

---

## 📊 Sub-Panel CRUD Standard Template

Each entity management view (e.g. Products, Brands, Categories, Users, Orders) follows this clean structure:

```jsx
import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const EntityManage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  return (
    <div className="space-y-6">
      {/* Action Row */}
      <div className="flex justify-end">
        <button className="btn-accent text-xs font-semibold px-4 py-2.5 inline-flex items-center gap-1.5 shadow-md rounded-xl hover:shadow-lg transition-all">
          <Plus size={16} /> Add New Entry
        </button>
      </div>

      {/* Shaded Depth Table Card */}
      <div className="bg-gradient-to-b from-[#EFEAE2] to-[#FAF7F2] rounded-2xl shadow-[0_10px_35px_-5px_rgba(45,39,34,0.1),0_4px_12px_-2px_rgba(45,39,34,0.05)] border border-[rgba(184,164,143,0.25)] overflow-hidden t-tilt-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gradient-to-r from-[#2D2722] via-[#3A332D] to-[#2D2722] text-[#FAF7F2] font-serif text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(184,164,143,0.2)]">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-[#FAF7F2]/80 transition-all duration-200">
                  <td className="p-4 font-semibold text-[#2D2722]">{item.name}</td>
                  <td className="p-4"><span className="badge-active">Active</span></td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 rounded-lg hover:bg-accent/20 text-accent"><Edit2 size={15} /></button>
                      <button className="p-2 rounded-lg hover:bg-red-500/20 text-red-600"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
```

---

## 🎬 Transition Animation Classes (`transitions.css`)

Ensure the following CSS transition tokens exist in the project:

```css
/* Panel & Card Entrance Slide */
.t-panel-slide {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.t-panel-slide.is-open {
  opacity: 1;
  transform: translateY(0);
}

/* 3D Hover Tilt & Card Glare */
.t-tilt-card {
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.t-tilt-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 40px -6px rgba(45,39,34,0.15), 0 6px 16px -3px rgba(45,39,34,0.08);
}

/* Shimmer Loading Text */
.t-shimmer {
  background: linear-gradient(90deg, rgba(142,131,119,0.7) 0%, rgba(201,162,39,0.9) 50%, rgba(142,131,119,0.7) 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 3s infinite linear;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

## ⚡ Step-by-Step Implementation Workflow

1. **Extract Design Tokens**: Read `index.css` or Tailwind config to get the primary dark, accent, and surface color codes.
2. **Setup Transitions**: Ensure `transitions.css` contains `.t-panel-slide`, `.t-tilt-card`, and `.t-shimmer`.
3. **Build `AdminBanner.jsx`**: Create the context-aware top banner with `LiveClock` and route metadata mapping.
4. **Build `AdminLayout.jsx`**: Implement the sidebar + viewport wrapper, incorporating auth checks.
5. **Build Dashboard & Widgets**: Add Recharts charts, metric cards, recent activity lists.
6. **Build Entity Management Views**: Construct CRUD pages with depth tables and modal drawers.
7. **Configure Router**: Nest all admin routes inside `<Route path="/admin" element={<AdminLayout />}>`.
