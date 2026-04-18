# Security Policy

## Supported Versions
Security fixes are provided for the latest state of the `main` branch.

## Reporting a Vulnerability
If you discover a security issue, report it privately.

Preferred method:
- Open a private security advisory on GitHub for this repository.

If private advisory is not possible:
- Contact the maintainer directly through repository contact channels and include "Security Report: PixelFlow" in the subject.

Please do not disclose vulnerabilities publicly until a fix is available.

## What to Include in a Report
Provide as much detail as possible:
- Vulnerability type and impact
- Affected component and file(s)
- Reproduction steps or proof of concept
- Potential attack scenario
- Suggested mitigation (if available)

Useful context:
- Runtime and environment details
- Request payloads or URLs used in reproduction
- Logs or stack traces

## Response Timeline (Target)
- Initial acknowledgement: within 72 hours
- Triage and severity assessment: within 7 days
- Fix planning and patch timeline: communicated after triage

Timelines are best-effort and may vary by complexity.

## Coordinated Disclosure
- Reporters are credited for valid findings unless they request anonymity.
- Public disclosure should wait until maintainers confirm remediation or mitigation guidance.

## Security Scope Highlights
PixelFlow includes controls intended to reduce abuse and unsafe network access:
- URL validation and private-network target blocking
- Rate limiting for analyze and stream routes
- Header allow-lists in stream proxy forwarding
- Safe proxy behavior with constrained response header forwarding

These controls are defense-in-depth and should be reviewed continuously.

## Hardening Recommendations for Deployments
If you deploy PixelFlow publicly, also implement:
- Reverse proxy or edge rate limiting
- WAF and request anomaly monitoring
- Strict TLS configuration
- Secrets management through environment variables
- Access logs with alerting for suspicious activity

## Out of Scope
The following are usually out of scope unless there is a clear exploit chain:
- Missing best-practice headers without practical impact
- Social engineering or phishing against contributors
- Denial of service requiring unrealistic resource levels

Thank you for helping keep PixelFlow secure.
