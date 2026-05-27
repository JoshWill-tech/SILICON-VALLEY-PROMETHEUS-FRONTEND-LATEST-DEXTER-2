# R2 Source Upload Operations

Prometheus source uploads use project-scoped Cloudflare R2 multipart uploads.

Required R2 bucket CORS for `R2_BUCKET_SOURCES`:

```json
[
  {
    "AllowedOrigins": [
      "https://prometheusstudio.tech",
      "https://www.prometheusstudio.tech",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["PUT", "POST", "OPTIONS"],
    "AllowedHeaders": [
      "content-type",
      "content-disposition",
      "x-amz-content-sha256",
      "authorization"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Required token permissions:

- `s3:CreateMultipartUpload`
- `s3:UploadPart`
- `s3:CompleteMultipartUpload`
- `s3:AbortMultipartUpload`
- `s3:PutObject`
- `s3:GetObject`

Set an R2 lifecycle rule to delete incomplete multipart uploads after 24 hours. The client aborts failed and cancelled uploads, but the lifecycle rule is the production backstop for browser crashes and lost connections.
