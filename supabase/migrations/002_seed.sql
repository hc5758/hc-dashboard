-- ============================================================
-- SEED DATA — HC Dashboard 5758
-- Run AFTER 001_schema.sql
-- ============================================================

-- EMPLOYEES
INSERT INTO employees (id, employee_id, full_name, email, phone, position, level, division, entity, employment_type, work_location, status, gender, birth_date, marital_status, join_date, end_date) VALUES
('10000000-0000-0000-0000-000000000001','EMP001','Budi Santoso','budi@ssr.co','081211110001','Creative Director','Director','Creative','SSR','PKWTT','Jakarta','active','Laki-laki','1985-03-15','Kawin','2020-01-10',NULL),
('10000000-0000-0000-0000-000000000002','EMP002','Sari Dewi','sari@ssr.co','081211110002','Marketing Manager','Manager','Marketing','SSR','PKWTT','Jakarta','active','Perempuan','1990-05-12','Kawin','2021-03-01',NULL),
('10000000-0000-0000-0000-000000000003','EMP003','Rizky Pratama','rizky@ssr.co','081211110003','HR Specialist','Specialist','Human Capital','SSR','PKWTT','Jakarta','active','Laki-laki','1993-08-22','Belum Kawin','2022-06-15',NULL),
('10000000-0000-0000-0000-000000000004','EMP004','Dewi Rahayu','dewi@ssr.co','081211110004','Finance Staff','Staff','Finance','SSR','PKWTT','Jakarta','active','Perempuan','1995-11-30','Belum Kawin','2022-09-01',NULL),
('10000000-0000-0000-0000-000000000005','EMP005','Andi Kurniawan','andi@ssr.co','081211110005','Social Media Specialist','Specialist','Social Media','SSR','PKWTT','Jakarta','active','Laki-laki','1992-07-19','Kawin','2021-07-01',NULL),
('10000000-0000-0000-0000-000000000006','EMP006','Nita Rahma','nita@ssr.co','081211110006','Graphic Designer','Specialist','Creative','SSR','PKWTT','Jakarta','active','Perempuan','1996-04-08','Belum Kawin','2023-01-02',NULL),
('10000000-0000-0000-0000-000000000007','EMP007','Fajar Rahman','fajar@ssr.co','081211110007','Finance Officer','Officer','Finance','SSR','PKWT','Jakarta','active','Laki-laki','1997-09-14','Belum Kawin','2023-06-01','2026-05-11'),
('10000000-0000-0000-0000-000000000008','EMP008','Ririn Astuti','ririn@ssr.co','081211110008','HR Officer','Officer','Human Capital','SSR','PKWT','Jakarta','active','Perempuan','1998-12-03','Belum Kawin','2023-06-01','2026-05-14'),
('10000000-0000-0000-0000-000000000009','EMP009','Ahmad Rifai','ahmad@nyambee.co','081211110009','Sr. Manager Operations','Sr. Manager','Operations','Nyambee (PAT)','PKWTT','Bandung','active','Laki-laki','1983-02-27','Kawin','2019-08-01',NULL),
('10000000-0000-0000-0000-000000000010','EMP010','Lita Anggraini','lita@nyambee.co','081211110010','Content Creator','Jr. Staff','Creative','Nyambee (PAT)','PKWTT','Bandung','active','Perempuan','1994-06-16','Belum Kawin','2022-04-01',NULL),
('10000000-0000-0000-0000-000000000011','EMP011','Doni Setiawan','doni@nyambee.co','081211110011','Performance Marketing','Sr. Officer','Marketing','Nyambee (PAT)','PKWTT','Bandung','active','Laki-laki','1991-10-05','Kawin','2021-01-15',NULL),
('10000000-0000-0000-0000-000000000012','EMP012','Maya Putri','maya@pat5758.co','081211110012','Head of Creative','Head','Creative','PAT-5758','PKWTT','Jakarta','active','Perempuan','1987-01-20','Kawin','2020-05-01',NULL),
('10000000-0000-0000-0000-000000000013','EMP013','Hendra Wijaya','hendra@pat5758.co','081211110013','Jr. Staff Design','Jr. Staff','Creative','PAT-5758','PKWT','Jakarta','active','Laki-laki','1999-03-11','Belum Kawin','2024-01-15','2026-05-22'),
('10000000-0000-0000-0000-000000000014','EMP014','Putri Handayani','putri@ssr.co','081211110014','Associate Marketing','Associate','Marketing','SSR','PKWT','Jakarta','active','Perempuan','2000-07-25','Belum Kawin','2024-02-01','2026-06-01'),
('10000000-0000-0000-0000-000000000015','EMP015','Bayu Nugroho','bayu@ssr.co','081211110015','Staff IT','Staff','IT & Systems','SSR','PKWTT','Jakarta','active','Laki-laki','1994-12-09','Belum Kawin','2022-11-01',NULL),
('10000000-0000-0000-0000-000000000016','EMP016','Anisa Fitriani','anisa@ssr.co','081211110016','Sr. Staff Accounting','Sr. Staff','Finance','SSR','PKWTT','Jakarta','active','Perempuan','1989-04-22','Kawin','2020-09-01',NULL),
('10000000-0000-0000-0000-000000000017','EMP017','M. Wicky Firdaus','wicky@ssr.co','081211110017','Creative Staff','Staff','Creative','SSR','PKWTT','Jakarta','resigned','Laki-laki','1995-06-14','Belum Kawin','2022-03-01',NULL),
('10000000-0000-0000-0000-000000000018','EMP018','ST Ratih Nurwanti','ratih@ssr.co','081211110018','Performance Marketing Staff','Staff','Marketing','SSR','PKWTT','Jakarta','resigned','Perempuan','1996-09-30','Belum Kawin','2023-08-21',NULL),
('10000000-0000-0000-0000-000000000019','EMP019','Chairunisa Vania R.','chairunisa@ssr.co','081211110019','HR Staff','Jr. Staff','Human Capital','SSR','PKWTT','Jakarta','resigned','Perempuan','1997-11-15','Belum Kawin','2023-04-01',NULL),
('10000000-0000-0000-0000-000000000020','EMP020','Ananda Rizki O.','ananda@ssr.co','081211110020','Social Media Staff','Jr. Staff','Social Media','SSR','PKWT','Jakarta','end_contract','Perempuan','1999-01-28','Belum Kawin','2023-03-06','2026-03-06')
ON CONFLICT DO NOTHING;

