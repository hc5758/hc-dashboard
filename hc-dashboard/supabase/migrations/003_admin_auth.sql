-- ============================================================
-- MIGRATION 003: Link admin_users ke Supabase Auth
-- Jalankan SETELAH membuat user di Supabase Auth Dashboard
-- ============================================================

-- Pastikan ID di admin_users cocok dengan auth.users
-- Setelah buat user lewat Supabase Auth UI, ambil UUID-nya
-- lalu update tabel admin_users:

-- Contoh cara update:
-- UPDATE admin_users
-- SET id = 'uuid-dari-supabase-auth'
-- WHERE email = 'admin@5758.co';

-- Atau, buat function trigger otomatis:
-- Setiap kali ada user baru di auth.users dengan email yang ada di admin_users,
-- update ID-nya otomatis.

CREATE OR REPLACE FUNCTION sync_admin_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Cek apakah email ada di admin_users
  UPDATE admin_users
  SET id = NEW.id
  WHERE email = NEW.email;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: jalankan setiap kali user baru dibuat di auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_admin_user_id();

-- ============================================================
-- LANGKAH SETUP MANUAL (jika trigger tidak berjalan):
-- ============================================================
-- 1. Buka Supabase Dashboard > Authentication > Users
-- 2. Klik "Add user" untuk setiap HR admin:
--    - admin@5758.co     / Admin5758!
--    - ian@5758.co       / Admin5758!
--    - vania@5758.co     / Admin5758!
--    - arin@5758.co      / Admin5758!
-- 3. Setelah dibuat, klik user tersebut, copy UUID-nya
-- 4. Jalankan SQL berikut di SQL Editor:
--
--    UPDATE admin_users SET id = 'UUID-DISINI' WHERE email = 'admin@5758.co';
--    UPDATE admin_users SET id = 'UUID-DISINI' WHERE email = 'ian@5758.co';
--    -- dst
--
-- ============================================================
-- CEK APAKAH SUDAH TERHUBUNG:
-- ============================================================
SELECT
  au.email,
  au.full_name,
  au.role,
  au.is_active,
  CASE WHEN auth_u.id IS NOT NULL THEN '✓ Terhubung' ELSE '✗ Belum ada Auth user' END as auth_status
FROM admin_users au
LEFT JOIN auth.users auth_u ON auth_u.id = au.id
ORDER BY au.role;
