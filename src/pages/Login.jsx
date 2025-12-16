import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

function Login({ setIsLoggedIn, setUserRole }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setError('');

      // ✅ Fetch users from backend
      const response = await axios.get('http://localhost:5186/api/Users');
      const users = response.data;

      // ✅ Validate credentials
      const foundUser = users.find(
        u => u.email === email && u.password === password
      );

      if (!foundUser) {
        toast.error('Invalid credentials ❌');
        return;
      }

      // ✅ NORMALIZE ROLE (IMPORTANT FIX)
      const role = foundUser.role?.toUpperCase();

      // ✅ Save login state
      setIsLoggedIn(true);
      setUserRole(role);

      // ✅ Save user in localStorage
      localStorage.setItem(
        'loggedInUser',
        JSON.stringify({ ...foundUser, role })
      );

      toast.success(`Welcome, ${foundUser.fullName} 👋`);

      // ✅ ROLE-BASED REDIRECT (CLEAN & SAFE)
      switch (role) {
        case 'ADMIN':
          navigate('/dashboard');
          break;

        case 'HR':
        case 'SALES':
        case 'RECEPTIONIST':
        case 'EMPLOYEE':
          navigate('/welcome');
          break;

        default:
          navigate('/404');
      }

    } catch (err) {
      console.error(err);
      toast.error('Login failed. Server error ❌');
    }
  };

  return (
    <div className="wrapper">
      <div className="container">
        <div className="form-box">
          <h2>Login to HMS</h2>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <p style={{ color: 'red', fontSize: '14px' }}>
                {error}
              </p>
            )}

            <button type="submit">Login</button>
          </form>

          <div className="switch-link">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
