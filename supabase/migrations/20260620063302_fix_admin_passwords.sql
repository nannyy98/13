-- Update admin accounts with fresh bcrypt hashes
UPDATE admin_accounts
SET password_hash = crypt('Admin123', gen_salt('bf'))
WHERE email = 'admin@shop.uz';

UPDATE admin_accounts
SET password_hash = crypt('Manager123', gen_salt('bf'))
WHERE email = 'manager@shop.uz';

UPDATE admin_accounts
SET password_hash = crypt('Seller123', gen_salt('bf'))
WHERE email = 'seller@shop.uz';

-- Update plain text for fallback
UPDATE admin_accounts SET password_plain = 'Admin123' WHERE email = 'admin@shop.uz';
UPDATE admin_accounts SET password_plain = 'Manager123' WHERE email = 'manager@shop.uz';
UPDATE admin_accounts SET password_plain = 'Seller123' WHERE email = 'seller@shop.uz';