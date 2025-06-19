// src/components/LoginForm.jsx
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { HiOutlineMail } from "react-icons/hi";
import { TiLockClosed } from "react-icons/ti";

export default function LoginForm() {
  const { signup, login, loginAsDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();

  const handleDemo = () => {
    loginAsDemo();
    nav("/"); // weiter zur Hauptseite im Demo-Modus
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      if (isRegister) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      nav("/"); // nach Login/Register zur Startseite
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <section className="container mt-10 p-7 bg-white rounded shadow">
        <h2 className="mb-4">{isRegister ? "Create Account" : "Login"}</h2>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="userEmail"
              className="text-lg flex items-center gap-1"
            >
              Email
              <HiOutlineMail size={20} />
            </label>
            <input
              id="userEmail"
              type="email"
              className="inputField"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              htmlFor="userPassword"
              className="text-lg flex items-center gap-1"
            >
              Password
              <TiLockClosed size={20} />
            </label>
            <input
              id="userPassword"
              type="password"
              className="inputField"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn w-full text-white rounded">
            {isRegister ? "Create Account" : "Log In"}
          </button>
        </form>
        <p className="mt-4 text-center">
          {isRegister ? "Already have an account? " : "Need an account? "}
          <button
            className="text-blue-600 underline cursor-pointer"
            onClick={() => setIsRegister((prev) => !prev)}
          >
            {isRegister ? "Log in" : "Sign up"}
          </button>
        </p>
      </section>

      <section className="container mt-10 p-7 bg-white rounded shadow">
        <h2>You are a guest? Create a Demo Account:</h2>
        <p className="mt-2 text-red-500">
          Warning: Your stacks and flashcards will not be saved.
        </p>
        <button onClick={handleDemo} className="btn mt-4 text-white w-full">
          Create Demo Account
        </button>
      </section>
    </>
  );
}
