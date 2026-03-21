# Scope Lock Document

**Lock Date:** 2026-03-21
**Lock Status:** LOCKED
**Target Launch:** 2026-07-04

---

## MVP Scope

### Features In Scope

| Feature | Description | Acceptance Criteria | Priority |
|---------|-------------|---------------------|----------|
| User authentication | Email/password signup and login via Supabase Auth | Users can register, log in, log out; protected routes redirect unauthenticated users | P0 |
| Video upload | Upload instructional videos for system ingestion | Videos stored in Supabase Storage; video record created with metadata and status | P0 |
| Transcription extraction | Transcribe uploaded videos via OpenAI Whisper API | Transcription text and timestamped segments stored in transcriptions table | P0 |
| Ingestion pipeline status | Track and display video processing status | UI shows real-time status per video (uploaded → transcribing → extracting → complete → error) | P0 |
| Knowledge graph construction | Build graph nodes and edges from transcription data | LLM extracts entities and relationships conforming to ontology; stored in nodes/edges tables | P0 |
| Knowledge graph visualization | Interactive graph explorer using Cytoscape.js | Users can navigate, zoom, filter, and click nodes/edges to explore their knowledge graph | P1 |
| Natural language chat | Chat interface to query knowledge graph via LLM | Users ask questions in natural language; system loads relevant subgraph and returns reasoned answers | P1 |
| Operator-defined ontology | CRUD API for ontology entries with default BJJ seed data | Operators can define node types, edge types, and property schemas; system ships with BJJ defaults | P0 |

### Explicitly Out of Scope (v1)

- **Video playback** - Reason: MVP focuses on knowledge extraction, not media consumption. Users already have access to their videos through original platforms.
- **Multi-modal AI** - Reason: Transcription-only approach keeps costs low and simplifies the pipeline. Visual analysis deferred to future phase.
- **Community/social features** - Reason: Single-user focus for MVP. Shared graphs and community ontologies are Phase 3.
- **Mobile app** - Reason: Web-first approach. Mobile-responsive improvements deferred to Phase 3.
- **Bulk video upload** - Reason: Single upload sufficient for MVP. Bulk upload is a Phase 2 convenience feature.

---

## Open Items

None — all decisions resolved.

---

## Change Control Process

**To add scope after lock:**
1. Propose the addition with rationale and user value
2. Review meeting required — discuss impact on timeline and existing scope
3. If approved, update this document and create corresponding tickets

**Authorized approvers:**
- Teddy Kim (product owner / sole stakeholder)

---

## Stakeholder Sign-Off

| Role | Status | Notes |
|------|--------|-------|
| Product / Founder | Aligned | Teddy Kim — sole stakeholder, all decisions confirmed |

---

## Timeline

**Target Launch:** 2026-07-04

| Milestone | Target Date |
|-----------|-------------|
| Scope Lock | 2026-03-21 |
| Infrastructure & Auth Complete | 2026-04-15 |
| Ingestion Pipeline Complete | 2026-05-15 |
| Knowledge Graph & Visualization Complete | 2026-06-15 |
| Chat Interface & Polish | 2026-06-30 |
| Launch | 2026-07-04 |

---

## What This Lock Means

By locking scope, we commit to:

1. **Building exactly this** - The 8 features listed above, no more, no less
2. **Predictable timeline** - The July 4 launch date is based on this defined scope
3. **Visible trade-offs** - Any additions require a review meeting and explicit approval
4. **Focus over features** - The core value (knowledge graph that agents can reliably traverse) is protected from scope creep

This document is the contract governing what gets built for v1.

---

## Next Steps

- [ ] Ensure all MVP features have tickets in the backlog
- [ ] Begin development — run `/work-ticket` to pick up the first ticket
- [ ] Run `/sprint-status` for regular progress checks

---

*This scope lock is valid until explicitly unlocked or launch is complete.*
