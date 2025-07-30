/**
 * Navigation Testing Utilities
 * 
 * Comprehensive mocking strategy for React Navigation v6
 * with route guards, state persistence, and screen transitions
 */

import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

// Types for navigation testing
export interface MockNavigationState {
  index: number
  routes: Array<{
    key: string
    name: string
    params?: Record<string, any>
  }>
}

export interface MockNavigationContextValue {
  navigate: jest.MockedFunction<any>
  goBack: jest.MockedFunction<any>
  canGoBack: jest.MockedFunction<any>
  reset: jest.MockedFunction<any>
  setParams: jest.MockedFunction<any>
  setOptions: jest.MockedFunction<any>
  dispatch: jest.MockedFunction<any>
  addListener: jest.MockedFunction<any>
  removeListener: jest.MockedFunction<any>
  isFocused: jest.MockedFunction<any>
  getId: jest.MockedFunction<any>
  getParent: jest.MockedFunction<any>
  getState: jest.MockedFunction<any>
}

export interface MockRouteContextValue {
  key: string
  name: string
  params: Record<string, any>
  path?: string
}

// Default mock navigation context
export const createMockNavigationContext = (
  overrides: Partial<MockNavigationContextValue> = {}
): MockNavigationContextValue => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  canGoBack: jest.fn(() => true),
  reset: jest.fn(),
  setParams: jest.fn(),
  setOptions: jest.fn(),
  dispatch: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeListener: jest.fn(),
  isFocused: jest.fn(() => true),
  getId: jest.fn(() => 'test-navigator'),
  getParent: jest.fn(() => null),
  getState: jest.fn(() => ({
    key: 'test-state',
    index: 0,
    routeNames: ['Home', 'Payment', 'Settings'],
    routes: [{ key: 'home-key', name: 'Home' }],
    type: 'stack',
    stale: false,
  })),
  ...overrides,
})

// Default mock route context
export const createMockRouteContext = (
  overrides: Partial<MockRouteContextValue> = {}
): MockRouteContextValue => ({
  key: 'test-route-key',
  name: 'TestScreen',
  params: {},
  ...overrides,
})

// Navigation state manager for testing
export class MockNavigationStateManager {
  private state: MockNavigationState
  private listeners: Set<Function> = new Set()

  constructor(initialState?: Partial<MockNavigationState>) {
    this.state = {
      index: 0,
      routes: [{ key: 'initial', name: 'Home' }],
      ...initialState,
    }
  }

  navigate(name: string, params?: Record<string, any>) {
    const existingRouteIndex = this.state.routes.findIndex(route => route.name === name)
    
    if (existingRouteIndex >= 0) {
      // Navigate to existing route
      this.state.index = existingRouteIndex
      if (params) {
        this.state.routes[existingRouteIndex].params = {
          ...this.state.routes[existingRouteIndex].params,
          ...params,
        }
      }
    } else {
      // Add new route
      this.state.routes.push({
        key: `${name.toLowerCase()}-${Date.now()}`,
        name,
        params,
      })
      this.state.index = this.state.routes.length - 1
    }

    this.notifyListeners()
  }

  goBack() {
    if (this.canGoBack()) {
      this.state.index -= 1
      this.notifyListeners()
      return true
    }
    return false
  }

  canGoBack() {
    return this.state.index > 0
  }

  reset(state: Partial<MockNavigationState>) {
    this.state = { ...this.state, ...state }
    this.notifyListeners()
  }

  getState() {
    return { ...this.state }
  }

  getCurrentRoute() {
    return this.state.routes[this.state.index]
  }

  addStateChangeListener(listener: Function) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getState()))
  }
}

// Route guard testing utilities
export interface RouteGuardConfig {
  name: string
  requiresAuth?: boolean
  requiresOnboarding?: boolean
  requiresWallet?: boolean
  allowedRoles?: string[]
}

export class MockRouteGuardManager {
  private guards: Map<string, RouteGuardConfig> = new Map()
  private userState = {
    isAuthenticated: false,
    hasCompletedOnboarding: false,
    hasWallet: false,
    role: 'user',
  }

  setRouteGuard(route: string, config: RouteGuardConfig) {
    this.guards.set(route, config)
  }

  setUserState(state: Partial<typeof this.userState>) {
    this.userState = { ...this.userState, ...state }
  }

