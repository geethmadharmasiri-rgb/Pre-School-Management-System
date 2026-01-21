import "./home.css";
import { useNavigate } from "react-router-dom";
import homeBanner from "../assets/images/home-banner.jpg";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className="navbar">
        <h2 className="logo">ILA KIDS CAMPUS</h2>

        <div className="nav-links">
         <span onClick={() => navigate("/programs")}>Our Programs</span>
         <span onClick={() => navigate("/about")}>About Us</span>
         <span onClick={() => navigate("/contact")}>Contact</span>

          <button
            className="enroll-btn"
            onClick={() => navigate("/login")}
          >
            Enroll Now
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-container">
        <img src={homeBanner} alt="Home Banner" className="hero-image" />

        <div className="hero-content">
          <h1>Nurturing Young Minds for a Bright Future</h1>
          <p>
            At ILA Kids Campus, we provide a safe and stimulating
            environment where children can learn, grow, and thrive
            through play-based and holistic education.
          </p>
          <button className="learn-btn">Learn More</button>
        </div>
      </div>

      {/* Key Aspects Section */}
      <div className="key-section">
        <h2>Key Aspects of Our Campus</h2>
        <p className="key-desc">
          ILA Kids Campus offers a comprehensive approach to early
          childhood education, focusing on holistic development and
          preparing children for future success.
        </p>

        <div className="card-container">
          <div className="card">
            <h3>Our Programs</h3>
            <p>
              Explore our diverse range of programs designed to foster
              creativity, critical thinking, and social skills.
            </p>
          </div>

          <div className="card">
            <h3>About Us</h3>
            <p>
              Discover our mission, values, and the dedicated team
              committed to providing exceptional early childhood
              education.
            </p>
          </div>

          <div className="card">
            <h3>Contact</h3>
            <p>
              Get in touch with us to schedule a visit, ask questions,
              or begin the enrollment process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
