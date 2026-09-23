"""CI audit gate: fail only on HIGH or CRITICAL vulns."""
import json
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "/tmp/audit.json"
with open(path) as f:
    data = json.load(f)
summary = data.get("metadata", {}).get("vulnerabilities", {})
print("audit summary:", summary)
high = summary.get("high", 0)
critical = summary.get("critical", 0)
if high or critical:
    print(f"FAIL: HIGH={high} CRITICAL={critical}")
    sys.exit(1)
print("PASS: zero HIGH/CRITICAL vulnerabilities")
