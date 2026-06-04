#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project)}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="japa-agent"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/${SERVICE_NAME}"

if [ -z "${GEMINI_API_KEY:-}" ]; then
  echo "ERROR: GEMINI_API_KEY is not set"
  exit 1
fi

if [ -z "${MONGO_URI:-}" ]; then
  echo "ERROR: MONGO_URI is not set"
  exit 1
fi

echo "Building Docker image..."
docker build -t "${IMAGE}" .

echo "Pushing to Artifact Registry..."
docker push "${IMAGE}"

echo "Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --concurrency 80 \
  --timeout 300 \
  --set-env-vars "GEMINI_API_KEY=${GEMINI_API_KEY},MONGO_URI=${MONGO_URI}"

echo "Deployment complete!"
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" --format="value(status.url)")
echo "Service URL: ${SERVICE_URL}"
echo ""
echo "Set this URL in your backend .env:"
echo "  AGENT_URL=${SERVICE_URL}"
