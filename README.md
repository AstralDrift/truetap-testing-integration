# True Tap Testing Integration

Comprehensive testing framework for True Tap React Native refactor supporting both legacy and new architecture components with Solana Seeker device optimization.

## Overview

This repository contains the complete testing infrastructure for the True Tap payment application refactor, ensuring safe migration from legacy components to new architecture while maintaining optimal performance on Solana Seeker hardware.

## Features

- **Multi-Architecture Support**: Tests both legacy (`src/`) and new (`modelFront/`) components
- **Device-Specific Testing**: Solana Seeker hardware optimization validation
- **Comprehensive Coverage**: Component, integration, E2E, and device compatibility tests
- **Performance Monitoring**: Automated benchmarking and optimization validation
- **Accessibility Compliance**: WCAG 2.1 AA standard validation

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm run test-runner all

# Run specific test suite
npm run test-runner run unit
npm run test-runner run integration
npm run test-runner run device

# Watch mode for development
npm test -- --watch
```

## Repository Structure

```
__tests__/
├── utils/                      # Testing utilities and mocks
├── integration/                # Cross-component integration tests  
├── device-compatibility/       # Physical device specific tests
└── setup.ts                   # Global test setup

modelFront/__tests__/
├── components/                 # New architecture component tests
├── integration/                # Cross-component tests
└── accessibility/              # Accessibility compliance tests
```

## Quality Targets

- 85%+ test coverage for critical components
- <45s full test suite execution time
- Physical device compatibility validation
- Production-ready testing framework

## Contributing

See the feature branch for the complete testing implementation and documentation.