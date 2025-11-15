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

      // ✅ Send login request to backend
      const response = await axios.get('http://localhost:5186/api/Users');
      const users = response.data;

      // ✅ Check credentials
      const foundUser = users.find(u => u.email === email && u.password === password);

      if (foundUser) {
        setIsLoggedIn(true);
        setUserRole(foundUser.role); // ✅ Set user role globally
        toast.success(`Welcome, ${foundUser.fullName}`);

        // ✅ Save user in localStorage for WelcomePage
        localStorage.setItem('loggedInUser', JSON.stringify(foundUser));

        // ✅ Redirect based on role
        switch (foundUser.role.toLowerCase()) {
          case 'admin':
            navigate('/dashboard');
            break;
            case 'procurement': 
          case 'inventory':
          case 'purchase':
          case 'sales':
          case 'manufacturing':
            navigate('/welcome');
            break;
          default:
            navigate('/404');
            break;
        }
      } else {
        toast.error('Invalid credentials ❌');
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
            {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
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
