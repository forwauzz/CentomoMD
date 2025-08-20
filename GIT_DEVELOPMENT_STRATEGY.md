# CentomoMD Git Development Strategy

## Overview
This document outlines our Git workflow strategy for CentomoMD, a medical evaluation platform requiring strict security controls, compliance tracking, and zero-retention data handling.

## Core Principles
- **Security-First Development**: Every commit must maintain zero-retention compliance
- **Medical Software Standards**: Rigorous testing and validation before production
- **Compliance Tracking**: All changes must be auditable for TGV compliance
- **Zero Downtime**: Production deployments must not interrupt medical workflows

---

## Branch Strategy

### Main Branches

#### `Production` (Production)
- **Purpose**: Production-ready code only
- **Protection**: Fully protected, requires PR approval
- **Deployment**: Auto-deploys to production Replit environment
- **Quality Gate**: Must pass all security, compliance, and functional tests
- **Merge Policy**: Only from `release/` branches via PR with security review

#### `develop` (Integration)
- **Purpose**: Integration branch for all feature development
- **Protection**: Protected, requires PR approval
- **Testing**: Continuous integration with automated testing
- **Quality Gate**: Must pass security checklist validation
- **Merge Policy**: Features merge here first for integration testing

### Supporting Branches

#### Feature Branches: `feature/[TICKET]-[description]`
**Examples:**
- `feature/CENT-123-voice-dictation-ocr`
- `feature/CENT-456-ai-section7-enhancement`
- `feature/CENT-789-bilingual-interface-updates`

**Workflow:**
```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/CENT-123-voice-dictation-ocr

# Work on feature with security-first commits
git add .
git commit -m "feat(voice): implement secure OCR processing with zero retention

- Add Tesseract.js integration for document text extraction
- Implement memory cleanup after processing
- Add quotation wrapping for extracted text
- Validate against SECURITY_COMPLIANCE_CHECKLIST.md

Security: ✅ Zero retention validated
Compliance: ✅ No patient data stored
Testing: ✅ Memory cleanup verified"

# Push and create PR to develop
git push origin feature/CENT-123-voice-dictation-ocr
```

#### Release Branches: `release/v[version]`
**Examples:**
- `release/v1.2.0`
- `release/v1.2.1-hotfix`

**Purpose:**
- Final preparation for production release
- Security validation and compliance review
- Integration testing with production-like data
- Documentation updates and changelog generation

**Workflow:**
```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# Final security review and compliance validation
# Update version numbers and documentation
# Run full security test suite
# Generate compliance report

# Merge to Production when ready
git checkout Production
git merge --no-ff release/v1.2.0
git tag v1.2.0
git push origin Production --tags

# Merge back to develop
git checkout develop
git merge --no-ff release/v1.2.0
```

#### Hotfix Branches: `hotfix/[URGENT]-[description]`
**Examples:**
- `hotfix/URGENT-session-timeout-fix`
- `hotfix/CRITICAL-memory-leak-voice-processing`

**Purpose:**
- Critical production issues requiring immediate deployment
- Security vulnerabilities or compliance violations
- System stability issues affecting medical workflows

**Workflow:**
```bash
# Create hotfix from Production
git checkout Production
git pull origin Production
git checkout -b hotfix/URGENT-session-timeout-fix

# Implement critical fix with security validation
git commit -m "fix(auth): resolve session timeout causing data exposure risk

- Fix session cleanup race condition
- Add explicit memory clearing on timeout
- Validate zero-retention compliance maintained

Security: ✅ Data exposure risk eliminated
Urgency: CRITICAL - affects active medical sessions
Testing: ✅ Verified in staging environment"

# Deploy to Production immediately
git checkout Production
git merge --no-ff hotfix/URGENT-session-timeout-fix
git tag v1.1.1-hotfix
git push origin Production --tags

# Merge to develop
git checkout develop
git merge --no-ff hotfix/URGENT-session-timeout-fix
```

---