-- CONTRACTS
INSERT INTO contracts (employee_id, contract_type, contract_number, start_date, end_date, is_active) VALUES
('10000000-0000-0000-0000-000000000007','PKWT','PKWT/2023/007','2023-06-01','2026-05-11',true),
('10000000-0000-0000-0000-000000000008','PKWT','PKWT/2023/008','2023-06-01','2026-05-14',true),
('10000000-0000-0000-0000-000000000013','PKWT','PKWT/2024/013','2024-01-15','2026-05-22',true),
('10000000-0000-0000-0000-000000000014','PKWT','PKWT/2024/014','2024-02-01','2026-06-01',true)
ON CONFLICT DO NOTHING;

-- RECRUITMENT
INSERT INTO recruitment (position, division, entity, pic_name, quarter, year, hiring_source, status, total_applicants, screening_count, interview_count, offering_count, target_date) VALUES
('Social Media Specialist','Social Media','SSR','Ian Pratama','Q2',2026,'Job Portal','In Progress',12,8,4,0,'2026-06-30'),
('Graphic Designer','Creative','SSR','Vania Kusuma','Q2',2026,'LinkedIn','Offering',8,5,3,2,'2026-05-30'),
('Performance Marketer','Marketing','SSR','Arin Setiawan','Q2',2026,'Referral','In Progress',6,4,2,0,'2026-06-15'),
('HR Officer','Human Capital','SSR','Ian Pratama','Q1',2026,'Job Portal','Hired',15,10,5,2,'2026-03-01')
ON CONFLICT DO NOTHING;

-- ONBOARDING
INSERT INTO onboarding (employee_id, pic_name, quarter, year, hiring_source, update_to_structure, send_job_description, session_1, session_1_date, session_2, session_2_date, session_3, session_4) VALUES
('10000000-0000-0000-0000-000000000006','Ian Pratama','Q1',2026,'Referral',true,true,true,'2026-01-05',true,'2026-01-12',false,false),
('10000000-0000-0000-0000-000000000013','Vania Kusuma','Q1',2026,'Job Portal',true,false,true,'2026-01-20',false,NULL,false,false),
('10000000-0000-0000-0000-000000000014','Arin Setiawan','Q1',2026,'LinkedIn',false,false,false,NULL,false,NULL,false,false),
('10000000-0000-0000-0000-000000000015','Ian Pratama','Q4',2025,'Job Portal',true,true,true,'2022-11-10',true,'2022-11-17',true,'2022-11-24')
ON CONFLICT DO NOTHING;

-- OFFBOARDING
INSERT INTO offboarding (employee_id, pic_name, report_date, quarter, year, offboard_type, effective_date, reason_to_leave, return_assets, clearance_letter, exit_interview, send_paklaring, bpjs_deactivated, final_payment_done) VALUES
('10000000-0000-0000-0000-000000000017','Ian Pratama','2026-02-22','Q1',2026,'Resign','2026-03-22','Opportunity from other company',false,true,true,false,false,false),
('10000000-0000-0000-0000-000000000018','Vania Kusuma','2026-02-25','Q1',2026,'Resign','2026-02-25','Opportunity from other company',true,true,true,false,false,true),
('10000000-0000-0000-0000-000000000019','Arin Setiawan','2026-03-15','Q2',2026,'Resign','2026-05-20','Opportunity from other company',false,false,false,false,false,false),
('10000000-0000-0000-0000-000000000020','Ian Pratama','2026-03-01','Q1',2026,'End of Contract','2026-03-06','Contract ended',true,true,true,true,true,true)
ON CONFLICT DO NOTHING;

