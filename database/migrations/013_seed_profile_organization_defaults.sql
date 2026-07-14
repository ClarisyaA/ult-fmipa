SET @legacy_profile_org_should_repair := (
  SELECT
    COUNT(*) = 4
  FROM ult_profile_organization_nodes
  WHERE CREATED_BY = 'migration'
    AND UPDATED_BY IS NULL
    AND PHOTO_PATH IS NULL
    AND (
      (PARENT_ID IS NULL AND NAME = 'Nama Lengkap' AND POSITION_TITLE = 'Kepala ULT')
      OR (PARENT_ID IS NOT NULL AND NAME = 'Nama Lengkap' AND POSITION_TITLE IN (
        'Koordinator Operasional',
        'Koordinator Administrasi',
        'Koordinator Teknik'
      ))
    )
);

SET @legacy_profile_root_id := (
  SELECT ID FROM ult_profile_organization_nodes
  WHERE @legacy_profile_org_should_repair = 1
    AND PARENT_ID IS NULL
    AND POSITION_TITLE = 'Kepala ULT'
    AND CREATED_BY = 'migration'
  ORDER BY ID ASC
  LIMIT 1
);

SET @legacy_profile_operasional_id := (
  SELECT ID FROM ult_profile_organization_nodes
  WHERE @legacy_profile_org_should_repair = 1
    AND PARENT_ID = @legacy_profile_root_id
    AND POSITION_TITLE = 'Koordinator Operasional'
    AND CREATED_BY = 'migration'
  ORDER BY ID ASC
  LIMIT 1
);

SET @legacy_profile_administrasi_id := (
  SELECT ID FROM ult_profile_organization_nodes
  WHERE @legacy_profile_org_should_repair = 1
    AND PARENT_ID = @legacy_profile_root_id
    AND POSITION_TITLE = 'Koordinator Administrasi'
    AND CREATED_BY = 'migration'
  ORDER BY ID ASC
  LIMIT 1
);

SET @legacy_profile_teknik_id := (
  SELECT ID FROM ult_profile_organization_nodes
  WHERE @legacy_profile_org_should_repair = 1
    AND PARENT_ID = @legacy_profile_root_id
    AND POSITION_TITLE = 'Koordinator Teknik'
    AND CREATED_BY = 'migration'
  ORDER BY ID ASC
  LIMIT 1
);

UPDATE ult_profile_organization_nodes
SET
  POSITION_TITLE = 'KEPALA ULT',
  ROLE_LABEL = 'KEPALA ULT',
  SORT_ORDER = 1
WHERE @legacy_profile_org_should_repair = 1
  AND ID = @legacy_profile_root_id;

UPDATE ult_profile_organization_nodes
SET
  POSITION_TITLE = 'KOORDINATOR OPERASIONAL',
  ROLE_LABEL = 'KOORDINATOR OPERASIONAL',
  SORT_ORDER = 1
WHERE @legacy_profile_org_should_repair = 1
  AND ID = @legacy_profile_operasional_id;

UPDATE ult_profile_organization_nodes
SET
  POSITION_TITLE = 'KOORDINATOR ADMINISTRASI',
  ROLE_LABEL = 'KOORDINATOR ADMINISTRASI',
  SORT_ORDER = 2
WHERE @legacy_profile_org_should_repair = 1
  AND ID = @legacy_profile_administrasi_id;

UPDATE ult_profile_organization_nodes
SET
  POSITION_TITLE = 'KOORDINATOR TEKNIK',
  ROLE_LABEL = 'KOORDINATOR TEKNIK',
  SORT_ORDER = 3
WHERE @legacy_profile_org_should_repair = 1
  AND ID = @legacy_profile_teknik_id;

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
SELECT @legacy_profile_operasional_id, 'Staff 1', 'Staff', NULL, 'emerald', 1, 1, 'migration'
WHERE @legacy_profile_org_should_repair = 1
  AND @legacy_profile_operasional_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ult_profile_organization_nodes
    WHERE PARENT_ID = @legacy_profile_operasional_id
      AND NAME = 'Staff 1'
      AND CREATED_BY = 'migration'
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
SELECT @legacy_profile_operasional_id, 'Staff 2', 'Staff', NULL, 'emerald', 2, 1, 'migration'
WHERE @legacy_profile_org_should_repair = 1
  AND @legacy_profile_operasional_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ult_profile_organization_nodes
    WHERE PARENT_ID = @legacy_profile_operasional_id
      AND NAME = 'Staff 2'
      AND CREATED_BY = 'migration'
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
SELECT @legacy_profile_administrasi_id, 'Staff 1', 'Staff', NULL, 'red', 1, 1, 'migration'
WHERE @legacy_profile_org_should_repair = 1
  AND @legacy_profile_administrasi_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ult_profile_organization_nodes
    WHERE PARENT_ID = @legacy_profile_administrasi_id
      AND NAME = 'Staff 1'
      AND CREATED_BY = 'migration'
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
SELECT @legacy_profile_administrasi_id, 'Staff 2', 'Staff', NULL, 'red', 2, 1, 'migration'
WHERE @legacy_profile_org_should_repair = 1
  AND @legacy_profile_administrasi_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ult_profile_organization_nodes
    WHERE PARENT_ID = @legacy_profile_administrasi_id
      AND NAME = 'Staff 2'
      AND CREATED_BY = 'migration'
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
SELECT @legacy_profile_teknik_id, 'Staff 1', 'Staff', NULL, 'amber', 1, 1, 'migration'
WHERE @legacy_profile_org_should_repair = 1
  AND @legacy_profile_teknik_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ult_profile_organization_nodes
    WHERE PARENT_ID = @legacy_profile_teknik_id
      AND NAME = 'Staff 1'
      AND CREATED_BY = 'migration'
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
SELECT @legacy_profile_teknik_id, 'Staff 2', 'Staff', NULL, 'amber', 2, 1, 'migration'
WHERE @legacy_profile_org_should_repair = 1
  AND @legacy_profile_teknik_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ult_profile_organization_nodes
    WHERE PARENT_ID = @legacy_profile_teknik_id
      AND NAME = 'Staff 2'
      AND CREATED_BY = 'migration'
  );
