const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const scheduleRoutes = require("./routes/schedule.routes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "REST API Jadwal Pelajaran Sekolah - Pretest Recruitment"
  });
});

app.use("/api/schedules", scheduleRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});