-- TNA RECORDS
INSERT INTO tna_records (employee_id, year, quarter, training_name, training_category, training_method, target_date, status, score) VALUES
('10000000-0000-0000-0000-000000000003',2026,'Q1','HRIS System Training','Technical','Online','2026-02-28','Done',88),
('10000000-0000-0000-0000-000000000003',2026,'Q2','Leadership Basics','Leadership','Offline','2026-05-31','In Progress',NULL),
('10000000-0000-0000-0000-000000000004',2026,'Q1','Excel Advanced','Hard Skill','Online','2026-04-30','Overdue',NULL),
('10000000-0000-0000-0000-000000000005',2026,'Q3','Digital Marketing Masterclass','Hard Skill','Online','2026-09-30','Planned',NULL),
('10000000-0000-0000-0000-000000000006',2026,'Q1','Communication Skills','Soft Skill','Offline','2026-04-15','Done',92),
('10000000-0000-0000-0000-000000000015',2026,'Q1','Cybersecurity Basics','Technical','Online','2026-03-31','Done',95),
('10000000-0000-0000-0000-000000000016',2026,'Q2','Tax & PPh21','Hard Skill','Offline','2026-06-30','In Progress',NULL),
('10000000-0000-0000-0000-000000000001',2026,'Q2','Leadership & Management','Leadership','Hybrid','2026-05-15','Done',90)
ON CONFLICT DO NOTHING;

-- PIP / SP
INSERT INTO pip_sp (employee_id, pic_name, type, issue_date, end_date, reason, improvement_plan, status) VALUES
('10000000-0000-0000-0000-000000000013','Vania Kusuma','SP1','2026-02-01','2026-03-01','Keterlambatan berulang lebih dari 5x dalam sebulan','Hadir tepat waktu, lapor progress harian ke supervisor','Active'),
('10000000-0000-0000-0000-000000000014','Arin Setiawan','PIP','2026-01-15','2026-04-15','Target output tidak tercapai 3 bulan berturut-turut','Membuat plan mingguan, coaching 2x per minggu dengan manager','Active')
ON CONFLICT DO NOTHING;

-- SALARY RECORDS
INSERT INTO salary_records (employee_id, year, month, basic_salary, allowance, overtime, bonus, bpjs_ketenagakerjaan, bpjs_kesehatan, is_paid, payment_date) VALUES
('10000000-0000-0000-0000-000000000001',2026,5,18000000,4000000,0,0,180000,72000,true,'2026-05-28'),
('10000000-0000-0000-0000-000000000002',2026,5,12000000,2500000,0,0,120000,48000,true,'2026-05-28'),
('10000000-0000-0000-0000-000000000003',2026,5,7000000,1500000,200000,0,70000,28000,true,'2026-05-28'),
('10000000-0000-0000-0000-000000000004',2026,5,5500000,1000000,0,0,55000,22000,false,NULL),
('10000000-0000-0000-0000-000000000005',2026,5,7500000,1500000,500000,0,75000,30000,true,'2026-05-28'),
('10000000-0000-0000-0000-000000000006',2026,5,6500000,1200000,0,0,65000,26000,true,'2026-05-28'),
('10000000-0000-0000-0000-000000000009',2026,5,15000000,3000000,0,1000000,150000,60000,true,'2026-05-28'),
('10000000-0000-0000-0000-000000000012',2026,5,16000000,3500000,0,0,160000,64000,true,'2026-05-28')
ON CONFLICT DO NOTHING;

-- LEAVE
INSERT INTO attendance_leave (employee_id, leave_type, start_date, end_date, total_days, status) VALUES
('10000000-0000-0000-0000-000000000002','Tahunan','2026-05-05','2026-05-07',3,'Approved'),
('10000000-0000-0000-0000-000000000004','Sakit','2026-05-05','2026-05-06',2,'Approved'),
('10000000-0000-0000-0000-000000000009','Penting','2026-05-07','2026-05-09',3,'Approved')
ON CONFLICT DO NOTHING;

-- ENGAGEMENT SURVEYS
INSERT INTO engagement_surveys (year, quarter, division, engagement_score, satisfaction_score, response_count, total_count) VALUES
(2026,'Q2','Creative',4.1,3.9,14,15),
(2026,'Q2','Marketing',3.6,3.4,9,10),
(2026,'Q2','Social Media',2.9,2.7,6,7),
(2026,'Q2','Finance',4.4,4.2,4,4),
(2026,'Q2','Human Capital',3.5,3.3,3,3),
(2026,'Q2','Operations',3.8,3.6,2,2)
ON CONFLICT DO NOTHING;