## Commit Message Standards

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: New feature implementation
- **fix**: Bug fix or issue resolution
- **security**: Security-related changes
- **compliance**: Compliance or regulatory updates
- **docs**: Documentation updates
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring without functional changes
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependency updates

### Scopes
- **voice**: Voice recognition and processing
- **ai**: AI text processing and enhancement
- **ocr**: OCR and document processing
- **auth**: Authentication and authorization
- **forms**: Medical form handling
- **ui**: User interface components
- **api**: Backend API endpoints
- **db**: Database operations
- **security**: Security implementations
- **compliance**: Compliance-related changes

### Security-First Commit Examples

#### Feature Development
```
feat(voice): implement secure voice transcription with Whisper API

- Add OpenAI Whisper integration for medical transcription
- Implement zero-retention processing with immediate cleanup
- Add bilingual support for French/English medical terminology
- Validate input sanitization and output security

Security: ✅ Zero retention validated - no audio data stored
Compliance: ✅ Medical data processed in-memory only
Testing: ✅ Memory cleanup verified after processing
Review: ✅ SECURITY_COMPLIANCE_CHECKLIST.md followed

Closes CENT-234
```

#### Security Fix
```
security(auth): patch session hijacking vulnerability

- Fix session token generation using crypto.randomBytes
- Add session token rotation on privilege escalation
- Implement proper session invalidation on logout
- Add audit logging for session security events

Vulnerability: CVE-2024-XXXX session token predictability
Impact: MEDIUM - potential unauthorized access
Mitigation: ✅ Secure token generation implemented
Validation: ✅ Penetration tested and verified

Fixes SECURITY-001
```

#### Compliance Update
```
compliance(privacy): update data processing for TGV requirements

- Implement explicit consent collection for AI processing
- Add data processing purpose limitation controls
- Update privacy notices with zero-retention explanation
- Add compliance audit trail for data processing events

TGV Criteria: P09.01-P09.04 (Data Retention Policies)
Compliance: ✅ Zero retention model documented
Legal: ✅ Privacy policy updated
Audit: ✅ Processing events logged without patient data

Addresses COMPLIANCE-TGV-45
```

---

## Pull Request Workflow

### PR Requirements

#### Mandatory Checks
- [ ] **Security Review**: SECURITY_COMPLIANCE_CHECKLIST.md validated
- [ ] **Zero Retention**: No patient data storage confirmed
- [ ] **Memory Cleanup**: Explicit cleanup implemented where needed
- [ ] **Input Validation**: All inputs validated and sanitized
- [ ] **Authentication**: Proper access controls implemented
- [ ] **Audit Logging**: Required actions logged without sensitive data
- [ ] **Testing**: Unit and integration tests passing
- [ ] **Documentation**: Code and compliance documentation updated

#### PR Template
```markdown
## Summary
Brief description of changes and business value.

## Security Validation
- [ ] SECURITY_COMPLIANCE_CHECKLIST.md reviewed and followed
- [ ] Zero-retention model maintained
- [ ] Memory cleanup implemented
- [ ] Input validation added
- [ ] Authentication/authorization verified
- [ ] Audit logging implemented

## Medical Data Handling
- [ ] No patient data stored permanently
- [ ] In-memory processing only
- [ ] Explicit cleanup after processing
- [ ] Error handling without data exposure

## Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Security tests passing
- [ ] Manual testing completed

## Compliance Impact
- [ ] TGV compliance maintained/improved
- [ ] Privacy requirements met
- [ ] Documentation updated
- [ ] Audit trail considerations addressed

## Breaking Changes
List any breaking changes and migration steps.

## Deployment Notes
Special deployment considerations or rollback procedures.
```

### Review Process

#### Security Review (Mandatory)
1. **Security Officer Review**: All PRs require security validation
2. **Compliance Check**: Verify TGV compliance maintained
3. **Zero-Retention Validation**: Confirm no patient data storage
4. **Code Security Scan**: Automated security scanning tools

