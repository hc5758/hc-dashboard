-- ============================================================
-- STEP 0: DROP SEMUA DULU (jalankan ini dulu sebelum schema)
-- ============================================================

-- Drop tables (urutan dari yang paling bergantung ke yang independen)
DROP TABLE IF EXISTS recruitment_candidates CASCADE;
DROP TABLE IF EXISTS performance_scores CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS engagement_surveys CASCADE;
DROP TABLE IF EXISTS attendance_leave CASCADE;
DROP TABLE IF EXISTS salary_records CASCADE;
DROP TABLE IF EXISTS pip_sp CASCADE;
DROP TABLE IF EXISTS tna_records CASCADE;
DROP TABLE IF EXISTS recruitment CASCADE;
DROP TABLE IF EXISTS offboarding CASCADE;
DROP TABLE IF EXISTS onboarding CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

SELECT 'Semua tabel berhasil dihapus! Sekarang jalankan 001_schema_FULL.sql' AS status;
