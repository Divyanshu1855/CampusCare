# CampusCare — College Complaint Portal

A mini-project combining React, Node.js/Express, MongoDB, Docker, Jenkins CI/CD, and AWS EC2.

## Features
- Create and list college facility complaints
- Filter by status and category
- Update complaint status and priority (demo admin controls)
- Delete a complaint
- MongoDB persistence using a named Docker volume
- Docker Compose deployment
- Jenkins pipeline for build, test, and redeploy

> Academic demo: the admin controls are not protected by authentication. Do not expose this as a production system without authentication, authorization, input/rate limiting, TLS, and secret management.

## Requirements
- Node.js 20+ and npm (local development)
- Git
- Docker Desktop (Windows/macOS) or Docker Engine + Compose plugin (Ubuntu)
- GitHub account and repository
- AWS account with permission to create an EC2 instance and security group
- Jenkins installed on the EC2 host for the included deployment pipeline

## 1. Run locally without Docker

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
Set `MONGODB_URI=mongodb://127.0.0.1:27017/campuscare` in `backend/.env` if MongoDB is installed locally.

### Frontend
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL shown in the terminal. The frontend's Vite proxy forwards `/api` to `http://localhost:5000`.

## 2. Run with Docker Compose
From the repository root:
```bash
docker compose up --build -d
docker compose ps
docker compose logs -f
```
Open `http://localhost`. Stop:
```bash
docker compose down
```
Stop and remove the database volume (DELETES saved complaints):
```bash
docker compose down -v
```

## 3. GitHub
Create an empty GitHub repository, then from the project root:
```bash
git init
git add .
git commit -m "Initial CampusCare project"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/CampusCare.git
git push -u origin main
```
Replace `YOUR_USERNAME` and repository URL with your own.

## 4. EC2 setup (Ubuntu 24.04 recommended)
Launch an instance and allow inbound:
- TCP 22 from **your IP only**
- TCP 80 from `0.0.0.0/0`
- TCP 8080 from **your IP only** while setting up Jenkins; avoid public exposure
- Do not expose MongoDB port 27017 or backend port 5000 publicly

SSH into the instance, then install Docker:
```bash
sudo apt update
sudo apt install -y ca-certificates curl git fontconfig openjdk-17-jre
# Install Node.js 20 for the Jenkins pipeline's npm test/build stages
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu
```
Log out and SSH in again for the Docker group change to take effect. Verify:
```bash
docker --version
docker compose version
```

## 5. Install Jenkins on EC2
```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo wget -O /etc/apt/keyrings/jenkins-keyring.asc https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key
echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update
sudo apt install -y jenkins
sudo systemctl enable --now jenkins
```

Allow Jenkins to run Docker commands. This gives Jenkins high privileges on the host, so use a dedicated lab EC2 instance and never run untrusted pipelines:
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```
The included Jenkinsfile runs `docker compose` on the same EC2 host. Install the Docker CLI/Compose plugin on the host as above.

Get initial password:
```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```
Open `http://EC2_PUBLIC_IP:8080` from your allowed IP, unlock Jenkins, install suggested plugins, and create an admin account.

## 6. Create Jenkins pipeline
1. In Jenkins, choose **New Item**.
2. Name it `CampusCare-CI-CD`, choose **Pipeline**, and click OK.
3. Under Pipeline, select **Pipeline script from SCM**.
4. SCM: **Git**. Repository URL: your public GitHub repository URL.
5. Branch: `*/main`; Script Path: `Jenkinsfile`.
6. Save, then click **Build Now**.
7. The pipeline checks out the repository, runs backend tests, builds the frontend, builds Docker images, and runs `docker compose up -d --build`.
8. Check the Jenkins Console Output and open `http://EC2_PUBLIC_IP`.

The Jenkinsfile uses polling (`H/2 * * * *`) to detect changes. This avoids requiring a public GitHub webhook. Jenkins must be running and able to reach GitHub.

## 7. Verify deployment
```bash
docker compose ps
docker compose logs --tail=100
curl http://localhost/api/health
```
Then open `http://EC2_PUBLIC_IP` in a browser.

## Troubleshooting
- **Site doesn't load:** confirm EC2 security group allows TCP 80 and `docker compose ps` shows frontend running.
- **API returns 502:** inspect `docker compose logs backend frontend`; verify the backend is healthy and the Nginx proxy uses service name `backend`.
- **MongoDB connection errors:** inspect `docker compose logs mongo backend`; Compose starts the backend after MongoDB health check.
- **Jenkins permission denied on Docker socket:** run `sudo usermod -aG docker jenkins`, then `sudo systemctl restart jenkins`; verify group membership and inspect `/var/run/docker.sock`.
- **Changes aren't deploying:** click Build Now; inspect Console Output. Polling may take a couple of minutes.
- **Complaints disappear:** do not use `docker compose down -v`; that deletes the named MongoDB volume.

## Suggested practical demonstration
1. Submit a complaint from the browser.
2. Show the complaint in the dashboard and change its status.
3. Run `docker compose ps` to show the containers.
4. Show the Jenkins pipeline stages and a successful build.
5. Change a small UI label, commit and push it to GitHub, then trigger or wait for Jenkins.
6. Open the EC2 public address and show the updated UI.
