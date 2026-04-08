# Eureka Server

## Overview

Netflix Eureka Server — service registry for the Finance microservices platform. All services register here on startup and discover each other via DNS-based load balancing.

## Tech Stack

| Component       | Choice                                   |
|-----------------|------------------------------------------|
| Framework       | Spring Cloud Netflix Eureka Server       |
| Security        | Spring Security (HTTP Basic)             |
| Java            | 21 (Eclipse Temurin)                     |

## Responsibilities

- **Service Registry**: All microservices register with their host/port info on startup
- **Service Discovery**: Services resolve each other by name (e.g., `lb://account-service`)
- **Health Monitoring**: Tracks heartbeats from registered services and removes expired instances
- **Dashboard**: Web UI at `http://localhost:8761` showing all registered services

## Configuration

Key environment variables:

| Variable           | Default   | Description              |
|--------------------|-----------|--------------------------|
| `EUREKA_USERNAME`  | admin     | Basic auth username      |
| `EUREKA_PASSWORD`  | admin123  | Basic auth password      |

## Running

```bash
# From project root
docker compose up eureka-server --build
```

## Verify

```bash
# Health check (no auth required)
curl http://localhost:8761/actuator/health

# Dashboard (requires auth)
open http://localhost:8761
# Login: admin / admin123
```

## Security

- Dashboard and registry endpoints require HTTP Basic authentication
- `/actuator/**` endpoints are public
- `/health` endpoint is public
- Eureka clients must include credentials in their `defaultZone` URL:
  `http://admin:admin123@eureka-server:8761/eureka/`

## Notes

- Does NOT register itself (server-only mode)
- Self-preservation is enabled (prevents mass deregistration on network partitions)
- Hostname inside Docker: `eureka-server`
- Port: 8761
