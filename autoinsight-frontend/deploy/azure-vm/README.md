# Azure VM deployment guide for AutoInsight

This folder contains a first-pass production setup for running the project on one Azure Linux VM.

## Architecture

- `nginx` serves the React frontend build.
- `gunicorn` runs the Flask backend on `127.0.0.1:5000`.
- `nginx` proxies `/api/*` requests to the backend.
- MongoDB can stay on MongoDB Atlas or move later.

## Files in this folder

- `autoinsight.conf`: nginx site config for the frontend and `/api` proxy.
- `autoinsight-backend.service`: `systemd` service for the Flask backend.
- `../../backend/.env.production.example`: production backend environment template.

## 1. Create the Azure VM

Recommended choices for a first deployment:

- OS: Ubuntu 24.04 LTS
- Size: `B2s` to start
- Public inbound ports: `22`, `80`, `443`
- Authentication: SSH key if possible

After creation, connect with:

```bash
ssh azureuser@YOUR_VM_PUBLIC_IP
```

## 2. Install base packages

```bash
sudo apt update
sudo apt install -y nginx python3 python3-venv python3-pip nodejs npm git
```

If you want live scraping in production, also install Chromium:

```bash
sudo apt install -y chromium-browser
```

If `chromium-browser` is unavailable on your Ubuntu image, install the available Chromium package and set the browser path in the environment later.

## 3. Prepare folders on the VM

```bash
sudo mkdir -p /var/www/autoinsight
sudo mkdir -p /var/lib/autoinsight/data
sudo mkdir -p /var/lib/autoinsight/manual
sudo mkdir -p /etc/autoinsight
sudo chown -R $USER:$USER /var/www/autoinsight
sudo chown -R www-data:www-data /var/lib/autoinsight
sudo chmod -R 775 /var/lib/autoinsight
```

## 4. Copy the project to the VM

Option A: clone from GitHub on the server

```bash
cd /var/www/autoinsight
git clone YOUR_REPO_URL app
```

Option B: upload the project from your computer with `scp` or VS Code remote SSH.

The guide below assumes the project ends up at:

```text
/var/www/autoinsight/app
```

## 5. Create the Python virtual environment

```bash
cd /var/www/autoinsight/app/autoinsight-frontend/backend
python3 -m venv /var/www/autoinsight/venv
source /var/www/autoinsight/venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## 6. Install frontend dependencies and build

```bash
cd /var/www/autoinsight/app/autoinsight-frontend/auto-frontend
npm install
npm run build
```

This creates the frontend files in:

```text
/var/www/autoinsight/app/autoinsight-frontend/auto-frontend/dist
```

## 7. Create the backend environment file

Copy the template from the repo:

```bash
sudo cp /var/www/autoinsight/app/autoinsight-frontend/backend/.env.production.example /etc/autoinsight/backend.env
sudo nano /etc/autoinsight/backend.env
```

Minimum changes to make:

- Set `MONGODB_URI`
- Decide whether `PIPELINE_SOURCE_MODE` is `manual` or `scrape`
- Keep `ENABLE_PIPELINE_SCHEDULER=false`

For a first deployment, `manual` is the easiest and most stable option.

If you choose `manual`, copy your JSON file to:

```bash
sudo cp /var/www/autoinsight/app/autoinsight-frontend/auto-frontend/src/data/scraped_vehicles_20_03_2026.json /var/lib/autoinsight/manual/scraped_vehicles.json
sudo chown www-data:www-data /var/lib/autoinsight/manual/scraped_vehicles.json
```

## 8. Install the systemd backend service

```bash
sudo cp /var/www/autoinsight/app/autoinsight-frontend/deploy/azure-vm/autoinsight-backend.service /etc/systemd/system/autoinsight-backend.service
sudo systemctl daemon-reload
sudo systemctl enable autoinsight-backend
sudo systemctl start autoinsight-backend
sudo systemctl status autoinsight-backend
```

Useful logs:

```bash
journalctl -u autoinsight-backend -n 100 --no-pager
```

## 9. Install the nginx site

```bash
sudo cp /var/www/autoinsight/app/autoinsight-frontend/deploy/azure-vm/autoinsight.conf /etc/nginx/sites-available/autoinsight
sudo ln -s /etc/nginx/sites-available/autoinsight /etc/nginx/sites-enabled/autoinsight
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

At this point the app should open over HTTP at:

```text
http://YOUR_VM_PUBLIC_IP
```

## 10. Add a domain name

In your DNS provider:

- Create an `A` record for your domain or subdomain
- Point it to the VM public IP

Examples:

- `autoinsight.yourdomain.com -> YOUR_VM_PUBLIC_IP`
- `www.yourdomain.com -> YOUR_VM_PUBLIC_IP`

## 11. Enable HTTPS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN
```

Follow the prompts. Certbot will update nginx and set up auto-renewal.

## 12. Test the backend health endpoint

```bash
curl http://127.0.0.1:5000/api/health
curl http://YOUR_DOMAIN/api/health
```

You should get JSON back from both.

## 13. Update the app after code changes

```bash
cd /var/www/autoinsight/app
git pull
source /var/www/autoinsight/venv/bin/activate
cd /var/www/autoinsight/app/autoinsight-frontend/backend
pip install -r requirements.txt
cd /var/www/autoinsight/app/autoinsight-frontend/auto-frontend
npm install
npm run build
sudo systemctl restart autoinsight-backend
sudo systemctl restart nginx
```

## 14. Recommended production settings

- Keep the backend bound to `127.0.0.1:5000`
- Only expose `80/443` publicly
- Use `manual` mode first, then move to `scrape` if needed
- Store secrets only in `/etc/autoinsight/backend.env`
- Rotate the MongoDB password that is currently in the tracked `.env`

## 15. Troubleshooting

If the homepage loads but API requests fail:

- check `journalctl -u autoinsight-backend -n 100 --no-pager`
- check `sudo nginx -t`
- check `sudo tail -n 100 /var/log/nginx/error.log`

If frontend routes like `/vehicle/...` show 404:

- verify nginx is using the provided `try_files $uri $uri/ /index.html;`

If the backend fails on startup in `scrape` mode:

- make sure Chromium is installed
- make sure Selenium packages are installed from `requirements.txt`
- switch to `PIPELINE_SOURCE_MODE=manual` to get the first release live faster
