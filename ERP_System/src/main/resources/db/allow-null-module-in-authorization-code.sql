-- Allow null module_id in authorization_code for generic organization ERP login
ALTER TABLE authorization_code ALTER COLUMN module_id DROP NOT NULL;
