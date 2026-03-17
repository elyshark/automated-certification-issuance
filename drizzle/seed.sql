-- =============================================================================
-- Seed data: additional employees, certificates, and training history
-- Generated: 2026-03-10
--
-- Insert order:
--   1. location
--   2. training
--   3. employee           (serial FK target for certificate & training_history)
--   4. certificate        (original 21 entries)
--   5. training_history   – batch 1: (no self-refs)
--   6. training_history   – batch 2: (renewed_from_id refs batches 1)
--   7. certificate        – batch 2: 13 entries extending running numbers
--   8. certificate        – batch 3:  2 renewal certs
--   9. training_history   – batch 3: (no self-refs)
--  10. training_history   – batch 4: (renewed_from_id refs batch 3)
-- =============================================================================
BEGIN;

-- -----------------------------------------------------------------------------
-- 1. LOCATION
-- -----------------------------------------------------------------------------
INSERT INTO
  location (code, name, latitude, longitude)
VALUES
  (
    'BKI',
    'Kota Kinabalu International Airport',
    '5.9235178',
    '116.0511855'
  ),
  (
    'JHB',
    'Johor Bahru Senai International Airport',
    '1.6360763',
    '103.6678629'
  ),
  (
    'KCH',
    'Kuching International Airport',
    '1.4873264',
    '110.3415879'
  ),
  (
    'KUL',
    'Kuala Lumpur International Airport',
    '2.7432869',
    '101.7016332'
  ),
  (
    'LGK',
    'Langkawi International Airport',
    '6.3425261',
    '99.7311044'
  ),
  (
    'PEN',
    'Penang International Airport',
    '5.2962569',
    '100.2751763'
  ),
  (
    'SZB',
    'Sultan Abdul Aziz Shah Airport',
    '3.1282988',
    '101.5522940'
  );

-- -----------------------------------------------------------------------------
-- 2. TRAINING
-- -----------------------------------------------------------------------------
INSERT INTO
  training (code, name)
VALUES
  ('DDT', 'Defensive Driving Training'),
  ('II', 'Installation Inspector'),
  ('PI', 'Product Inspector');

-- -----------------------------------------------------------------------------
-- 3. EMPLOYEES
-- -----------------------------------------------------------------------------
INSERT INTO
  employee (given_name, surname, email, position, role)
VALUES
  (
    'Elysha Soffiea',
    'Shariful Basri',
    'elyshasoffiea@gmail.com',
    'Superintendent',
    'ADMINISTRATOR'
  ),
  (
    'Ammar Farhan',
    'Mohamad Rizam',
    'ammarfmr11@gmail.com',
    'Refueler',
    'ADMINISTRATOR'
  ),
  (
    'Kevin',
    'Chong',
    'kevin_chong@petronas.com.my',
    'Administrator',
    'USER'
  ),
  (
    'Nurul Ain',
    'Abdullah',
    'nurulain.abdullah@petronas.com.my',
    'Refueler',
    'USER'
  ),
  (
    'Hafizuddin',
    'Razali',
    'hafizuddin.razali@petronas.com.my',
    'Supervisor',
    'REVIEWER'
  ),
  (
    'Siti Hajar',
    'Mohd Yusof',
    'sitihajar.yusof@petronas.com.my',
    'Refueler',
    'USER'
  ),
  (
    'Rajendran',
    'Subramaniam',
    'rajendran.sub@petronas.com.my',
    'Inspector',
    'USER'
  ),
  (
    'Wei Kiat',
    'Lim',
    'weikiat.lim@petronas.com.my',
    'Technician',
    'USER'
  ),
  (
    'Farah Nadia',
    'Zulkifli',
    'farahnadia.zulkifli@petronas.com.my',
    'Superintendent',
    'REVIEWER'
  ),
  (
    'Ahmad Syafiq',
    'Roslan',
    'ahmadsyafiq.roslan@petronas.com.my',
    'Refueler',
    'USER'
  ),
  (
    'Boon Keat',
    'Tan',
    'bounkeat.tan@petronas.com.my',
    'Engineer',
    'USER'
  ),
  (
    'Zuraidah',
    'Ismail',
    'zuraidah.ismail@petronas.com.my',
    'Supervisor',
    'REVIEWER'
  ),
  (
    'Mohamad Faris',
    'Othman',
    'faris.othman@petronas.com.my',
    'Refueler',
    'USER'
  ),
  (
    'Priya',
    'Krishnaswamy',
    'priya.krishnaswamy@petronas.com.my',
    'Inspector',
    'USER'
  ),
  (
    'Zainudin',
    'Hamid',
    'zainudin.hamid@petronas.com.my',
    'Technician',
    'USER'
  ),
  (
    'Siew Ling',
    'Ng',
    'siewling.ng@petronas.com.my',
    'Administrator',
    'USER'
  ),
  (
    'Azrul Hisham',
    'Baharudin',
    'azrulhisham.baharudin@petronas.com.my',
    'Superintendent',
    'REVIEWER'
  ),
  (
    'Nurhafizah',
    'Mohd Noor',
    'nurhafizah.mohdnoor@petronas.com.my',
    'Refueler',
    'USER'
  );

