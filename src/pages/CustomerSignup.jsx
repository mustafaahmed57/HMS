import React, { useState } from "react";
import "../csscode/CustomerAuth.css";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link } from "react-router-dom";


export default function CustomerSignup() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    passwordHash: ""
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        "http://localhost:5186/api/customers/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Registration failed ❌");
        setLoading(false);
        return;
      }

      toast.success("Account created successfully 🎉 Please login");

      setForm({
        fullName: "",
        email: "",
        phone: "",
        passwordHash: ""
      });
    } catch {
      toast.error("Server not reachable ⚠️");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="auth-subtitle">
          Join StayElite and enjoy a seamless hotel booking experience.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            name="fullName"
            placeholder="Full Name"
            value={form.fullName}
            onChange={handleChange}
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            required
          />

          {/* PASSWORD WITH TOGGLE */}
          <div className="password-field">
            <input
              name="passwordHash"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.passwordHash}
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
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* <p className="auth-footer">
          Already have an account? <span>Login</span>
        </p> */}
        <p className="auth-footer">
  Already have an account?{" "}
  <Link to="/Customer-login">Login</Link>
</p>

      </div>
    </div>
  );
}
