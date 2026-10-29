-- DropTable
DROP TABLE "preset_part_tag";

-- CreateTable
CREATE TABLE "shared_tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "public_id" TEXT NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    CONSTRAINT "shared_tag_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "shared_tag_public_id_key" ON "shared_tag"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "shared_tag_created_by_id_name_key" ON "shared_tag"("created_by_id", "name");

-- AlterTable
ALTER TABLE "calc_tag" ADD COLUMN "shared_tag_id" INTEGER REFERENCES "shared_tag" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "calc_tag_shared_tag_id_idx" ON "calc_tag"("shared_tag_id");
