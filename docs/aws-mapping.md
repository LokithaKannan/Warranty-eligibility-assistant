# AWS Concept Mapping

> **Important distinction:** This application runs **locally** using local equivalents.
> The AWS services listed below are **concepts mapped for learning purposes only**.
> No AWS resources have been provisioned or configured.

## Service Mapping Table

| Local Implementation | AWS Equivalent | AWS Service | Notes |
|---------------------|---------------|-------------|-------|
| Express + Node.js server | Container service | Amazon ECS / EKS | Would run as a containerised service |
| Vite dev server / nginx | Static hosting | Amazon S3 + CloudFront | Frontend static files served via CDN |
| SQLite + Prisma | Managed relational DB | Amazon RDS (PostgreSQL) | Production would use RDS for persistence and HA |
| Local `uploads/` directory | Object storage | Amazon S3 | PDFs stored in S3 with server-side encryption |
| JWT authentication | Identity service | Amazon Cognito | Cognito provides managed auth + MFA |
| bcryptjs password hashing | Managed secrets | AWS Secrets Manager | Secrets Manager stores DB credentials and JWT secrets |
| `.env` file | Parameter store | AWS Systems Manager Parameter Store | SSM stores environment config securely |
| `console.log` / Morgan logger | Managed logging | Amazon CloudWatch Logs | Application logs streamed to CloudWatch |
| Manual audit log table | Compliance logging | AWS CloudTrail | CloudTrail records API-level actions automatically |
| Vitest tests | Automated testing | AWS CodeBuild | CodeBuild runs tests in the CI/CD pipeline |
| GitHub Actions CI | Managed CI/CD | AWS CodePipeline + CodeBuild | Full CI/CD with CodePipeline → CodeBuild → CodeDeploy |
| Docker Compose | Container orchestration | Amazon ECS with Fargate | Fargate eliminates EC2 management |
| Local network (localhost) | VPC networking | Amazon VPC | Isolated network with private subnets |
| nginx CORS config | API gateway | Amazon API Gateway | API Gateway handles routing, auth, rate limiting |
| express-rate-limit | WAF / Shield | AWS WAF + Shield | WAF provides SQL injection, XSS, rate limit protection |
| Helmet security headers | Security best practices | AWS Config + Security Hub | Security Hub monitors compliance |
| File validation (magic bytes) | Threat detection | Amazon GuardDuty | GuardDuty detects malicious file uploads and anomalies |
| SQLite encryption (future) | Encryption at rest | AWS KMS | KMS manages encryption keys for RDS, S3, EBS |

## Architecture on AWS (Conceptual)

```
Internet → Route 53 (DNS)
         → CloudFront (CDN for frontend)
         → API Gateway (rate limiting, auth)
         → VPC
           ├── Public Subnet: Application Load Balancer
           └── Private Subnet: ECS Fargate (Express API)
                              ├── RDS PostgreSQL (database)
                              ├── S3 (uploaded PDFs)
                              ├── ElastiCache (session/token store)
                              └── Secrets Manager (env secrets)

Monitoring: CloudWatch Logs + CloudTrail + GuardDuty
CI/CD: CodePipeline → CodeBuild → ECR → ECS Deploy
```

## Key Differences: Local vs AWS Production

| Concern | Local Prototype | AWS Production |
|---------|----------------|----------------|
| Database durability | SQLite file (single point) | RDS Multi-AZ with automated backups |
| Secret storage | `.env` file (developer responsibility) | Secrets Manager with rotation |
| File storage | Local `uploads/` directory | S3 with versioning and lifecycle policies |
| Scalability | Single Node.js process | ECS Fargate auto-scaling |
| TLS/HTTPS | Not configured | ACM certificate + ALB termination |
| Audit trail | Application-level audit table | CloudTrail (immutable, tamper-resistant) |
| Threat detection | Manual input validation | GuardDuty + WAF |
| Encryption at rest | Not implemented | KMS-managed encryption on RDS + S3 |
