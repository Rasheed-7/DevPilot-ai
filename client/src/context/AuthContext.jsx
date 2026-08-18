/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(
    () => !!localStorage.getItem("token")
  );

  const isAuthenticated = !!user;

  const fetchAuthenticatedUser = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return {
        success: false,
        user: null,
        hasToken: false,
      };
    }

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    try {
      const response = await api.get("/auth/me");

      if (response.data.success) {
        return {
          success: true,
          user: response.data.user,
          hasToken: true,
        };
      }

      return {
        success: false,
        user: null,
        hasToken: true,
      };
    } catch (error) {
      console.error("Auth check failed:", error);

      return {
        success: false,
        user: null,
        hasToken: true,
      };
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const result = await fetchAuthenticatedUser();

      if (result.success) {
        setUser(result.user);
        localStorage.setItem("user", JSON.stringify(result.user));
      } else {
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete api.defaults.headers.common["Authorization"];
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete api.defaults.headers.common["Authorization"];
    } finally {
      setLoading(false);
    }
  }, [fetchAuthenticatedUser]);

  // ✅ refreshUser – fetches latest user and updates state + localStorage
  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const response = await api.get("/auth/me");

      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        return userData;
      }
    } catch (error) {
      console.error("Refresh user failed:", error);
    }
    return null;
  }, []);

  // In AuthContext.jsx, modify the useEffect to check for user cookie

useEffect(() => {
  let cancelled = false;

  const initializeAuth = async () => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    // ✅ If we have user data in localStorage, use it
    if (storedUser && token) {
      try {
        const user = JSON.parse(storedUser);
        console.log("User from localStorage:", user);
        setUser(user);
        setLoading(false);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        return;
      } catch (e) {
        console.error("Failed to parse stored user:", e);
      }
    }

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const response = await api.get("/auth/me");

      if (cancelled) return;

      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete api.defaults.headers.common["Authorization"];
      }
    } catch (error) {
      if (cancelled) return;
      console.error("Auth check failed:", error);
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete api.defaults.headers.common["Authorization"];
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  initializeAuth();

  return () => {
    cancelled = true;
  };
}, []);

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { user: userData, token } = response.data;

      if (token) {
        localStorage.setItem("token", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      // Set initial user from response (might have profilePicture)
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      // ✅ Refresh to get the complete user data (including profilePicture)
      await refreshUser();

      return {
        success: true,
        user: userData,
      };
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      const { user: userData, token } = response.data;

      if (token) {
        localStorage.setItem("token", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      // ✅ Refresh to get the complete user data
      await refreshUser();

      return {
        success: true,
        user: userData,
      };
    } catch (error) {
      console.error("Register error:", error.response?.data || error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        checkAuth,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export default AuthContext;