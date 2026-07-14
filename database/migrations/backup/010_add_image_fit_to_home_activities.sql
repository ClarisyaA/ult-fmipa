ALTER TABLE `ult_home_activities`
  ADD COLUMN IF NOT EXISTS `IMAGE_FIT` VARCHAR(20) NOT NULL DEFAULT 'cover' AFTER `IMAGE_ALT`;

UPDATE `ult_home_activities`
SET `IMAGE_FIT` = 'cover'
WHERE `IMAGE_FIT` IS NULL OR `IMAGE_FIT` NOT IN ('cover', 'contain');
