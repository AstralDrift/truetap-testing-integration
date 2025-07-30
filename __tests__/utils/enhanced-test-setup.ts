/**
 * Enhanced Test Setup for React Native Solana Payment App
 * 
 * Provides comprehensive testing utilities for:
 * - Animation testing with Framer Motion
 * - Performance monitoring
 * - Device capability simulation
 * - Accessibility testing helpers
 */

import { configure } from '@testing-library/react-native'
import 'jest-extended'

// Configure testing library for React Native
configure({
  asyncUtilTimeout: 10000,
  // Improved query helpers for RN components
  defaultHidden: true,
})

// Mock Framer Motion for testing
jest.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (target, prop) => {
        if (typeof prop === 'string') {
          return React.forwardRef<any, any>(({ children, ...props }, ref) =>
            React.createElement(prop, { ...props, ref }, children)
          )
        }
        return target[prop as keyof typeof target]
      },
    }
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useAnimation: () => ({
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useMotionValue: (initial: any) => ({
    get: () => initial,
    set: jest.fn(),
    on: jest.fn(),
    destroy: jest.fn(),
  }),
  useTransform: (value: any, input: any, output: any) => ({
    get: () => output[0],
    set: jest.fn(),
    on: jest.fn(),
    destroy: jest.fn(),
  }),
  useSpring: (value: any) => value,
  useCycle: (...values: any[]) => [values[0], jest.fn()],
  useReducedMotion: () => false,
  usePresence: () => [true, jest.fn()],
  useIsPresent: () => true,
  MotionConfig: ({ children }: { children: React.ReactNode }) => children,
  Variants: {},
}))

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  
  // Add missing mocks
  Reanimated.default.call = () => {}
  Reanimated.default.clock = jest.fn()
  Reanimated.default.Value = jest.fn()
  Reanimated.default.event = jest.fn(() => jest.fn())
  Reanimated.default.add = jest.fn()
  Reanimated.default.eq = jest.fn()
  Reanimated.default.set = jest.fn()
  Reanimated.default.cond = jest.fn()
  Reanimated.default.interpolate = jest.fn()
  Reanimated.default.View = require('react-native').View
  Reanimated.default.Extrapolate = { EXTEND: 'extend', CLAMP: 'clamp', IDENTITY: 'identity' }
  Reanimated.default.interpolateNode = jest.fn()
  Reanimated.default.Easing = {
    in: jest.fn(),
    out: jest.fn(),
    inOut: jest.fn(),
    linear: jest.fn(),
    ease: jest.fn(),
    quad: jest.fn(),
    cubic: jest.fn(),
    poly: jest.fn(),
    sin: jest.fn(),
    circle: jest.fn(),
    exp: jest.fn(),
    elastic: jest.fn(),
    back: jest.fn(),
    bounce: jest.fn(),
    bezier: jest.fn(),
  }
  
  return Reanimated
})

// Mock React Native Gesture Handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View')
  const Text = require('react-native/Libraries/Text/Text')
  const ScrollView = require('react-native/Libraries/Components/ScrollView/ScrollView')
  const FlatList = require('react-native/Libraries/Lists/FlatList')
  
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView,
    FlatList,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    gestureHandlerRootHOC: jest.fn((component) => component),
    Directions: {},
    GestureDetector: View,
    Gesture: {
      Tap: () => ({}),
      Pan: () => ({}),
      Pinch: () => ({}),
      Rotation: () => ({}),
      Fling: () => ({}),
      LongPress: () => ({}),
    },
  }
})

// Performance monitoring utilities
global.performance = global.performance || {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  navigation: {} as any,
  timing: {} as any,
  onresourcetimingbufferfull: null,
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  clearResourceTimings: jest.fn(),
  getEntries: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  setResourceTimingBufferSize: jest.fn(),
  toJSON: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}

// Memory monitoring for performance tests
interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

// @ts-ignore
global.performance.memory = {
  usedJSHeapSize: 10000000, // 10MB
  totalJSHeapSize: 20000000, // 20MB
  jsHeapSizeLimit: 100000000, // 100MB
} as MemoryInfo

// Mock device information
jest.mock('react-native-device-info', () => ({
  getModel: jest.fn(() => Promise.resolve('Solana Seeker')),
  getDeviceId: jest.fn(() => Promise.resolve('test-device-id')),
  getSystemVersion: jest.fn(() => Promise.resolve('14')),
  getBuildNumber: jest.fn(() => Promise.resolve('1')),
  getVersion: jest.fn(() => Promise.resolve('0.1.0')),
  getBundleId: jest.fn(() => Promise.resolve('com.truetap.app')),
  isEmulator: jest.fn(() => Promise.resolve(false)),
  hasNfc: jest.fn(() => Promise.resolve(true)),
  hasBluetooth: jest.fn(() => Promise.resolve(true)),
  supportedAbis: jest.fn(() => Promise.resolve(['arm64-v8a'])),
  getAvailableLocationProviders: jest.fn(() => Promise.resolve({})),
}))

