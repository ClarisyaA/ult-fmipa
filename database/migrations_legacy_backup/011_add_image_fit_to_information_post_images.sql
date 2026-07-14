ALTER TABLE `ult_information_post_images`
  ADD COLUMN IF NOT EXISTS `IMAGE_FIT` VARCHAR(20) NOT NULL DEFAULT 'cover' AFTER `ALT_TEXT`;

UPDATE `ult_information_post_images`
SET `IMAGE_FIT` = 'cover'
WHERE `IMAGE_FIT` IS NULL OR `IMAGE_FIT` NOT IN ('cover', 'contain');
