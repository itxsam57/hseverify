DROP TRIGGER IF EXISTS platform_secure_files_no_delete
  ON platform_secure_files;
DROP TRIGGER IF EXISTS platform_secure_files_guard_update
  ON platform_secure_files;
DROP TRIGGER IF EXISTS platform_secure_files_validate_insert
  ON platform_secure_files;

DROP FUNCTION IF EXISTS platform_secure_file_reject_delete();
DROP FUNCTION IF EXISTS platform_secure_file_guard_update();
DROP FUNCTION IF EXISTS platform_secure_file_validate_insert();

DROP TABLE IF EXISTS platform_secure_files;

-- Secure-file audit facts are durable history. The expanded audit action and
-- target vocabularies intentionally remain valid after this storage rollback
-- so already-recorded immutable events are not invalidated. Reapplication
-- replaces the same constraints deterministically.
