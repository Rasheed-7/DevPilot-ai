import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import { useTheme } from "../context/ThemeContext";

const MainLayout = () => {
  const { darkMode } = useTheme();

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? "bg-slate-950" : "bg-gray-100"}`}>
      {/* Sidebar - fixed, doesn't scroll */}
      <Sidebar />

      {/* Main content area - scrollable */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />

        <main
          className={`flex-1 overflow-y-auto p-4 sm:p-6 ${
            darkMode ? "bg-slate-950" : "bg-gray-100"
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;