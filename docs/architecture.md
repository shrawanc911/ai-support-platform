# System Architecture

## High-Level Architecture

```text
React Frontend
       |
       | HTTP / SSE
       |
       v
FastAPI Backend
       |
       +------------------+
       |                  |
       v                  v
Business Services      AI Services
       |                  |
       |                  +---- LLM
       |                  |
       |                  +---- RAG
       |                  |
       |                  +---- Agents
       |
       v
PostgreSQL

Future infrastructure:

Redis
Background Workers
Object Storage
Monitoring