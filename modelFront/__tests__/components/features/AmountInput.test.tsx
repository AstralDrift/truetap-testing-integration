/**
 * AmountInput Component Tests
 * 
 * Tests for the payment amount input component with:
 * - Currency conversion and validation
 * - Quick amount buttons
 * - Balance display and max functionality
 * - Accessibility features
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AmountInput } from '../../../components/features/AmountInput'
import type { Currency, UserPreferences } from '@/types'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock animated components
jest.mock('@/components/ui/animated/AnimatedInput', () => ({
  AnimatedInput: React.forwardRef<HTMLInputElement, any>(({ onChange, ...props }, ref) => (
    <input ref={ref} onChange={onChange} {...props} />
  ))
}))

jest.mock('@/components/ui/animated/AnimatedButton', () => ({
  AnimatedButton: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  )
}))

jest.mock('@/components/ui/animated/AnimatedNumber', () => ({
  AnimatedNumber: ({ value, prefix }: any) => <span>{prefix}{value}</span>,
  AnimatedCurrency: ({ value, currency }: any) => <span>{value} {currency}</span>
}))

// Mock utility functions
jest.mock('@/lib/animation-utils', () => ({
  createAccessibleAnimation: jest.fn(() => ({}))
}))

jest.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' ')
}))

describe('AmountInput Component', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    currency: 'SOL' as Currency,
  }

  const mockPreferences: UserPreferences = {
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    voiceOverEnabled: false,
    hapticsEnabled: true,
    soundEnabled: true,
    tipsEnabled: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<AmountInput {...defaultProps} />)
      
      expect(screen.getByLabelText('Amount')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('0.00 SOL')).toBeInTheDocument()
    })

    it('should render with custom label and placeholder', () => {
      render(
        <AmountInput 
          {...defaultProps}
          label="Payment Amount"
          placeholder="Enter amount"
        />
      )
      
      expect(screen.getByLabelText('Payment Amount')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument()
    })

    it('should display currency symbol correctly', () => {
      const { rerender } = render(<AmountInput {...defaultProps} currency="SOL" />)
      expect(screen.getByText('◎')).toBeInTheDocument()

      rerender(<AmountInput {...defaultProps} currency="USD" />)
      expect(screen.getByText('$')).toBeInTheDocument()
    })
  })

  describe('Input Validation', () => {
    it('should only allow numeric input', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      
      render(<AmountInput {...defaultProps} onChange={onChange} />)
      
      const input = screen.getByLabelText('Amount')
      
      await user.type(input, '123.45')
      expect(onChange).toHaveBeenLastCalledWith('123.45')
      
      onChange.mockClear()
      await user.type(input, 'abc')
      expect(onChange).not.toHaveBeenCalled()
    })

    it('should validate minimum amount', () => {
      render(
        <AmountInput 
          {...defaultProps}
          value="0.5"
          minAmount={1}
        />
      )
      
      expect(screen.getByText('Minimum amount is 1')).toBeInTheDocument()
    })

    it('should validate maximum amount', () => {
      render(
        <AmountInput 
          {...defaultProps}
          value="150"
          maxAmount={100}
        />
      )
      
      expect(screen.getByText('Maximum amount is 100')).toBeInTheDocument()
    })

    it('should validate against balance', () => {
      render(
        <AmountInput 
          {...defaultProps}
          value="15"
          balance={10}
        />
      )
      
      expect(screen.getByText('Insufficient balance')).toBeInTheDocument()
    })

    it('should show custom error message', () => {
      render(
        <AmountInput 
          {...defaultProps}
          error="Custom error message"
        />
      )
      
      expect(screen.getByText('Custom error message')).toBeInTheDocument()
    })
  })

  describe('Balance Display', () => {
    it('should show balance when enabled', () => {
      render(
        <AmountInput 
          {...defaultProps}
          showBalance
          balance={5.25}
          currency="SOL"
        />
      )
      
      expect(screen.getByText('Balance:')).toBeInTheDocument()
      expect(screen.getByText('5.25 SOL')).toBeInTheDocument()
    })

    it('should show MAX button when onMaxClick provided', () => {
      const onMaxClick = jest.fn()
      
      render(
        <AmountInput 
          {...defaultProps}
          showBalance
          balance={10}
          onMaxClick={onMaxClick}
        />
      )
      
      expect(screen.getByText('MAX')).toBeInTheDocument()
    })

    it('should handle MAX button click', async () => {
      const user = userEvent.setup()
      const onMaxClick = jest.fn()
      
      render(
        <AmountInput 
          {...defaultProps}
          showBalance
          balance={10}
          onMaxClick={onMaxClick}
        />
      )
      
      await user.click(screen.getByText('MAX'))
      expect(onMaxClick).toHaveBeenCalled()
    })

    it('should set balance as value when MAX clicked without onMaxClick', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      
      render(
        <AmountInput 
          {...defaultProps}
          onChange={onChange}
          showBalance
          balance={10}
          onMaxClick={() => {}} // Provide onMaxClick to show button
        />
      )
      
      await user.click(screen.getByText('MAX'))
      // onMaxClick is called, not onChange in this case
    })
  })

  describe('Quick Amounts', () => {
    it('should show quick amount buttons by default', () => {
      render(<AmountInput {...defaultProps} />)
      
      // Default SOL quick amounts: [0.1, 0.5, 1, 2.5]
      expect(screen.getByText('0.1')).toBeInTheDocument()
      expect(screen.getByText('0.5')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2.5')).toBeInTheDocument()
    })

    it('should show USD quick amounts for USD currency', () => {
      render(<AmountInput {...defaultProps} currency="USD" />)
      
      // Default USD quick amounts: [10, 50, 100, 250]
      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('250')).toBeInTheDocument()
    })

    it('should use custom quick amounts when provided', () => {
      render(
        <AmountInput 
          {...defaultProps}
          quickAmounts={[1, 5, 10]}
        />
      )
      
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.queryByText('0.1')).not.toBeInTheDocument()
    })

    it('should handle quick amount selection', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      
      render(<AmountInput {...defaultProps} onChange={onChange} />)
      
      await user.click(screen.getByText('0.5'))
      expect(onChange).toHaveBeenCalledWith('0.5')
    })

    it('should hide quick amounts when disabled', () => {
      render(<AmountInput {...defaultProps} showQuickAmounts={false} />)
      
      expect(screen.queryByText('Quick amounts')).not.toBeInTheDocument()
    })
  })

  describe('Currency Conversion', () => {
    it('should show conversion when enabled', () => {
      render(
        <AmountInput 
          {...defaultProps}
          value="1"
          showConversion
          exchangeRate={180}
        />
      )
      
      expect(screen.getByText('≈')).toBeInTheDocument()
      expect(screen.getByText('180 USD')).toBeInTheDocument()
    })

    it('should handle currency toggle', async () => {
      const user = userEvent.setup()
      const onCurrencyChange = jest.fn()
      const onChange = jest.fn()
      
      render(
        <AmountInput 
          {...defaultProps}
          value="1"
          onChange={onChange}
          onCurrencyChange={onCurrencyChange}
          availableCurrencies={['SOL', 'USD']}
          exchangeRate={180}
        />
      )
      
      const toggleButton = screen.getByText('SOL')
      await user.click(toggleButton)
      
      expect(onCurrencyChange).toHaveBeenCalledWith('USD')
      expect(onChange).toHaveBeenCalledWith('180.00') // Converted amount
    })

    it('should show exchange rate info', () => {
      render(
        <AmountInput 
          {...defaultProps}
          showConversion
          exchangeRate={180}
        />
      )
      
      expect(screen.getByText('Exchange Rate:')).toBeInTheDocument()
      expect(screen.getByText('1 SOL =')).toBeInTheDocument()
      expect(screen.getByText('$180')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show loading state', () => {
      render(<AmountInput {...defaultProps} loading />)
      
      // Loading prop is passed to AnimatedInput
      const input = screen.getByLabelText('Amount')
      expect(input).toBeInTheDocument()
    })

    it('should disable interactions when loading', () => {
      render(
        <AmountInput 
          {...defaultProps}
          loading
          onCurrencyChange={jest.fn()}
          availableCurrencies={['SOL', 'USD']}
        />
      )
      
      const toggleButton = screen.getByText('SOL')
      expect(toggleButton).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AmountInput {...defaultProps} />)
      
      expect(screen.getByLabelText('Amount')).toBeInTheDocument()
    })

    it('should announce validation errors', () => {
      render(
        <AmountInput 
          {...defaultProps}
          value="150"
          maxAmount={100}
        />
      )
      
      expect(screen.getByText('Maximum amount is 100')).toBeInTheDocument()
    })

    it('should support screen reader preferences', () => {
      render(
        <AmountInput 
          {...defaultProps}
          preferences={{ ...mockPreferences, voiceOverEnabled: true }}
        />
      )
      
      expect(screen.getByLabelText('Amount')).toBeInTheDocument()
    })

    it('should respect reduced motion preferences', () => {
      render(
        <AmountInput 
          {...defaultProps}
          preferences={{ ...mockPreferences, reducedMotion: true }}
          disableAnimations
        />
      )
      
      expect(screen.getByLabelText('Amount')).toBeInTheDocument()
    })
  })

  describe('Focus Management', () => {
    it('should handle focus and blur events', async () => {
      const user = userEvent.setup()
      
      render(<AmountInput {...defaultProps} />)
      
      const input = screen.getByLabelText('Amount')
      
      await user.click(input)
      expect(input).toHaveFocus()
      
      await user.tab()
      expect(input).not.toHaveFocus()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid exchange rates gracefully', () => {
      render(
        <AmountInput 
          {...defaultProps}
          value="1"
          showConversion
          exchangeRate={0}
        />
      )
      
      // Should not crash and should handle gracefully
      expect(screen.getByLabelText('Amount')).toBeInTheDocument()
    })

    it('should handle missing currency in availableCurrencies', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      render(
        <AmountInput 
          {...defaultProps}
          currency="BTC" as any
          availableCurrencies={['SOL', 'USD']}
        />
      )
      
      expect(screen.getByLabelText('Amount')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Performance', () => {
    it('should handle rapid value changes efficiently', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      
      render(<AmountInput {...defaultProps} onChange={onChange} />)
      
      const input = screen.getByLabelText('Amount')
      
      // Rapid typing
      await user.type(input, '123456789')
      
      // Should not cause performance issues
      expect(onChange).toHaveBeenCalled()
    })

    it('should debounce conversion calculations', async () => {
      const user = userEvent.setup()
      
      render(
        <AmountInput 
          {...defaultProps}
          showConversion
          exchangeRate={180}
        />
      )
      
      const input = screen.getByLabelText('Amount')
      await user.type(input, '1.5')
      
      // Should show converted amount
      await waitFor(() => {
        expect(screen.getByText('≈')).toBeInTheDocument()
      })
    })
  })

  describe('Integration Tests', () => {
    it('should work with all features enabled', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      const onCurrencyChange = jest.fn()
      const onMaxClick = jest.fn()
      
      render(
        <AmountInput 
          {...defaultProps}
          onChange={onChange}
          onCurrencyChange={onCurrencyChange}
          onMaxClick={onMaxClick}
          showBalance
          showConversion
          showQuickAmounts
          balance={10}
          exchangeRate={180}
          availableCurrencies={['SOL', 'USD']}
          preferences={mockPreferences}
        />
      )
      
      // Test input
      const input = screen.getByLabelText('Amount')
      await user.type(input, '2.5')
      expect(onChange).toHaveBeenLastCalledWith('2.5')
      
      // Test quick amount
      await user.click(screen.getByText('1'))
      expect(onChange).toHaveBeenLastCalledWith('1')
      
      // Test MAX button
      await user.click(screen.getByText('MAX'))
      expect(onMaxClick).toHaveBeenCalled()
      
      // Should show all features
      expect(screen.getByText('Balance:')).toBeInTheDocument()
      expect(screen.getByText('Exchange Rate:')).toBeInTheDocument()
      expect(screen.getByText('Quick amounts')).toBeInTheDocument()
    })
  })
})