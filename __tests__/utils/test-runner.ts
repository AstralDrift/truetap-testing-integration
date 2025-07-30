/**
 * Test Runner Utilities
 * 
 * Comprehensive test execution utilities for the True Tap Testing Integration
 * Provides orchestration for different test types and environments
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'

export interface TestSuiteConfig {
  name: string
  pattern: string
  timeout: number
  maxWorkers: number
  coverage: boolean
  environment: 'jsdom' | 'node' | 'react-native'
}

export interface TestExecutionResult {
  success: boolean
  testsRun: number
  testsPassed: number
  testsFailed: number
  coverage?: {
    lines: number
    functions: number
    branches: number
    statements: number
  }
  duration: number
  errors: string[]
}

export class TestRunner {
  private suites: Map<string, TestSuiteConfig> = new Map()

  constructor() {
    this.initializeDefaultSuites()
  }

  private initializeDefaultSuites() {
    // Unit Tests
    this.suites.set('unit', {
      name: 'Unit Tests',
      pattern: '__tests__/**/*.test.{ts,tsx}',
      timeout: 10000,
      maxWorkers: 1,
      coverage: true,
      environment: 'jsdom',
    })

    // Component Tests
    this.suites.set('components', {
      name: 'Component Tests',
      pattern: '__tests__/components/**/*.test.{ts,tsx}',
      timeout: 15000,
      maxWorkers: 1,
      coverage: true,
      environment: 'jsdom',
    })

    // Integration Tests
    this.suites.set('integration', {
      name: 'Integration Tests', 
      pattern: '__tests__/integration/**/*.test.{ts,tsx}',
      timeout: 20000,
      maxWorkers: 1,
      coverage: true,
      environment: 'jsdom',
    })

    // Device Compatibility Tests
    this.suites.set('device', {
      name: 'Device Compatibility Tests',
      pattern: '__tests__/device-compatibility/**/*.test.{ts,tsx}',
      timeout: 30000,
      maxWorkers: 1,
      coverage: false,
      environment: 'react-native',
    })

    // Performance Tests
    this.suites.set('performance', {
      name: 'Performance Tests',
      pattern: '__tests__/performance/**/*.test.{ts,tsx}',
      timeout: 45000,
      maxWorkers: 1,
      coverage: false,
      environment: 'jsdom',
    })

    // Accessibility Tests
    this.suites.set('accessibility', {
      name: 'Accessibility Tests',
      pattern: '__tests__/accessibility/**/*.test.{ts,tsx}',
      timeout: 20000,
      maxWorkers: 1,
      coverage: true,
      environment: 'jsdom',
    })
  }

  addSuite(key: string, config: TestSuiteConfig) {
    this.suites.set(key, config)
  }

  getSuite(key: string): TestSuiteConfig | undefined {
    return this.suites.get(key)
  }

  listSuites(): TestSuiteConfig[] {
    return Array.from(this.suites.values())
  }

  async runSuite(
    suiteKey: string, 
    options: {
      watch?: boolean
      verbose?: boolean
      updateSnapshots?: boolean
    } = {}
  ): Promise<TestExecutionResult> {
    const suite = this.suites.get(suiteKey)
    if (!suite) {
      throw new Error(`Test suite '${suiteKey}' not found`)
    }

    const startTime = Date.now()
    
    try {
      // Build Jest command
      const jestArgs = [
        '--testPathPattern', suite.pattern,
        '--testTimeout', suite.timeout.toString(),
        '--maxWorkers', suite.maxWorkers.toString(),
        '--testEnvironment', suite.environment,
      ]

      if (suite.coverage) {
        jestArgs.push('--coverage')
      }

      if (options.watch) {
        jestArgs.push('--watch')
      }

      if (options.verbose) {
        jestArgs.push('--verbose')
      }

      if (options.updateSnapshots) {
        jestArgs.push('--updateSnapshot')
      }

      // Execute Jest
      const command = `npx jest ${jestArgs.join(' ')}`
      console.log(`Running: ${command}`)

      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      })

      // Parse Jest output
      const result = this.parseJestOutput(output)
      result.duration = Date.now() - startTime

      return result
    } catch (error: any) {
      return {
        success: false,
        testsRun: 0,
        testsPassed: 0,
        testsFailed: 0,
        duration: Date.now() - startTime,
        errors: [error.message, error.stdout || '', error.stderr || ''].filter(Boolean),
      }
    }
  }

  async runAll(options: {
    parallel?: boolean
    failFast?: boolean
    coverage?: boolean
  } = {}): Promise<Map<string, TestExecutionResult>> {
    const results = new Map<string, TestExecutionResult>()
    const suiteKeys = Array.from(this.suites.keys())

    if (options.parallel) {
      // Run suites in parallel
      const promises = suiteKeys.map(async (key) => {
        const result = await this.runSuite(key, { verbose: true })
        return { key, result }
      })

      const parallelResults = await Promise.allSettled(promises)
      
      parallelResults.forEach((settledResult, index) => {
        if (settledResult.status === 'fulfilled') {
          results.set(settledResult.value.key, settledResult.value.result)
        } else {
          results.set(suiteKeys[index], {
            success: false,
            testsRun: 0,
            testsPassed: 0,
            testsFailed: 0,
            duration: 0,
            errors: [settledResult.reason.message || 'Unknown error'],
          })
        }
      })
    } else {
      // Run suites sequentially
      for (const key of suiteKeys) {
        const result = await this.runSuite(key, { verbose: true })
        results.set(key, result)

        // Fail fast if enabled and suite failed
        if (options.failFast && !result.success) {
          break
        }
      }
    }

    return results
  }

  private parseJestOutput(output: string): TestExecutionResult {
    const lines = output.split('\n')
    
    let testsRun = 0
    let testsPassed = 0
    let testsFailed = 0
    let coverage: any = undefined

    // Parse test results
    const testSummaryLine = lines.find(line => 
      line.includes('Tests:') && (line.includes('passed') || line.includes('failed'))
    )

    if (testSummaryLine) {
      const passedMatch = testSummaryLine.match(/(\d+) passed/)
      const failedMatch = testSummaryLine.match(/(\d+) failed/)
      const totalMatch = testSummaryLine.match(/(\d+) total/)

      if (passedMatch) testsPassed = parseInt(passedMatch[1])
      if (failedMatch) testsFailed = parseInt(failedMatch[1])
      if (totalMatch) testsRun = parseInt(totalMatch[1])
    }

    // Parse coverage results
    const coverageLines = lines.filter(line => 
      line.includes('All files') || line.includes('|')
    )

    if (coverageLines.length > 0) {
      const coverageLine = coverageLines.find(line => line.includes('All files'))
      if (coverageLine) {
        const parts = coverageLine.split('|').map(s => s.trim())
        if (parts.length >= 5) {
          coverage = {
            statements: parseFloat(parts[1]) || 0,
            branches: parseFloat(parts[2]) || 0,
            functions: parseFloat(parts[3]) || 0,
            lines: parseFloat(parts[4]) || 0,
          }
        }
      }
    }

    return {
      success: testsFailed === 0,
      testsRun,
      testsPassed,
      testsFailed,
      coverage,
      duration: 0, // Will be set by caller
      errors: [],
    }
  }

  generateReport(results: Map<string, TestExecutionResult>): string {
    const report: string[] = []
    
    report.push('='.repeat(80))
    report.push('TRUE TAP - TESTING INTEGRATION REPORT')
    report.push('='.repeat(80))
    report.push('')

    let totalTests = 0
    let totalPassed = 0
    let totalFailed = 0
    let totalDuration = 0

    results.forEach((result, suiteName) => {
      const suite = this.suites.get(suiteName)
      const status = result.success ? '✅ PASS' : '❌ FAIL'
      
      report.push(`${status} ${suite?.name || suiteName}`)
      report.push(`  Tests: ${result.testsRun} total, ${result.testsPassed} passed, ${result.testsFailed} failed`)
      report.push(`  Duration: ${(result.duration / 1000).toFixed(2)}s`)
      
      if (result.coverage) {
        report.push(`  Coverage: ${result.coverage.statements}% statements, ${result.coverage.branches}% branches`)
      }

      if (result.errors.length > 0) {
        report.push(`  Errors: ${result.errors.length}`)
        result.errors.forEach(error => {
          report.push(`    - ${error.split('\n')[0]}`)
        })
      }

      report.push('')

      totalTests += result.testsRun
      totalPassed += result.testsPassed
      totalFailed += result.testsFailed
      totalDuration += result.duration
    })

    report.push('-'.repeat(80))
    report.push('SUMMARY')
    report.push('-'.repeat(80))
    report.push(`Total Tests: ${totalTests}`)
    report.push(`Passed: ${totalPassed}`)
    report.push(`Failed: ${totalFailed}`)
    report.push(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`)
    report.push(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`)
    report.push('')

    const overallStatus = totalFailed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'
    report.push(overallStatus)
    report.push('')

    return report.join('\n')
  }

  async validateTestEnvironment(): Promise<{
    valid: boolean
    issues: string[]
    recommendations: string[]
  }> {
    const issues: string[] = []
    const recommendations: string[] = []

    // Check for required files
    const requiredFiles = [
      'jest.config.js',
      '__tests__/setup.ts',
      '__tests__/utils/enhanced-test-setup.ts',
      '__tests__/utils/navigation-test-utils.ts',
      '__tests__/utils/device-compatibility-testing.ts',
    ]

    requiredFiles.forEach(file => {
      if (!existsSync(file)) {
        issues.push(`Missing required file: ${file}`)
      }
    })

    // Check Jest configuration
    try {
      const jestConfig = require('../../jest.config.enhanced.js')
      
      if (!jestConfig.projects || jestConfig.projects.length === 0) {
        issues.push('Jest config missing projects configuration')
      }

      if (!jestConfig.coverageThreshold) {
        recommendations.push('Consider adding coverage thresholds to jest.config.js')
      }
    } catch (error) {
      issues.push('Could not load Jest configuration')
    }

    // Check for test utilities
    const utilityFiles = [
      '__tests__/utils/navigation-test-utils.ts',
      '__tests__/utils/device-compatibility-testing.ts',
    ]

    utilityFiles.forEach(file => {
      if (!existsSync(file)) {
        issues.push(`Missing test utility: ${file}`)
      }
    })

    return {
      valid: issues.length === 0,
      issues,
      recommendations,
    }
  }
}

