import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../csscode/CustomerAuth.css";
import { toast } from "react-toastify";

export default function CustomerBooking() {
  const { roomTypeId } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [booking, setBooking] = useState({
    checkIn: "",
    checkOut: "",
    guests: 1
  });

  useEffect(() => {
    // 🔐 Login check
    const customer = localStorage.getItem("customer");
    if (!customer) {
      toast.info("Please login to continue");
      navigate("/Customer-login");
      return;
    }

    // 🏨 Fetch selected room type
    fetch(`http://localhost:5186/api/RoomTypes/${roomTypeId}`)
      .then(res => res.json())
      .then(data => setRoom(data))
      .catch(() => toast.error("Failed to load room"));
  }, [roomTypeId, navigate]);

  const handleChange = (e) => {
    setBooking({ ...booking, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!booking.checkIn || !booking.checkOut) {
      toast.error("Please select dates");
      return;
    }

    toast.success("Booking confirmed (demo)");
    // 🔜 Next: save booking to DB
  };

  if (!room) return null;

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Book Your Stay</h2>

        <p className="auth-subtitle">
          <strong>{room.name}</strong><br />
          PKR {room.basePricePerNight} per night
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="date"
            name="checkIn"
            onChange={handleChange}
            required
          />

          <input
            type="date"
            name="checkOut"
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="guests"
            min="1"
            max={room.maxOccupancy}
            value={booking.guests}
            onChange={handleChange}
            required
          />

          <button className="auth-btn">
            Confirm Booking
          </button>
        </form>
      </div>
    </div>
  );
}
