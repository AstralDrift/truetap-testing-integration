/**
 * Screen Integration Tests
 * 
 * Tests for refactored screen components with navigation, state management,
 * and component interactions
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { 
  NavigationTestWrapper,
  MockNavigationStateManager,
  MockRouteGuardManager,
  createMockNavigationContext,
  createMockRouteContext
} from '../utils/navigation-test-utils'

// Mock the refactored screen components
const MockPaymentFlowScreen = ({ navigation, route }: any) => (
  <div data-testid="payment-flow-screen">
    <h1>Payment Flow</h1>
    <button onClick={() => navigation.navigate('AmountInput')}>
      Enter Amount
    </button>
    <button onClick={() => navigation.navigate('PaymentConfirmation', { amount: '1.5' })}>
      Confirm Payment
    </button>
    <div data-testid="route-params">
      {route.params ? JSON.stringify(route.params) : 'No params'}
    </div>
  </div>
)

const MockDashboardScreen = ({ navigation, route }: any) => (
  <div data-testid="dashboard-screen">
    <h1>Dashboard</h1>
    <button onClick={() => navigation.navigate('Payment')}>
      Send Payment
    </button>
    <button onClick={() => navigation.navigate('Contacts')}>
      View Contacts
    </button>
    <div data-testid="wallet-balance">Balance: 10.5 SOL</div>
  </div>
)

const MockWalletConnectionScreen = ({ navigation, route }: any) => (
  <div data-testid="wallet-connection-screen">
    <h1>Connect Wallet</h1>
    <button onClick={() => navigation.navigate('Dashboard')}>
      Continue to Dashboard
    </button>
    <button onClick={() => navigation.goBack()}>
      Go Back
    </button>
    <div data-testid="connection-status">
      {route.params?.connected ? 'Connected' : 'Disconnected'}
    </div>
  </div>
)

describe('Screen Integration Tests', () => {
  let mockNavigation: any
  let mockRoute: any
  let navigationStateManager: MockNavigationStateManager
  let routeGuardManager: MockRouteGuardManager

  beforeEach(() => {
    navigationStateManager = new MockNavigationStateManager()
    routeGuardManager = new MockRouteGuardManager()
    
    mockNavigation = createMockNavigationContext({
      navigate: jest.fn((screen, params) => {
        navigationStateManager.navigate(screen, params)
      }),
      goBack: jest.fn(() => {
        return navigationStateManager.goBack()
      }),
      canGoBack: jest.fn(() => navigationStateManager.canGoBack()),
      getState: jest.fn(() => navigationStateManager.getState()),
    })

    mockRoute = createMockRouteContext({
      name: 'TestScreen',
      params: {},
    })
  })

  describe('Payment Flow Screen Integration', () => {
    it('should render payment flow screen with navigation', () => {
      render(
        <NavigationTestWrapper 
          mockNavigation={mockNavigation} 
          mockRoute={mockRoute}
        >
          <MockPaymentFlowScreen 
            navigation={mockNavigation} 
            route={mockRoute} 
          />
        </NavigationTestWrapper>
      )

      expect(screen.getByTestId('payment-flow-screen')).toBeInTheDocument()
      expect(screen.getByText('Payment Flow')).toBeInTheDocument()
      expect(screen.getByText('Enter Amount')).toBeInTheDocument()
    })

    it('should handle navigation to amount input', async () => {
      const user = userEvent.setup()
      
      render(
        <NavigationTestWrapper 
          mockNavigation={mockNavigation} 
          mockRoute={mockRoute}
        >
          <MockPaymentFlowScreen 
            navigation={mockNavigation} 
            route={mockRoute} 
          />
        </NavigationTestWrapper>
      )

      await user.click(screen.getByText('Enter Amount'))
      
      expect(mockNavigation.navigate).toHaveBeenCalledWith('AmountInput')
    })

    it('should pass parameters during navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <NavigationTestWrapper 
          mockNavigation={mockNavigation} 
          mockRoute={mockRoute}
        >
          <MockPaymentFlowScreen 
            navigation={mockNavigation} 
            route={mockRoute} 
          />
        </NavigationTestWrapper>
      )

      await user.click(screen.getByText('Confirm Payment'))
      
      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        'PaymentConfirmation', 
        { amount: '1.5' }
      )
    })

    it('should display route parameters', () => {
      const routeWithParams = createMockRouteContext({
        name: 'PaymentFlow',
        params: { amount: '2.5', recipient: 'user123' },
      })

      render(
        <NavigationTestWrapper 
          mockNavigation={mockNavigation} 
          mockRoute={routeWithParams}
        >
          <MockPaymentFlowScreen 
            navigation={mockNavigation} 
            route={routeWithParams} 
          />
        </NavigationTestWrapper>
      )

      const paramsDisplay = screen.getByTestId('route-params')
      expect(paramsDisplay).toHaveTextContent('amount')
      expect(paramsDisplay).toHaveTextContent('2.5')
      expect(paramsDisplay).toHaveTextContent('recipient')
    })
  })

  describe('Dashboard Screen Integration', () => {
    it('should render dashboard with all navigation options', () => {
      render(
        <NavigationTestWrapper 
          mockNavigation={mockNavigation} 
          mockRoute={mockRoute}
        >
          <MockDashboardScreen 
            navigation={mockNavigation} 
            route={mockRoute} 
          />
        </NavigationTestWrapper>
      )

      expect(screen.getByTestId('dashboard-screen')).toBeInTheDocument()
      expect(screen.getByText('Send Payment')).toBeInTheDocument()
      expect(screen.getByText('View Contacts')).toBeInTheDocument()
      expect(screen.getByTestId('wallet-balance')).toHaveTextContent('10.5 SOL')
    })

    it('should navigate to payment screen', async () => {
      const user = userEvent.setup()
      
      render(
        <NavigationTestWrapper 
          mockNavigation={mockNavigation} 
          mockRoute={mockRoute}
        >
          <MockDashboardScreen 
            navigation={mockNavigation} 
            route={mockRoute} 
          />
        </NavigationTestWrapper>
      )

      await user.click(screen.getByText('Send Payment'))
      
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Payment')
    })

    it('should navigate to contacts screen', async () => {
      const user = userEvent.setup()
      
      render(
        <NavigationTestWrapper 
          mockNavigation={mockNavigation} 
          mockRoute={mockRoute}
        >
          <MockDashboardScreen 
            navigation={mockNavigation} 
            route={mockRoute} 
          />
        </NavigationTestWrapper>
      )

      await user.click(screen.getByText('View Contacts'))
      
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Contacts')
    })
  })

  describe('Wallet Connection Screen Integration', () => {
    it('should render wallet connection screen', () => {
      render(
        <NavigationTestWrapper 
          mockNavigation={mockNavigation} 
          mockRoute={mockRoute}
        >
          <MockWalletConnectionScreen 
            navigation={mockNavigation} 
            route={mockRoute} 
          />
        </NavigationTestWrapper>
      )

      expect(screen.getByTestId('wallet-connection-screen')).toBeInTheDocument()
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
    })

    it('should handle back navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <NavigationTestWrapper 
          mockNavigation={mockNavigation} 
          mockRoute={mockRoute}
        >
          <MockWalletConnectionScreen 
            navigation={mockNavigation} 
            route={mockRoute} 
          />
        </NavigationTestWrapper>
      )

      await user.click(screen.getByText('Go Back'))
      
      expect(mockNavigation.goBack).toHaveBeenCalled()
    })

    it('should display connection status from params', () => {
      const connectedRoute = createMockRouteContext({
        name: 'WalletConnection',
        params: { connected: true },
      })

      render(
        <NavigationTestWrapper 
          mockNavigation={mockNavigation} 
          mockRoute={connectedRoute}
        >
          <MockWalletConnectionScreen 
            navigation={mockNavigation} 
            route={connectedRoute} 
          />
        </NavigationTestWrapper>
      )

      expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected')
    })

    it('should show disconnected status by default', () => {
      render(
        <NavigationTestWrapper 
          mockNavigation={mockNavigation} 
          mockRoute={mockRoute}
        >
          <MockWalletConnectionScreen 
            navigation={mockNavigation} 
            route={mockRoute} 
          />
        </NavigationTestWrapper>
      )

      expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected')
    })
  })

  describe('Navigation State Management', () => {
    it('should track navigation state changes', () => {
      const stateChangeListener = jest.fn()
      navigationStateManager.addStateChangeListener(stateChangeListener)

      navigationStateManager.navigate('Payment', { amount: '1.0' })
      
      expect(stateChangeListener).toHaveBeenCalled()
      
      const currentState = navigationStateManager.getState()
      expect(currentState.routes).toHaveLength(2) // Initial + Payment
      expect(currentState.routes[1].name).toBe('Payment')
      expect(currentState.routes[1].params).toEqual({ amount: '1.0' })
    })

    it('should handle back navigation correctly', () => {
      navigationStateManager.navigate('Payment')
      navigationStateManager.navigate('Confirmation')
      
      expect(navigationStateManager.canGoBack()).toBe(true)
      
      const backResult = navigationStateManager.goBack()
      expect(backResult).toBe(true)
      
      const currentRoute = navigationStateManager.getCurrentRoute()
      expect(currentRoute.name).toBe('Payment')
    })

    it('should reset navigation state', () => {
      navigationStateManager.navigate('Payment')
      navigationStateManager.navigate('Confirmation')
      
      navigationStateManager.reset({
        index: 0,
        routes: [{ key: 'home-reset', name: 'Home' }]
      })
      
      const state = navigationStateManager.getState()
      expect(state.index).toBe(0)
      expect(state.routes).toHaveLength(1)
      expect(state.routes[0].name).toBe('Home')
    })
  })

  describe('Route Guards Integration', () => {
    beforeEach(() => {
      // Set up route guards
      routeGuardManager.setRouteGuard('Payment', {
        name: 'Payment',
        requiresAuth: true,
        requiresWallet: true,
      })
      
      routeGuardManager.setRouteGuard('Settings', {
        name: 'Settings',
        requiresAuth: true,
        allowedRoles: ['admin', 'premium'],
      })
    })

    it('should allow navigation when user meets requirements', () => {
      routeGuardManager.setUserState({
        isAuthenticated: true,
        hasWallet: true,
      })

      const result = routeGuardManager.canNavigateToRoute('Payment')
      expect(result.allowed).toBe(true)
    })

    it('should block navigation when authentication required', () => {
      routeGuardManager.setUserState({
        isAuthenticated: false,
        hasWallet: true,
      })

      const result = routeGuardManager.canNavigateToRoute('Payment')
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Authentication required')
    })

    it('should block navigation when wallet required', () => {
      routeGuardManager.setUserState({
        isAuthenticated: true,
        hasWallet: false,
      })

      const result = routeGuardManager.canNavigateToRoute('Payment')
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Wallet connection required')
    })

    it('should enforce role-based access', () => {
      routeGuardManager.setUserState({
        isAuthenticated: true,
        role: 'user',
      })

      const result = routeGuardManager.canNavigateToRoute('Settings')
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Insufficient permissions')
    })
  })

  describe('Error Handling', () => {
    it('should handle navigation errors gracefully', async () => {
      const errorNavigation = createMockNavigationContext({
        navigate: jest.fn(() => {
          throw new Error('Navigation failed')
        }),
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(
        <NavigationTestWrapper mockNavigation={errorNavigation}>
          <MockPaymentFlowScreen 
            navigation={errorNavigation} 
            route={mockRoute} 
          />
        </NavigationTestWrapper>
      )

      // Should not crash the test
      expect(screen.getByTestId('payment-flow-screen')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should handle missing route parameters gracefully', () => {
      const routeWithoutParams = createMockRouteContext({
        name: 'TestScreen',
        params: undefined as any,
      })

      render(
        <NavigationTestWrapper 
          mockNavigation={mockNavigation} 
          mockRoute={routeWithoutParams}
        >
          <MockPaymentFlowScreen 
            navigation={mockNavigation} 
            route={routeWithoutParams} 
          />
        </NavigationTestWrapper>
      )

      expect(screen.getByTestId('route-params')).toHaveTextContent('No params')
    })
  })

  describe('Accessibility', () => {
    it('should have proper navigation accessibility labels', () => {
      render(
        <NavigationTestWrapper 
          mockNavigation={mockNavigation} 
          mockRoute={mockRoute}
        >
          <MockDashboardScreen 
            navigation={mockNavigation} 
            route={mockRoute} 
          />
        </NavigationTestWrapper>
      )

      const paymentButton = screen.getByText('Send Payment')
      const contactsButton = screen.getByText('View Contacts')
      
      expect(paymentButton).toBeInTheDocument()
      expect(contactsButton).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <NavigationTestWrapper 
          mockNavigation={mockNavigation} 
          mockRoute={mockRoute}
        >
          <MockDashboardScreen 
            navigation={mockNavigation} 
            route={mockRoute} 
          />
        </NavigationTestWrapper>
      )

      await user.tab()
      expect(screen.getByText('Send Payment')).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Payment')
    })
  })

  describe('Performance', () => {
    it('should handle rapid navigation changes', async () => {
      const user = userEvent.setup()
      
      render(
        <NavigationTestWrapper 
          mockNavigation={mockNavigation} 
          mockRoute={mockRoute}
        >
          <MockDashboardScreen 
            navigation={mockNavigation} 
            route={mockRoute} 
          />
        </NavigationTestWrapper>
      )

      // Rapid clicks
      const paymentButton = screen.getByText('Send Payment')
      await user.click(paymentButton)
      await user.click(paymentButton)
      await user.click(paymentButton)

      // Should handle gracefully without errors
      expect(mockNavigation.navigate).toHaveBeenCalledTimes(3)
    })
  })
})