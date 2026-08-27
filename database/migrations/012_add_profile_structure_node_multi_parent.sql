-- Adds multi-parent support to the "Profil Struktur" org chart: a node can now
-- be linked under more than one parent (e.g. "Staf Pelaksana" under both
-- "Penanggung Jawab Harian" and "Koordinator Pelaksana"), via a junction table
-- instead of the single scalar ult_profile_structure_nodes.PARENT_ID column.

CREATE TABLE IF NOT EXISTS ult_profile_structure_node_parents (
  NODE_ID INT NOT NULL,
  PARENT_ID INT NOT NULL,
  CREATED_AT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CREATED_BY VARCHAR(100) NULL,
  PRIMARY KEY (NODE_ID, PARENT_ID),
  INDEX IDX_PROFILE_STRUCTURE_NODE_PARENTS_PARENT (PARENT_ID),
  CONSTRAINT CHK_PROFILE_STRUCTURE_NODE_PARENTS_NOT_SELF CHECK (NODE_ID <> PARENT_ID),
  CONSTRAINT FK_PROFILE_STRUCTURE_NODE_PARENTS_NODE
    FOREIGN KEY (NODE_ID) REFERENCES ult_profile_structure_nodes(ID)
    ON DELETE CASCADE,
  CONSTRAINT FK_PROFILE_STRUCTURE_NODE_PARENTS_PARENT
    FOREIGN KEY (PARENT_ID) REFERENCES ult_profile_structure_nodes(ID)
    ON DELETE CASCADE
);
-- NOTE: no ON UPDATE CASCADE on either FK above — MariaDB rejects a CHECK
-- constraint that references a column subject to ON UPDATE CASCADE
-- (ER_GENERATED_COLUMN_FUNCTION_IS_NOT_ALLOWED). This is fine: node IDs are
-- auto-increment and never updated in place, so ON UPDATE CASCADE would
-- never fire anyway.

-- Backfill: every existing single PARENT_ID becomes a junction-table edge.
-- Idempotent via NOT EXISTS guard, safe to re-run.
INSERT INTO ult_profile_structure_node_parents (NODE_ID, PARENT_ID, CREATED_BY)
SELECT n.ID, n.PARENT_ID, 'migration'
FROM ult_profile_structure_nodes n
WHERE n.PARENT_ID IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ult_profile_structure_node_parents e
    WHERE e.NODE_ID = n.ID AND e.PARENT_ID = n.PARENT_ID
  );

-- The legacy PARENT_ID column is kept as a non-authoritative "primary parent"
-- cache (application code keeps it in sync with parentIds[0]), but its FK is
-- loosened from RESTRICT to SET NULL: once the junction table is the source
-- of truth, a stale RESTRICT FK could otherwise block deleting a node that a
-- UI edit already detached via the junction table, producing a confusing
-- "still has children" error that doesn't match what the admin sees on screen.
-- NOTE: MariaDB has no "ADD CONSTRAINT IF NOT EXISTS", so this drop-then-add
-- pair is not a strict no-op on re-run, but it converges to the same end
-- state (FK named FK_PROFILE_STRUCTURE_NODE_PARENT, ON DELETE SET NULL)
-- every time, which satisfies this project's re-run safety requirement.
ALTER TABLE ult_profile_structure_nodes
  DROP FOREIGN KEY IF EXISTS FK_PROFILE_STRUCTURE_NODE_PARENT;

ALTER TABLE ult_profile_structure_nodes
  ADD CONSTRAINT FK_PROFILE_STRUCTURE_NODE_PARENT
  FOREIGN KEY (PARENT_ID) REFERENCES ult_profile_structure_nodes(ID)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Seed the real-world case requested: "Staf Pelaksana" also reports to
-- "Penanggung Jawab Harian", in addition to its existing "Koordinator
-- Pelaksana" parent. Guarded by label match across the existing seed chain,
-- so it safely no-ops if this data has since been renamed/restructured by
-- an admin.
INSERT INTO ult_profile_structure_node_parents (NODE_ID, PARENT_ID, CREATED_BY)
SELECT staf.ID, pjh.ID, 'migration'
FROM ult_profile_structure_nodes staf
JOIN ult_profile_structure_node_parents staf_koordinator
  ON staf_koordinator.NODE_ID = staf.ID
JOIN ult_profile_structure_nodes koordinator
  ON koordinator.ID = staf_koordinator.PARENT_ID AND koordinator.LABEL = 'Koordinator Pelaksana'
JOIN ult_profile_structure_nodes pjh
  ON pjh.LABEL = 'Penanggung Jawab Harian'
WHERE staf.LABEL = 'Staf Pelaksana'
  AND NOT EXISTS (
    SELECT 1 FROM ult_profile_structure_node_parents e2
    WHERE e2.NODE_ID = staf.ID AND e2.PARENT_ID = pjh.ID
  );
