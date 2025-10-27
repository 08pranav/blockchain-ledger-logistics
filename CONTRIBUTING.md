# Contributing to Blockchain Ledger – Logistics Accounting System

Thank you for your interest in contributing to this project! This guide will help you get started with contributing to our blockchain ledger system.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Coding Standards](#coding-standards)

## 🤝 Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow:

- **Be respectful**: Treat everyone with respect and kindness
- **Be inclusive**: Welcome newcomers and help them get started
- **Be constructive**: Provide helpful feedback and suggestions
- **Be patient**: Remember that everyone has different skill levels

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:
- Node.js (v16 or higher)
- npm or yarn
- Git
- MongoDB (local or Atlas account)

### Fork and Clone

1. Fork this repository on GitHub
2. Clone your forked repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/blockchain-ledger-logistics.git
   cd blockchain-ledger-logistics
   ```

3. Add the original repository as upstream:
   ```bash
   git remote add upstream https://github.com/08pranav/blockchain-ledger-logistics.git
   ```

## 🛠️ Development Setup

1. **Install Dependencies**
   ```bash
   npm run install-all
   ```

2. **Set Up Environment Variables**
   ```bash
   # Copy environment template
   cp server/.env.example server/.env
   
   # Edit the .env file with your configuration
   ```

3. **Start Development Servers**
   ```bash
   npm run dev
   ```

4. **Run Tests** (when available)
   ```bash
   npm test
   ```

## 🎯 Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug Fixes**: Fix existing issues or bugs
- ✨ **New Features**: Add new functionality
- 📚 **Documentation**: Improve or add documentation
- 🎨 **UI/UX Improvements**: Enhance user interface and experience
- ⚡ **Performance**: Optimize code performance
- 🔧 **Refactoring**: Improve code structure without changing functionality
- 🧪 **Tests**: Add or improve test coverage

### Before You Start

1. **Check Existing Issues**: Look for existing issues related to your contribution
2. **Create an Issue**: If none exists, create one to discuss your proposed changes
3. **Get Assignment**: Wait for maintainer approval before starting work on large features

### Branch Naming Convention

Use descriptive branch names:
- `feature/add-transaction-validation`
- `fix/login-authentication-bug`
- `docs/update-api-documentation`
- `refactor/blockchain-validation-logic`

## 📝 Pull Request Process

### 1. Keep Your Fork Updated

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Update documentation if needed

### 4. Test Your Changes

- Ensure all existing tests pass
- Add tests for new functionality
- Test the application thoroughly

### 5. Commit Your Changes

Use clear, descriptive commit messages following this format:

```
type(scope): brief description

Longer description if necessary

- List any breaking changes
- Reference issues: Fixes #123
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(auth): add two-factor authentication

- Implement TOTP-based 2FA
- Add QR code generation for setup
- Update user model with 2FA fields

Fixes #145"
```

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear title and description
- Link to related issues
- Screenshots for UI changes
- Testing instructions

## 🐛 Issue Guidelines

### Reporting Bugs

When reporting bugs, please include:

1. **Clear Title**: Brief description of the issue
2. **Environment**: OS, Node.js version, browser (if applicable)
3. **Steps to Reproduce**: Detailed steps to reproduce the bug
4. **Expected Behavior**: What should happen
5. **Actual Behavior**: What actually happens
6. **Screenshots**: If applicable
7. **Additional Context**: Any other relevant information

### Requesting Features

For feature requests, include:

1. **Problem Statement**: What problem does this solve?
2. **Proposed Solution**: How should it work?
3. **Alternatives**: Other solutions you've considered
4. **Use Cases**: Real-world scenarios where this would be useful

## 💻 Coding Standards

### JavaScript/React

- Use ES6+ features
- Follow ESLint configuration
- Use functional components with hooks
- Write self-documenting code with clear variable names
- Add JSDoc comments for complex functions

```javascript
/**
 * Validates a blockchain transaction
 * @param {Object} transaction - The transaction to validate
 * @param {string} transaction.from - Sender address
 * @param {string} transaction.to - Recipient address
 * @param {number} transaction.amount - Transaction amount
 * @returns {boolean} True if transaction is valid
 */
function validateTransaction(transaction) {
  // Implementation here
}
```

### CSS/Styling

- Use TailwindCSS classes consistently
- Follow mobile-first responsive design
- Use semantic class names for custom CSS
- Maintain consistent spacing and typography

### File Organization

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── context/       # React context providers
├── utils/         # Utility functions
├── hooks/         # Custom React hooks
└── constants/     # Application constants
```

### API Design

- Use RESTful conventions
- Include proper error handling
- Add input validation
- Write clear API documentation
- Use consistent response formats

```javascript
// Good API response format
{
  success: true,
  data: { ... },
  message: "Operation completed successfully"
}

// Error response format
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input data",
    details: { ... }
  }
}
```

## 🧪 Testing Guidelines

### Unit Tests

- Test individual functions and components
- Use descriptive test names
- Follow Arrange-Act-Assert pattern

```javascript
describe('validateTransaction', () => {
  it('should return true for valid transaction', () => {
    // Arrange
    const transaction = {
      from: 'address1',
      to: 'address2',
      amount: 100
    };

    // Act
    const result = validateTransaction(transaction);

    // Assert
    expect(result).toBe(true);
  });
});
```

### Integration Tests

- Test API endpoints
- Test database operations
- Test user workflows

## 📋 Review Checklist

Before submitting your PR, ensure:

- [ ] Code follows project conventions
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] No console.log statements in production code
- [ ] Error handling is implemented
- [ ] Security best practices are followed
- [ ] Performance impact is considered
- [ ] Accessibility guidelines are met (for UI changes)

## 🎉 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Project documentation
- Special mentions in project updates

## ❓ Questions?

If you have questions about contributing:

1. Check existing issues and discussions
2. Create a new issue with the "question" label
3. Reach out to maintainers
4. Join our community discussions

## 📚 Resources

- [Project Documentation](README.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Issue Templates](.github/ISSUE_TEMPLATE)
- [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md)

---

**Thank you for contributing to the future of blockchain-based logistics! 🚀**

*Every contribution, no matter how small, makes a difference.*