// Export singleton instance
export const testRunner = new TestRunner()

// Command-line interface
if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'run':
      const suite = args[1] || 'unit'
      testRunner.runSuite(suite, { verbose: true })
        .then(result => {
          console.log(`Suite '${suite}' completed:`, result)
          process.exit(result.success ? 0 : 1)
        })
        .catch(error => {
          console.error('Test execution failed:', error)
          process.exit(1)
        })
      break

    case 'all':
      testRunner.runAll({ parallel: false, coverage: true })
        .then(results => {
          const report = testRunner.generateReport(results)
          console.log(report)
          
          const hasFailures = Array.from(results.values()).some(r => !r.success)
          process.exit(hasFailures ? 1 : 0)
        })
        .catch(error => {
          console.error('Test execution failed:', error)
          process.exit(1)
        })
      break

    case 'validate':
      testRunner.validateTestEnvironment()
        .then(validation => {
          console.log('Test Environment Validation:')
          console.log(`Status: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`)
          
          if (validation.issues.length > 0) {
            console.log('\nIssues:')
            validation.issues.forEach(issue => console.log(`  - ${issue}`))
          }

          if (validation.recommendations.length > 0) {
            console.log('\nRecommendations:')
            validation.recommendations.forEach(rec => console.log(`  - ${rec}`))
          }

          process.exit(validation.valid ? 0 : 1)
        })
        .catch(error => {
          console.error('Validation failed:', error)
          process.exit(1)
        })
      break

    default:
      console.log('Usage:')
      console.log('  npm run test-runner run [suite]   - Run specific test suite')
      console.log('  npm run test-runner all          - Run all test suites')
      console.log('  npm run test-runner validate     - Validate test environment')
      console.log('')
      console.log('Available suites:', Array.from(testRunner.listSuites().map(s => s.name)))
      break
  }
}