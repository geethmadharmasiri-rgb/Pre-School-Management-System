require("dotenv").config();
const jwt = require("jsonwebtoken");

const API_URL = "http://127.0.0.1:5000";
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key"; // fallback if env missing

// Create dummy admin token
const token = jwt.sign(
    { id: 1, role: "ADMIN", email: "admin@example.com", name: "Admin" },
    JWT_SECRET,
    { expiresIn: "1h" }
);

async function testEndpoint(endpoint) {
    console.log(`\n🔍 Testing ${endpoint}...`);
    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        if (res.ok) {
            const data = await res.json();
            console.log("✅ Success. Data length:", Array.isArray(data) ? data.length : "Object");
        } else {
            console.log("❌ Failed.");
            const text = await res.text();
            console.log("Response Body:", text);
        }
    } catch (err) {
        console.error("❌ Network Error:", err.message);
    }
}

(async () => {
    console.log("🔑 Generated Test Admin Token:", token);
    await testEndpoint("/api/admin/academic-years");
    await testEndpoint("/api/admin/classes");
})();
