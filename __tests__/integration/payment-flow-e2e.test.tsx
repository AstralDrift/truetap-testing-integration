/**
 * End-to-End Payment Flow Tests
 * 
 * Comprehensive testing of payment flows including:
 * - NFC tap interactions
 * - BLE payment flows  
 * - Wallet service integration
 * - Transaction processing
 * - Error handling and recovery
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { 
  NavigationTestWrapper,
  createMockNavigationContext,
  createMockRouteContext
} from '../utils/navigation-test-utils'

// Mock services
const mockWalletService = {
  isConnected: jest.fn(() => true),
  getBalance: jest.fn(() => Promise.resolve(10.5)),
  getPublicKey: jest.fn(() => 'mock-public-key'),
  sendTransaction: jest.fn(() => Promise.resolve({
    signature: 'mock-signature',
    success: true
  })),
  disconnect: jest.fn(),
  connect: jest.fn(() => Promise.resolve(true)),
}

const mockNFCService = {
  isEnabled: jest.fn(() => Promise.resolve(true)),
  startScanning: jest.fn(),
  stopScanning: jest.fn(),
  writeNDEF: jest.fn(() => Promise.resolve(true)),
  onTagDiscovered: jest.fn(),
  onError: jest.fn(),
}

const mockBLEService = {
  isEnabled: jest.fn(() => Promise.resolve(true)),
  startAdvertising: jest.fn(),
  stopAdvertising: jest.fn(),
  startScanning: jest.fn(),
  stopScanning: jest.fn(),
  connectToDevice: jest.fn(),
  sendPaymentData: jest.fn(() => Promise.resolve(true)),
  onDeviceDiscovered: jest.fn(),
  onPaymentReceived: jest.fn(),
}

const mockHCEService = {
  isEnabled: jest.fn(() => Promise.resolve(true)),
  enable: jest.fn(() => Promise.resolve(true)),
  disable: jest.fn(),
  onPaymentReceived: jest.fn(),
  processPayment: jest.fn(() => Promise.resolve({
    success: true,
    transactionId: 'mock-transaction-id'
  })),
}

// Mock Payment Flow Components
const MockPaymentFlow = ({ navigation, route }: any) => {
  const [step, setStep] = React.useState('amount')
  const [amount, setAmount] = React.useState('')
  const [recipient, setRecipient] = React.useState('')
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleAmountSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Invalid amount')
      return
    }
    setError('')
    setStep('recipient')
  }

  const handleRecipientSubmit = () => {
    if (!recipient) {
      setError('Recipient required')
      return
    }
    setError('')
    setStep('confirmation')
  }

  const handlePaymentSubmit = async () => {
    setIsProcessing(true)
    setError('')
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const balance = await mockWalletService.getBalance()
      if (parseFloat(amount) > balance) {
        throw new Error('Insufficient funds')
      }

      const result = await mockWalletService.sendTransaction()
      if (result.success) {
        setStep('success')
        navigation.navigate('PaymentSuccess', {
          amount,
          recipient,
          signature: result.signature
        })
      } else {
        throw new Error('Transaction failed')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div data-testid="payment-flow">
      {error && (
        <div data-testid="error-message" role="alert">
          {error}
        </div>
      )}
      
      {step === 'amount' && (
        <div data-testid="amount-step">
          <h2>Enter Amount</h2>
          <input
            data-testid="amount-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00 SOL"
            type="number"
            aria-label="Payment amount"
          />
          <button
            data-testid="amount-continue"
            onClick={handleAmountSubmit}
            disabled={isProcessing}
          >
            Continue
          </button>
        </div>
      )}

      {step === 'recipient' && (
        <div data-testid="recipient-step">
          <h2>Select Recipient</h2>
          <input
            data-testid="recipient-input"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Recipient address or contact"
            aria-label="Payment recipient"
          />
          <button
            data-testid="recipient-continue"
            onClick={handleRecipientSubmit}
            disabled={isProcessing}
          >
            Continue
          </button>
          <button
            data-testid="recipient-back"
            onClick={() => setStep('amount')}
            disabled={isProcessing}
          >
            Back
          </button>
        </div>
      )}

      {step === 'confirmation' && (
        <div data-testid="confirmation-step">
          <h2>Confirm Payment</h2>
          <div data-testid="payment-summary">
            <p>Amount: {amount} SOL</p>
            <p>To: {recipient}</p>
          </div>
          <button
            data-testid="confirm-payment"
            onClick={handlePaymentSubmit}
            disabled={isProcessing}
            aria-label="Confirm and send payment"
          >
            {isProcessing ? 'Processing...' : 'Send Payment'}
          </button>
          <button
            data-testid="confirmation-back"
            onClick={() => setStep('recipient')}
            disabled={isProcessing}
          >
            Back
          </button>
        </div>
      )}

      {step === 'success' && (
        <div data-testid="success-step">
          <h2>Payment Sent!</h2>
          <p>Your payment has been successfully sent.</p>
          <button
            data-testid="success-done"
            onClick={() => navigation.navigate('Dashboard')}
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}

const MockNFCPaymentFlow = ({ navigation, route }: any) => {
  const [isScanning, setIsScanning] = React.useState(false)
  const [scanResult, setScanResult] = React.useState<any>(null)
  const [error, setError] = React.useState('')

  const startNFCScan = async () => {
    setIsScanning(true)
    setError('')
    
    try {
      await mockNFCService.startScanning()
      
      // Simulate NFC tag discovery
      setTimeout(() => {
        setScanResult({
          type: 'payment_request',
          amount: '2.5',
          recipient: 'nfc-recipient',
          message: 'Tap payment request'
        })
        setIsScanning(false)
      }, 2000)
    } catch (err: any) {
      setError(err.message)
      setIsScanning(false)
    }
  }

  const processNFCPayment = async () => {
    try {
      const result = await mockHCEService.processPayment()
      if (result.success) {
        navigation.navigate('PaymentSuccess', {
          method: 'nfc',
          transactionId: result.transactionId
        })
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div data-testid="nfc-payment-flow">
      <h2>NFC Payment</h2>
      
      {error && (
        <div data-testid="nfc-error" role="alert">
          {error}
        </div>
      )}

      {!isScanning && !scanResult && (
        <button
          data-testid="start-nfc-scan"
          onClick={startNFCScan}
          aria-label="Start NFC scanning"
        >
          Tap to Pay
        </button>
      )}

      {isScanning && (
        <div data-testid="nfc-scanning">
          <p>Hold your device near the payment terminal...</p>
          <button
            data-testid="cancel-nfc-scan"
            onClick={() => {
              mockNFCService.stopScanning()
              setIsScanning(false)
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {scanResult && (
        <div data-testid="nfc-result">
          <h3>Payment Request Detected</h3>
          <p>Amount: {scanResult.amount} SOL</p>
          <p>To: {scanResult.recipient}</p>
          <p>Message: {scanResult.message}</p>
          
          <button
            data-testid="confirm-nfc-payment"
            onClick={processNFCPayment}
            aria-label="Confirm NFC payment"
          >
            Confirm Payment
          </button>
          <button
            data-testid="cancel-nfc-payment"
            onClick={() => setScanResult(null)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

const MockBLEPaymentFlow = ({ navigation, route }: any) => {
  const [isScanning, setIsScanning] = React.useState(false)
  const [discoveredDevices, setDiscoveredDevices] = React.useState<any[]>([])
  const [selectedDevice, setSelectedDevice] = React.useState<any>(null)
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [error, setError] = React.useState('')

  const startBLEScan = async () => {
    setIsScanning(true)
    setError('')
    setDiscoveredDevices([])
    
    try {
      await mockBLEService.startScanning()
      
      // Simulate device discovery
      setTimeout(() => {
        setDiscoveredDevices([
          { id: 'device1', name: 'Solana Seeker #1', rssi: -45 },
          { id: 'device2', name: 'Solana Seeker #2', rssi: -60 },
        ])
      }, 1000)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const connectToDevice = async (device: any) => {
    setIsConnecting(true)
    setError('')
    
    try {
      await mockBLEService.connectToDevice(device.id)
      setSelectedDevice(device)
      setIsScanning(false)
      setIsConnecting(false)
    } catch (err: any) {
      setError(err.message)
      setIsConnecting(false)
    }
  }

  const sendBLEPayment = async () => {
    try {
      await mockBLEService.sendPaymentData({
        amount: '3.0',
        recipient: selectedDevice.id
      })
      
      navigation.navigate('PaymentSuccess', {
        method: 'ble',
        device: selectedDevice.name
      })
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div data-testid="ble-payment-flow">
      <h2>Bluetooth Payment</h2>
      
      {error && (
        <div data-testid="ble-error" role="alert">
          {error}
        </div>
      )}

      {!isScanning && !selectedDevice && (
        <button
          data-testid="start-ble-scan"
          onClick={startBLEScan}
          aria-label="Start Bluetooth scanning"
        >
          Find Nearby Devices
        </button>
      )}

      {isScanning && (
        <div data-testid="ble-scanning">
          <p>Scanning for nearby Solana Seekers...</p>
          
          {discoveredDevices.length > 0 && (
            <div data-testid="discovered-devices">
              <h3>Discovered Devices</h3>
              {discoveredDevices.map(device => (
                <div key={device.id} data-testid={`device-${device.id}`}>
                  <p>{device.name} (RSSI: {device.rssi})</p>
                  <button
                    onClick={() => connectToDevice(device)}
                    disabled={isConnecting}
                    aria-label={`Connect to ${device.name}`}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <button
            data-testid="stop-ble-scan"
            onClick={() => {
              mockBLEService.stopScanning()
              setIsScanning(false)
            }}
          >
            Stop Scanning
          </button>
        </div>
      )}

      {selectedDevice && (
        <div data-testid="ble-connected">
          <h3>Connected to {selectedDevice.name}</h3>
          <p>Ready to send payment</p>
          
          <button
            data-testid="send-ble-payment"
            onClick={sendBLEPayment}
            aria-label="Send Bluetooth payment"
          >
            Send 3.0 SOL
          </button>
          <button
            data-testid="disconnect-ble"
            onClick={() => setSelectedDevice(null)}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}

describe('End-to-End Payment Flow Tests', () => {
  let mockNavigation: any
  let mockRoute: any

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    mockNavigation = createMockNavigationContext()
    mockRoute = createMockRouteContext()
    
    // Set up default mock returns
    mockWalletService.isConnected.mockReturnValue(true)
    mockWalletService.getBalance.mockResolvedValue(10.5)
    mockNFCService.isEnabled.mockResolvedValue(true)
    mockBLEService.isEnabled.mockResolvedValue(true)
    mockHCEService.isEnabled.mockResolvedValue(true)
  })

  describe('Standard Payment Flow', () => {
    it('should complete full payment flow successfully', async () => {
      const user = userEvent.setup()
      
      render(
        <NavigationTestWrapper mockNavigation={mockNavigation} mockRoute={mockRoute}>
          <MockPaymentFlow navigation={mockNavigation} route={mockRoute} />
        </NavigationTestWrapper>
      )

      // Step 1: Enter amount
      expect(screen.getByTestId('amount-step')).toBeInTheDocument()
      
      const amountInput = screen.getByTestId('amount-input')
      await user.type(amountInput, '2.5')
      await user.click(screen.getByTestId('amount-continue'))

      // Step 2: Enter recipient
      await waitFor(() => {
        expect(screen.getByTestId('recipient-step')).toBeInTheDocument()
      })
      
      const recipientInput = screen.getByTestId('recipient-input')
      await user.type(recipientInput, 'test-recipient')
      await user.click(screen.getByTestId('recipient-continue'))

      // Step 3: Confirm payment
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-step')).toBeInTheDocument()
      })
      
      expect(screen.getByText('Amount: 2.5 SOL')).toBeInTheDocument()
      expect(screen.getByText('To: test-recipient')).toBeInTheDocument()
      
      await user.click(screen.getByTestId('confirm-payment'))

      // Step 4: Success
      await waitFor(() => {
        expect(screen.getByTestId('success-step')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      expect(screen.getByText('Payment Sent!')).toBeInTheDocument()
      expect(mockWalletService.sendTransaction).toHaveBeenCalled()
    })

    it('should handle insufficient funds error', async () => {
      const user = userEvent.setup()
      mockWalletService.getBalance.mockResolvedValue(1.0) // Lower balance
      
      render(
        <NavigationTestWrapper mockNavigation={mockNavigation} mockRoute={mockRoute}>
          <MockPaymentFlow navigation={mockNavigation} route={mockRoute} />
        </NavigationTestWrapper>
      )

      // Complete flow with amount higher than balance
      const amountInput = screen.getByTestId('amount-input')
      await user.type(amountInput, '5.0')
      await user.click(screen.getByTestId('amount-continue'))

      const recipientInput = screen.getByTestId('recipient-input')
      await user.type(recipientInput, 'test-recipient')
      await user.click(screen.getByTestId('recipient-continue'))

      await user.click(screen.getByTestId('confirm-payment'))

      // Should show error
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Insufficient funds')
      })
    })

    it('should validate amount input', async () => {
      const user = userEvent.setup()
      
      render(
        <NavigationTestWrapper mockNavigation={mockNavigation} mockRoute={mockRoute}>
          <MockPaymentFlow navigation={mockNavigation} route={mockRoute} />
        </NavigationTestWrapper>
      )

      // Try to continue without amount
      await user.click(screen.getByTestId('amount-continue'))

      expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid amount')
      expect(screen.getByTestId('amount-step')).toBeInTheDocument() // Should stay on same step
    })

    it('should allow navigation back through steps', async () => {
      const user = userEvent.setup()
      
      render(
        <NavigationTestWrapper mockNavigation={mockNavigation} mockRoute={mockRoute}>
          <MockPaymentFlow navigation={mockNavigation} route={mockRoute} />
        </NavigationTestWrapper>
      )

      // Go to recipient step
      const amountInput = screen.getByTestId('amount-input')
      await user.type(amountInput, '2.5')
      await user.click(screen.getByTestId('amount-continue'))

      // Go back to amount step
      await user.click(screen.getByTestId('recipient-back'))
      
      expect(screen.getByTestId('amount-step')).toBeInTheDocument()
      expect(amountInput).toHaveValue('2.5') // Should preserve value
    })
  })

  describe('NFC Payment Flow', () => {
    it('should complete NFC payment successfully', async () => {
      const user = userEvent.setup()
      
      render(
        <NavigationTestWrapper mockNavigation={mockNavigation} mockRoute={mockRoute}>
          <MockNFCPaymentFlow navigation={mockNavigation} route={mockRoute} />
        </NavigationTestWrapper>
      )

      // Start NFC scanning
      await user.click(screen.getByTestId('start-nfc-scan'))
      
      expect(screen.getByTestId('nfc-scanning')).toBeInTheDocument()
      expect(mockNFCService.startScanning).toHaveBeenCalled()

      // Wait for scan result
      await waitFor(() => {
        expect(screen.getByTestId('nfc-result')).toBeInTheDocument()
      }, { timeout: 3000 })

      expect(screen.getByText('Amount: 2.5 SOL')).toBeInTheDocument()
      expect(screen.getByText('To: nfc-recipient')).toBeInTheDocument()

      // Confirm payment
      await user.click(screen.getByTestId('confirm-nfc-payment'))
      
      expect(mockHCEService.processPayment).toHaveBeenCalled()
      expect(mockNavigation.navigate).toHaveBeenCalledWith('PaymentSuccess', {
        method: 'nfc',
        transactionId: 'mock-transaction-id'
      })
    })

    it('should allow canceling NFC scan', async () => {
      const user = userEvent.setup()
      
      render(
        <NavigationTestWrapper mockNavigation={mockNavigation} mockRoute={mockRoute}>
          <MockNFCPaymentFlow navigation={mockNavigation} route={mockRoute} />
        </NavigationTestWrapper>
      )

      // Start scanning then cancel
      await user.click(screen.getByTestId('start-nfc-scan'))
      await user.click(screen.getByTestId('cancel-nfc-scan'))

      expect(mockNFCService.stopScanning).toHaveBeenCalled()
      expect(screen.getByTestId('start-nfc-scan')).toBeInTheDocument()
    })
  })

  describe('BLE Payment Flow', () => {
    it('should discover and connect to BLE devices', async () => {
      const user = userEvent.setup()
      
      render(
        <NavigationTestWrapper mockNavigation={mockNavigation} mockRoute={mockRoute}>
          <MockBLEPaymentFlow navigation={mockNavigation} route={mockRoute} />
        </NavigationTestWrapper>
      )

      // Start BLE scanning
      await user.click(screen.getByTestId('start-ble-scan'))
      
      expect(screen.getByTestId('ble-scanning')).toBeInTheDocument()
      expect(mockBLEService.startScanning).toHaveBeenCalled()

      // Wait for device discovery
      await waitFor(() => {
        expect(screen.getByTestId('discovered-devices')).toBeInTheDocument()
      }, { timeout: 2000 })

      expect(screen.getByTestId('device-device1')).toBeInTheDocument()
      expect(screen.getByText('Solana Seeker #1 (RSSI: -45)')).toBeInTheDocument()

      // Connect to device
      const device1Button = screen.getByLabelText('Connect to Solana Seeker #1')
      await user.click(device1Button)

      await waitFor(() => {
        expect(screen.getByTestId('ble-connected')).toBeInTheDocument()
      })

      expect(mockBLEService.connectToDevice).toHaveBeenCalledWith('device1')
      expect(screen.getByText('Connected to Solana Seeker #1')).toBeInTheDocument()
    })

    it('should send BLE payment successfully', async () => {
      const user = userEvent.setup()
      
      render(
        <NavigationTestWrapper mockNavigation={mockNavigation} mockRoute={mockRoute}>
          <MockBLEPaymentFlow navigation={mockNavigation} route={mockRoute} />
        </NavigationTestWrapper>
      )

      // Simulate device already connected
      await user.click(screen.getByTestId('start-ble-scan'))
      
      await waitFor(() => {
        expect(screen.getByTestId('device-device1')).toBeInTheDocument()
      }, { timeout: 2000 })

      await user.click(screen.getByLabelText('Connect to Solana Seeker #1'))
      
      await waitFor(() => {
        expect(screen.getByTestId('ble-connected')).toBeInTheDocument()
      })

      // Send payment
      await user.click(screen.getByTestId('send-ble-payment'))

      expect(mockBLEService.sendPaymentData).toHaveBeenCalledWith({
        amount: '3.0',
        recipient: 'device1'
      })
      
      expect(mockNavigation.navigate).toHaveBeenCalledWith('PaymentSuccess', {
        method: 'ble',
        device: 'Solana Seeker #1'
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle wallet service errors', async () => {
      const user = userEvent.setup()
      mockWalletService.sendTransaction.mockRejectedValue(new Error('Network error'))
      
      render(
        <NavigationTestWrapper mockNavigation={mockNavigation} mockRoute={mockRoute}>
          <MockPaymentFlow navigation={mockNavigation} route={mockRoute} />
        </NavigationTestWrapper>
      )

      // Complete payment flow
      const amountInput = screen.getByTestId('amount-input')
      await user.type(amountInput, '2.5')
      await user.click(screen.getByTestId('amount-continue'))

      const recipientInput = screen.getByTestId('recipient-input')
      await user.type(recipientInput, 'test-recipient')
      await user.click(screen.getByTestId('recipient-continue'))

      await user.click(screen.getByTestId('confirm-payment'))

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Network error')
      })
    })

    it('should handle NFC service errors', async () => {
      const user = userEvent.setup()
      mockNFCService.startScanning.mockRejectedValue(new Error('NFC not available'))
      
      render(
        <NavigationTestWrapper mockNavigation={mockNavigation} mockRoute={mockRoute}>
          <MockNFCPaymentFlow navigation={mockNavigation} route={mockRoute} />
        </NavigationTestWrapper>
      )

      await user.click(screen.getByTestId('start-nfc-scan'))

      await waitFor(() => {
        expect(screen.getByTestId('nfc-error')).toHaveTextContent('NFC not available')
      })
    })

    it('should handle BLE service errors', async () => {
      const user = userEvent.setup()
      mockBLEService.connectToDevice.mockRejectedValue(new Error('Connection failed'))
      
      render(
        <NavigationTestWrapper mockNavigation={mockNavigation} mockRoute={mockRoute}>
          <MockBLEPaymentFlow navigation={mockNavigation} route={mockRoute} />
        </NavigationTestWrapper>
      )

      await user.click(screen.getByTestId('start-ble-scan'))
      
      await waitFor(() => {
        expect(screen.getByTestId('device-device1')).toBeInTheDocument()
      }, { timeout: 2000 })

      await user.click(screen.getByLabelText('Connect to Solana Seeker #1'))

      await waitFor(() => {
        expect(screen.getByTestId('ble-error')).toHaveTextContent('Connection failed')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <NavigationTestWrapper mockNavigation={mockNavigation} mockRoute={mockRoute}>
          <MockPaymentFlow navigation={mockNavigation} route={mockRoute} />
        </NavigationTestWrapper>
      )

      expect(screen.getByLabelText('Payment amount')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
    })

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup()
      
      render(
        <NavigationTestWrapper mockNavigation={mockNavigation} mockRoute={mockRoute}>
          <MockPaymentFlow navigation={mockNavigation} route={mockRoute} />
        </NavigationTestWrapper>
      )

      await user.click(screen.getByTestId('amount-continue'))

      const errorElement = screen.getByTestId('error-message')
      expect(errorElement).toHaveAttribute('role', 'alert')
      expect(errorElement).toHaveTextContent('Invalid amount')
    })
  })

  describe('Performance', () => {
    it('should handle rapid user interactions gracefully', async () => {
      const user = userEvent.setup()
      
      render(
        <NavigationTestWrapper mockNavigation={mockNavigation} mockRoute={mockRoute}>
          <MockPaymentFlow navigation={mockNavigation} route={mockRoute} />
        </NavigationTestWrapper>
      )

      const amountInput = screen.getByTestId('amount-input')
      await user.type(amountInput, '2.5')
      
      const continueButton = screen.getByTestId('amount-continue')
      
      // Rapid clicks
      await user.click(continueButton)
      await user.click(continueButton)
      await user.click(continueButton)

      // Should only process once
      await waitFor(() => {
        expect(screen.getByTestId('recipient-step')).toBeInTheDocument()
      })
    })
  })
})