// Enhanced console methods for test debugging
const originalConsole = { ...console }

// Test-specific console wrapper
global.testConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}

// Utility for capturing console output in tests
export const captureConsoleOutput = () => {
  const captured = {
    log: [] as any[],
    warn: [] as any[],
    error: [] as any[],
    info: [] as any[],
  }

  console.log = jest.fn((...args) => captured.log.push(args))
  console.warn = jest.fn((...args) => captured.warn.push(args))
  console.error = jest.fn((...args) => captured.error.push(args))
  console.info = jest.fn((...args) => captured.info.push(args))

  return {
    captured,
    restore: () => {
      console.log = originalConsole.log
      console.warn = originalConsole.warn
      console.error = originalConsole.error
      console.info = originalConsole.info
    },
  }
}

// Animation testing utilities
export const animationTestUtils = {
  // Wait for animations to complete
  waitForAnimations: (duration = 500) => 
    new Promise(resolve => setTimeout(resolve, duration)),
  
  // Mock animation frame
  mockAnimationFrame: () => {
    let id = 0
    global.requestAnimationFrame = jest.fn((callback) => {
      setTimeout(callback, 16) // Simulate 60fps
      return ++id
    })
    global.cancelAnimationFrame = jest.fn()
  },

  // Test reduced motion
  mockReducedMotion: (enabled: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: enabled && query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })
  },
}

// Accessibility testing utilities
export const accessibilityTestUtils = {
  // Check for accessibility violations
  checkA11y: async (container: any) => {
    // Mock accessibility checker
    const violations = []
    
    // Check for missing labels
    const unlabeledElements = container.querySelectorAll(
      'button:not([aria-label]):not([aria-labelledby]), input:not([aria-label]):not([aria-labelledby])'
    )
    
    if (unlabeledElements.length > 0) {
      violations.push({
        rule: 'label',
        description: 'Interactive elements must have accessible labels',
        elements: unlabeledElements,
      })
    }

    return violations
  },

  // Mock screen reader
  mockScreenReader: () => ({
    announce: jest.fn(),
    focus: jest.fn(),
    speak: jest.fn(),
  }),
}

// Test data generators
export const testDataGenerators = {
  // Generate mock wallet data
  createMockWallet: () => ({
    publicKey: 'H4jHizv4q5pdo2SgXbuhw2LF2a2b8XjXq8K1Z2Y3Z4b5',
    balance: 10.5,
    transactions: [
      {
        id: 'tx1',
        type: 'send' as const,
        amount: 2.5,
        timestamp: Date.now() - 86400000,
        otherParty: 'recipient1',
        status: 'confirmed' as const,
      },
    ],
  }),

  // Generate mock contact
  createMockContact: (overrides = {}) => ({
    id: 'contact1',
    name: 'John Doe',
    publicKey: 'H4jHizv4q5pdo2SgXbuhw2LF2a2b8XjXq8K1Z2Y3Z4b5',
    avatar: null,
    lastSeen: new Date(),
    isVerified: true,
    tags: [],
    ...overrides,
  }),

  // Generate mock preferences
  createMockPreferences: (overrides = {}) => ({
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    voiceOverEnabled: false,
    hapticsEnabled: true,
    soundEnabled: true,
    tipsEnabled: true,
    ...overrides,
  }),
}

// Cleanup utilities
export const testCleanup = {
  // Clear all timers and intervals
  clearTimers: () => {
    if (typeof global.gc === 'function') {
      global.gc()
    }
    jest.runOnlyPendingTimers()
    jest.clearAllTimers()
  },

  // Reset all mocks
  resetMocks: () => {
    jest.clearAllMocks()
    jest.resetAllMocks()
    jest.restoreAllMocks()
  },

  // Clean up DOM
  cleanupDOM: () => {
    if (typeof document !== 'undefined') {
      document.body.innerHTML = ''
    }
  },
}

// Global test cleanup
afterEach(() => {
  testCleanup.clearTimers()
  // Don't automatically reset mocks to allow for custom cleanup per test
})

afterAll(() => {
  testCleanup.resetMocks()
  testCleanup.cleanupDOM()
})

// Export testing utilities for use in tests
export * from './navigation-test-utils'
export * from './device-compatibility-testing'