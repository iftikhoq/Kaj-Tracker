---
name: react-vite-frontend-builder
description: Build scalable React + Vite SPA frontends with modular React Context state management, Axios request interceptors with auto-refresh token queues, React Router v7 routing, Tailwind CSS, and pluggable backend framework adapters (Django DRF, Laravel Sanctum/JWT). Trigger on "create react frontend", "build vite frontend", "react frontend architecture", "react auth context", "frontend api integration", "make react app".
---

# Universal React + Vite Single Page Application (SPA) Builder

This skill provides full architecture guidelines, directory layouts, state management blueprints, router patterns, and pluggable backend API adapters for building high-performance frontend applications with React and Vite.

---

## 1. Directory Layout & Architecture

```text
frontend_root/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── netlify.toml / vercel.json
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── App.css
    ├── index.css
    ├── routes.jsx                   # Centralized React Router configuration
    ├── assets/                      # Static branding, images, vectors
    ├── components/                  # Shared UI Components (Navbar, Footer, Modals)
    ├── pages/                       # Route Pages & Admin Layout Views
    │   ├── Home.jsx
    │   ├── Profile.jsx
    │   └── Admin/
    │       ├── AdminLayout.jsx
    │       └── Dashboard.jsx
    ├── context/                     # Modular React Context Providers
    │   ├── AuthContext.jsx          # Auth, Tokens & User State
    │   ├── CartContext.jsx          # Persistent Cart State
    │   ├── ProductContext.jsx       # Global Product/Catalog State
    │   └── FilterContext.jsx        # Search & UI Filters
    ├── hooks/                       # Custom React Hooks
    └── services/                    # API Layer & Backend Adapters
        ├── api.js                   # Universal Core Axios Client Engine
        └── adapters/
            ├── djangoAdapter.js     # Django REST Framework (DRF) Endpoints
            └── laravelAdapter.js    # Laravel Sanctum / JWT Endpoints
```

---

## 2. Standard Dependencies (`package.json`)

```json
{
  "name": "vite-react-app",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.7.0",
    "framer-motion": "^12.0.0",
    "lucide-react": "^0.400.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-helmet-async": "^2.0.5",
    "react-hot-toast": "^2.5.2",
    "react-icons": "^5.2.0",
    "react-router-dom": "^7.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.40",
    "tailwindcss": "^3.4.0",
    "vite": "^5.4.0"
  }
}
```

---

## 3. Core API Client Engine (`src/services/api.js`)

The API client features automatic Bearer header insertion, a concurrency queue (`failedQueue`) preventing parallel token refresh requests, and automated retry logic on `401 Unauthorized`.

