CREATE TABLE IF NOT EXISTS ult_profile_structure_settings (
  ID INT NOT NULL PRIMARY KEY,
  TITLE VARCHAR(150) NOT NULL DEFAULT 'Struktur Organisasi ULT',
  SUBTITLE VARCHAR(255) NULL DEFAULT 'Sinergi kepemimpinan dan eksekusi layanan yang tertata.',
  UPDATED_AT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UPDATED_BY VARCHAR(100) NULL
);

CREATE TABLE IF NOT EXISTS ult_profile_structure_nodes (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  PARENT_ID INT NULL,
  LABEL VARCHAR(150) NOT NULL,
  NODE_TYPE VARCHAR(20) NOT NULL DEFAULT 'standard',
  SORT_ORDER INT NOT NULL DEFAULT 0,
  IS_ACTIVE TINYINT(1) NOT NULL DEFAULT 1,
  CREATED_AT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CREATED_BY VARCHAR(100) NULL,
  UPDATED_BY VARCHAR(100) NULL,
  INDEX IDX_PROFILE_STRUCTURE_NODE_PARENT (PARENT_ID),
  INDEX IDX_PROFILE_STRUCTURE_NODE_ACTIVE_SORT (IS_ACTIVE, SORT_ORDER),
  CONSTRAINT FK_PROFILE_STRUCTURE_NODE_PARENT
    FOREIGN KEY (PARENT_ID) REFERENCES ult_profile_structure_nodes(ID)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS ult_profile_structure_node_items (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  NODE_ID INT NOT NULL,
  CONTENT VARCHAR(255) NOT NULL,
  SORT_ORDER INT NOT NULL DEFAULT 0,
  IS_ACTIVE TINYINT(1) NOT NULL DEFAULT 1,
  CREATED_AT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CREATED_BY VARCHAR(100) NULL,
  UPDATED_BY VARCHAR(100) NULL,
  INDEX IDX_PROFILE_STRUCTURE_ITEM_NODE (NODE_ID),
  INDEX IDX_PROFILE_STRUCTURE_ITEM_ACTIVE_SORT (IS_ACTIVE, SORT_ORDER),
  CONSTRAINT FK_PROFILE_STRUCTURE_ITEM_NODE
    FOREIGN KEY (NODE_ID) REFERENCES ult_profile_structure_nodes(ID)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

INSERT INTO ult_profile_structure_settings (ID, TITLE, SUBTITLE)
SELECT 1, 'Struktur Organisasi ULT', 'Sinergi kepemimpinan dan eksekusi layanan yang tertata.'
WHERE NOT EXISTS (SELECT 1 FROM ult_profile_structure_settings WHERE ID = 1);

SET @should_seed_structure := (SELECT COUNT(*) = 0 FROM ult_profile_structure_nodes);

INSERT INTO ult_profile_structure_nodes (PARENT_ID, LABEL, NODE_TYPE, SORT_ORDER, CREATED_BY)
SELECT NULL, 'Tim Pembina', 'primary', 1, 'migration'
WHERE @should_seed_structure = 1;

SET @tim_pembina_id := (
  SELECT ID FROM ult_profile_structure_nodes
  WHERE PARENT_ID IS NULL AND LABEL = 'Tim Pembina' AND CREATED_BY = 'migration'
  ORDER BY ID ASC LIMIT 1
);

INSERT INTO ult_profile_structure_node_items (NODE_ID, CONTENT, SORT_ORDER, CREATED_BY)
SELECT @tim_pembina_id, 'Dekan Fakultas MIPA', 1, 'migration'
WHERE @should_seed_structure = 1 AND @tim_pembina_id IS NOT NULL;

INSERT INTO ult_profile_structure_node_items (NODE_ID, CONTENT, SORT_ORDER, CREATED_BY)
SELECT @tim_pembina_id, 'Wakil Dekan Bidang Akademik, Kemahasiswaan dan Riset', 2, 'migration'
WHERE @should_seed_structure = 1 AND @tim_pembina_id IS NOT NULL;

INSERT INTO ult_profile_structure_node_items (NODE_ID, CONTENT, SORT_ORDER, CREATED_BY)
SELECT @tim_pembina_id, 'Wakil Dekan Bidang Sumber Daya dan Organisasi', 3, 'migration'
WHERE @should_seed_structure = 1 AND @tim_pembina_id IS NOT NULL;

INSERT INTO ult_profile_structure_nodes (PARENT_ID, LABEL, NODE_TYPE, SORT_ORDER, CREATED_BY)
SELECT @tim_pembina_id, 'Penanggung Jawab Harian', 'standard', 1, 'migration'
WHERE @should_seed_structure = 1 AND @tim_pembina_id IS NOT NULL;

INSERT INTO ult_profile_structure_nodes (PARENT_ID, LABEL, NODE_TYPE, SORT_ORDER, CREATED_BY)
SELECT @tim_pembina_id, 'Koordinator Pelaksana', 'standard', 2, 'migration'
WHERE @should_seed_structure = 1 AND @tim_pembina_id IS NOT NULL;

SET @pjh_id := (
  SELECT ID FROM ult_profile_structure_nodes
  WHERE PARENT_ID = @tim_pembina_id AND LABEL = 'Penanggung Jawab Harian' AND CREATED_BY = 'migration'
  ORDER BY ID ASC LIMIT 1
);

SET @koordinator_id := (
  SELECT ID FROM ult_profile_structure_nodes
  WHERE PARENT_ID = @tim_pembina_id AND LABEL = 'Koordinator Pelaksana' AND CREATED_BY = 'migration'
  ORDER BY ID ASC LIMIT 1
);

INSERT INTO ult_profile_structure_node_items (NODE_ID, CONTENT, SORT_ORDER, CREATED_BY)
SELECT @pjh_id, 'Manajer Akademik dan Kemahasiswaan', 1, 'migration'
WHERE @should_seed_structure = 1 AND @pjh_id IS NOT NULL;

INSERT INTO ult_profile_structure_node_items (NODE_ID, CONTENT, SORT_ORDER, CREATED_BY)
SELECT @pjh_id, 'Manajer Sumber Daya, Perencanaan, dan Informasi', 2, 'migration'
WHERE @should_seed_structure = 1 AND @pjh_id IS NOT NULL;

INSERT INTO ult_profile_structure_node_items (NODE_ID, CONTENT, SORT_ORDER, CREATED_BY)
SELECT @koordinator_id, 'Koordinator Urusan Akademik dan Kemahasiswaan', 1, 'migration'
WHERE @should_seed_structure = 1 AND @koordinator_id IS NOT NULL;

INSERT INTO ult_profile_structure_nodes (PARENT_ID, LABEL, NODE_TYPE, SORT_ORDER, CREATED_BY)
SELECT @koordinator_id, 'Staf Pelaksana', 'standard', 1, 'migration'
WHERE @should_seed_structure = 1 AND @koordinator_id IS NOT NULL;

SET @staf_id := (
  SELECT ID FROM ult_profile_structure_nodes
  WHERE PARENT_ID = @koordinator_id AND LABEL = 'Staf Pelaksana' AND CREATED_BY = 'migration'
  ORDER BY ID ASC LIMIT 1
);

INSERT INTO ult_profile_structure_node_items (NODE_ID, CONTENT, SORT_ORDER, CREATED_BY)
SELECT @staf_id, 'Tim Adhoc ULT', 1, 'migration'
WHERE @should_seed_structure = 1 AND @staf_id IS NOT NULL;

INSERT INTO ult_profile_structure_nodes (PARENT_ID, LABEL, NODE_TYPE, SORT_ORDER, CREATED_BY)
SELECT @staf_id, 'Urusan Akademik', 'leaf', 1, 'migration'
WHERE @should_seed_structure = 1 AND @staf_id IS NOT NULL;

INSERT INTO ult_profile_structure_nodes (PARENT_ID, LABEL, NODE_TYPE, SORT_ORDER, CREATED_BY)
SELECT @staf_id, 'Urusan Kemahasiswaan', 'leaf', 2, 'migration'
WHERE @should_seed_structure = 1 AND @staf_id IS NOT NULL;

INSERT INTO ult_profile_structure_nodes (PARENT_ID, LABEL, NODE_TYPE, SORT_ORDER, CREATED_BY)
SELECT @staf_id, 'Urusan Perencanaan dan Keuangan', 'leaf', 3, 'migration'
WHERE @should_seed_structure = 1 AND @staf_id IS NOT NULL;

INSERT INTO ult_profile_structure_nodes (PARENT_ID, LABEL, NODE_TYPE, SORT_ORDER, CREATED_BY)
SELECT @staf_id, 'Urusan Kehumasan', 'leaf', 4, 'migration'
WHERE @should_seed_structure = 1 AND @staf_id IS NOT NULL;

INSERT INTO ult_profile_structure_nodes (PARENT_ID, LABEL, NODE_TYPE, SORT_ORDER, CREATED_BY)
SELECT @staf_id, 'Urusan Sarana Prasarana', 'leaf', 5, 'migration'
WHERE @should_seed_structure = 1 AND @staf_id IS NOT NULL;
