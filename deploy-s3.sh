#!/bin/bash
set -e

# Load environment variables from .env if exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

S3_BUCKET="${S3_BUCKET:?Error: S3_BUCKET is not set. Add it to .env or export it.}"
AWS_REGION="${AWS_REGION:-ap-northeast-1}"
DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"

echo "==> Building static files..."
docker compose up --build

if [ ! -d "./out" ] || [ -z "$(ls -A ./out)" ]; then
  echo "Error: ./out is empty. Build may have failed."
  exit 1
fi

echo "==> Uploading to s3://${S3_BUCKET}..."
aws s3 sync ./out "s3://${S3_BUCKET}" \
  --delete \
  --region "${AWS_REGION}" \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html" \
  --exclude "404.html"

# HTML files with shorter cache
aws s3 sync ./out "s3://${S3_BUCKET}" \
  --region "${AWS_REGION}" \
  --cache-control "public, max-age=0, must-revalidate" \
  --include "*.html" \
  --exclude "*" \
  --content-type "text/html"

# Invalidate CloudFront cache if distribution ID is set
if [ -n "${DISTRIBUTION_ID}" ]; then
  echo "==> Invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id "${DISTRIBUTION_ID}" \
    --paths "/*" \
    --region "${AWS_REGION}"
fi

echo "==> Deploy complete: https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/index.html"
