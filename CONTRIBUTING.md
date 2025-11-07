# Contributing to AirSign Protocol

We're excited that you're interested in contributing to AirSign! This document outlines the process for contributing and helps you get started.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include:

- **Clear description** of the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Environment details** (OS, SDK version, device)
- **Screenshots or logs** if applicable

### Suggesting Features

We welcome feature suggestions! Please:

- Check existing feature requests first
- Provide clear use cases and benefits
- Consider security and privacy implications
- Include implementation ideas if possible

### Pull Requests

1. **Fork the repository** and create a feature branch
2. **Make your changes** following our coding standards
3. **Add tests** for new functionality
4. **Update documentation** as needed
5. **Run the test suite** and ensure all tests pass
6. **Submit a pull request** with a clear description

## Development Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- React Native development environment
- iOS: Xcode 14+, iOS 13+ target
- Android: Android Studio, API level 23+

### Local Development

```bash
# Clone the repository
git clone https://github.com/anuragchvn-blip/airsign-protocol.git
cd airsign-protocol

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Start development servers
npm run dev
```

### Package Structure

```
packages/
├── core/              # Core protocol (TypeScript)
├── react-native/      # React Native SDK
├── web/              # Web SDK
└── cli/              # CLI tools

apps/
├── demo-wallet/      # Demo application
├── web-demo/         # Web demo
└── test-app/         # Testing app
```

## Coding Standards

### TypeScript

- Use strict TypeScript configuration
- Prefer explicit types over `any`
- Use meaningful variable and function names
- Follow ESLint configuration

### Security

- Never commit private keys or secrets
- Validate all inputs thoroughly
- Use secure random number generation
- Follow cryptographic best practices

### Testing

- Write unit tests for all new features
- Include integration tests for cross-platform code
- Test error conditions and edge cases
- Aim for >90% code coverage

### Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Update protocol specification for protocol changes
- Include code examples in documentation

## Architecture Guidelines

### Core Principles

- **Security first** - Validate everything, trust nothing
- **Privacy by design** - Minimize data collection and retention
- **Cross-platform compatibility** - Write once, run everywhere
- **Performance** - Optimize for mobile and web constraints

### Message Flow

1. **Discovery** - Devices advertise capabilities
2. **Handshake** - Establish encrypted channel
3. **Transfer** - Send encrypted messages
4. **Verification** - Validate and decrypt
5. **Action** - User approves/rejects

### Error Handling

- Use structured error types
- Provide helpful error messages
- Log errors appropriately
- Fail securely (don't leak sensitive data)

## Security Considerations

### Cryptography

- Use well-established libraries (libsodium, noble-crypto)
- Implement proper key rotation
- Use authenticated encryption (AEAD)
- Validate all cryptographic operations

### Network Security

- Assume hostile network environment
- Implement replay protection
- Use ephemeral connections
- Validate peer identity

### User Safety

- Clear warnings for irreversible actions
- No automatic transaction broadcasting
- Validate transaction data
- Secure UI/UX patterns

## Testing Guidelines

### Unit Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific package
npm test packages/core
```

### Integration Tests

```bash
# End-to-end tests
npm run test:e2e

# Cross-platform tests
npm run test:platforms
```

### Security Tests

```bash
# Cryptographic tests
npm run test:crypto

# Fuzz testing
npm run test:fuzz
```

## Release Process

1. **Version bump** following semantic versioning
2. **Update CHANGELOG.md** with new features/fixes
3. **Run full test suite** including security tests
4. **Create release PR** for review
5. **Tag release** after merge
6. **Publish packages** to npm
7. **Update documentation** as needed

## Getting Help

- **Discord**: [Join our community](https://discord.gg/airsign)
- **Issues**: Use GitHub issues for bugs and features
- **Security**: See [SECURITY.md](SECURITY.md) for security issues
- **Email**: maintainers@airsign.protocol (for sensitive matters)

## Recognition

Contributors will be recognized in:
- GitHub contributors page
- CHANGELOG.md for significant contributions
- Annual contributor appreciation posts

Thank you for helping make AirSign better! 🚀