#### Functional Review
1. **Medical Domain Expert**: Validate medical workflow correctness
2. **Technical Lead**: Architecture and implementation review
3. **QA Validation**: Test coverage and quality assurance

#### Approval Requirements
- **Production Branch**: 2 approvals (Security Officer + Technical Lead)
- **Develop Branch**: 1 approval (Technical Lead or Senior Developer)
- **Feature Branches**: 1 approval (Peer review)

---

## Environment Strategy

### Development Environments

#### Local Development
```bash
# Environment setup
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/centomomd_dev
OPENAI_API_KEY=sk-dev-key...
SESSION_SECRET=dev-session-secret
LOG_LEVEL=debug
```

#### Staging/Testing
```bash
# Staging environment (Replit staging)
NODE_ENV=staging
DATABASE_URL=postgresql://staging-db/centomomd_staging
OPENAI_API_KEY=sk-staging-key...
SESSION_SECRET=staging-session-secret
LOG_LEVEL=info
```

#### Production
```bash
# Production environment (Replit production)
NODE_ENV=production
DATABASE_URL=postgresql://prod-db/centomomd_production
OPENAI_API_KEY=sk-prod-key...
SESSION_SECRET=secure-production-secret
LOG_LEVEL=warn
```

### Deployment Pipeline

#### Automated Deployment
```yaml
# .github/workflows/deploy.yml concept
name: CentomoMD Deployment Pipeline

on:
  push:
    branches: [Production, develop]
  pull_request:
    branches: [Production, develop]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Security Scan
        run: |
          npm audit
          npm run security:scan
          npm run compliance:check

  test-suite:
    runs-on: ubuntu-latest
    steps:
      - name: Run Test Suite
        run: |
          npm run test:unit
          npm run test:integration
          npm run test:security
          npm run test:compliance

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: [security-scan, test-suite]
    steps:
      - name: Deploy to Staging
        run: |
          # Deploy to Replit staging environment
          replit deploy staging

  deploy-production:
    if: github.ref == 'refs/heads/Production'
    needs: [security-scan, test-suite]
    steps:
      - name: Deploy to Production
        run: |
          # Deploy to Replit production
          replit deploy production
```

---

## Security and Compliance Integration

### Pre-Commit Hooks
```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "🔒 Running CentomoMD Security Pre-Commit Checks..."

# Check for sensitive data patterns
echo "Checking for sensitive data exposure..."
if git diff --cached --name-only | xargs grep -l "password\|secret\|key\|token" --exclude-dir=node_modules; then
    echo "❌ Potential sensitive data found in commit"
    echo "Review files and ensure no secrets are committed"
    exit 1
fi

# Check for patient data storage patterns
echo "Checking for patient data storage violations..."
if git diff --cached | grep -i "INSERT.*patient\|CREATE TABLE.*medical\|patient.*storage"; then
    echo "❌ Potential patient data storage detected"
    echo "Review against zero-retention policy"
    exit 1
fi

# Run security linting
echo "Running security lint..."
npm run lint:security
if [ $? -ne 0 ]; then
    echo "❌ Security linting failed"
    exit 1
fi

# Validate commit message format
echo "Validating commit message format..."
npm run validate:commit-msg
if [ $? -ne 0 ]; then
    echo "❌ Commit message format invalid"
    exit 1
fi

echo "✅ Pre-commit security checks passed"
```

### Branch Protection Rules

#### Production Branch Protection
- Require pull request reviews before merging
- Require status checks to pass before merging
- Require security review approval
- Require up-to-date branches before merging
- Include administrators in restrictions
- Allow force pushes: ❌
- Allow deletions: ❌

#### Develop Branch Protection
- Require pull request reviews before merging
- Require status checks to pass before merging
- Require up-to-date branches before merging
- Allow force pushes: ❌
- Allow deletions: ❌

---

## Release Management

