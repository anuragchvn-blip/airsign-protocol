# Security Policy

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| 0.x.x   | :x:                |

## Reporting a Vulnerability

The AirSign team takes security seriously. We appreciate your efforts to responsibly disclose security vulnerabilities.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via:

- **Email**: security@airsign.protocol
- **GPG Key**: Available at [keybase.io/airsign](https://keybase.io/airsign)
- **Response Time**: We aim to respond within 24 hours

### What to Include

Please include the following information:

- Type of issue (e.g., cryptographic, network, validation)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Security Response Process

1. **Acknowledgment**: We'll acknowledge receipt within 24 hours
2. **Investigation**: Our security team will investigate the issue
3. **Assessment**: We'll assess the severity and impact
4. **Fix Development**: We'll develop and test a fix
5. **Disclosure**: We'll coordinate disclosure with you
6. **Release**: We'll release the fix and security advisory

### Security Measures

AirSign implements multiple layers of security:

#### Cryptographic Security
- **Ephemeral Key Exchange**: ECDH with P-256 curve
- **Authenticated Encryption**: XChaCha20-Poly1305 AEAD
- **Key Rotation**: New ephemeral keys per session
- **Secure Random**: Cryptographically secure randomness

#### Network Security
- **No Private Key Transmission**: Only public keys and signed data
- **Replay Protection**: Nonce verification and expiry timestamps
- **Peer Authentication**: Optional wallet signature verification
- **Secure Channels**: All data encrypted in transit

#### Application Security
- **Input Validation**: All inputs sanitized and validated
- **Error Handling**: Secure error handling without information leakage
- **Memory Safety**: Secure memory allocation and cleanup
- **Logging**: No sensitive data in logs

#### Transport Security
- **iOS**: MultipeerConnectivity with encryption
- **Android**: Nearby Connections with encryption
- **Web**: WebRTC with DTLS encryption
- **QR Fallback**: Encrypted payload encoding

### Known Security Considerations

#### High-Risk Operations
- **Signed Transactions**: Users must explicitly approve before broadcast
- **File Transfers**: Size limits and type validation enforced
- **Payment URIs**: Amount and address validation required

#### Threat Model
- **Network Attackers**: Mitigated by encryption and authentication
- **Malicious Peers**: Mitigated by signature verification and user consent
- **Replay Attacks**: Mitigated by nonces and expiry times
- **Man-in-the-Middle**: Mitigated by ephemeral key exchange

### Security Best Practices for Integrators

#### Implementation Guidelines
- Always validate received messages
- Show clear warnings for signed transactions
- Never auto-broadcast transactions
- Implement proper error handling
- Use secure storage for temporary data

#### User Interface Security
- Clear sender identification
- Signature verification status
- Amount and token verification
- Expiry time display
- Confirmation dialogs for irreversible actions

### Bug Bounty Program

We're planning to launch a bug bounty program for responsible disclosure of security vulnerabilities. Details will be announced soon.

### Security Advisories

Security advisories will be published at:
- GitHub Security Advisories
- NPM Security Advisories
- Our security mailing list

To subscribe to security updates, email: security-subscribe@airsign.protocol

### Hall of Fame

We recognize security researchers who help improve AirSign security:

<!-- Security researchers will be listed here -->

### Contact

For security-related questions or concerns:
- **Email**: security@airsign.protocol
- **GPG**: [Public key](https://keybase.io/airsign/pgp_keys.asc)

---

**Note**: This security policy applies to the AirSign protocol and reference implementations. Individual applications using AirSign should implement additional security measures appropriate for their use case.