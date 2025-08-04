#!/usr/bin/env node

/**
 * Test Runner Script for CargoFlow Backend
 * 
 * This script orchestrates the execution of all test suites:
 * - Unit tests
 * - Integration tests  
 * - End-to-end tests
 */

const { spawn } = require('child_process');
const path = require('path');

// ANSI color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

/**
 * Print colored console messages
 */
function printMessage(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print section headers
 */
function printHeader(message) {
  console.log('\n' + '='.repeat(60));
  printMessage(message, 'bold');
  console.log('='.repeat(60));
}

/**
 * Run a command and return a promise
 */
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Run test suite with timing
 */
async function runTestSuite(name, command, args = []) {
  printHeader(`Running ${name}`);
  const startTime = Date.now();
  
  try {
    await runCommand(command, args);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    printMessage(`✅ ${name} completed successfully in ${duration}s`, 'green');
    return true;
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    printMessage(`❌ ${name} failed after ${duration}s`, 'red');
    printMessage(`Error: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  printHeader('CargoFlow Backend Test Suite');
  printMessage('Starting comprehensive test execution...', 'cyan');
  
  const testResults = {
    unit: false,
    integration: false,
    e2e: false
  };

  const startTime = Date.now();

  try {
    // Check if dependencies are installed
    printMessage('Checking dependencies...', 'yellow');
    await runCommand('npm', ['list', '--depth=0'], { stdio: 'pipe' });
    printMessage('Dependencies verified ✓', 'green');

    // Run unit tests
    testResults.unit = await runTestSuite(
      'Unit Tests',
      'npm',
      ['run', 'test:unit']
    );

    // Run integration tests
    testResults.integration = await runTestSuite(
      'Integration Tests', 
      'npm',
      ['run', 'test:integration']
    );

    // Run E2E tests
    testResults.e2e = await runTestSuite(
      'End-to-End Tests',
      'npm', 
      ['run', 'test:e2e']
    );

    // Generate coverage report
    printHeader('Generating Coverage Report');
    try {
      await runCommand('npm', ['run', 'test:coverage']);
      printMessage('✅ Coverage report generated successfully', 'green');
    } catch (error) {
      printMessage('⚠️  Coverage report generation failed', 'yellow');
    }

  } catch (error) {
    printMessage(`Fatal error: ${error.message}`, 'red');
  }

  // Print summary
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  printHeader('Test Results Summary');
  
  const passed = Object.values(testResults).filter(Boolean).length;
  const total = Object.keys(testResults).length;
  
  printMessage(`Unit Tests: ${testResults.unit ? '✅ PASSED' : '❌ FAILED'}`, 
    testResults.unit ? 'green' : 'red');
  printMessage(`Integration Tests: ${testResults.integration ? '✅ PASSED' : '❌ FAILED'}`, 
    testResults.integration ? 'green' : 'red');
  printMessage(`E2E Tests: ${testResults.e2e ? '✅ PASSED' : '❌ FAILED'}`, 
    testResults.e2e ? 'green' : 'red');
  
  console.log('\n' + '-'.repeat(40));
  printMessage(`Total: ${passed}/${total} test suites passed`, 
    passed === total ? 'green' : 'red');
  printMessage(`Execution time: ${totalTime}s`, 'cyan');
  
  if (passed === total) {
    printMessage('\n🎉 All tests passed! Your code is ready for deployment.', 'green');
    process.exit(0);
  } else {
    printMessage('\n🚨 Some tests failed. Please review the errors above.', 'red');
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  printMessage('CargoFlow Backend Test Runner', 'bold');
  console.log('\nUsage: node run-tests.js [options]');
  console.log('\nOptions:');
  console.log('  --help, -h     Show this help message');
  console.log('  --unit         Run only unit tests');
  console.log('  --integration  Run only integration tests');
  console.log('  --e2e          Run only end-to-end tests');
  console.log('  --coverage     Run tests with coverage report');
  console.log('\nExamples:');
  console.log('  node run-tests.js                 # Run all tests');
  console.log('  node run-tests.js --unit          # Run only unit tests');
  console.log('  node run-tests.js --coverage      # Run all tests with coverage');
  process.exit(0);
}

// Handle specific test type arguments
if (args.includes('--unit')) {
  runTestSuite('Unit Tests', 'npm', ['run', 'test:unit'])
    .then(success => process.exit(success ? 0 : 1));
} else if (args.includes('--integration')) {
  runTestSuite('Integration Tests', 'npm', ['run', 'test:integration'])
    .then(success => process.exit(success ? 0 : 1));
} else if (args.includes('--e2e')) {
  runTestSuite('End-to-End Tests', 'npm', ['run', 'test:e2e'])
    .then(success => process.exit(success ? 0 : 1));
} else if (args.includes('--coverage')) {
  runCommand('npm', ['run', 'test:coverage'])
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else {
  // Run all tests
  runTests();
}

// Handle process termination
process.on('SIGINT', () => {
  printMessage('\n\nTest execution interrupted by user', 'yellow');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  printMessage(`\nUncaught exception: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  printMessage(`\nUnhandled rejection at: ${promise}, reason: ${reason}`, 'red');
  process.exit(1);
});
