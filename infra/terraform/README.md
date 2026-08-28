# Terraform Baseline

> **Phase 2 — not required for local development or initial product build.**
> Use this folder when you are ready to deploy SecureStack to AWS.

This folder defines the infrastructure baseline for production deployment.

## Current baseline

- Terraform and AWS provider versions pinned.
- AWS provider configuration with region variable.
- Shared tagging convention (`locals.common_tags`).

## Next recommended steps

1. Add VPC and subnets.
2. Add ECS Fargate service (or your chosen platform) for the Docker image.
3. Add ALB with HTTPS listener and ACM certificate.
4. Add managed Redis for shared rate limiting.
5. Add CloudWatch logging, alarms, and dashboards.
6. Add Terraform backend (`s3` + `dynamodb`) for remote state locking.
