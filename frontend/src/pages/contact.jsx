import React from "react";
import { useNavigate } from "react-router-dom";
import "./contact.css"; // CSS is in the same folder

const Contact = () => {
  const navigate = useNavigate();

  return (
    <div className="contact-container">
      {/* Hero Section */}
      <div className="contact-hero">
        <h1>Contact ILA Kids Campus</h1>
        <p>We’d love to hear from you! Reach out for admissions, queries, or feedback.</p>
      </div>

      {/* Contact Form Section */}
      <div className="contact-form-section">
        <div className="contact-form-container">
          <form>
            <label>Name</label>
            <input type="text" placeholder="Your Name" required />

            <label>Email</label>
            <input type="email" placeholder="Your Email" required />

            <label>Subject</label>
            <input type="text" placeholder="Subject" required />

            <label>Message</label>
            <textarea placeholder="Write your message here..." rows="6" required></textarea>

            <button type="submit" className="submit-btn">Send Message</button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="contact-info">
          <h2>Contact Information</h2>
          <p><strong>Address:</strong> ILA Kids Campus, Teldeniya, Sri Lanka</p>
          <p><strong>Email:</strong> info@ilakidscampus.lk</p>
          <p><strong>Phone:</strong> +94 11 1234 567</p>
          <button className="back-home-btn" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Contact;
