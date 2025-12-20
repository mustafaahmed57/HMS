import React, { useState } from "react";
import "../csscode/CustomerAuth.css";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
// import { Link } from "react-router-dom";
import { Link, useNavigate } from "react-router-dom";

export default function CustomerLogin() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5186/api/customers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Login failed ❌");
        return;
      }

      toast.success("Login successful 🎉");

      localStorage.setItem(
        "customer",
        JSON.stringify({
          customerId: data.customerId,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          loginTime: Date.now(),
          lastActivityTime: Date.now(), // 🔥 ADD THIS
        })
      );

      navigate("/customer-landing");
    } catch {
      toast.error("Server not reachable ⚠️");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">
          Login to manage your bookings and profile.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required
          />

          <div className="password-field">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <span
              className="toggle-eye"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          <p className="auth-footer">
            <Link to="/Customer-landing">Continue browsing as guest</Link>
          </p>
        </form>

        <p className="auth-footer">
          Don’t have an account? <Link to="/Customer-signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
