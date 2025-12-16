import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function WelcomePage() {
  const user = JSON.parse(localStorage.getItem('loggedInUser'));
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'Employee') {
      navigate('/employee-task');
    }
  }, [navigate, user?.role]); // ✅ correct dependencies

  return (
    <div className="welcome-page p-8 text-center">
      <h1>Welcome, {user?.fullName} 👋</h1>
      <p>
        You are logged in as <strong>{user?.role}</strong>
      </p>
      <p className="mt-4 text-gray-600">
        Please use the sidebar to explore your module features.
      </p>
    </div>
  );
}

export default WelcomePage;
