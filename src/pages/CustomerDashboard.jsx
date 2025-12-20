import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../csscode/CustomerDashboard.css";

export default function CustomerDashboard() {
  const navigate = useNavigate();

  // ✅ customer state (IMPORTANT FIX)
  const [customer, setCustomer] = useState(null);

  // 🔁 demo data (baad mein API se ayega)
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("customer");

    if (!stored) {
      navigate("/Customer-login");
      return;
    }

    const parsed = JSON.parse(stored);
    setCustomer(parsed);

    const SESSION_TIMEOUT = 1 * 60 * 1000; // 1 minute

    // 🔥 ACTIVITY TRACKER
    const updateActivity = () => {
      const current = localStorage.getItem("customer");
      if (!current) return;

      const data = JSON.parse(current);

      localStorage.setItem(
        "customer",
        JSON.stringify({
          ...data,
          lastActivityTime: Date.now(),
        })
      );
    };

    // 👂 Listen to activity
    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("click", updateActivity);
    window.addEventListener("scroll", updateActivity);

    // ⏱ Inactivity checker
    const timer = setInterval(() => {
      const current = localStorage.getItem("customer");
      if (!current) {
        setCustomer(null);
        navigate("/Customer-login");
        return;
      }

      const data = JSON.parse(current);

      if (Date.now() - data.lastActivityTime > SESSION_TIMEOUT) {
        localStorage.removeItem("customer");
        setCustomer(null);
        navigate("/Customer-login");
      }
    }, 1000);

    // 🔥 Fetch bookings (once)
    fetch(`http://localhost:5186/api/bookings/customer/${parsed.customerId}`)
      .then((res) => res.json())
      .then((data) => setBookings(data))
      .catch(() => console.error("Failed to load bookings"));

    // 🧹 CLEANUP
    return () => {
      clearInterval(timer);
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("scroll", updateActivity);
    };
  }, [navigate]);

  // ⏳ wait until customer loads
  if (!customer) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("customer");
    navigate("/Customer-login");
  };

  return (
    <div className="dashboard">
      {/* ================= HEADER ================= */}
      <div className="dashboard-header">
        <div>
          <h2>Welcome, {customer.fullName}</h2>
          <p>
            {customer.email} | {customer.phone}
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className="btn-solid"
            onClick={() => navigate("/customer-landing")}
          >
            Home
          </button>

          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      {/* ================= BOOKINGS ================= */}
      <section className="dash-section">
        <h3>My Bookings</h3>

        {bookings.length === 0 && (
          <p className="empty-text">No bookings yet.</p>
        )}

        {bookings.map((b) => (
          <div key={b.bookingId} className="booking-card">
            <div className="booking-row">
              <strong>{b.roomTypeName}</strong>
              <span className={`status ${b.status.toLowerCase()}`}>
                {b.status}
              </span>
            </div>

            <p>
              {new Date(b.checkInDate).toLocaleDateString()} →{" "}
              {new Date(b.checkOutDate).toLocaleDateString()}
              {" | "}
              Guests: {b.guests}
            </p>
          </div>
        ))}
      </section>

      {/* ================= INVOICE ================= */}
      {/* <section className="dash-section">
        <h3>Invoice</h3>

        {bookings.length === 0 || bookings[0].status === "Pending" ? (
          <p className="info-text">
            Invoice will be generated after booking confirmation.
          </p>
        ) : (
          <div className="invoice-card">
            <p>Room Price: PKR {bookings[0].price}</p>
            <p>Nights: {bookings[0].nights}</p>
            <hr />
            <p className="total">
              Total: PKR {bookings[0].price * bookings[0].nights}
            </p>
          </div>
        )}
      </section> */}
    </div>
  );
}