```javascript
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Abstract token refresh executor
export const executeTokenRefresh = async (refreshEndpoint, refreshPayload) => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    clearAuthState();
    throw new Error("No refresh token stored.");
  }

  isRefreshing = true;

  try {
    const response = await axios.post(`${api.defaults.baseURL}${refreshEndpoint}`, {
      ...refreshPayload,
      refresh: refreshToken,
    });

    const newAccessToken = response.data.access || response.data.token || response.data.access_token;
    const newRefreshToken = response.data.refresh || response.data.refresh_token;

    localStorage.setItem("access_token", newAccessToken);
    if (newRefreshToken) {
      localStorage.setItem("refresh_token", newRefreshToken);
    }

    window.dispatchEvent(new Event("tokens-updated"));
    isRefreshing = false;
    processQueue(null, newAccessToken);
    return newAccessToken;
  } catch (err) {
    isRefreshing = false;
    processQueue(err, null);
    clearAuthState();
    throw err;
  }
};

export const clearAuthState = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("tokens-updated"));
};

// Request Interceptor: Inject Access Token
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("access_token");
    if (accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catch 401 & Trigger Queue Retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes("/refresh")) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      try {
        const refreshEndpoint = window.__API_REFRESH_ENDPOINT__ || "/auth/token/refresh/";
        const newAccessToken = await executeTokenRefresh(refreshEndpoint, {});
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 4. Universal Authentication Context (`src/context/AuthContext.jsx`)

Provides real-time authentication state, cross-tab tab synchronization, and proactive background token refreshes.

```jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import api, { clearAuthState } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children, backendAdapter }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("access_token"));
  const refreshTokenRef = useRef(localStorage.getItem("refresh_token"));

  // Sync state when localStorage changes across tabs or via custom dispatch
  useEffect(() => {
    const syncAuthState = () => {
      const token = localStorage.getItem("access_token");
      const refresh = localStorage.getItem("refresh_token");
      const storedUser = localStorage.getItem("user");

      setAccessToken(token);
      refreshTokenRef.current = refresh;
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };

    window.addEventListener("storage", syncAuthState);
    window.addEventListener("tokens-updated", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("tokens-updated", syncAuthState);
    };
  }, []);

  const login = async (credentials) => {
    try {
      const data = await backendAdapter.login(credentials);
      
      setAccessToken(data.accessToken);
      refreshTokenRef.current = data.refreshToken;
      setUser(data.user);

      localStorage.setItem("access_token", data.accessToken);
      if (data.refreshToken) localStorage.setItem("refresh_token", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      return { success: true };
    } catch (err) {
      console.error("Auth login failed:", err);
      return { success: false, error: err.response?.data || err.message };
    }
  };

  const logout = useCallback(async () => {
    try {
      await backendAdapter.logout();
    } catch (err) {
      console.warn("Server logout notification skipped:", err);
    } finally {
      clearAuthState();
      setUser(null);
      setAccessToken(null);
    }
  }, [backendAdapter]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

## 5. Domain Context Pattern (Example: Persistent Shopping Cart)

```jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const stored = localStorage.getItem("cart_items");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart_items", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1, selectedVariant = null) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.id === product.id && item.variant?.id === selectedVariant?.id
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      return [...prev, { ...product, quantity, variant: selectedVariant }];
    });
  };

  const removeFromCart = (index) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => setCartItems([]);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + (item.discountedPrice || item.price) * item.quantity,
    0
  );

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
```

---

## 6. Centralized React Router Configuration (`src/routes.jsx`)

```jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import AdminLayout from "./pages/Admin/AdminLayout";
import Dashboard from "./pages/Admin/Dashboard";
import { useAuth } from "./context/AuthContext";

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireAdmin && !user?.is_staff) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      {/* Protected Admin Nested Layout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
```

---

## 7. Master Provider Tree (`src/App.jsx`)

```jsx
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import djangoAdapter from "./services/adapters/djangoAdapter";
import AppRoutes from "./routes";

const App = () => {
  return (
    <AuthProvider backendAdapter={djangoAdapter}>
      <HelmetProvider>
        <CartProvider>
          <Router>
            <AppRoutes />
            <Toaster position="bottom-right" />
          </Router>
        </CartProvider>
      </HelmetProvider>
    </AuthProvider>
  );
};

export default App;
```

---

## 8. ISOLATED BACKEND ADAPTERS SECTION

*This section isolates framework-specific API request formats, endpoints, and token structures so you can easily switch or add new backend adapters.*

### 8.1 Django REST Framework (DRF) Adapter (`src/services/adapters/djangoAdapter.js`)

```javascript
import api from "../api";

window.__API_REFRESH_ENDPOINT__ = "/auth/token/refresh/";

const djangoAdapter = {
  login: async ({ email, password }) => {
    const res = await api.post("/auth/login/", { email, password });
    return {
      accessToken: res.data.access,
      refreshToken: res.data.refresh,
      user: res.data.user || { email },
    };
  },
  logout: async () => {
    return await api.post("/auth/logout/");
  },
  refreshToken: async (refreshToken) => {
    const res = await api.post("/auth/token/refresh/", { refresh: refreshToken });
    return {
      accessToken: res.data.access,
      refreshToken: res.data.refresh,
    };
  },
};

export default djangoAdapter;
```

### 8.2 Laravel (Sanctum / JWT) Adapter (`src/services/adapters/laravelAdapter.js`)

```javascript
import api from "../api";

window.__API_REFRESH_ENDPOINT__ = "/api/v1/auth/refresh";

const laravelAdapter = {
  login: async ({ email, password }) => {
    const res = await api.post("/api/v1/auth/login", { email, password });
    return {
      accessToken: res.data.token || res.data.access_token,
      refreshToken: res.data.refresh_token || null,
      user: res.data.user,
    };
  },
  logout: async () => {
    return await api.post("/api/v1/auth/logout");
  },
  refreshToken: async (refreshToken) => {
    const res = await api.post("/api/v1/auth/refresh", { refresh_token: refreshToken });
    return {
      accessToken: res.data.access_token || res.data.token,
      refreshToken: res.data.refresh_token || null,
    };
  },
};

export default laravelAdapter;
```

---

## 9. Workflow Blueprint for Building Frontend Applications

1. **Scaffold Project**: `npx -y create-vite@latest ./ --template react`
2. **Install Core Dependencies**: `npm install axios react-router-dom react-helmet-async react-hot-toast lucide-react framer-motion`
3. **Configure Tailwind & Vite**: Set up `tailwind.config.js` and `vite.config.js`.
4. **Setup API Engine & Adapters**: Configure `src/services/api.js` and select/build the appropriate backend adapter (`djangoAdapter` or `laravelAdapter`).
5. **Construct Context Hierarchy**: Implement `AuthContext` and domain contexts (`CartContext`, `ProductContext`, etc.).
6. **Configure Routes & Protected Views**: Build `src/routes.jsx` with route guards.
