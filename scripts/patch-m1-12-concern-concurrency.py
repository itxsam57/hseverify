from pathlib import Path

path = Path('src/lib/public-verification/public-verification-repository.ts')
text = path.read_text()

old_class = '''export class PublicVerificationRepository {\n  constructor(private readonly database: DatabaseClient) {}\n'''
new_class = '''export class PublicVerificationRepository {\n  private readonly concernInflight = new Map<\n    string,\n    Promise<CreatePublicVerificationConcernResult>\n  >();\n\n  constructor(private readonly database: DatabaseClient) {}\n'''
if text.count(old_class) != 1:
    raise RuntimeError('repository class insertion socket changed')
text = text.replace(old_class, new_class, 1)

old_start = '''  async createConcernWithAudit(\n    input: CreatePublicVerificationConcernInput\n  ): Promise<CreatePublicVerificationConcernResult> {\n    assertConcernInput(input);\n\n    return this.database.transaction(async (transaction) => {\n'''
new_start = '''  async createConcernWithAudit(\n    input: CreatePublicVerificationConcernInput\n  ): Promise<CreatePublicVerificationConcernResult> {\n    assertConcernInput(input);\n\n    const inFlight = this.concernInflight.get(input.idempotencyKey);\n    if (inFlight) {\n      const existing = await inFlight;\n      return Object.freeze({ concernId: existing.concernId, created: false });\n    }\n\n    const operation = this.createConcernWithAuditTransaction(input);\n    this.concernInflight.set(input.idempotencyKey, operation);\n    try {\n      return await operation;\n    } finally {\n      if (this.concernInflight.get(input.idempotencyKey) === operation) {\n        this.concernInflight.delete(input.idempotencyKey);\n      }\n    }\n  }\n\n  private async createConcernWithAuditTransaction(\n    input: CreatePublicVerificationConcernInput\n  ): Promise<CreatePublicVerificationConcernResult> {\n    return this.database.transaction(async (transaction) => {\n'''
if text.count(old_start) != 1:
    raise RuntimeError('concern transaction insertion socket changed')
text = text.replace(old_start, new_start, 1)
path.write_text(text)
print('M1.12 concern same-process retry coalescing staged.')