-- -----------------------------------------------------------------------------
-- 4. CERTIFICATES  (21 new entries)
--    Expiry = issued_date + 24 months (matches application business rule)
-- -----------------------------------------------------------------------------
INSERT INTO
  certificate (id, path, issued_date, expiry_date, issued_to)
VALUES
  (
    'PI-PEN-001',
    'https://fakeurl.com/certificates/PI-PEN-001',
    '2026-03-09 17:13:28.231143+00',
    '2028-03-09 17:11:02.09824+00',
    1
  ),
  (
    'II-KUL-001',
    'https://fakeurl.com/certificates/II-KUL-001',
    '2026-03-09 17:16:24.284601+00',
    '2028-03-09 17:14:31.525844+00',
    2
  ),
  -- 2024 cohort
  (
    'DDT-BKI-001',
    'https://fakeurl.com/certificates/DDT-BKI-001',
    '2024-06-15 08:00:00+00',
    '2026-06-15 08:00:00+00',
    4
  ),
  (
    'PI-KUL-001',
    'https://fakeurl.com/certificates/PI-KUL-001',
    '2024-07-20 08:00:00+00',
    '2026-07-20 08:00:00+00',
    5
  ),
  (
    'DDT-PEN-001',
    'https://fakeurl.com/certificates/DDT-PEN-001',
    '2024-08-10 08:00:00+00',
    '2026-08-10 08:00:00+00',
    6
  ),
  (
    'II-JHB-001',
    'https://fakeurl.com/certificates/II-JHB-001',
    '2024-09-05 08:00:00+00',
    '2026-09-05 08:00:00+00',
    7
  ),
  (
    'PI-BKI-001',
    'https://fakeurl.com/certificates/PI-BKI-001',
    '2024-10-12 08:00:00+00',
    '2026-10-12 08:00:00+00',
    8
  ),
  (
    'DDT-KCH-001',
    'https://fakeurl.com/certificates/DDT-KCH-001',
    '2024-11-18 08:00:00+00',
    '2026-11-18 08:00:00+00',
    10
  ),
  (
    'II-SZB-001',
    'https://fakeurl.com/certificates/II-SZB-001',
    '2024-12-03 08:00:00+00',
    '2026-12-03 08:00:00+00',
    11
  ),
  -- 2025 cohort
  (
    'PI-LGK-001',
    'https://fakeurl.com/certificates/PI-LGK-001',
    '2025-01-14 08:00:00+00',
    '2027-01-14 08:00:00+00',
    13
  ),
  (
    'DDT-JHB-001',
    'https://fakeurl.com/certificates/DDT-JHB-001',
    '2025-02-20 08:00:00+00',
    '2027-02-20 08:00:00+00',
    14
  ),
  (
    'II-KCH-001',
    'https://fakeurl.com/certificates/II-KCH-001',
    '2025-03-10 08:00:00+00',
    '2027-03-10 08:00:00+00',
    15
  ),
  (
    'PI-SZB-001',
    'https://fakeurl.com/certificates/PI-SZB-001',
    '2025-04-05 08:00:00+00',
    '2027-04-05 08:00:00+00',
    18
  ),
  (
    'DDT-KUL-001',
    'https://fakeurl.com/certificates/DDT-KUL-001',
    '2025-05-15 08:00:00+00',
    '2027-05-15 08:00:00+00',
    3
  ),
  (
    'II-PEN-001',
    'https://fakeurl.com/certificates/II-PEN-001',
    '2025-06-08 08:00:00+00',
    '2027-06-08 08:00:00+00',
    6
  ),
  (
    'DDT-LGK-001',
    'https://fakeurl.com/certificates/DDT-LGK-001',
    '2025-07-22 08:00:00+00',
    '2027-07-22 08:00:00+00',
    7
  ),
  (
    'II-KUL-002',
    'https://fakeurl.com/certificates/II-KUL-002',
    '2025-09-14 08:00:00+00',
    '2027-09-14 08:00:00+00',
    8
  ),
  (
    'DDT-PEN-002',
    'https://fakeurl.com/certificates/DDT-PEN-002',
    '2025-10-28 08:00:00+00',
    '2027-10-28 08:00:00+00',
    13
  ),
  (
    'PI-JHB-001',
    'https://fakeurl.com/certificates/PI-JHB-001',
    '2025-11-15 08:00:00+00',
    '2027-11-15 08:00:00+00',
    14
  ),
  -- 2026 cohort (includes renewals)
  (
    'DDT-BKI-002',
    'https://fakeurl.com/certificates/DDT-BKI-002',
    '2026-01-10 08:00:00+00',
    '2028-01-10 08:00:00+00',
    4
  ),
  (
    'PI-KUL-002',
    'https://fakeurl.com/certificates/PI-KUL-002',
    '2026-02-25 08:00:00+00',
    '2028-02-25 08:00:00+00',
    5
  ),
  (
    'II-BKI-001',
    'https://fakeurl.com/certificates/II-BKI-001',
    '2026-03-05 08:00:00+00',
    '2028-03-05 08:00:00+00',
    13
  ),
  (
    'DDT-BKI-003',
    'https://fakeurl.com/certificates/DDT-BKI-003',
    '2026-03-08 08:00:00+00',
    '2028-03-08 08:00:00+00',
    14
  );

