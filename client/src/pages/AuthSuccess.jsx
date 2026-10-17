import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

const AuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    console.log("========== AUTH SUCCESS PAGE LOADED ==========");
    
    const token = searchParams.get("token");
    const userParam = searchParams.get("user");
    const error = searchParams.get("error");

    console.log("Token present:", token ? "Yes" : "No");
    console.log("User param present:", userParam ? "Yes" : "No");
    console.log("Error:", error || "None");

    if (error) {
      toast.error(`Authentication failed: ${error}`);
      navigate("/login");
      return;
    }

    if (!token) {
      console.error("No token found in URL!");
      toast.error("Authentication failed. No token received.");
      navigate("/login");
      return;
    }

    // Store everything immediately
    try {
      console.log("Storing token in localStorage...");
      localStorage.setItem("token", token);
      
      if (userParam) {
        console.log("Storing user data from URL...");
        const user = JSON.parse(decodeURIComponent(userParam));
        console.log("User data:", user);
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        console.log("No user data in URL, fetching from API...");
        // Set token in axios and fetch user
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        // We'll fetch user data in the background
        api.get("/auth/me").then(response => {
          if (response.data.success) {
            localStorage.setItem("user", JSON.stringify(response.data.user));
            console.log("User data fetched and stored");
          }
        }).catch(err => {
          console.error("Failed to fetch user:", err);
        });
      }
      
      // Set axios header
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      
      console.log("All data stored, redirecting to dashboard...");
      toast.success("Welcome! You've successfully signed in with Google.");
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
      
    } catch (error) {
      console.error("Error storing auth data:", error);
      toast.error("Failed to complete authentication. Please try again.");
      navigate("/login");
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Completing your sign in...</p>
      </div>
    </div>
  );
};

export default AuthSuccess;