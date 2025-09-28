PRAGMA defer_foreign_keys = ON;

-- CreateTable
CREATE TABLE "user" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "last_updated_opened_calcs" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_presets" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_preset_id" INTEGER,
    CONSTRAINT "user_current_preset_id_fkey" FOREIGN KEY ("current_preset_id") REFERENCES "preset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "preset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "created_by_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "hours_work_time" INTEGER NOT NULL,
    "hours_default_from" INTEGER NOT NULL,
    "hours_default_to" INTEGER,
    "hours_precision" INTEGER NOT NULL,
    "tasks_precision" INTEGER NOT NULL,
    "easter_holiday" BOOLEAN NOT NULL,
    "ascension_holiday" BOOLEAN NOT NULL,
    "pentecost_holiday" BOOLEAN NOT NULL,
    "christmas_holiday" BOOLEAN NOT NULL,
    "saturday_holiday" BOOLEAN NOT NULL,
    "sunday_holiday" BOOLEAN NOT NULL,
    CONSTRAINT "preset_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "preset_part_tag" (
    "preset_id" INTEGER NOT NULL,
    "preset_mode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    PRIMARY KEY ("preset_id", "preset_mode", "name"),
    CONSTRAINT "preset_part_tag_preset_id_fkey" FOREIGN KEY ("preset_id") REFERENCES "preset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "preset_github_owner" (
    "preset_id" INTEGER NOT NULL,
    "owner" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "autocomplete_without_owner" BOOLEAN NOT NULL,

    PRIMARY KEY ("preset_id", "owner"),
    CONSTRAINT "preset_github_owner_preset_id_fkey" FOREIGN KEY ("preset_id") REFERENCES "preset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "preset_github_repo" (
    "preset_id" INTEGER NOT NULL,
    "owner" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "autocomplete_without_repository" BOOLEAN NOT NULL,

    PRIMARY KEY ("preset_id", "owner", "repo"),
    CONSTRAINT "preset_github_repo_preset_id_fkey" FOREIGN KEY ("preset_id") REFERENCES "preset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "preset_github_repo_preset_id_owner_fkey" FOREIGN KEY ("preset_id", "owner") REFERENCES "preset_github_owner" ("preset_id", "owner") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "preset_fixedd_holiday" (
    "preset_id" INTEGER NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,

    PRIMARY KEY ("preset_id", "from", "to"),
    CONSTRAINT "preset_fixedd_holiday_preset_id_fkey" FOREIGN KEY ("preset_id") REFERENCES "preset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "calc" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "public_id" TEXT NOT NULL COLLATE BINARY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "saved_up_time" INTEGER NOT NULL,
    "saved_up_vacation" REAL NOT NULL,
    "work_time" INTEGER NOT NULL,
    "default_from" INTEGER NOT NULL,
    "default_to" INTEGER,
    "precision" INTEGER NOT NULL,
    CONSTRAINT "calc_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "calc_tag" (
    "calc_id" INTEGER NOT NULL,
    "tag" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    PRIMARY KEY ("calc_id", "tag"),
    CONSTRAINT "calc_tag_calc_id_fkey" FOREIGN KEY ("calc_id") REFERENCES "calc" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "calc_entry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "calc_id" INTEGER NOT NULL,
    "rank" TEXT NOT NULL COLLATE BINARY,
    "name" TEXT NOT NULL,
    "from" INTEGER,
    "to" INTEGER,
    "subtracted_time" INTEGER,
    "is_tracking" BOOLEAN NOT NULL,
    "notes" TEXT,
    CONSTRAINT "calc_entry_calc_id_fkey" FOREIGN KEY ("calc_id") REFERENCES "calc" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "calc_entry_tag" (
    "calc_id" INTEGER NOT NULL,
    "tag" TEXT NOT NULL,
    "entry_id" INTEGER NOT NULL,

    PRIMARY KEY ("entry_id", "tag"),
    CONSTRAINT "calc_entry_tag_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "calc_entry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "calc_entry_tag_calc_id_tag_fkey" FOREIGN KEY ("calc_id", "tag") REFERENCES "calc_tag" ("calc_id", "tag") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "opened_calc" (
    "userId" INTEGER NOT NULL,
    "calcId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    PRIMARY KEY ("userId", "calcId"),
    CONSTRAINT "opened_calc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "opened_calc_calcId_fkey" FOREIGN KEY ("calcId") REFERENCES "calc" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "preset_created_by_id_name_key" ON "preset"("created_by_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "calc_public_id_key" ON "calc"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "calc_entry_calc_id_rank_key" ON "calc_entry"("calc_id", "rank");

PRAGMA defer_foreign_keys = OFF;