-- -----------------------------------------------------------------------------
-- 5. TRAINING HISTORY – batch 1 (no renewed_from_id yet)
-- -----------------------------------------------------------------------------
INSERT INTO
  training_history (
    training_code,
    trainee_id,
    location_code,
    training_date,
    reviewed_date,
    certificate_id,
    reviewer_id,
    status,
    remarks,
    renewed_from_id
  )
VALUES
  (
    'PI',
    1,
    'PEN',
    '2026-03-09 17:12:33.20149+00',
    '2026-03-09 17:12:33.20149+00',
    'PI-PEN-001',
    2,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'II',
    2,
    'KUL',
    '2026-03-09 17:16:08.105808+00',
    '2026-03-09 17:16:08.105808+00',
    'II-KUL-001',
    1,
    'APPROVED',
    NULL,
    NULL
  ),
  -- 2024 cohort
  (
    'DDT',
    4,
    'BKI',
    '2024-06-15 08:00:00+00',
    '2024-06-16 09:00:00+00',
    'DDT-BKI-001',
    1,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'PI',
    5,
    'KUL',
    '2024-07-20 08:00:00+00',
    '2024-07-21 09:00:00+00',
    'PI-KUL-001',
    9,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'DDT',
    6,
    'PEN',
    '2024-08-10 08:00:00+00',
    '2024-08-11 09:00:00+00',
    'DDT-PEN-001',
    1,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'II',
    7,
    'JHB',
    '2024-09-05 08:00:00+00',
    '2024-09-06 09:00:00+00',
    'II-JHB-001',
    9,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'PI',
    8,
    'BKI',
    '2024-10-12 08:00:00+00',
    '2024-10-13 09:00:00+00',
    'PI-BKI-001',
    2,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'DDT',
    10,
    'KCH',
    '2024-11-18 08:00:00+00',
    '2024-11-19 09:00:00+00',
    'DDT-KCH-001',
    12,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'II',
    11,
    'SZB',
    '2024-12-03 08:00:00+00',
    '2024-12-04 09:00:00+00',
    'II-SZB-001',
    17,
    'APPROVED',
    NULL,
    NULL
  ),
  -- 2025 cohort
  (
    'PI',
    13,
    'LGK',
    '2025-01-14 08:00:00+00',
    '2025-01-15 09:00:00+00',
    'PI-LGK-001',
    5,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'DDT',
    14,
    'JHB',
    '2025-02-20 08:00:00+00',
    '2025-02-21 09:00:00+00',
    'DDT-JHB-001',
    12,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'II',
    15,
    'KCH',
    '2025-03-10 08:00:00+00',
    '2025-03-11 09:00:00+00',
    'II-KCH-001',
    9,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'PI',
    18,
    'SZB',
    '2025-04-05 08:00:00+00',
    '2025-04-06 09:00:00+00',
    'PI-SZB-001',
    2,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'DDT',
    3,
    'KUL',
    '2025-05-15 08:00:00+00',
    '2025-05-16 09:00:00+00',
    'DDT-KUL-001',
    1,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'II',
    6,
    'PEN',
    '2025-06-08 08:00:00+00',
    '2025-06-09 09:00:00+00',
    'II-PEN-001',
    17,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'DDT',
    7,
    'LGK',
    '2025-07-22 08:00:00+00',
    '2025-07-23 09:00:00+00',
    'DDT-LGK-001',
    5,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'II',
    8,
    'KUL',
    '2025-09-14 08:00:00+00',
    '2025-09-15 09:00:00+00',
    'II-KUL-002',
    1,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'DDT',
    13,
    'PEN',
    '2025-10-28 08:00:00+00',
    '2025-10-29 09:00:00+00',
    'DDT-PEN-002',
    12,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'PI',
    14,
    'JHB',
    '2025-11-15 08:00:00+00',
    '2025-11-16 09:00:00+00',
    'PI-JHB-001',
    17,
    'APPROVED',
    NULL,
    NULL
  ),
  -- Late 2025 – awaiting review
  (
    'DDT',
    11,
    'KUL',
    '2025-12-05 08:00:00+00',
    NULL,
    NULL,
    NULL,
    'PENDING',
    NULL,
    NULL
  ),
  (
    'PI',
    15,
    'KUL',
    '2026-01-18 08:00:00+00',
    NULL,
    NULL,
    NULL,
    'PENDING',
    NULL,
    NULL
  );

