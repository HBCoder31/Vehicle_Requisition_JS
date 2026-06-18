USE vehicle_requisition_portal;
UPDATE employees SET password_hash = '$2b$10$i3dx.c7xKonwpc78vnzQh.2jMtUrbwmX0if8iYZIKpIDP81W/dqzG' WHERE email IN ('admin@test.com', 'john@test.com', 'hod@test.com', 'coo@test.com', 'garage@test.com');
