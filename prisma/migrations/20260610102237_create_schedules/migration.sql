-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "class_code" VARCHAR(10) NOT NULL,
    "class_name" VARCHAR(10) NOT NULL,
    "subject_code" VARCHAR(10) NOT NULL,
    "teacher_nik" VARCHAR(20) NOT NULL,
    "teacher_name" VARCHAR(100) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "jam_ke" INTEGER NOT NULL,
    "time_start" TEXT NOT NULL,
    "time_end" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);