-- -----------------------------------------------------------------------------
-- 6. TRAINING HISTORY – batch 2
-- -----------------------------------------------------------------------------
INSERT INTO
  training_history (
    training_code,
    trainee_id,
    location_code,
    training_date,
    reviewed_date,
    certificate_id,
    reviewer_id,
    status,
    remarks,
    renewed_from_id
  )
VALUES
  -- Renewals
  (
    'DDT',
    4,
    'BKI',
    '2026-01-10 08:00:00+00',
    '2026-01-11 09:00:00+00',
    'DDT-BKI-002',
    9,
    'APPROVED',
    NULL,
    3
  ),
  (
    'PI',
    5,
    'KUL',
    '2026-02-25 08:00:00+00',
    '2026-02-26 09:00:00+00',
    'PI-KUL-002',
    1,
    'APPROVED',
    NULL,
    4
  ),
  -- Rejected
  (
    'DDT',
    18,
    'KCH',
    '2026-02-03 08:00:00+00',
    '2026-02-04 09:00:00+00',
    NULL,
    9,
    'REJECTED',
    'Failed assessment criteria.',
    NULL
  ),
  -- Pending
  (
    'PI',
    10,
    'SZB',
    '2026-02-20 08:00:00+00',
    NULL,
    NULL,
    NULL,
    'PENDING',
    NULL,
    NULL
  ),
  (
    'DDT',
    16,
    'KUL',
    '2026-03-01 08:00:00+00',
    NULL,
    NULL,
    NULL,
    'PENDING',
    NULL,
    NULL
  ),
  -- Recent approvals
  (
    'II',
    13,
    'BKI',
    '2026-03-05 08:00:00+00',
    '2026-03-06 09:00:00+00',
    'II-BKI-001',
    5,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'DDT',
    14,
    'BKI',
    '2026-03-08 08:00:00+00',
    '2026-03-09 09:00:00+00',
    'DDT-BKI-003',
    12,
    'APPROVED',
    NULL,
    NULL
  );

-- -----------------------------------------------------------------------------
-- 7. CERTIFICATES – batch 2: 13 new entries to extend running numbers
-- -----------------------------------------------------------------------------
INSERT INTO
  certificate (id, path, issued_date, expiry_date, issued_to)
