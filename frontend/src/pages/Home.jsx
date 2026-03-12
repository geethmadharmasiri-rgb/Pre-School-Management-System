import "./home.css";
import { useNavigate } from "react-router-dom";
import homeBanner from "../assets/images/home-banner.png";
import learning from "../assets/images/learning.jpg";
import playtime from "../assets/images/playtime.jpg";
import parent from "../assets/images/parent.jpg";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Enhanced Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <h2 className="logo">🎓 ILA KIDS CAMPUS</h2>
          <div className="nav-links">
            <span onClick={() => navigate("/programs")}>Our Programs</span>
            <span onClick={() => navigate("/about")}>About Us</span>
            <span onClick={() => navigate("/contact")}>Contact</span>
            <button className="nav-login-btn" onClick={() => navigate("/parent-login")}>
              Parent Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-container">
        <div className="hero-overlay"></div>
        <img src={homeBanner} alt="Happy Children" className="hero-image" />

        <div className="hero-content">
          <h1 className="hero-title">Nurturing Young Minds for a Bright Future</h1>
          <p className="hero-subtitle">
            At ILA Kids Campus, we provide a safe and stimulating environment
            where children can learn, grow, and thrive through play-based learning.
          </p>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="why-section">
        <h2 className="section-title">Why Choose ILA Kids Campus?</h2>
        <p className="section-subtitle">
          We believe every child deserves the best start in life. Our comprehensive approach
          focuses on holistic development and preparing children for future success.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-image-wrapper">
              <img src={learning} alt="Interactive Learning" className="feature-image" />
            </div>
            <h3>Interactive Learning</h3>
            <p>
              Engaging curriculum designed to foster creativity, critical thinking,
              and a lifelong love of learning through hands-on activities.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-image-wrapper">
              <img src={playtime} alt="Safe Environment" className="feature-image" />
            </div>
            <h3>Safe & Nurturing</h3>
            <p>
              State-of-the-art facilities with trained staff ensuring a secure,
              caring environment where every child feels valued and protected.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-image-wrapper">
              <img src={parent} alt="Parent Partnership" className="feature-image" />
            </div>
            <h3>Parent Partnership</h3>
            <p>
              Real-time updates and transparent communication keeping you connected
              to your child's daily activities and developmental milestones.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-number">500+</div>
            <div className="stat-label">Happy Children</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">50+</div>
            <div className="stat-label">Expert Teachers</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">15+</div>
            <div className="stat-label">Years Experience</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">98%</div>
            <div className="stat-label">Parent Satisfaction</div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <h2>Ready to Join Our Family?</h2>
        <p>Schedule a visit to see our campus and meet our dedicated team.</p>
        <button className="cta-button" onClick={() => navigate("/contact")}>
          Get in Touch
        </button>
      </div>

      {/* Enhanced Footer */}
      <footer className="home-footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-col">
              <h3>ILA Kids Campus</h3>
              <p>Empowering young minds since 2010</p>
              <div className="footer-social">
                <span>📧 info@ilakids.edu</span>
                <span>📞 +94 77 123 4567</span>
              </div>
            </div>

            <div className="footer-col">
              <h4>Quick Links</h4>
              <ul>
                <li onClick={() => navigate("/programs")}>Our Programs</li>
                <li onClick={() => navigate("/about")}>About Us</li>
                <li onClick={() => navigate("/contact")}>Contact</li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Portal Access</h4>
              <ul>
                <li onClick={() => navigate("/teacher-login")}>Teacher Login</li>
                <li onClick={() => navigate("/admin-login")}>Admin Login</li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2026 ILA Kids Campus. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
