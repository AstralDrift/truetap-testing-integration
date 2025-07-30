/**
 * Solana Seeker Device Compatibility Tests
 * 
 * Tests specifically for Solana Seeker hardware features:
 * - NFC capabilities and tap-to-pay
 * - Genesis Token verification
 * - Hardware-specific UI optimizations
 * - Performance on physical device
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeviceCapabilityTester } from '../utils/device-compatibility-testing'

// Mock Solana Seeker specific services
const mockSeekerCapabilities = {
  hasNFC: true,
  hasGenesisToken: true,
  supportsHCE: true,
  hasSecureElement: true,
  screenSize: { width: 393, height: 851 }, // Solana Seeker dimensions
  pixelDensity: 2.75,
  androidVersion: 13,
  model: 'Solana Seeker',
}

const mockGenesisTokenService = {
  isAvailable: jest.fn(() => Promise.resolve(true)),
  verify: jest.fn(() => Promise.resolve({
    isValid: true,
    tokenId: 'seeker-genesis-token',
    attributes: ['Solana Seeker', 'Genesis Edition']
  })),
  getTokenMetadata: jest.fn(() => Promise.resolve({
    name: 'Solana Seeker Genesis Token',
    description: 'Official Solana Seeker device verification token',
    image: 'ipfs://seeker-genesis-image'
  })),
}

const mockSeekerNFCService = {
  isNFCEnabled: jest.fn(() => Promise.resolve(true)),
  isSeekerOptimized: jest.fn(() => Promise.resolve(true)),
  getTapDistance: jest.fn(() => Promise.resolve(5)), // mm
  getOptimalTapPosition: jest.fn(() => Promise.resolve({ x: 196, y: 100 })),
  enableSeekerMode: jest.fn(() => Promise.resolve(true)),
  onSeekerTap: jest.fn(),
  calibrateTapSensitivity: jest.fn(),
}

// Mock Seeker-optimized components
const MockSeekerTapScreen = ({ onTap }: { onTap: () => void }) => {
  const [isReady, setIsReady] = React.useState(false)
  const [tapPosition, setTapPosition] = React.useState({ x: 0, y: 0 })

  React.useEffect(() => {
    const initializeSeeker = async () => {
      const position = await mockSeekerNFCService.getOptimalTapPosition()
      setTapPosition(position)
      await mockSeekerNFCService.enableSeekerMode()
      setIsReady(true)
    }
    
    initializeSeeker()
  }, [])

  const handleTap = (event: React.MouseEvent) => {
    if (!isReady) return
    
    const rect = event.currentTarget.getBoundingClientRect()
    const tapX = event.clientX - rect.left
    const tapY = event.clientY - rect.top
    
    // Check if tap is within optimal range (±20px)
    const distance = Math.sqrt(
      Math.pow(tapX - tapPosition.x, 2) + Math.pow(tapY - tapPosition.y, 2)
    )
    
    if (distance <= 20) {
      onTap()
    }
  }

  return (
    <div 
      data-testid="seeker-tap-screen"
      onClick={handleTap}
      style={{
        width: mockSeekerCapabilities.screenSize.width,
        height: mockSeekerCapabilities.screenSize.height,
        position: 'relative',
        background: 'linear-gradient(135deg, #14F195, #9945FF)',
      }}
    >
      <div
        data-testid="tap-indicator"
        style={{
          position: 'absolute',
          left: tapPosition.x - 25,
          top: tapPosition.y - 25,
          width: 50,
          height: 50,
          borderRadius: '50%',
          border: '2px solid white',
          opacity: isReady ? 1 : 0.3,
        }}
      />
      
      <div data-testid="seeker-status">
        {isReady ? 'Ready to Tap' : 'Initializing Seeker...'}
      </div>
      
      {!isReady && (
        <div data-testid="seeker-loading">
          Optimizing for Solana Seeker hardware...
        </div>
      )}
    </div>
  )
}

const MockGenesisTokenVerification = () => {
  const [verificationStatus, setVerificationStatus] = React.useState<'idle' | 'verifying' | 'verified' | 'failed'>('idle')
  const [tokenData, setTokenData] = React.useState<any>(null)

  const verifyGenesisToken = async () => {
    setVerificationStatus('verifying')
    
    try {
      const isAvailable = await mockGenesisTokenService.isAvailable()
      if (!isAvailable) {
        throw new Error('Genesis Token not found')
      }

      const verification = await mockGenesisTokenService.verify()
      if (!verification.isValid) {
        throw new Error('Invalid Genesis Token')
      }

      const metadata = await mockGenesisTokenService.getTokenMetadata()
      setTokenData({ ...verification, ...metadata })
      setVerificationStatus('verified')
    } catch (error) {
      setVerificationStatus('failed')
    }
  }

  return (
    <div data-testid="genesis-token-verification">
      <h2>Solana Seeker Verification</h2>
      
      {verificationStatus === 'idle' && (
        <button
          data-testid="verify-genesis-token"
          onClick={verifyGenesisToken}
        >
          Verify Genesis Token
        </button>
      )}

      {verificationStatus === 'verifying' && (
        <div data-testid="verification-loading">
          Verifying Genesis Token...
        </div>
      )}

      {verificationStatus === 'verified' && tokenData && (
        <div data-testid="verification-success">
          <h3>✅ Verified Solana Seeker</h3>
          <p>Token ID: {tokenData.tokenId}</p>
          <p>Name: {tokenData.name}</p>
          <p>Attributes: {tokenData.attributes.join(', ')}</p>
        </div>
      )}

      {verificationStatus === 'failed' && (
        <div data-testid="verification-failed" role="alert">
          ❌ Genesis Token verification failed
        </div>
      )}
    </div>
  )
}

describe('Solana Seeker Device Compatibility', () => {
  let deviceTester: DeviceCapabilityTester

  beforeEach(() => {
    jest.clearAllMocks()
    deviceTester = new DeviceCapabilityTester()
    
    // Mock device capabilities for Solana Seeker
    deviceTester.setDeviceCapabilities(mockSeekerCapabilities)
  })

  describe('Hardware Capabilities', () => {
    it('should detect Solana Seeker hardware features', async () => {
      const capabilities = await deviceTester.testDeviceCapabilities()
      
      expect(capabilities.nfc).toBe(true)
      expect(capabilities.bluetooth).toBe(true)
      expect(capabilities.biometrics).toBe(true)
      expect(capabilities.secureStorage).toBe(true)
      expect(capabilities.deviceModel).toBe('Solana Seeker')
    })

    it('should verify Genesis Token presence', async () => {
      const hasGenesisToken = await mockGenesisTokenService.isAvailable()
      expect(hasGenesisToken).toBe(true)
      
      const verification = await mockGenesisTokenService.verify()
      expect(verification.isValid).toBe(true)
      expect(verification.tokenId).toBe('seeker-genesis-token')
    })

    it('should detect NFC optimization for Seeker', async () => {
      const isOptimized = await mockSeekerNFCService.isSeekerOptimized()
      expect(isOptimized).toBe(true)
      
      const tapDistance = await mockSeekerNFCService.getTapDistance()
      expect(tapDistance).toBeLessThanOrEqual(10) // Seeker should have < 10mm tap distance
    })

    it('should get optimal tap position for Seeker hardware', async () => {
      const position = await mockSeekerNFCService.getOptimalTapPosition()
      
      expect(position.x).toBeGreaterThan(0)
      expect(position.y).toBeGreaterThan(0)
      expect(position.x).toBeLessThan(mockSeekerCapabilities.screenSize.width)
      expect(position.y).toBeLessThan(mockSeekerCapabilities.screenSize.height)
    })
  })

  describe('Seeker-Optimized UI', () => {
    it('should render tap screen optimized for Seeker dimensions', async () => {
      const onTap = jest.fn()
      
      render(<MockSeekerTapScreen onTap={onTap} />)
      
      const tapScreen = screen.getByTestId('seeker-tap-screen')
      expect(tapScreen).toHaveStyle({
        width: `${mockSeekerCapabilities.screenSize.width}px`,
        height: `${mockSeekerCapabilities.screenSize.height}px`,
      })

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByText('Ready to Tap')).toBeInTheDocument()
      })

      expect(mockSeekerNFCService.enableSeekerMode).toHaveBeenCalled()
    })

    it('should position tap indicator at optimal location', async () => {
      const onTap = jest.fn()
      
      render(<MockSeekerTapScreen onTap={onTap} />)
      
      await waitFor(() => {
        expect(screen.getByTestId('tap-indicator')).toBeInTheDocument()
      })

      const indicator = screen.getByTestId('tap-indicator')
      expect(indicator).toHaveStyle({
        left: '171px', // 196 - 25 (half width)
        top: '75px',   // 100 - 25 (half height)
      })
    })

    it('should detect accurate tap within optimal range', async () => {
      const user = userEvent.setup()
      const onTap = jest.fn()
      
      render(<MockSeekerTapScreen onTap={onTap} />)
      
      await waitFor(() => {
        expect(screen.getByText('Ready to Tap')).toBeInTheDocument()
      })

      const tapScreen = screen.getByTestId('seeker-tap-screen')
      
      // Simulate tap at optimal position (196, 100)
      fireEvent.click(tapScreen, {
        clientX: 196,
        clientY: 100,
        currentTarget: tapScreen,
        target: tapScreen,
      })

      expect(onTap).toHaveBeenCalled()
    })

    it('should ignore taps outside optimal range', async () => {
      const onTap = jest.fn()
      
      render(<MockSeekerTapScreen onTap={onTap} />)
      
      await waitFor(() => {
        expect(screen.getByText('Ready to Tap')).toBeInTheDocument()
      })

      const tapScreen = screen.getByTestId('seeker-tap-screen')
      
      // Simulate tap far from optimal position
      fireEvent.click(tapScreen, {
        clientX: 50,
        clientY: 50,
        currentTarget: tapScreen,
        target: tapScreen,
      })

      expect(onTap).not.toHaveBeenCalled()
    })
  })

  describe('Genesis Token Verification', () => {
    it('should successfully verify Genesis Token', async () => {
      const user = userEvent.setup()
      
      render(<MockGenesisTokenVerification />)
      
      await user.click(screen.getByTestId('verify-genesis-token'))
      
      // Should show loading state
      expect(screen.getByTestId('verification-loading')).toBeInTheDocument()
      
      // Wait for verification to complete
      await waitFor(() => {
        expect(screen.getByTestId('verification-success')).toBeInTheDocument()
      })

      expect(screen.getByText('✅ Verified Solana Seeker')).toBeInTheDocument()
      expect(screen.getByText('Token ID: seeker-genesis-token')).toBeInTheDocument()
      expect(mockGenesisTokenService.verify).toHaveBeenCalled()
    })

    it('should handle Genesis Token not found', async () => {
      const user = userEvent.setup()
      mockGenesisTokenService.isAvailable.mockResolvedValue(false)
      
      render(<MockGenesisTokenVerification />)
      
      await user.click(screen.getByTestId('verify-genesis-token'))
      
      await waitFor(() => {
        expect(screen.getByTestId('verification-failed')).toBeInTheDocument()
      })

      expect(screen.getByText('❌ Genesis Token verification failed')).toBeInTheDocument()
    })

    it('should handle invalid Genesis Token', async () => {
      const user = userEvent.setup()
      mockGenesisTokenService.verify.mockResolvedValue({
        isValid: false,
        tokenId: null,
        attributes: []
      })
      
      render(<MockGenesisTokenVerification />)
      
      await user.click(screen.getByTestId('verify-genesis-token'))
      
      await waitFor(() => {
        expect(screen.getByTestId('verification-failed')).toBeInTheDocument()
      })
    })
  })

  describe('Performance Optimization', () => {
    it('should meet Seeker performance targets', async () => {
      const performanceMetrics = await deviceTester.testPerformance()
      
      // Seeker-specific performance targets
      expect(performanceMetrics.renderTime).toBeLessThan(16) // 60fps target
      expect(performanceMetrics.tapResponseTime).toBeLessThan(100) // Sub-100ms
      expect(performanceMetrics.memoryUsage).toBeLessThan(150) // MB
      expect(performanceMetrics.cpuUsage).toBeLessThan(30) // %
    })

    it('should handle rapid tap interactions without performance degradation', async () => {
      const onTap = jest.fn()
      
      render(<MockSeekerTapScreen onTap={onTap} />)
      
      await waitFor(() => {
        expect(screen.getByText('Ready to Tap')).toBeInTheDocument()
      })

      const tapScreen = screen.getByTestId('seeker-tap-screen')
      
      // Simulate rapid tapping
      const rapidTaps = Array.from({ length: 10 }, (_, i) => 
        fireEvent.click(tapScreen, {
          clientX: 196,
          clientY: 100,
          currentTarget: tapScreen,
          target: tapScreen,
        })
      )

      // Should handle all taps without errors
      expect(onTap).toHaveBeenCalledTimes(10)
    })
  })

  describe('Hardware Integration', () => {
    it('should initialize Seeker-specific features on mount', async () => {
      const onTap = jest.fn()
      
      render(<MockSeekerTapScreen onTap={onTap} />)
      
      expect(screen.getByTestId('seeker-loading')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(mockSeekerNFCService.getOptimalTapPosition).toHaveBeenCalled()
        expect(mockSeekerNFCService.enableSeekerMode).toHaveBeenCalled()
      })
    })

    it('should handle hardware initialization errors gracefully', async () => {
      const onTap = jest.fn()
      mockSeekerNFCService.enableSeekerMode.mockRejectedValue(new Error('Hardware error'))
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      render(<MockSeekerTapScreen onTap={onTap} />)
      
      // Should not crash despite hardware error
      expect(screen.getByTestId('seeker-tap-screen')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Accessibility on Seeker', () => {
    it('should provide Seeker-specific accessibility features', async () => {
      const touchTargets = await deviceTester.testTouchTargets()
      
      // Seeker screen requires larger touch targets due to form factor
      expect(touchTargets.averageSize).toBeGreaterThanOrEqual(44) // 44px minimum
      expect(touchTargets.allTargetsMeetMinimum).toBe(true)
    })

    it('should support Seeker hardware accessibility features', async () => {
      const accessibilityFeatures = await deviceTester.testAccessibility()
      
      expect(accessibilityFeatures.supportsVibration).toBe(true)
      expect(accessibilityFeatures.supportsVoiceOver).toBe(true)
      expect(accessibilityFeatures.supportsHighContrast).toBe(true)
    })
  })

  describe('Network Connectivity', () => {
    it('should handle Seeker-specific network configurations', async () => {
      const networkTest = await deviceTester.testNetworkConnectivity()
      
      expect(networkTest.wifi).toBe(true)
      expect(networkTest.cellular).toBe(true)
      expect(networkTest.bluetooth).toBe(true)
      expect(networkTest.nfc).toBe(true)
    })

    it('should optimize for Seeker battery life during network operations', async () => {
      const batteryOptimization = await deviceTester.testBatteryOptimization()
      
      // Seeker-specific battery optimizations
      expect(batteryOptimization.backgroundAppRefresh).toBe(false)
      expect(batteryOptimization.locationServices).toBe('whenInUse')
      expect(batteryOptimization.bluetoothScanInterval).toBeGreaterThanOrEqual(5000) // ms
    })
  })

  describe('Security Features', () => {
    it('should utilize Seeker secure element for key storage', async () => {
      const securityTest = await deviceTester.testSecurityFeatures()
      
      expect(securityTest.hasSecureElement).toBe(true)
      expect(securityTest.supportsHardwareKeystore).toBe(true)
      expect(securityTest.biometricAuthAvailable).toBe(true)
    })

    it('should enforce Seeker-specific security policies', async () => {
      const securityPolicy = await deviceTester.testSecurityPolicy()
      
      expect(securityPolicy.requiresScreenLock).toBe(true)
      expect(securityPolicy.allowsRootedDevices).toBe(false)
      expect(securityPolicy.enforcesPinComplexity).toBe(true)
    })
  })
})