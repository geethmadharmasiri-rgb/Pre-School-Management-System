import React from "react";
import "./programs.css";
import playtimeImg from "../assets/images/playtime.jpg";
import learningImg from "../assets/images/learning.jpg";

function Programs() {
  return (
    <div className="programs-page">
      <header className="programs-header">
        <h1>Our Programs</h1>
        <p>Providing holistic learning experiences for children aged 3-5</p>
      </header>

      <div className="programs-container">
        <div className="program-card">
          <img src={playtimeImg} alt="Playtime Activities" />
          <h2>Play-Based Learning</h2>
          <p>
            Engaging activities designed to stimulate curiosity, creativity, and
            social skills through play and interactive exercises.
          </p>
        </div>

        <div className="program-card">
          <img src={learningImg} alt="Montessori Activities" />
          <h2>Montessori Curriculum</h2>
          <p>
            Structured Montessori approach for intellectual and emotional development,
            nurturing independence and problem-solving skills.
          </p>
        </div>

        <div className="program-card">
          <img src={playtimeImg} alt="Physical Development" />
          <h2>Physical Development</h2>
          <p>
            Activities that enhance fine and gross motor skills through fun exercises,
            sports, and movement games.
          </p>
        </div>

        <div className="program-card">
          <img src={learningImg} alt="Creative Arts" />
          <h2>Creative Arts</h2>
          <p>
            Music, drawing, storytelling, and drama sessions to foster imagination
            and self-expression.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Programs;
