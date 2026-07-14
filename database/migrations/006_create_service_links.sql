CREATE TABLE IF NOT EXISTS `ult_service_links` (
  `ID` BIGINT NOT NULL AUTO_INCREMENT,
  `SERVICE_SLUG` VARCHAR(100) NOT NULL,
  `LINK_KEY` VARCHAR(100) NOT NULL,
  `LABEL` VARCHAR(150) NOT NULL,
  `URL` VARCHAR(500) NOT NULL,
  `IS_ACTIVE` TINYINT(1) NOT NULL DEFAULT 1,
  `CREATED_AT` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `UPDATED_AT` DATETIME(3) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  `UPDATED_BY` VARCHAR(100) NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `uniq_ult_service_links_service_key` (`SERVICE_SLUG`, `LINK_KEY`),
  INDEX `idx_ult_service_links_active` (`SERVICE_SLUG`, `IS_ACTIVE`, `LINK_KEY`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `ult_service_links` (
  `SERVICE_SLUG`,
  `LINK_KEY`,
  `LABEL`,
  `URL`,
  `IS_ACTIVE`
) VALUES (
  'rekomendasi-beasiswa',
  'scholarship_recommendation_template',
  'Template Surat Rekomendasi Beasiswa',
  'https://docs.google.com/document/d/13D9_jd6D31Ycdyz0xwFLHzPY02eQW648tNB3wyR6cCo/edit?usp=sharing',
  1
) ON DUPLICATE KEY UPDATE
  `LINK_KEY` = `LINK_KEY`;
