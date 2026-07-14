CREATE TABLE IF NOT EXISTS `ult_home_links` (
  `ID` BIGINT NOT NULL AUTO_INCREMENT,
  `LINK_KEY` VARCHAR(100) NOT NULL,
  `LABEL` VARCHAR(150) NOT NULL,
  `URL` VARCHAR(500) NOT NULL,
  `IS_ACTIVE` TINYINT(1) NOT NULL DEFAULT 1,
  `CREATED_AT` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `UPDATED_AT` DATETIME(3) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  `UPDATED_BY` VARCHAR(100) NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `uniq_ult_home_links_key` (`LINK_KEY`),
  INDEX `idx_ult_home_links_active` (`IS_ACTIVE`, `LINK_KEY`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `ult_home_links` (
  `LINK_KEY`,
  `LABEL`,
  `URL`,
  `IS_ACTIVE`
) VALUES (
  'academic_calendar',
  'Kalender Akademik',
  'https://www.unpad.ac.id/pengumuman/kalender-kegiatan-akademik-universitas-padjadjaran-tahun-akademik-2026-2027/',
  1
) ON DUPLICATE KEY UPDATE
  `LABEL` = VALUES(`LABEL`);
