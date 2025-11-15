import React from 'react';
import { Link } from 'react-router-dom';

function Signup() {
  return (
    <div className="wrapper">
      <div className="container">
        <div className="form-box" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '10px' }}>🔒 Signup Disabled</h2>
          <p style={{ fontSize: '16px', margin: '20px 0', lineHeight: '1.6' }}>
            🚫 Self-registration is not allowed.<br />
            👤 Please contact the admin to create your account.
          </p>
          <p style={{ marginTop: '30px', fontSize: '14px' }}>
           <Link
  to="/"
  style={{
    display: 'inline-block',
    // marginTop: '10px',
    padding: '10px 28px',
    backgroundColor: '#080808', // Button color
    color: '#ffffff',
    borderRadius: '25px',
    fontWeight: '600',
    fontSize: '15px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    transition: 'background-color 0.3s ease',
    textDecoration: 'none'
  }}
  onMouseOver={(e) => {
    e.target.style.backgroundColor = '#0f2e44'; // Your ERP theme color
  }}
  onMouseOut={(e) => {
    e.target.style.backgroundColor = '#080808';
  }}
>
  Back to Login
</Link>

          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
