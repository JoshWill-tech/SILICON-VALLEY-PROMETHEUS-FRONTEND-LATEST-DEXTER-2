# R2 Source Upload Operations

Prometheus source uploads use project-scoped Cloudflare R2 multipart uploads.

Required R2 bucket CORS for browser uploads to `R2_BUCKET_SOURCES`:

```json
[
  {
    "AllowedOrigins": [
      "https://prometheusstudio.tech",
      "https://www.prometheusstudio.tech",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": [
      "Content-Type",
      "Content-Disposition"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

`ETag` must be exposed because the browser sends it back to
`/api/projects/[id]/upload-multipart/complete` for `CompleteMultipartUpload`.
If production uploads fail before the first part completes, verify the bucket
preflight returns `Access-Control-Allow-Origin` for the exact production origin
and `Access-Control-Allow-Methods: PUT`.
If the same bucket/custom domain is also used for browser playback, keep a
separate read rule or include `GET` and `HEAD` as required by that surface.

Required token permissions:

- `s3:CreateMultipartUpload`
- `s3:UploadPart`
- `s3:CompleteMultipartUpload`
- `s3:AbortMultipartUpload`
- `s3:PutObject`
- `s3:GetObject`

Set an R2 lifecycle rule to delete incomplete multipart uploads after 24 hours. The client aborts failed and cancelled uploads, but the lifecycle rule is the production backstop for browser crashes and lost connections.
