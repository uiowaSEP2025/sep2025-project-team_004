# Code Coverage in Our Django Project

This document explains how code coverage is set up and monitored in our project.

## What is Code Coverage?

Code coverage is a metric that helps us understand how much of our codebase is being tested by our test suite. It's expressed as a percentage of code lines that are executed during tests divided by the total number of executable lines.

## How We Track Code Coverage

We use the following tools to track code coverage:

1. **pytest-cov**: A pytest plugin that measures code coverage during test runs
2. **GitHub Actions**: Automatically runs tests and measures coverage on each pull request and push to main branches
3. **Codecov**: Visualizes and tracks coverage over time

## Running Coverage Locally

To check coverage on your local machine:

```bash
# Install required packages
pip install pytest pytest-django pytest-cov

# Run tests with coverage
cd backend/sep2025_project_team_004
pytest --cov=sep2025_project_team_004 --cov-report=html

# Open the generated report
open htmlcov/index.html  # on macOS
# or
start htmlcov/index.html  # on Windows
```

## Coverage Requirements

We strive to maintain at least 70% code coverage. Our CI pipeline is configured to fail if coverage falls below this threshold.

## Coverage Configuration

The coverage settings are defined in two places:

1. **pytest.ini**: Contains configuration for pytest and coverage
2. **.github/workflows/test.yml**: Contains the GitHub Actions workflow that runs tests and checks coverage

## Improving Coverage

To improve code coverage:

1. Write tests for untested code
2. Focus on testing business logic and complex functionality
3. Use the coverage report to identify untested code areas
4. Aim for meaningful tests rather than just improving the coverage percentage

## CI Integration

Every pull request will automatically have its code coverage checked. If coverage falls below 70%, the CI will fail, preventing merges until coverage is improved.

## Codecov Dashboard

You can view detailed coverage reports on the [Codecov dashboard](https://codecov.io) after setting up your repository with Codecov. 