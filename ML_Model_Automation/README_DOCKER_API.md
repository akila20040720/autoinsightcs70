AutoInsight Scraper API (Docker)

This service scrapes Riyasewana listings with filters and exposes an API.

Implemented filters:
- make
- model
- year
- vehicle types (cars, vans, pickups, suvs)

Default scrape behavior:
- types defaults to cars
- max_pages_per_type defaults to 3

Endpoints:
- GET /health
- GET /vehicle-types
- POST /scrape
- GET /vehicles

Local run with Docker:

1) Open terminal in this folder:
   cd "d:\AutoInsight Dashboard\autoinsightcs70\ML_Model\ML_Model_Automation"

2) Build image:
   docker build -t autoinsight-scraper-api:local .

3) Run container:
   docker run --rm -p 8000:8000 -v "${PWD}/output:/app/output" autoinsight-scraper-api:local

4) Verify service:
   http://localhost:8000/health

Example: scrape with filters (make/model/year)

PowerShell:
$body = @{
  types = @("cars")
  make = "Toyota"
  model = "Axio"
  year = "2018"
  max_pages_per_type = 1
  delay_seconds = 1
  headless = $true
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:8000/scrape" -Body $body -ContentType "application/json"

Note about logs like "added 0, total 1":
- This means pages were scraped, but no new unique rows were added for that vehicle type.
- Common reasons: strict filters (make/model/year), duplicate listing URLs, or that type has no matching ads.
- To broaden results, increase max_pages_per_type and/or remove one filter.

Get scraped data by filters:

Invoke-RestMethod -Method Get -Uri "http://localhost:8000/vehicles?make=Toyota&model=Axio&year=2018&limit=50"

Run with Docker Compose:

- Start:
  docker compose up --build

- Stop:
  docker compose down

Automated pre-deploy test (PowerShell):

- Full test (build, run, scrape, restart, logs, summary):
   powershell -ExecutionPolicy Bypass -File .\predeploy_docker_test.ps1

- Quick smoke test (skip scrape):
   powershell -ExecutionPolicy Bypass -File .\predeploy_docker_test.ps1 -SkipScrape

- Keep container running after tests:
   powershell -ExecutionPolicy Bypass -File .\predeploy_docker_test.ps1 -KeepContainer

- Faster rebuild using cache:
   powershell -ExecutionPolicy Bypass -File .\predeploy_docker_test.ps1 -UseCache

AWS deploy (ECR + ECS Fargate):

1) Create ECR repository:
   aws ecr create-repository --repository-name autoinsight-scraper-api

2) Login Docker to ECR:
   aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com

3) Tag and push image:
   docker tag autoinsight-scraper-api:local <account-id>.dkr.ecr.<region>.amazonaws.com/autoinsight-scraper-api:latest
   docker push <account-id>.dkr.ecr.<region>.amazonaws.com/autoinsight-scraper-api:latest

4) Create ECS task definition using that image and expose container port 8000.

5) Create ECS service (Fargate) with an Application Load Balancer.

6) Update security group to allow inbound traffic to ALB listener.

Note:
- Run locally first and validate /scrape and /vehicles before pushing to AWS.
- The container writes CSV output to /app/output and this is volume-mounted locally.
