import React, { useEffect, useState } from "react";
import "../csscode/CustomerLanding.css";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useLimitedDateRange } from "../components/useLimitedDateRange";

export default function CustomerLanding() {
  const { minDateStr, maxDateStr } = useLimitedDateRange({
    allowPastDays: 0,
    allowFutureDays: 10,
  });
  const [searchText, setSearchText] = useState("");
  const [guestFilter, setGuestFilter] = useState("");
  const [priceSort, setPriceSort] = useState("");

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  // const customer = JSON.parse(localStorage.getItem("customer"));
  const [customer, setCustomer] = useState(
    JSON.parse(localStorage.getItem("customer"))
  );

  const filteredRooms = roomTypes
    .filter((rt) => rt.name.toLowerCase().includes(searchText.toLowerCase()))
    .filter((rt) =>
      guestFilter ? rt.maxOccupancy >= Number(guestFilter) : true
    )
    .sort((a, b) => {
      if (priceSort === "low") return a.basePricePerNight - b.basePricePerNight;
      if (priceSort === "high")
        return b.basePricePerNight - a.basePricePerNight;
      return 0;
    });

  const openBookingModal = (room) => {
    const customer = localStorage.getItem("customer");

    if (!customer) {
      toast.info("Please login to book a room");
      navigate("/Customer-login");
      return;
    }

    setSelectedRoom(room);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRoom(null);
  };

  useEffect(() => {
    fetch("http://localhost:5186/api/RoomTypes/active")
      .then((res) => res.json())
      .then((data) => setRoomTypes(data))
      .catch((err) => console.error("Failed to load room types", err));
  }, []);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await fetch(
          "http://localhost:5186/api/jobposting/public-active"
        );

        if (!res.ok) {
          throw new Error("Failed to fetch jobs");
        }

        const data = await res.json();
        setJobs(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load job openings ❌");
        setJobs([]);
      } finally {
        setJobsLoading(false);
      }
    };

    loadJobs();
  }, []);

  useEffect(() => {
    const SESSION_TIMEOUT = 1 * 60 * 1000; // 1 minute

    // 🔁 Update activity
    const updateActivity = () => {
      const stored = localStorage.getItem("customer");
      if (!stored) return;

      const parsed = JSON.parse(stored);

      localStorage.setItem(
        "customer",
        JSON.stringify({
          ...parsed,
          lastActivityTime: Date.now(),
        })
      );
    };

    // 👂 Listen to user activity
    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("click", updateActivity);
    window.addEventListener("scroll", updateActivity);

    // ⏱ Inactivity checker
    const timer = setInterval(() => {
      const stored = localStorage.getItem("customer");
      if (!stored) {
        setCustomer(null);
        return;
      }

      const parsed = JSON.parse(stored);

      if (Date.now() - parsed.lastActivityTime > SESSION_TIMEOUT) {
        localStorage.removeItem("customer");
        setCustomer(null);
        toast.info("Session expired due to inactivity. Please login again.");
      }
    }, 1000);

    // 🧹 Cleanup
    return () => {
      clearInterval(timer);
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("scroll", updateActivity);
    };
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll(".section");

    const revealOnScroll = () => {
      sections.forEach((section) => {
        const windowHeight = window.innerHeight;
        const elementTop = section.getBoundingClientRect().top;

        if (elementTop < windowHeight - 100) {
          section.classList.add("reveal", "active");
        }
      });
    };

    window.addEventListener("scroll", revealOnScroll);
    revealOnScroll();

    return () => window.removeEventListener("scroll", revealOnScroll);
  }, []);

  const handleProceedToCheckout = (e) => {
    e.preventDefault();

    // ✅ FIRST: form reference
    const form = e.target;

    const checkIn = form.checkIn.value;
    const checkOut = form.checkOut.value;
    const guests = form.guests.value;

    // 🔐 login check
    if (!customer) {
      toast.error("Please login first");
      return;
    }

    // ❌ empty date guard
    if (!checkIn || !checkOut) {
      toast.error("Please select both check-in and check-out dates");
      return;
    }

    // ❌ BUSINESS RULE: checkout must be after checkin
    if (new Date(checkOut) <= new Date(checkIn)) {
      toast.error("Check-out date must be after check-in date");
      return;
    }

    // ✅ build checkout payload
    const checkoutData = {
      customerId: customer.customerId,

      room: {
        roomTypeId: selectedRoom.roomTypeId,
        name: selectedRoom.name,
        pricePerNight: selectedRoom.basePricePerNight,
        maxOccupancy: selectedRoom.maxOccupancy,
        image: selectedRoom.imagePaths
          ? `http://localhost:5186${selectedRoom.imagePaths}`
          : "/data/placeholder-room.jpg",
      },

      booking: {
        checkIn,
        checkOut,
        guests,
      },
    };

    // 🚀 proceed to checkout
    navigate("/checkout", { state: checkoutData });
  };

  return (
    <div className="site">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">StayElite</div>

        <ul>
          <li>
            <a href="#home">Home</a>
          </li>
          <li>
            <a href="#rooms">Rooms</a>
          </li>
          <li>
            <a href="#amenities">Amenities</a>
          </li>
          <li>
            <a href="#about">About Us</a>
          </li>
          <li>
            <a href="#contact">Contact</a>
          </li>
          <li>
            <a href="#careers">Careers</a>
          </li>
        </ul>
        <div className="nav-buttons">
          {!customer ? (
            <>
              <Link to="/Customer-signup">
                <button className="btn-outline">Sign Up</button>
              </Link>

              <Link to="/Customer-login">
                <button className="btn-outline">Login</button>
              </Link>

              <Link to="/login">
                <button className="btn-outline">Admin Login</button>
              </Link>
            </>
          ) : (
            <div className="user-nav">
              <span className="user-name">Hi, {customer.fullName}</span>
              <button
                className="btn-solid"
                onClick={() => navigate("/customer-dashboard")}
              >
                My Rooms
              </button>
              <button
                className="btn-outline"
                onClick={() => {
                  localStorage.removeItem("customer");
                  setCustomer(null);
                  navigate("/Customer-login");
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section id="home" className="hero hero-video">
        {/* Background Video */}
        <video className="hero-bg-video" autoPlay loop muted playsInline>
          <source src="/data/roomvideo.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Dark Overlay */}
        <div className="hero-overlay"></div>

        {/* Content */}
        <div className="hero-content">
          <span className="hero-eyebrow">DISCOVER PREMIUM STAYS</span>

          <h1>
            Find Your Perfect <span>Stay</span>
          </h1>

          <p>
            Experience elegant rooms, professional service, and effortless
            booking — designed for comfort-focused travelers.
          </p>

          <div className="hero-actions">
            <button className="btn-solid" onClick={() => navigate("#rooms")}>
              Explore Rooms
            </button>
            <button
              className="btn-outline"
              onClick={() => navigate("/Customer-login")}
            >
              Book Now
            </button>
          </div>
        </div>
      </section>

      {/* ROOMS */}
      <section id="rooms" className="section">
        <div className="rooms-header">
          <h2>Our Rooms</h2>
          <p className="section-desc">
            Thoughtfully designed spaces combining modern interiors, premium
            bedding, and essential amenities.
          </p>
        </div>

        {/* 🔍 SEARCH + FILTER BAR */}
        <div className="rooms-filter premium-filter">
          <input
            type="text"
            placeholder="Search room type..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="filter-input"
          />

          <select
            className="filter-select"
            value={guestFilter}
            onChange={(e) => setGuestFilter(e.target.value)}
          >
            <option value="">Guests</option>
            <option value="1">1 Guest</option>
            <option value="2">2 Guests</option>
            <option value="3">3+ Guests</option>
          </select>

          <select
            className="filter-select"
            value={priceSort}
            onChange={(e) => setPriceSort(e.target.value)}
          >
            <option value="">Sort by price</option>
            <option value="low">Low → High</option>
            <option value="high">High → Low</option>
          </select>
        </div>
        {searchText && (
          <p className="search-feedback">
            Showing results for "<strong>{searchText}</strong>"
          </p>
        )}

        <div className="room-row">
          {filteredRooms.length === 0 && (
            <div className="rooms-empty">
              <h4>No rooms found</h4>
              <p>
                We couldn’t find any rooms matching your search. Try adjusting
                your filters or browse all available rooms.
              </p>

              <button
                className="btn-clear"
                onClick={() => {
                  setSearchText("");
                  setGuestFilter("");
                  setPriceSort("");
                }}
              >
                Clear filters
              </button>
            </div>
          )}

          {roomTypes.length === 0 && <p>No rooms available at the moment.</p>}

          {filteredRooms.map((rt) => (
            <div key={rt.roomTypeId} className="room-card">
              <div className="room-img">
                <img
                  src={
                    rt.imagePaths
                      ? `http://localhost:5186${rt.imagePaths}`
                      : "/data/placeholder-room.jpg"
                  }
                  alt={rt.name}
                />
              </div>

              <div className="room-body">
                <h3>{rt.name}</h3>

                <p className="room-desc">
                  {rt.description ||
                    "Comfortable room designed for a relaxing stay."}
                </p>

                <div className="room-meta">
                  <span>👤 Up to {rt.maxOccupancy} guests</span>
                </div>

                <div className="room-footer">
                  <span className="price">
                    PKR {rt.basePricePerNight}
                    <small>/night</small>
                  </span>

                  <button
                    className="btn-book"
                    onClick={() => openBookingModal(rt)}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section why-section">
        <h2>Why Choose StayElite</h2>
        <p className="section-desc">
          Because your comfort, safety, and peace of mind matter to us.
        </p>

        <div className="why-grid">
          <div className="why-card">
            💎<h4>Premium Comfort</h4>
            <p>
              Thoughtfully designed rooms with quality bedding and calm
              interiors.
            </p>
          </div>
          <div className="why-card">
            🔒<h4>Safe & Secure</h4>
            <p>24/7 monitoring, controlled access, and secure premises.</p>
          </div>
          <div className="why-card">
            📍<h4>Prime Location</h4>
            <p>Easy access to Islamabad’s key business & leisure areas.</p>
          </div>
          <div className="why-card">
            💰<h4>Transparent Pricing</h4>
            <p>No hidden charges — what you see is what you pay.</p>
          </div>
          <div className="why-card">
            🧑‍💼<h4>Professional Staff</h4>
            <p>Trained staff ensuring smooth and respectful service.</p>
          </div>
          <div className="why-card">
            ⚡<h4>Easy Booking</h4>
            <p>Fast online booking with instant confirmation.</p>
          </div>
        </div>
      </section>

      <section className="section light">
        <h2>What Our Guests Say</h2>

        <div className="review-grid">
          <div className="review-card">
            ⭐⭐⭐⭐⭐<p>“Extremely clean and peaceful. Felt like home.”</p>
            <strong>— Ahmed, Lahore</strong>
          </div>
          <div className="review-card">
            ⭐⭐⭐⭐⭐<p>“Professional staff and smooth booking experience.”</p>
            <strong>— Sarah, Islamabad</strong>
          </div>
          <div className="review-card">
            ⭐⭐⭐⭐⭐<p>“Perfect for business trips. Highly recommended.”</p>
            <strong>— Ali, Karachi</strong>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Hotel Policies</h2>

        <div className="policy-grid">
          <div>
            ⏰ <strong>Check-in:</strong> 2:00 PM
          </div>
          <div>
            ⏰ <strong>Check-out:</strong> 12:00 PM
          </div>
          <div>
            🪪 <strong>ID Required:</strong> CNIC / Passport
          </div>
          <div>
            🚭 <strong>Smoking:</strong> Non-smoking rooms
          </div>
          <div>
            💳 <strong>Payments:</strong> Cash & Online
          </div>
          <div>
            ❌ <strong>No Hidden Charges</strong>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready for a Comfortable Stay?</h2>
        <p>Book your room today and experience premium hospitality.</p>
        <button
          className="btn-solid"
          onClick={() => navigate("/Customer-login")}
        >
          Book Now
        </button>
      </section>

      <section className="section light">
        <h2>Location & Nearby</h2>

        <div className="location-grid">
          <div>🏢 Business District – 10 mins</div>
          <div>🛍 Shopping Mall – 8 mins</div>
          <div>🏞 Margalla Hills – 20 mins</div>
          <div>✈ Islamabad Airport – 35 mins</div>
        </div>
      </section>

      <section className="section">
        <h2>Frequently Asked Questions</h2>

        <div className="faq">
          <p>
            <strong>❓ Is breakfast included?</strong>
            <br />
            Yes, selected rooms include breakfast.
          </p>
          <p>
            <strong>❓ Can I cancel my booking?</strong>
            <br />
            Yes, cancellation policy applies.
          </p>
          <p>
            <strong>❓ Is parking free?</strong>
            <br />
            Yes, free on-site parking available.
          </p>
        </div>
      </section>

      {/* AMENITIES */}
      <section id="amenities" className="section light amenities-section">
        <h2>Hotel Amenities</h2>
        <p className="section-desc">
          Everything you need for a smooth, comfortable, and worry-free stay —
          thoughtfully provided for your convenience.
        </p>

        {/* CORE AMENITIES */}
        <h3 className="amenities-title">Comfort & Convenience</h3>
        <div className="amenities-grid">
          <div className="amenity-card">
            🛏
            <h4>Luxury Bedding</h4>
            <p>
              Premium mattresses, soft pillows, and fresh linens to ensure deep,
              uninterrupted sleep.
            </p>
          </div>

          <div className="amenity-card">
            ❄<h4>Climate Control</h4>
            <p>
              Individually controlled air conditioning for personalized comfort
              in every season.
            </p>
          </div>

          <div className="amenity-card">
            📶
            <h4>High-Speed Wi-Fi</h4>
            <p>
              Seamless internet access for work, streaming, and staying
              connected anytime.
            </p>
          </div>

          <div className="amenity-card">
            🧼
            <h4>Daily Housekeeping</h4>
            <p>
              Spotless rooms cleaned daily with high hygiene and quality
              standards.
            </p>
          </div>
        </div>

        {/* SERVICES */}
        <h3 className="amenities-title">Guest Services</h3>
        <div className="amenities-grid">
          <div className="amenity-card">
            🍽
            <h4>Room Service</h4>
            <p>
              Enjoy delicious meals and refreshments delivered straight to your
              room.
            </p>
          </div>

          <div className="amenity-card">
            🧳
            <h4>Luggage Assistance</h4>
            <p>
              Hassle-free luggage handling for a smooth check-in and check-out
              experience.
            </p>
          </div>

          <div className="amenity-card">
            🕒
            <h4>24/7 Front Desk</h4>
            <p>
              Our staff is always available to assist you with any request,
              anytime.
            </p>
          </div>

          <div className="amenity-card">
            🧾
            <h4>Easy Billing</h4>
            <p>
              Transparent pricing with clear invoices — no hidden charges, ever.
            </p>
          </div>
        </div>

        {/* SAFETY & BUSINESS */}
        <h3 className="amenities-title">Safety & Business Friendly</h3>
        <div className="amenities-grid">
          <div className="amenity-card">
            🔒
            <h4>Secure Environment</h4>
            <p>
              CCTV surveillance and controlled access to ensure guest safety at
              all times.
            </p>
          </div>

          <div className="amenity-card">
            🚗
            <h4>Free Parking</h4>
            <p>Spacious and secure on-site parking for your convenience.</p>
          </div>

          <div className="amenity-card">
            💼
            <h4>Business Friendly</h4>
            <p>
              Ideal setup for business travelers requiring comfort, focus, and
              reliability.
            </p>
          </div>

          <div className="amenity-card">
            ☕<h4>Tea & Coffee Setup</h4>
            <p>
              In-room tea and coffee facilities for a refreshing start or
              relaxing evening.
            </p>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="section about-section">
        <h2>About StayElite</h2>
        <p className="section-desc">
          A place where thoughtful design, warm hospitality, and modern comfort
          come together to create memorable stays.
        </p>

        <div className="about-grid">
          {/* LEFT CONTENT */}
          <div className="about-text">
            <p className="about-lead">
              At <strong>StayElite</strong>, we believe a hotel should feel more
              than just a place to sleep — it should feel safe, peaceful, and
              welcoming.
            </p>

            <p>
              Every element of StayElite is designed with one goal in mind:
              <strong> effortless comfort</strong>. From spotless rooms and calm
              interiors to transparent pricing and smooth booking, we remove
              stress from your journey so you can focus on what truly matters.
            </p>

            <p>
              Whether you’re a business traveler, a family on vacation, or
              someone visiting Islamabad for a short stay — we offer a refined
              environment that feels professional yet personal.
            </p>

            <div className="about-icons">
              <div className="about-icon">
                🏨
                <span>Professionally Managed Hotel</span>
              </div>
              <div className="about-icon">
                🧼
                <span>High Cleanliness Standards</span>
              </div>
              <div className="about-icon">
                🔒
                <span>Safe & Secure Environment</span>
              </div>
              <div className="about-icon">
                💼
                <span>Ideal for Business Travelers</span>
              </div>
            </div>
          </div>

          {/* RIGHT HIGHLIGHTS */}
          <div className="about-cards">
            <div className="about-card">
              ⭐<h4>Our Vision</h4>
              <p>
                To redefine hotel stays by offering reliable comfort, honest
                service, and a peaceful atmosphere for every guest.
              </p>
            </div>

            <div className="about-card">
              🤝
              <h4>Our Values</h4>
              <p>
                Transparency, cleanliness, respect, and guest satisfaction are
                the foundation of everything we do.
              </p>
            </div>

            <div className="about-card">
              🌍
              <h4>Our Promise</h4>
              <p>
                No surprises. No compromises. Just a smooth, relaxing, and
                memorable stay — every time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}

      <section id="contact" className="section light contact-section">
        <h2>Contact Us</h2>
        <p className="section-desc">
          We’re always happy to assist you — before, during, or after your stay.
        </p>

        <div className="contact-grid">
          <div className="contact-card">
            <h4>📧 Email</h4>
            <p>info@stayelite.com</p>
            <span>For bookings & general inquiries</span>
          </div>

          <div className="contact-card">
            <h4>📞 Phone</h4>
            <p>+92 300 1234567</p>
            <span>Available 24/7 for support</span>
          </div>

          <div className="contact-card">
            <h4>📍 Location</h4>
            <p>Islamabad, Pakistan</p>
            <span>Prime & easily accessible area</span>
          </div>
        </div>
      </section>

      <section id="careers" className="section light">
        <h2>Careers at StayElite</h2>
        <p className="section-desc">
          Join our professional hospitality team. Apply online in seconds.
        </p>

        <form
          className="career-form"
          onSubmit={async (e) => {
            e.preventDefault();

            const fd = new FormData(e.target);

            try {
              const res = await fetch(
                "http://localhost:5186/api/public-hiring/apply",
                {
                  method: "POST",
                  body: fd,
                }
              );

              const data = await res.json();

              if (!res.ok) {
                toast.error(data.message || "Failed to submit application ❌");
                return;
              }

              toast.success("Application submitted successfully ✅");
              e.target.reset();
            } catch {
              toast.error("Failed to submit application ❌");
            }
          }}
        >
          <select name="JobPostingID" required disabled={jobsLoading}>
            {jobsLoading && <option>Loading jobs...</option>}

            {!jobsLoading && jobs.length === 0 && (
              <option disabled>No openings available</option>
            )}

            {!jobsLoading &&
              jobs.map((job) => (
                <option key={job.jobPostingID} value={job.jobPostingID}>
                  {job.designation} – {job.department}
                  {job.numberOfPositions
                    ? ` (${job.numberOfPositions} position)`
                    : ""}
                </option>
              ))}
          </select>

          <input
            type="text"
            name="CandidateName"
            placeholder="Full Name"
            required
          />

          <input
            type="text"
            name="CandidateContact"
            placeholder="Contact (11 digits)"
            maxLength="11"
            required
          />

          <input
            type="email"
            name="CandidateEmail"
            placeholder="Email Address"
            required
          />

          <textarea name="Remarks" placeholder="Short introduction" rows="3" />

          <input type="file" name="cvFile" accept="application/pdf" required />

          <button
            className="btn-solid"
            disabled={jobsLoading || jobs.length === 0}
          >
            {jobsLoading || jobs.length === 0 ? "No Openings" : "Apply Now"}
          </button>
        </form>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-content">
          <h3>StayElite</h3>
          <p className="footer-tagline">
            Luxury stays · Trusted comfort · Exceptional service
          </p>

          <div className="footer-links">
            <a href="#home">Home</a>
            <a href="#rooms">Rooms</a>
            <a href="#amenities">Amenities</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </div>

          <p className="footer-copy">
            © {new Date().getFullYear()} StayElite Hotel. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ================= MODAL ================= */}
      {showModal && selectedRoom && (
        <div className="booking-modal-overlay">
          <div className="booking-modal-card">
            <button
              type="button"
              className="booking-modal-close"
              onClick={closeModal}
            >
              ×
            </button>

            <h2 className="booking-modal-title">Confirm Booking</h2>

            <p className="booking-modal-room">
              <strong>{selectedRoom.name}</strong>
              <br />
              PKR {selectedRoom.basePricePerNight} / night
            </p>

            <form onSubmit={handleProceedToCheckout}>
              {/* CHECK-IN */}
              <div className="booking-field">
                <label>Check-in Date</label>
                <input
                  type="date"
                  name="checkIn"
                  required
                  min={minDateStr}
                  max={maxDateStr}
                />
              </div>

              {/* CHECK-OUT */}
              <div className="booking-field">
                <label>Check-out Date</label>
                <input
                  type="date"
                  name="checkOut"
                  required
                  min={minDateStr}
                  max={maxDateStr}
                />
              </div>

              {/* GUESTS */}
              <div className="booking-field">
                <label>Guests</label>
                <input
                  type="number"
                  name="guests"
                  min="1"
                  max={selectedRoom.maxOccupancy}
                  defaultValue="1"
                  required
                />
              </div>

              <button className="booking-confirm-btn">
                Proceed to Checkout
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
