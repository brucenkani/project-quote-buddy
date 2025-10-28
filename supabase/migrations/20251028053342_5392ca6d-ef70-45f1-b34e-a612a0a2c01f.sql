
-- Insert existing payment records from journal entries
-- Payment for INV-00001 (1150)
INSERT INTO invoice_payments (id, invoice_id, user_id, company_id, amount, date, method, reference)
VALUES (
  gen_random_uuid(),
  '3137329e-0673-48fe-bcad-32c6c92703a1', -- INV-00001
  '3ec5da87-15bd-4300-8be2-b8ef7d9d3f95',
  'bdb49a9b-c62c-47bf-907f-1bfb8a5fc982',
  1150,
  '2025-10-27',
  'Bank Transfer',
  'PAY-INV-00001'
);

-- Payment for INV-00002 (2300)
INSERT INTO invoice_payments (id, invoice_id, user_id, company_id, amount, date, method, reference)
VALUES (
  gen_random_uuid(),
  'f1427a16-39a9-4428-b5f9-4ab0f24c4de4', -- INV-00002
  '3ec5da87-15bd-4300-8be2-b8ef7d9d3f95',
  'bdb49a9b-c62c-47bf-907f-1bfb8a5fc982',
  2300,
  '2025-10-27',
  'Bank Transfer',
  'PAY-INV-00002'
);