VALUES
  -- II-JHB: 001 existed → 002 (new trainee)
  (
    'II-JHB-002',
    'https://fakeurl.com/certificates/II-JHB-002',
    '2025-04-16 08:00:00+00',
    '2027-04-16 08:00:00+00',
    10
  ),
  -- PI-BKI: 001 existed → 002, 003 (two more trainees)
  (
    'PI-BKI-002',
    'https://fakeurl.com/certificates/PI-BKI-002',
    '2025-05-21 08:00:00+00',
    '2027-05-21 08:00:00+00',
    13
  ),
  (
    'PI-BKI-003',
    'https://fakeurl.com/certificates/PI-BKI-003',
    '2025-08-31 08:00:00+00',
    '2027-08-31 08:00:00+00',
    18
  ),
  -- DDT-KCH: 001 existed → 002, 003 (two more trainees)
  (
    'DDT-KCH-002',
    'https://fakeurl.com/certificates/DDT-KCH-002',
    '2025-06-13 08:00:00+00',
    '2027-06-13 08:00:00+00',
    16
  ),
  (
    'DDT-KCH-003',
    'https://fakeurl.com/certificates/DDT-KCH-003',
    '2025-11-06 08:00:00+00',
    '2027-11-06 08:00:00+00',
    4
  ),
  -- PI-LGK: 001 existed → 002, 003
  (
    'PI-LGK-002',
    'https://fakeurl.com/certificates/PI-LGK-002',
    '2025-09-21 08:00:00+00',
    '2027-09-21 08:00:00+00',
    6
  ),
  (
    'PI-LGK-003',
    'https://fakeurl.com/certificates/PI-LGK-003',
    '2026-01-26 08:00:00+00',
    '2028-01-26 08:00:00+00',
    11
  ),
  -- DDT-JHB: 001 existed → 002 (new trainee; 003 will be a renewal inserted next batch)
  (
    'DDT-JHB-002',
    'https://fakeurl.com/certificates/DDT-JHB-002',
    '2025-07-06 08:00:00+00',
    '2027-07-06 08:00:00+00',
    7
  ),
  -- II-KCH: 001 existed → 002
  (
    'II-KCH-002',
    'https://fakeurl.com/certificates/II-KCH-002',
    '2025-08-19 08:00:00+00',
    '2027-08-19 08:00:00+00',
    4
  ),
  -- PI-PEN: 001 in existing DB → 002, 003 (new trainees)
  (
    'PI-PEN-002',
    'https://fakeurl.com/certificates/PI-PEN-002',
    '2025-12-01 08:00:00+00',
    '2027-12-01 08:00:00+00',
    7
  ),
  (
    'PI-PEN-003',
    'https://fakeurl.com/certificates/PI-PEN-003',
    '2026-03-07 08:00:00+00',
    '2028-03-07 08:00:00+00',
    13
  ),
  -- DDT-KUL: 001 existed → 002, 003
  (
    'DDT-KUL-002',
    'https://fakeurl.com/certificates/DDT-KUL-002',
    '2025-11-11 08:00:00+00',
    '2027-11-11 08:00:00+00',
    10
  ),
  (
    'DDT-KUL-003',
    'https://fakeurl.com/certificates/DDT-KUL-003',
    '2026-02-19 08:00:00+00',
    '2028-02-19 08:00:00+00',
    18
  );

-- -----------------------------------------------------------------------------
-- 8. CERTIFICATES – batch 3: renewal certs
-- -----------------------------------------------------------------------------
INSERT INTO
  certificate (id, path, issued_date, expiry_date, issued_to)
VALUES
  -- II-JHB-003: emp 10 renews their own II-JHB-002
  (
    'II-JHB-003',
    'https://fakeurl.com/certificates/II-JHB-003',
    '2026-03-08 08:00:00+00',
    '2028-03-08 08:00:00+00',
    10
  ),
  -- DDT-JHB-003: emp 7 renews their own DDT-JHB-002
  (
    'DDT-JHB-003',
    'https://fakeurl.com/certificates/DDT-JHB-003',
    '2026-03-09 08:00:00+00',
    '2028-03-09 08:00:00+00',
    7
  );

-- -----------------------------------------------------------------------------
-- 9. TRAINING HISTORY – batch 3 (no self-refs)
-- -----------------------------------------------------------------------------
INSERT INTO
  training_history (
    training_code,
    trainee_id,
    location_code,
    training_date,
    reviewed_date,
    certificate_id,
    reviewer_id,
    status,
    remarks,
    renewed_from_id
  )
