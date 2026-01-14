# AWS EC2 File Upload Configuration

## Backend Changes Made

### 1. Multer Configuration (src/routes/songs.ts)
- **File size limit**: Increased to 100MB
- **Field size limit**: Increased to 100MB  
- **Max files**: 2 (audio + cover)

### 2. Express Body Parser (src/server.ts)
- **JSON limit**: Increased to 100MB
- **URL-encoded limit**: Increased to 100MB

## Additional AWS EC2 Configuration Needed

### If Using Nginx as Reverse Proxy

Add this to your Nginx configuration file (usually `/etc/nginx/nginx.conf` or `/etc/nginx/sites-available/your-app`):

```nginx
http {
    # Increase client body size limit to 100MB
    client_max_body_size 100M;
    
    # Increase timeouts for large uploads
    client_body_timeout 300s;
    client_header_timeout 300s;
    send_timeout 300s;
    proxy_read_timeout 300s;
    
    server {
        listen 80;
        server_name api.thecrafthindustan.in;
        
        location / {
            proxy_pass http://localhost:4000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            
            # Important for file uploads
            proxy_request_buffering off;
        }
    }
}
```

After editing, restart Nginx:
```bash
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### If Using Apache as Reverse Proxy

Add to your Apache configuration:

```apache
<VirtualHost *:80>
    ServerName api.thecrafthindustan.in
    
    # Increase upload limit to 100MB
    LimitRequestBody 104857600
    
    ProxyPass / http://localhost:4000/
    ProxyPassReverse / http://localhost:4000/
</VirtualHost>
```

Restart Apache:
```bash
sudo systemctl restart apache2
```

### Node.js Process Configuration

If running Node.js directly or with PM2, ensure enough memory:

**PM2 ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'audioly-backend',
    script: './dist/server.js',
    instances: 1,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    }
  }]
}
```

## Deployment Steps

1. **Rebuild the backend:**
   ```bash
   cd backend
   npm run build
   ```

2. **Restart your Node.js server:**
   
   If using PM2:
   ```bash
   pm2 restart audioly-backend
   ```
   
   If using systemd:
   ```bash
   sudo systemctl restart your-app-name
   ```

3. **Test the upload:**
   - Try uploading a file under 100MB
   - Check server logs for any errors

## Troubleshooting

### Still getting 413 errors?

1. **Check Nginx/Apache logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   # or
   sudo tail -f /var/log/apache2/error.log
   ```

2. **Check Node.js logs:**
   ```bash
   pm2 logs audioly-backend
   # or
   journalctl -u your-app-name -f
   ```

3. **Verify configuration:**
   - Ensure all changes are deployed
   - Confirm reverse proxy is properly configured
   - Check EC2 security groups allow traffic

### Memory Issues on t3.micro?

t3.micro has only 1GB RAM. For large uploads:
- Consider upgrading to t3.small (2GB RAM)
- Or implement chunked uploads
- Or use direct S3 uploads with presigned URLs

## Recommended: Direct S3 Upload

For better performance and to avoid EC2 memory issues, consider implementing direct S3 uploads:

1. Generate presigned URLs from backend
2. Upload files directly from client to S3
3. Send only metadata to backend

This bypasses the EC2 instance entirely for file uploads.
