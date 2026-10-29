# CBT System - Network Setup & Multi-Admin Configuration Guide

## Table of Contents
1. [Local Network (LAN) Access](#local-network-lan-access)
2. [Internet (WAN) Access](#internet-wan-access)
3. [Multi-Admin Setup](#multi-admin-setup)
4. [Security Considerations](#security-considerations)
5. [Troubleshooting](#troubleshooting)

---

## Local Network (LAN) Access

### Overview
The CBT system is now configured to allow computers on your local network to access the exam system. This is useful for schools or training centers where all devices are connected to the same router.

### Server Configuration
The server is configured to listen on all network interfaces (`0.0.0.0`) by default. This is set in:
- `.env` file: `HOST=0.0.0.0`
- `app.js`: Listens on the configured HOST

### Finding Your Local IP Address

**On Windows:**
```cmd
ipconfig | findstr /i "IPv4"
```
Look for an address like `192.168.1.100` or `10.0.0.50`

**On Mac/Linux:**
```bash
ifconfig | grep "inet "
```
or
```bash
hostname -I
```

### Accessing from Other Computers

Once you have your server's local IP address (e.g., `192.168.1.100`), other computers on the same network can access the CBT system by navigating to:

```
http://192.168.1.100:3000
```

### Firewall Configuration

**Windows Firewall:**
1. Open "Windows Defender Firewall with Advanced Security"
2. Click "Inbound Rules" → "New Rule"
3. Select "Port" → Next
4. Enter `3000` in "Specific local ports"
5. Select "Allow the connection"
6. Check all profiles (Domain, Private, Public)
7. Name it "CBT System" and finish

**Alternatively, using Command Prompt (Admin):**
```cmd
netsh advfirewall firewall add rule name="CBT System" dir=in action=allow protocol=TCP localport=3000
```

### Testing LAN Access
1. Start the CBT server: `npm start`
2. From another computer on the same network, open a browser
3. Navigate to `http://<your-server-ip>:3000`
4. You should see the login page

---

## Internet (WAN) Access

### Overview
Do not forward the Node.js application port (3000) directly to the public internet. The app does not terminate TLS itself, so direct HTTP access would expose credentials and session cookies.

### Recommended deployment
1. Put the application behind a maintained HTTPS reverse proxy or private access tunnel.
2. Keep port 3000 reachable only by the proxy and trusted local devices.
3. Set `NODE_ENV=production`, a unique `SESSION_SECRET` (at least 32 characters), and `TRUST_PROXY=true` when HTTPS terminates at the trusted proxy.
4. Publish only the proxy's HTTPS endpoint. Configure DNS or DDNS to point to that endpoint if needed.

For school-only LAN use, follow the LAN instructions above and limit access to the private network with firewall rules.

---

## Multi-Admin Setup

### Overview
The CBT system now supports multiple admins, where each student can be assigned to a specific admin. Results for students will only be visible to their assigned admin.

### Creating Admin Accounts

Admin accounts are created directly in the database. Use this SQL:

```sql
USE cbt_db;

-- Create first admin
INSERT INTO admin_users (username, password_hash) 
VALUES ('admin1', '$2b$10$YourHashedPasswordHere');

-- Create second admin
INSERT INTO admin_users (username, password_hash) 
VALUES ('admin2', '$2b$10$YourHashedPasswordHere');
```

### Generating Password Hashes

Use bcrypt to generate password hashes. Create a simple script:

```javascript
// generate-password.js
const bcrypt = require('bcrypt');
const password = 'your-secure-password';
const saltRounds = 10;

bcrypt.hash(password, saltRounds).then(hash => {
  console.log('Password hash:', hash);
});
```

Run with: `node generate-password.js`

### Assigning Students to Admins

**Method 1: During Student Creation**
1. Log in as an admin
2. Go to Admin Dashboard
3. In "Add Student" form, select an admin from the "Assign to Admin" dropdown
4. Create the student

**Method 2: Reassign Existing Students**
1. Log in as an admin
2. Go to Admin Dashboard
3. Use the "Assign Student to Admin" form
4. Enter student registration number
5. Select the admin to assign
6. Click "Assign Student"

### Viewing Results by Admin

1. Log in as an admin
2. Go to Admin Dashboard
3. Click "Load Results" in the "Student Results" section
4. You'll only see results for students assigned to you (or unassigned students)
5. Use the "Filter by Exam" dropdown to see specific exam results

### Admin Permissions

- **Regular Admin**: Can only see and manage students assigned to them
- **Unassigned Students**: Visible to all admins
- **All Admins**: Can create exams and questions (shared across all admins)

---

## Security Considerations

### 1. Use HTTPS for Internet Access
For internet access, HTTPS is strongly recommended:

```bash
# Install a reverse proxy like Nginx with Let's Encrypt SSL
# Or use a service like Cloudflare Tunnel
```

### 2. Strong Passwords
- Use strong, unique passwords for all admin accounts
- Minimum 12 characters with mixed case, numbers, and symbols

### 3. Change Default Secrets
Update the session secret in `.env`:
```
SESSION_SECRET=your-very-secure-random-string-here
```

### 4. Firewall Rules
- Only open necessary ports
- Consider restricting access by IP if possible

### 5. Regular Updates
- Keep Node.js and dependencies updated
- Run `npm audit fix` regularly

### 6. Database Security
- Use a strong MySQL root password
- Consider creating a dedicated database user for the CBT system

---

## Troubleshooting

### Cannot Access from Other Computers (LAN)

1. **Check if server is running:**
   ```bash
   netstat -an | findstr :3000
   ```
   Should show `LISTENING`

2. **Verify firewall allows port 3000:**
   ```bash
   netsh advfirewall firewall show rule name="CBT System"
   ```

3. **Test locally first:**
   - On server: `http://localhost:3000`
   - On server: `http://<your-local-ip>:3000`

### Cannot Access from Internet (WAN)

1. Confirm the HTTPS reverse proxy or private tunnel is running and its certificate is valid.
2. Check that the proxy can reach the app on its private host and port.
3. Check DNS or DDNS points to the proxy endpoint. Do not expose port 3000 directly.

### Database Connection Issues

1. **Check MySQL is running:**
   ```bash
   netstat -an | findstr :3306
   ```

2. **Verify credentials in .env:**
   - DB_USER
   - DB_PASSWORD
   - DB_NAME

3. **Reinitialize database:**
   ```bash
   npm run init-db
   ```

### Admin Cannot See Student Results

1. **Verify student is assigned to admin:**
   ```sql
   SELECT registration_number, name, admin_id 
   FROM students 
   WHERE registration_number = 'STO1-001A';
   ```

2. **Check admin ID:**
   ```sql
   SELECT id, username FROM admin_users;
   ```

3. **Ensure student has taken an exam:**
   ```sql
   SELECT * FROM exam_attempts 
   WHERE registration_number = 'STO1-001A';
   ```

---

## Quick Reference

### Starting the Server
```bash
npm.cmd start
```
In PowerShell, use `npm.cmd` to avoid execution-policy errors from the `npm.ps1` shim.

### Finding Local IP
- Windows: `ipconfig | findstr /i "IPv4"`
- Mac/Linux: `ifconfig | grep "inet "`

### Adding Firewall Rule (Windows)
```cmd
netsh advfirewall firewall add rule name="CBT System" dir=in action=allow protocol=TCP localport=3000
```

### Environment Variables
- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: 0.0.0.0)
- `DB_HOST`: MySQL host (default: 127.0.0.1)
- `DB_PORT`: MySQL port (default: 3306)
- `DB_USER`: MySQL username
- `DB_PASSWORD`: MySQL password
- `DB_NAME`: Database name (default: cbt_db)

---

## Support

For issues or questions:
1. Check the logs in the terminal where the server is running
2. Review this documentation
3. Check the MySQL error logs if database issues occur
