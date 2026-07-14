CREATE TABLE IF NOT EXISTS ult_profile_organization_nodes (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  PARENT_ID INT NULL,
  NAME VARCHAR(150) NOT NULL,
  POSITION_TITLE VARCHAR(150) NOT NULL,
  ROLE_LABEL VARCHAR(100) NULL,
  PHOTO_PATH VARCHAR(255) NULL,
  PHOTO_ORIGINAL_NAME VARCHAR(255) NULL,
  PHOTO_STORED_NAME VARCHAR(255) NULL,
  PHOTO_MIME_TYPE VARCHAR(100) NULL,
  PHOTO_SIZE_BYTES INT NULL,
  PHOTO_ALT VARCHAR(150) NULL,
  COLOR_VARIANT VARCHAR(30) NULL,
  IS_ACTIVE TINYINT(1) NOT NULL DEFAULT 1,
  SORT_ORDER INT NOT NULL DEFAULT 0,
  CREATED_AT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CREATED_BY VARCHAR(100) NULL,
  UPDATED_BY VARCHAR(100) NULL,
  INDEX IDX_PROFILE_ORG_PARENT (PARENT_ID),
  INDEX IDX_PROFILE_ORG_ACTIVE_SORT (IS_ACTIVE, SORT_ORDER),
  CONSTRAINT FK_PROFILE_ORG_PARENT
    FOREIGN KEY (PARENT_ID) REFERENCES ult_profile_organization_nodes(ID)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS ult_profile_location_settings (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  EYEBROW VARCHAR(100) NULL DEFAULT 'Location & Access',
  TITLE VARCHAR(150) NOT NULL DEFAULT 'Lokasi Kami',
  DESCRIPTION TEXT NOT NULL,
  DIRECTION_LABEL VARCHAR(80) NOT NULL DEFAULT 'Petunjuk Arah',
  DIRECTION_URL VARCHAR(500) NULL,
  EMAIL VARCHAR(150) NULL,
  IMAGE_PATH VARCHAR(255) NULL,
  IMAGE_ORIGINAL_NAME VARCHAR(255) NULL,
  IMAGE_STORED_NAME VARCHAR(255) NULL,
  IMAGE_MIME_TYPE VARCHAR(100) NULL,
  IMAGE_SIZE_BYTES INT NULL,
  IMAGE_ALT VARCHAR(150) NULL,
  IMAGE_FIT VARCHAR(20) NOT NULL DEFAULT 'cover',
  IS_ACTIVE TINYINT(1) NOT NULL DEFAULT 1,
  CREATED_AT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UPDATED_BY VARCHAR(100) NULL
);

CREATE TABLE IF NOT EXISTS ult_profile_location_hours (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  LOCATION_ID INT NOT NULL,
  DAY_LABEL VARCHAR(100) NOT NULL,
  TIME_LABEL VARCHAR(100) NOT NULL,
  SORT_ORDER INT NOT NULL DEFAULT 0,
  IS_ACTIVE TINYINT(1) NOT NULL DEFAULT 1,
  CREATED_AT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX IDX_PROFILE_LOCATION_HOURS_LOCATION (LOCATION_ID),
  INDEX IDX_PROFILE_LOCATION_HOURS_ACTIVE_SORT (IS_ACTIVE, SORT_ORDER),
  CONSTRAINT FK_PROFILE_LOCATION_HOURS_LOCATION
    FOREIGN KEY (LOCATION_ID) REFERENCES ult_profile_location_settings(ID)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

INSERT INTO ult_profile_location_settings (
  ID,
  EYEBROW,
  TITLE,
  DESCRIPTION,
  DIRECTION_LABEL,
  DIRECTION_URL,
  EMAIL,
  IMAGE_ALT,
  IMAGE_FIT,
  IS_ACTIVE
)
SELECT
  1,
  'Location & Access',
  'Lokasi Kami',
  'Lokasi ULT FMIPA berada di Lt. 1 Gedung Otto Sumarwoto Fakultas MIPA (Gedung Dekanat), Jl. Ir. Sukarno Km. 21, Jatinangor, Sumedang dan berada di pusat kawasan Universitas Padjadjaran Kampus Jatinangor.',
  'Petunjuk Arah',
  'https://www.google.com/maps/search/?api=1&query=FMIPA%20Unpad%20Jatinangor',
  'ult.fmipa@unpad.ac.id',
  'Denah lokasi FMIPA Unpad',
  'cover',
  1
WHERE NOT EXISTS (
  SELECT 1 FROM ult_profile_location_settings WHERE ID = 1
);

INSERT INTO ult_profile_location_hours (
  LOCATION_ID,
  DAY_LABEL,
  TIME_LABEL,
  SORT_ORDER,
  IS_ACTIVE
)
SELECT 1, 'Senin - Kamis', '08.00-15.00 WIB', 0, 1
WHERE NOT EXISTS (
  SELECT 1 FROM ult_profile_location_hours
  WHERE LOCATION_ID = 1 AND DAY_LABEL = 'Senin - Kamis'
);

INSERT INTO ult_profile_location_hours (
  LOCATION_ID,
  DAY_LABEL,
  TIME_LABEL,
  SORT_ORDER,
  IS_ACTIVE
)
SELECT 1, 'Jumat (Daring)', '08.00-16.00 WIB', 1, 1
WHERE NOT EXISTS (
  SELECT 1 FROM ult_profile_location_hours
  WHERE LOCATION_ID = 1 AND DAY_LABEL = 'Jumat (Daring)'
);

SET @should_seed_profile_org := (
  SELECT COUNT(*) = 0 FROM ult_profile_organization_nodes
);

INSERT INTO ult_profile_organization_nodes (
  NAME,
  POSITION_TITLE,
  ROLE_LABEL,
  COLOR_VARIANT,
  SORT_ORDER,
  IS_ACTIVE,
  CREATED_BY
)
SELECT 'Nama Lengkap', 'KEPALA ULT', 'KEPALA ULT', 'emerald', 1, 1, 'migration'
WHERE @should_seed_profile_org = 1;

SET @profile_root_id := (
  SELECT ID FROM ult_profile_organization_nodes
  WHERE PARENT_ID IS NULL
    AND NAME = 'Nama Lengkap'
    AND POSITION_TITLE = 'KEPALA ULT'
    AND CREATED_BY = 'migration'
  ORDER BY ID ASC
  LIMIT 1
);

INSERT INTO ult_profile_organization_nodes (
  PARENT_ID,
  NAME,
  POSITION_TITLE,
  ROLE_LABEL,
  COLOR_VARIANT,
  SORT_ORDER,
  IS_ACTIVE,
  CREATED_BY
)
SELECT @profile_root_id, 'Nama Lengkap', 'KOORDINATOR OPERASIONAL', 'KOORDINATOR OPERASIONAL', 'emerald', 1, 1, 'migration'
WHERE @should_seed_profile_org = 1 AND @profile_root_id IS NOT NULL;

INSERT INTO ult_profile_organization_nodes (
  PARENT_ID,
  NAME,
  POSITION_TITLE,
  ROLE_LABEL,
  COLOR_VARIANT,
  SORT_ORDER,
  IS_ACTIVE,
  CREATED_BY
)
SELECT @profile_root_id, 'Nama Lengkap', 'KOORDINATOR ADMINISTRASI', 'KOORDINATOR ADMINISTRASI', 'red', 2, 1, 'migration'
WHERE @should_seed_profile_org = 1 AND @profile_root_id IS NOT NULL;

INSERT INTO ult_profile_organization_nodes (
  PARENT_ID,
  NAME,
  POSITION_TITLE,
  ROLE_LABEL,
  COLOR_VARIANT,
  SORT_ORDER,
  IS_ACTIVE,
  CREATED_BY
)
SELECT @profile_root_id, 'Nama Lengkap', 'KOORDINATOR TEKNIK', 'KOORDINATOR TEKNIK', 'amber', 3, 1, 'migration'
WHERE @should_seed_profile_org = 1 AND @profile_root_id IS NOT NULL;

SET @profile_operasional_id := (
  SELECT ID FROM ult_profile_organization_nodes
  WHERE PARENT_ID = @profile_root_id
    AND POSITION_TITLE = 'KOORDINATOR OPERASIONAL'
    AND CREATED_BY = 'migration'
  ORDER BY ID ASC
  LIMIT 1
);

SET @profile_administrasi_id := (
  SELECT ID FROM ult_profile_organization_nodes
  WHERE PARENT_ID = @profile_root_id
    AND POSITION_TITLE = 'KOORDINATOR ADMINISTRASI'
    AND CREATED_BY = 'migration'
  ORDER BY ID ASC
  LIMIT 1
);

SET @profile_teknik_id := (
  SELECT ID FROM ult_profile_organization_nodes
  WHERE PARENT_ID = @profile_root_id
    AND POSITION_TITLE = 'KOORDINATOR TEKNIK'
    AND CREATED_BY = 'migration'
  ORDER BY ID ASC
  LIMIT 1
);

INSERT INTO ult_profile_organization_nodes (
  PARENT_ID,
  NAME,
  POSITION_TITLE,
  ROLE_LABEL,
  COLOR_VARIANT,
  SORT_ORDER,
  IS_ACTIVE,
  CREATED_BY
)
SELECT @profile_operasional_id, 'Staff 1', 'Staff', NULL, 'emerald', 1, 1, 'migration'
WHERE @should_seed_profile_org = 1 AND @profile_operasional_id IS NOT NULL;

INSERT INTO ult_profile_organization_nodes (
  PARENT_ID,
  NAME,
  POSITION_TITLE,
  ROLE_LABEL,
  COLOR_VARIANT,
  SORT_ORDER,
  IS_ACTIVE,
  CREATED_BY
)
SELECT @profile_operasional_id, 'Staff 2', 'Staff', NULL, 'emerald', 2, 1, 'migration'
WHERE @should_seed_profile_org = 1 AND @profile_operasional_id IS NOT NULL;

INSERT INTO ult_profile_organization_nodes (
  PARENT_ID,
  NAME,
  POSITION_TITLE,
  ROLE_LABEL,
  COLOR_VARIANT,
  SORT_ORDER,
  IS_ACTIVE,
  CREATED_BY
)
SELECT @profile_administrasi_id, 'Staff 1', 'Staff', NULL, 'red', 1, 1, 'migration'
WHERE @should_seed_profile_org = 1 AND @profile_administrasi_id IS NOT NULL;

INSERT INTO ult_profile_organization_nodes (
  PARENT_ID,
  NAME,
  POSITION_TITLE,
  ROLE_LABEL,
  COLOR_VARIANT,
  SORT_ORDER,
  IS_ACTIVE,
  CREATED_BY
)
SELECT @profile_administrasi_id, 'Staff 2', 'Staff', NULL, 'red', 2, 1, 'migration'
WHERE @should_seed_profile_org = 1 AND @profile_administrasi_id IS NOT NULL;

INSERT INTO ult_profile_organization_nodes (
  PARENT_ID,
  NAME,
  POSITION_TITLE,
  ROLE_LABEL,
  COLOR_VARIANT,
  SORT_ORDER,
  IS_ACTIVE,
  CREATED_BY
)
SELECT @profile_teknik_id, 'Staff 1', 'Staff', NULL, 'amber', 1, 1, 'migration'
WHERE @should_seed_profile_org = 1 AND @profile_teknik_id IS NOT NULL;

INSERT INTO ult_profile_organization_nodes (
  PARENT_ID,
  NAME,
  POSITION_TITLE,
  ROLE_LABEL,
  COLOR_VARIANT,
  SORT_ORDER,
  IS_ACTIVE,
  CREATED_BY
)
SELECT @profile_teknik_id, 'Staff 2', 'Staff', NULL, 'amber', 2, 1, 'migration'
WHERE @should_seed_profile_org = 1 AND @profile_teknik_id IS NOT NULL;
