# Restaurant Management System

Backend system developed using Node.js + Postgresql for managing restaurants.

Postman Collection link (import): https://www.getpostman.com/collections/82394d3d16385781f4b2

**Postgresql DB is expired (AWS), so you need to create a new one and edit the connection string accordingly**

Prepopulated with an admin user : empNo:"0001", "password":fahad1994.

Call login_user with these credentials and then use access_token in all subsequent calls.


**DB Structure**:


db_users: id (pk), name, password, access_token, role


db_tables: id(pk), table_no, no_of_seats, is_active


db_reservations: id(pk), table_no, time_start, time_end, 



**Things completed:**
Add user.
Login user.
Check roles.
Add table.
Delete table.
Get tables.
Get available time slots.


**Things to be done:**


Make/Delete a reservation


Redis caching


Security protocols


Flow chart

