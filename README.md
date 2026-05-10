# Speech Practice App

A full-stack web application with a Spring Boot backend and React frontend, deployed on AWS Elastic Beanstalk.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Client                           │
│                  React + Vite (JS)                      │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP / JWT
┌───────────────────────▼─────────────────────────────────┐
│               Spring Boot 3 (port 8080)                 │
│                                                         │
│  Security Filter Chain                                  │
│  ├── JWTAuthenticationFilter                            │
│  └── Spring Security 6                                  │
│                                                         │
│  REST Layer                                             │
│  ├── AuthenticationController  (/api/v1/auth)           │
│  ├── CustomerController        (/api/v1/customers)      │
│  └── PingPongController        (/ping-pong)             │
│                                                         │
│  Service Layer                                          │
│  ├── AuthenticationService                              │
│  └── CustomerService                                    │
│                                                         │
│  Data Access (DAO pattern)                              │
│  ├── CustomerJPADataAccessService                       │
│  ├── CustomerJDBCDataAccessService                      │
│  └── CustomerListDataAccessService  (in-memory/test)    │
│                                                         │
│  Integrations                                           │
│  └── S3Service  (AWS S3 — mocked locally)               │
└───────────┬───────────────────────┬─────────────────────┘
            │ JDBC / JPA            │ AWS SDK
┌───────────▼──────────┐  ┌─────────▼────────────────────┐
│  PostgreSQL (5332)   │  │  AWS S3                      │
│  Flyway migrations   │  │  Bucket: speech-practice-app │
│  docker-compose.yml  │  │  Region: eu-west-1           │
└──────────────────────┘  └──────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 3, Spring Security 6, Spring Data JPA |
| Auth | JWT (jjwt 0.11.5), BCrypt |
| Database | PostgreSQL 14, Flyway migrations |
| Storage | AWS S3 |
| Frontend | React, Vite |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Cloud | AWS Elastic Beanstalk (eu-west-1) |
| Build | Maven, Google Jib (Docker image push) |

## Local Development

**Prerequisites:** Java 17, Docker

1. Start PostgreSQL:
   ```bash
   docker-compose up -d
   ```

2. Run the backend:
   ```bash
   cd backend && mvn spring-boot:run
   ```
   API available at `http://localhost:8080`

3. Run the frontend:
   ```bash
   cd frontend/react && npm install && npm run dev
   ```

## CI/CD

| Workflow | Trigger | Action |
|---|---|---|
| `backend-ci.yml` | Push to `backend/**` | Build, test, verify |
| `backend-cd.yml` | Push to `main` (`backend/**`) | Build → push Docker image → deploy to Elastic Beanstalk |
| `frontend-react-cd.yml` | Push to `main` (`frontend/react/**`) | Build → push Docker image → deploy |
