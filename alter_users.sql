ALTER TABLE users MODIFY COLUMN contact_number varchar(15) DEFAULT '';
ALTER TABLE users MODIFY COLUMN date_join date DEFAULT '2020-01-01';
ALTER TABLE users MODIFY COLUMN address varchar(512) DEFAULT '';
ALTER TABLE users MODIFY COLUMN photo_path varchar(255) DEFAULT '';
