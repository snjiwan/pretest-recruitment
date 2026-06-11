const { PrismaClient } = require("@prisma/client");
const ExcelJS = require("exceljs");
const XLSX = require("xlsx");
const fs = require("fs");

const prisma = new PrismaClient();

function formatDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function excelTimeToString(value) {
  if (!value) return "";

  if (value instanceof Date) {
    return value.toTimeString().slice(0, 8);
  }

  if (typeof value === "number") {
    const totalSeconds = Math.round(value * 24 * 60 * 60);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  return value.toString();
}

exports.getAllSchedules = async (req, res) => {
  try {
    const schedules = await prisma.schedule.findMany({
      orderBy: [
        { date: "asc" },
        { jam_ke: "asc" }
      ]
    });

    res.json({
      message: "Data jadwal berhasil diambil",
      data: schedules
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.createSchedule = async (req, res) => {
  try {
    const data = req.body;

    const bentrok = await prisma.schedule.findFirst({
      where: {
        date: new Date(data.date),
        jam_ke: Number(data.jam_ke),
        OR: [
          { class_code: data.class_code },
          { teacher_nik: data.teacher_nik }
        ]
      }
    });

    if (bentrok) {
      return res.status(400).json({
        error: "Jadwal bentrok untuk kelas atau guru di jam yang sama"
      });
    }

    const schedule = await prisma.schedule.create({
      data: {
        class_code: data.class_code,
        class_name: data.class_name,
        subject_code: data.subject_code,
        teacher_nik: data.teacher_nik,
        teacher_name: data.teacher_name,
        date: new Date(data.date),
        jam_ke: Number(data.jam_ke),
        time_start: data.time_start,
        time_end: data.time_end
      }
    });

    res.status(201).json({
      message: "Jadwal berhasil ditambahkan",
      data: schedule
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const bentrok = await prisma.schedule.findFirst({
      where: {
        id: {
          not: id
        },
        date: new Date(data.date),
        jam_ke: Number(data.jam_ke),
        OR: [
          { class_code: data.class_code },
          { teacher_nik: data.teacher_nik }
        ]
      }
    });

    if (bentrok) {
      return res.status(400).json({
        error: "Jadwal bentrok untuk kelas atau guru di jam yang sama"
      });
    }

    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        class_code: data.class_code,
        class_name: data.class_name,
        subject_code: data.subject_code,
        teacher_nik: data.teacher_nik,
        teacher_name: data.teacher_name,
        date: new Date(data.date),
        jam_ke: Number(data.jam_ke),
        time_start: data.time_start,
        time_end: data.time_end
      }
    });

    res.json({
      message: "Jadwal berhasil diupdate",
      data: schedule
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.schedule.delete({
      where: { id }
    });

    res.json({
      message: "Jadwal berhasil dihapus"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.getStudentSchedule = async (req, res) => {
  try {
    const { class_code, date } = req.query;

    if (!class_code || !date) {
      return res.status(400).json({
        error: "class_code dan date wajib diisi"
      });
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        class_code,
        date: new Date(date)
      },
      orderBy: {
        jam_ke: "asc"
      }
    });

    res.json({
      class_code,
      class_name: schedules[0]?.class_name || null,
      date,
      total_jadwal: schedules.length,
      jadwal: schedules.map((item) => ({
        jam_ke: item.jam_ke,
        subject_code: item.subject_code,
        teacher_name: item.teacher_name,
        time_start: item.time_start,
        time_end: item.time_end
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.getTeacherSchedule = async (req, res) => {
  try {
    const { teacher_nik, start_date, end_date } = req.query;

    if (!teacher_nik || !start_date || !end_date) {
      return res.status(400).json({
        error: "teacher_nik, start_date, dan end_date wajib diisi"
      });
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        teacher_nik,
        date: {
          gte: new Date(start_date),
          lte: new Date(end_date)
        }
      },
      orderBy: [
        { date: "asc" },
        { jam_ke: "asc" }
      ]
    });

    res.json({
      teacher_nik,
      teacher_name: schedules[0]?.teacher_name || null,
      periode: {
        start_date,
        end_date
      },
      total_jp: schedules.length,
      jadwal: schedules.map((item) => ({
        date: formatDate(item.date),
        class_code: item.class_code,
        class_name: item.class_name,
        subject_code: item.subject_code,
        jam_ke: item.jam_ke,
        time_start: item.time_start,
        time_end: item.time_end
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.getRekapJP = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        error: "start_date dan end_date wajib diisi"
      });
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        date: {
          gte: new Date(start_date),
          lte: new Date(end_date)
        }
      },
      orderBy: [
        { teacher_name: "asc" },
        { date: "asc" }
      ]
    });

    const grouped = {};

    schedules.forEach((item) => {
      if (!grouped[item.teacher_nik]) {
        grouped[item.teacher_nik] = {
          teacher_nik: item.teacher_nik,
          teacher_name: item.teacher_name,
          total_jp: 0,
          classes: {}
        };
      }

      grouped[item.teacher_nik].total_jp += 1;

      if (!grouped[item.teacher_nik].classes[item.class_name]) {
        grouped[item.teacher_nik].classes[item.class_name] = 0;
      }

      grouped[item.teacher_nik].classes[item.class_name] += 1;
    });

    const rekap = Object.values(grouped).map((item) => ({
      teacher_nik: item.teacher_nik,
      teacher_name: item.teacher_name,
      total_jp: item.total_jp,
      total_kelas: Object.keys(item.classes).length,
      detail_kelas: Object.entries(item.classes).map(([class_name, jumlah_jp]) => ({
        class_name,
        jumlah_jp
      }))
    }));

    res.json({
      periode: {
        start_date,
        end_date
      },
      total_pengajar: rekap.length,
      rekap
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.uploadSchedules = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "File Excel wajib diupload"
      });
    }

    const workbook = XLSX.readFile(req.file.path, {
      cellDates: true
    });

    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return res.status(400).json({
        error: "Sheet Excel tidak ditemukan"
      });
    }

    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: ""
    });

    let totalInserted = 0;
    let totalSkipped = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      const data = {
        class_code: row[0]?.toString().trim(),
        class_name: row[1]?.toString().trim(),
        subject_code: row[2]?.toString().trim(),
        teacher_nik: row[3]?.toString().trim(),
        teacher_name: row[4]?.toString().trim(),
        date: row[5],
        jam_ke: Number(row[6]),
        time_start: excelTimeToString(row[7]),
        time_end: excelTimeToString(row[8])
      };

      if (
        !data.class_code ||
        !data.class_name ||
        !data.subject_code ||
        !data.teacher_nik ||
        !data.teacher_name ||
        !data.date ||
        !data.jam_ke ||
        !data.time_start ||
        !data.time_end
      ) {
        totalSkipped++;
        continue;
      }

      const bentrok = await prisma.schedule.findFirst({
        where: {
          date: new Date(data.date),
          jam_ke: data.jam_ke,
          OR: [
            { class_code: data.class_code },
            { teacher_nik: data.teacher_nik }
          ]
        }
      });

      if (bentrok) {
        totalSkipped++;
        continue;
      }

      await prisma.schedule.create({
        data: {
          class_code: data.class_code,
          class_name: data.class_name,
          subject_code: data.subject_code,
          teacher_nik: data.teacher_nik,
          teacher_name: data.teacher_name,
          date: new Date(data.date),
          jam_ke: data.jam_ke,
          time_start: data.time_start,
          time_end: data.time_end
        }
      });

      totalInserted++;
    }

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      message: "Upload jadwal berhasil diproses",
      total_inserted: totalInserted,
      total_skipped: totalSkipped
    });
  } catch (error) {
    console.log("UPLOAD ERROR:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: error.message
    });
  }
};

exports.exportSchedules = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        error: "start_date dan end_date wajib diisi"
      });
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        date: {
          gte: new Date(start_date),
          lte: new Date(end_date)
        }
      },
      orderBy: [
        { teacher_name: "asc" },
        { date: "asc" }
      ]
    });

    const grouped = {};

    schedules.forEach((item) => {
      if (!grouped[item.teacher_nik]) {
        grouped[item.teacher_nik] = {
          teacher_nik: item.teacher_nik,
          teacher_name: item.teacher_name,
          classes: new Set(),
          weeks: [0, 0, 0, 0, 0],
          total_jp: 0
        };
      }

      const date = new Date(item.date);
      const week = Math.ceil(date.getDate() / 7);

      grouped[item.teacher_nik].classes.add(item.class_name);

      if (week >= 1 && week <= 5) {
        grouped[item.teacher_nik].weeks[week - 1] += 1;
      }

      grouped[item.teacher_nik].total_jp += 1;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rekap JP Pengajar");

    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "NIK", key: "teacher_nik", width: 20 },
      { header: "Nama Pengajar", key: "teacher_name", width: 30 },
      { header: "Kelas Yang Diajar", key: "classes", width: 35 },
      { header: "Pekan 1", key: "week1", width: 12 },
      { header: "Pekan 2", key: "week2", width: 12 },
      { header: "Pekan 3", key: "week3", width: 12 },
      { header: "Pekan 4", key: "week4", width: 12 },
      { header: "Pekan 5", key: "week5", width: 12 },
      { header: "Total JP", key: "total_jp", width: 12 }
    ];

    worksheet.getRow(1).font = {
      bold: true
    };

    Object.values(grouped).forEach((item, index) => {
      worksheet.addRow({
        no: index + 1,
        teacher_nik: item.teacher_nik,
        teacher_name: item.teacher_name,
        classes: Array.from(item.classes).join(", "),
        week1: item.weeks[0],
        week2: item.weeks[1],
        week3: item.weeks[2],
        week4: item.weeks[3],
        week5: item.weeks[4],
        total_jp: item.total_jp
      });
    });

    const fileName = `rekap_jp_${Date.now()}.xlsx`;
    const filePath = `src/uploads/${fileName}`;

    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, fileName, () => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};