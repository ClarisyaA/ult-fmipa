CREATE TABLE IF NOT EXISTS `ult_home_activity_images` (
  `ID` BIGINT NOT NULL AUTO_INCREMENT,
  `ACTIVITY_ID` BIGINT NOT NULL,
  `IMAGE_PATH` VARCHAR(500) NULL,
  `IMAGE_ORIGINAL_NAME` VARCHAR(255) NULL,
  `IMAGE_STORED_NAME` VARCHAR(255) NULL,
  `IMAGE_MIME_TYPE` VARCHAR(100) NULL,
  `IMAGE_SIZE_BYTES` INT NULL,
  `IMAGE_ALT` VARCHAR(150) NULL,
  `IMAGE_FIT` VARCHAR(20) NOT NULL DEFAULT 'cover',
  `IS_COVER` TINYINT(1) NOT NULL DEFAULT 0,
  `SORT_ORDER` INT NOT NULL DEFAULT 0,
  `CREATED_AT` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `UPDATED_AT` DATETIME(3) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  `CREATED_BY` VARCHAR(100) NULL,
  `UPDATED_BY` VARCHAR(100) NULL,
  PRIMARY KEY (`ID`),
  INDEX `idx_ult_home_activity_images_activity` (`ACTIVITY_ID`),
  INDEX `idx_ult_home_activity_images_cover` (`ACTIVITY_ID`, `IS_COVER`),
  INDEX `idx_ult_home_activity_images_sort` (`ACTIVITY_ID`, `SORT_ORDER`),
  CONSTRAINT `fk_ult_home_activity_images_activity`
    FOREIGN KEY (`ACTIVITY_ID`) REFERENCES `ult_home_activities` (`ID`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Backfill: every legacy activity that still carries its single image
-- directly on the parent row gets exactly one child image (marked as
-- cover), so admin/public read paths can switch to the child table as the
-- source of truth without losing any existing activity's image. Guarded by
-- "activity has no child rows yet" so re-running this migration never
-- duplicates rows (including rows created later through the new
-- multi-image admin flow).
INSERT INTO `ult_home_activity_images` (
  `ACTIVITY_ID`,
  `IMAGE_PATH`,
  `IMAGE_ORIGINAL_NAME`,
  `IMAGE_STORED_NAME`,
  `IMAGE_MIME_TYPE`,
  `IMAGE_SIZE_BYTES`,
  `IMAGE_ALT`,
  `IMAGE_FIT`,
  `IS_COVER`,
  `SORT_ORDER`,
  `CREATED_BY`
)
SELECT
  a.`ID`,
  a.`IMAGE_PATH`,
  a.`IMAGE_ORIGINAL_NAME`,
  a.`IMAGE_STORED_NAME`,
  a.`IMAGE_MIME_TYPE`,
  a.`IMAGE_SIZE_BYTES`,
  a.`IMAGE_ALT`,
  a.`IMAGE_FIT`,
  1,
  0,
  'migration-backfill'
FROM `ult_home_activities` a
WHERE a.`IMAGE_PATH` IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `ult_home_activity_images` c WHERE c.`ACTIVITY_ID` = a.`ID`
  );
