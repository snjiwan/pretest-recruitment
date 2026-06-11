const express = require("express");
const multer = require("multer");
const apiKeyMiddleware = require("../middleware/apiKey");
const controller = require("../controllers/schedule.controller");

const router = express.Router();

const upload = multer({
  dest: "src/uploads/"
});

router.use(apiKeyMiddleware);

router.get("/", controller.getAllSchedules);
router.post("/", controller.createSchedule);
router.put("/:id", controller.updateSchedule);
router.delete("/:id", controller.deleteSchedule);

router.post("/upload", upload.single("file"), controller.uploadSchedules);
router.get("/export", controller.exportSchedules);

router.get("/student", controller.getStudentSchedule);
router.get("/teacher", controller.getTeacherSchedule);
router.get("/report/rekap-jp", controller.getRekapJP);

module.exports = router;