  canNavigateToRoute(routeName: string): { allowed: boolean; reason?: string } {
    const guard = this.guards.get(routeName)
    
    if (!guard) {
      return { allowed: true }
    }

    if (guard.requiresAuth && !this.userState.isAuthenticated) {
      return { allowed: false, reason: 'Authentication required' }
    }

    if (guard.requiresOnboarding && !this.userState.hasCompletedOnboarding) {
      return { allowed: false, reason: 'Onboarding required' }
    }

    if (guard.requiresWallet && !this.userState.hasWallet) {
      return { allowed: false, reason: 'Wallet connection required' }
    }

    if (guard.allowedRoles && !guard.allowedRoles.includes(this.userState.role)) {
      return { allowed: false, reason: 'Insufficient permissions' }
    }

    return { allowed: true }
  }
}

// Screen transition testing utilities
export class MockScreenTransitionManager {
  private transitions: Map<string, any> = new Map()
  private currentTransition: string | null = null

  setTransition(from: string, to: string, config: any) {
    this.transitions.set(`${from}->${to}`, config)
  }

  startTransition(from: string, to: string) {
    const key = `${from}->${to}`
    const config = this.transitions.get(key)
    
    this.currentTransition = key
    
    // Simulate transition duration
    setTimeout(() => {
      this.currentTransition = null
    }, config?.duration || 300)
    
    return config
  }

  isTransitioning() {
    return this.currentTransition !== null
  }

  getCurrentTransition() {
    return this.currentTransition
  }
}

// Deep linking testing utilities
export class MockDeepLinkManager {
  private links: Map<string, any> = new Map()

  registerLink(path: string, config: { screen: string; params?: any }) {
    this.links.set(path, config)
  }

  handleDeepLink(url: string) {
    const path = new URL(url).pathname
    const config = this.links.get(path)
    
    if (config) {
      return {
        screen: config.screen,
        params: config.params,
      }
    }
    
    return null
  }

  generateLink(screen: string, params?: any) {
    for (const [path, config] of this.links) {
      if (config.screen === screen) {
        let link = `truetap://app${path}`
        if (params) {
          const searchParams = new URLSearchParams(params)
          link += `?${searchParams.toString()}`
        }
        return link
      }
    }
    
    return null
  }
}

// Test wrapper component for navigation testing
export const NavigationTestWrapper: React.FC<{
  children: React.ReactNode
  initialState?: MockNavigationState
  mockNavigation?: Partial<MockNavigationContextValue>
  mockRoute?: Partial<MockRouteContextValue>
}> = ({ 
  children, 
  initialState, 
  mockNavigation = {}, 
  mockRoute = {} 
}) => {
  const navigationContext = createMockNavigationContext(mockNavigation)
  const routeContext = createMockRouteContext(mockRoute)

  return (
    <div data-testid="navigation-test-wrapper">
      {children}
    </div>
  )
}

// Utility functions for common testing patterns
export const navigationTestUtils = {
  // Wait for navigation action to complete
  waitForNavigation: async (mockNavigate: jest.MockedFunction<any>, timeout = 1000) => {
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Navigation timeout'))
      }, timeout)

      const checkNavigation = () => {
        if (mockNavigate.mock.calls.length > 0) {
          clearTimeout(timer)
          resolve()
        } else {
          setTimeout(checkNavigation, 10)
        }
      }

      checkNavigation()
    })
  },

  // Create navigation event mock
  createNavigationEvent: (type: string, data?: any) => ({
    type,
    target: 'test-route-key',
    data,
    preventDefault: jest.fn(),
    defaultPrevented: false,
  }),

  // Mock back handler
  createBackHandlerMock: () => {
    const listeners = new Set<Function>()
    
    return {
      addEventListener: jest.fn((event: string, handler: Function) => {
        if (event === 'hardwareBackPress') {
          listeners.add(handler)
          return { remove: () => listeners.delete(handler) }
        }
      }),
      removeEventListener: jest.fn(),
      exitApp: jest.fn(),
      listeners,
      simulateBackPress: () => {
        let handled = false
        listeners.forEach(handler => {
          if (handler() === true) {
            handled = true
          }
        })
        return handled
      },
    }
  },

  // Validate navigation structure
  validateNavigationStructure: (navigationMock: MockNavigationContextValue) => {
    const requiredMethods = [
      'navigate', 'goBack', 'canGoBack', 'reset', 'setParams', 
      'setOptions', 'dispatch', 'addListener', 'getState'
    ]
    
    requiredMethods.forEach(method => {
      if (typeof navigationMock[method as keyof MockNavigationContextValue] !== 'function') {
        throw new Error(`Navigation mock missing method: ${method}`)
      }
    })
    
    return true
  },
}

// Export all utilities for use in tests
export {
  MockNavigationState,
  MockNavigationContextValue,
  MockRouteContextValue,
}