### Version Strategy
Following Semantic Versioning (SemVer): `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes or significant architectural updates
- **MINOR**: New features that maintain backward compatibility
- **PATCH**: Bug fixes and security patches

### Release Process

#### Planning Phase
1. **Feature Freeze**: Lock feature scope for release
2. **Security Review**: Complete security assessment
3. **Compliance Validation**: Verify TGV compliance maintained
4. **Documentation Update**: Update user and technical documentation

#### Testing Phase
1. **Integration Testing**: Full system integration testing
2. **Security Testing**: Penetration testing and vulnerability assessment
3. **Performance Testing**: Load testing with medical workflow simulations
4. **Compliance Testing**: Validate zero-retention and audit logging

#### Deployment Phase
1. **Staging Deployment**: Deploy to staging for final validation
2. **Medical User Testing**: Healthcare professionals validate workflows
3. **Production Deployment**: Deploy to production with monitoring
4. **Post-Deployment Monitoring**: Monitor system health and security

### Emergency Response

#### Security Incident Response
```bash
# Emergency hotfix workflow
git checkout Production
git checkout -b hotfix/EMERGENCY-security-patch

# Implement critical fix
# ... security patch development ...

# Emergency review and deployment
git commit -m "security(EMERGENCY): patch critical vulnerability

Critical security patch for production system.
Full security review and testing completed offline.

Vulnerability: [Brief description]
Impact: [Severity and scope]
Mitigation: [Solution implemented]
Validation: [Testing completed]"

# Deploy immediately
git checkout Production
git merge --no-ff hotfix/EMERGENCY-security-patch
git tag v1.2.1-emergency
git push origin Production --tags

# Immediate deployment to production
# Full incident report to follow
```

---

## Team Workflow

### Daily Development
1. **Start of Day**: Pull latest `develop`, create feature branch
2. **Development**: Implement features following security checklist
3. **Testing**: Run security and functional tests locally
4. **Commit**: Use security-first commit messages
5. **Push**: Create PR with security validation completed

### Weekly Planning
1. **Security Review**: Review any security issues from previous week
2. **Compliance Check**: Validate ongoing TGV compliance progress
3. **Feature Planning**: Plan features with security considerations
4. **Technical Debt**: Address security-related technical debt

### Monthly Security Audit
1. **Code Security Review**: Comprehensive security code review
2. **Dependency Audit**: Update and audit all dependencies
3. **Compliance Assessment**: Full TGV compliance assessment
4. **Incident Review**: Review any security incidents or issues

---

## Tools and Automation

### Required Tools
- **Git**: Version control with security-focused workflow
- **GitHub/GitLab**: Code review and CI/CD integration
- **npm audit**: Dependency vulnerability scanning
- **ESLint Security**: Security-focused linting rules
- **SonarQube**: Code quality and security analysis
- **OWASP ZAP**: Security testing automation

### Automation Scripts
```bash
# Security validation script
#!/bin/bash
# scripts/security-check.sh

echo "🔒 CentomoMD Security Validation"

# Dependency security audit
echo "Running dependency security audit..."
npm audit --audit-level=moderate
if [ $? -ne 0 ]; then
    echo "❌ Security vulnerabilities found in dependencies"
    exit 1
fi

# Code security scan
echo "Running code security scan..."
npm run lint:security
if [ $? -ne 0 ]; then
    echo "❌ Security issues found in code"
    exit 1
fi

# Compliance validation
echo "Validating compliance requirements..."
npm run test:compliance
if [ $? -ne 0 ]; then
    echo "❌ Compliance validation failed"
    exit 1
fi

echo "✅ All security checks passed"
```

---

## Training and Documentation

### Developer Onboarding
1. **Security Training**: Complete security awareness training
2. **Compliance Overview**: Understand TGV compliance requirements
3. **Git Workflow**: Master the security-first Git workflow
4. **Medical Domain**: Basic medical software development principles

### Ongoing Education
- Monthly security awareness sessions
- Quarterly compliance training updates
- Annual medical software development certification
- Regular Git workflow refresher training

---

This Git strategy ensures that every code change maintains our zero-retention security model while enabling efficient development of a compliant medical evaluation platform.