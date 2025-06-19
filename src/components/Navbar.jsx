// src/components/Navbar.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logo from "../images/favicon.ico/android-chrome-192x192.png";

export default function Navbar() {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className="bg-white shadow-sm p-4 flex justify-center">
      <div className="container flex items-center justify-between">
        <Link to="/">
          <div className="flex items-center space-x-2">
            <img src={logo} alt="Logo" className="w-10" />
            <span className="hidden xs:block font-bold text-[20px]">
              Flashedcards
            </span>
          </div>
        </Link>

        {currentUser ? (
          <button className="btn text-white" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <Link to="/login" className="btn text-white">
            Login / Register
          </Link>
        )}
      </div>
    </nav>
  );
}
