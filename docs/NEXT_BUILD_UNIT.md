# Next Build Unit

Continue with the Worker Identity submission and correction-evidence module.

The module must implement:

- identity document type selection and jurisdiction-aware requirements;
- front, back and supporting-file uploads with draft and committed versions;
- worker-visible upload, processing and verification status;
- reviewer-safe evidence metadata without exposing unrelated worker records;
- changes-requested routing with retained history;
- correction evidence linked to pending sensitive-profile correction requests;
- file type, size, signature and malware-scan adapter boundaries;
- secure object-storage references rather than public file paths;
- server authorization, audit events, loading, success and failure states;
- contract, repository and route tests before dashboard and profile actions are enabled.

Identity evidence must never silently replace a verified record. Every committed submission and decision remains traceable.