VALUES
  -- II-JHB sequence continues
  (
    'II',
    10,
    'JHB',
    '2025-04-15 08:00:00+00',
    '2025-04-16 09:00:00+00',
    'II-JHB-002',
    1,
    'APPROVED',
    NULL,
    NULL
  ),
  -- PI-BKI sequence continues
  (
    'PI',
    13,
    'BKI',
    '2025-05-20 08:00:00+00',
    '2025-05-21 09:00:00+00',
    'PI-BKI-002',
    2,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'PI',
    18,
    'BKI',
    '2025-08-30 08:00:00+00',
    '2025-08-31 09:00:00+00',
    'PI-BKI-003',
    9,
    'APPROVED',
    NULL,
    NULL
  ),
  -- DDT-KCH sequence continues
  (
    'DDT',
    16,
    'KCH',
    '2025-06-12 08:00:00+00',
    '2025-06-13 09:00:00+00',
    'DDT-KCH-002',
    12,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'DDT',
    4,
    'KCH',
    '2025-11-05 08:00:00+00',
    '2025-11-06 09:00:00+00',
    'DDT-KCH-003',
    5,
    'APPROVED',
    NULL,
    NULL
  ),
  -- PI-LGK sequence continues
  (
    'PI',
    6,
    'LGK',
    '2025-09-20 08:00:00+00',
    '2025-09-21 09:00:00+00',
    'PI-LGK-002',
    9,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'PI',
    11,
    'LGK',
    '2026-01-25 08:00:00+00',
    '2026-01-26 09:00:00+00',
    'PI-LGK-003',
    17,
    'APPROVED',
    NULL,
    NULL
  ),
  -- DDT-JHB-002 (003 will be a renewal in batch 4)
  (
    'DDT',
    7,
    'JHB',
    '2025-07-05 08:00:00+00',
    '2025-07-06 09:00:00+00',
    'DDT-JHB-002',
    12,
    'APPROVED',
    NULL,
    NULL
  ),
  -- II-KCH sequence continues
  (
    'II',
    4,
    'KCH',
    '2025-08-18 08:00:00+00',
    '2025-08-19 09:00:00+00',
    'II-KCH-002',
    5,
    'APPROVED',
    NULL,
    NULL
  ),
  -- PI-PEN sequence continues
  (
    'PI',
    7,
    'PEN',
    '2025-11-30 08:00:00+00',
    '2025-12-01 09:00:00+00',
    'PI-PEN-002',
    1,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'PI',
    13,
    'PEN',
    '2026-03-07 08:00:00+00',
    '2026-03-07 09:00:00+00',
    'PI-PEN-003',
    2,
    'APPROVED',
    NULL,
    NULL
  ),
  -- DDT-KUL sequence continues
  (
    'DDT',
    10,
    'KUL',
    '2025-11-10 08:00:00+00',
    '2025-11-11 09:00:00+00',
    'DDT-KUL-002',
    1,
    'APPROVED',
    NULL,
    NULL
  ),
  (
    'DDT',
    18,
    'KUL',
    '2026-02-18 08:00:00+00',
    '2026-02-19 09:00:00+00',
    'DDT-KUL-003',
    9,
    'APPROVED',
    NULL,
    NULL
  );

-- -----------------------------------------------------------------------------
-- 10. TRAINING HISTORY – batch 4 (renewals referencing batch 3)
-- -----------------------------------------------------------------------------
INSERT INTO
  training_history (
    training_code,
    trainee_id,
    location_code,
    training_date,
    reviewed_date,
    certificate_id,
    reviewer_id,
    status,
    remarks,
    renewed_from_id
  )
VALUES
  -- emp 10 renews II-JHB (cert 002 → 003)
  (
    'II',
    10,
    'JHB',
    '2026-03-08 08:00:00+00',
    '2026-03-08 09:00:00+00',
    'II-JHB-003',
    9,
    'APPROVED',
    NULL,
    29
  ),
  -- emp 7 renews DDT-JHB (cert 002 → 003)
  (
    'DDT',
    7,
    'JHB',
    '2026-03-09 08:00:00+00',
    '2026-03-09 09:00:00+00',
    'DDT-JHB-003',
    12,
    'APPROVED',
    NULL,
    36
  );

COMMIT;