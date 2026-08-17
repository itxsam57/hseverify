from pathlib import Path

path = Path('src/lib/audit/audit-domain.ts')
text = path.read_text()
old = '''    component !== "outbox-worker" ||\n'''
new = '''    (component !== "outbox-worker" &&\n     component !== "public-verification-intake") ||\n'''
if text.count(old) != 1:
    raise RuntimeError(f'expected one trusted system binder check, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
print('M1.12 public verification audit actor binder staged.')
