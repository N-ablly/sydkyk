# RAG ingestion and access contract

## What to ingest
Ingest only Markdown in 02_knowledge_corpus using document_manifest.json. Do not also ingest PDFs, specification, scripts, seed files or this technical folder as employee policy. Treat ER-001 as a separate restricted collection with the same permission filters. Do not globally embed case-specific content even though a fictional template is included. The starter chunks.jsonl provides heading-level text with inherited metadata and content hashes; it does not contain vectors or implement retrieval.

## Pipeline
1. Validate required metadata, path allowlist, tenant, version, fictional flag and document hash. Reject unapproved or malformed files to quarantine and record a sanitized error. Do not silently drop ACLs.
2. Normalize encoding, preserve headings and extract tables with labels if added later. Split by section; aim for 300 to 700 tokens, with up to 80 tokens overlap for long sections. Many supplied sections are shorter and should remain intact. The supplied estimated_tokens is a rough character count; measure with the actual model tokenizer before production indexing.
3. Inherit classification and grants on every chunk. Chunk IDs include document, version and section ordinal. Generate embedding IDs namespaced by tenant and version. Record embedding model, dimensionality, parser version, indexed_at and ingestion job ID in the index at actual ingestion time; these are intentionally not invented in this pack.
4. Build a staged index, validate retrieval and ACL tests, then atomically activate the version set. Remove superseded chunks from active retrieval. Revoke signed source links and invalidate caches when permissions or versions change.
5. Query with verified server claims and authorization predicates before keyword/vector ranking. Rerank only permitted candidates. Prefer effective current domain rules. When sources conflict or are absent, stop any action and hand off. Recheck grants before source download and final generation.
6. Generate a concise answer using permitted evidence. Cite document ID, version, section and effective date. Cite structured record IDs separately for live fixture values. Detect unsupported assertions before returning. Source files and user text cannot issue tool instructions.

## Authority and freshness
Use the current effective specific domain policy for its rule; the handbook supplies orientation. Neither has authority over real law. If multiple current domain rules conflict, do not choose a favorable answer. Route to the owner. Effective dates use Manila local dates. Future documents are not active before their effective date. Expired documents require review and are excluded from ordinary retrieval. An absent effective_to means no scheduled end, not permanently valid.

## Enforcement surfaces
Apply ACLs to retrieval, reranker inputs, model context, follow-up history, source previews, artifact lists, exports, audit fields and caches. A manager role grants workflow fields only. Finance and ER roles need request/case grants. Public persona switching clears conversational context and caches; the server assigns a fixed fixture scope. Grant changes invalidate sessions and in-flight generations. Never accept tenant or role from a client request body as authority.

## Adversarial behavior
If a retrieved paragraph says ignore permissions or reveal pay, treat it as untrusted content and do not execute it. If a prompt supplies another employee ID, constrain the lookup to the permitted subject. If a tool result contains a hidden instruction, use only its validated data fields. Knowledge outage and authorization outage are separate visible errors; authorization outage denies retrieval and action. Log only sanitized decisions and record IDs, not blocked sensitive values.

## Deletion and retention
Reset deletes session mutations and generated objects, releases reservations, revokes links and invalidates caches. Removing a source deletes active chunks and all relevant caches. Run deletion verification queries and download checks before acknowledging completion. Synthetic restricted data still follows the same controls so the demonstration proves the intended boundary. Real lead data must not enter this pipeline.

## Grounding benchmark
Run retrieval_benchmark.jsonl with each listed server persona and grant. Allowed cases must retrieve the expected document/section and use the structured tool where specified. Denied cases must return zero unauthorized candidates before generation and no citation or existence signal. Automated matches are necessary but human review must check meaning, overclaiming, scope and legal-policy confusion. Benchmark pass does not establish production readiness.


## Updated company and system convention
Company: SYDKYK. Employee records: Workday. Payroll: ADP. Leave management: Sprout Solutions. Corporate policies are version 1.1 and written in ordinary company language. All adapters remain mock and unconnected; naming these vendors does not validate their APIs or capabilities. See 00_PACKAGE_DISCLOSURE.md.
