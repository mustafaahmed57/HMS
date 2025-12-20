import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../csscode/CustomerCheckout.css";
import { toast } from "react-toastify";

export default function Checkout() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // ✅ ALL HOOKS AT TOP (NO CONDITIONS)
  const loggedCustomer = JSON.parse(localStorage.getItem("customer"));

  const [guest, setGuest] = useState({
    fullName: loggedCustomer?.fullName || "",
    email: loggedCustomer?.email || "",
    phone: loggedCustomer?.phone || "",
    request: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔐 Auth + data protection
  useEffect(() => {
    const customer = localStorage.getItem("customer");
    if (!customer || !state) {
      navigate("/Customer-login");
    }
  }, [navigate, state]);

  // ⛔ SAFE EARLY RETURN (after hooks)
  if (!state) return null;

  const { customerId, room, booking } = state;

  // 🧮 Date calculations
  const checkInDate = new Date(booking.checkIn);
  const checkOutDate = new Date(booking.checkOut);

  const nights = Math.max(
    1,
    Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))
  );

  const roomTotal = room.pricePerNight * nights;
  const tax = Math.round(roomTotal * 0);
  const grandTotal = roomTotal + tax;

  const handleChange = (e) => {
    setGuest({ ...guest, [e.target.name]: e.target.value });
  };

  // ✅ FINAL BOOKING API
  const handleConfirmBooking = async () => {
    if (!guest.fullName || !guest.email || !guest.phone) {
      toast.error("Please fill all guest details");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select payment method");
      return;
    }

    if (!agree) {
      toast.error("Please accept hotel policies");
      return;
    }

    const payload = {
      customerId,
      roomTypeId: room.roomTypeId,
      checkInDate: booking.checkIn,
      checkOutDate: booking.checkOut,
      guests: booking.guests,
      pricePerNight: room.pricePerNight,
      nights,
      totalAmount: grandTotal,
      paymentMethod,
      guestName: guest.fullName,
      guestEmail: guest.email,
      guestPhone: guest.phone,
      specialRequest: guest.request,
    };

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5186/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Booking failed");
        return;
      }

      toast.success("Booking confirmed 🎉");
      navigate("/customer-dashboard", {
        state: { bookingId: data.bookingId },
      });
    } catch {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <h2 className="checkout-title">Checkout details</h2>

      <div className="checkout-grid">
        {/* LEFT */}
        <div>
          <div className="card">
            <h3>Booking Summary</h3>

            <div className="summary-room">
              <img src={room.image} alt={room.name} />
              <div>
                <h4>{room.name}</h4>
                <p>Guests: {booking.guests}</p>
                <p>
                  {checkInDate.toLocaleDateString()} →{" "}
                  {checkOutDate.toLocaleDateString()}
                </p>
                <p>Nights: {nights}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Guest Information</h3>
            <p className="guest-note">
              ℹ️ These details are pre-filled from your account. You may edit
              them if needed.
            </p>

            <input
              name="fullName"
              value={guest.fullName}
              placeholder="Full Name"
              onChange={handleChange}
            />
            <input
              name="email"
              type="email"
              value={guest.email}
              placeholder="Email"
              onChange={handleChange}
            />
            <input name="phone" placeholder="Phone" onChange={handleChange} />
            <textarea
              name="request"
              value={guest.phone}
              placeholder="Special requests"
              onChange={handleChange}
            />
          </div>

          <div className="checkout-payment">
            <h3 className="checkout-payment-title">Payment Method</h3>

            <label className="checkout-payment-option">
              <input
                type="radio"
                name="pay"
                onChange={() => setPaymentMethod("Card")}
              />
              <span>Credit / Debit Card</span>
            </label>

            <label className="checkout-payment-option">
              <input
                type="radio"
                name="pay"
                onChange={() => setPaymentMethod("EasyPaisa")}
              />
              <span>EasyPaisa / JazzCash</span>
            </label>

            <label className="checkout-payment-option">
              <input
                type="radio"
                name="pay"
                onChange={() => setPaymentMethod("PayAtHotel")}
              />
              <span>Pay at Hotel</span>
            </label>

            <label className="checkout-payment-policy">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span>I agree to hotel policies</span>
            </label>
          </div>
        </div>

        {/* RIGHT */}
        <div className="card sticky">
          <h3>Price Details</h3>

          <div className="price-row">
            <span>
              {room.pricePerNight} × {nights} nights
            </span>
            <span>PKR {roomTotal}</span>
          </div>

          <div className="price-row">
            <span>Tax (0%)</span>
            <span>PKR {tax}</span>
          </div>

          <hr />

          <div className="price-row total">
            <span>Total</span>
            <span>PKR {grandTotal}</span>
          </div>

          <button
            className="btn-soliddd"
            onClick={handleConfirmBooking}
            disabled={loading}
          >
            {loading ? "Processing..." : "Confirm & Pay"}
          </button>

          <div className="checkout-info-box">
            <p>
              🔒 Your booking is protected with secure processing. Please review
              your stay details carefully before confirming.
            </p>

            <p>
              🏨 Check-in starts from <strong>2:00 PM</strong> and check-out is
              before
              <strong> 12:00 PM</strong>.
            </p>

            <p>
              📩 A confirmation message will be sent to your registered email
              and phone number after successful booking.
            </p>

            <p>
              ℹ️ For any assistance, our front desk team is available 24/7 to
              help you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
