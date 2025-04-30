const axios = require('axios');

// CONFIGURATION
const INFLUX_URL = 'http://localhost:8086/api/v2/write?bucket=my-bucket&org=my-org&precision=s';
const INFLUX_TOKEN = 'your-influx-token-here';
const JSON_URL = 'https://api.example.com/data.json'; // Replace with real URL

async function importData() {
  try {
    const response = await axios.get(JSON_URL);
    const data = response.data;

    // Transform JSON into InfluxDB line protocol
    const timestamp = Math.floor(Date.now() / 1000);
    const line = `metrics cpu=${data.cpu},memory=${data.memory} ${timestamp}`;

    await axios.post(INFLUX_URL, line, {
      headers: {
        'Authorization': `Token ${INFLUX_TOKEN}`,
        'Content-Type': 'text/plain'
      }
    });

    console.log("✅ Data pushed to InfluxDB");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

importData();
