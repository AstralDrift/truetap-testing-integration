/**
 * Device Compatibility Testing Framework
 * 
 * Comprehensive testing utilities for React Native device compatibility:
 * - Physical Android devices (Solana Seeker)
 * - Emulator environments  
 * - Different screen sizes and orientations
 * - Performance testing across device tiers
 */

import { Dimensions, Platform, PixelRatio } from 'react-native'

// Device profiles for testing
export interface DeviceProfile {
  name: string
  platform: 'android' | 'ios'
  screenSize: {
    width: number
    height: number
  }
  pixelRatio: number
  densityDpi: number
  isTablet: boolean
  isEmulator: boolean
  performanceTier: 'low' | 'medium' | 'high'
  features: {
    nfc: boolean
    bluetooth: boolean
    biometrics: boolean
    camera: boolean
  }
}

// Solana Seeker device profile
export const SOLANA_SEEKER_PROFILE: DeviceProfile = {
  name: 'Solana Seeker',
  platform: 'android',
  screenSize: { width: 393, height: 851 },
  pixelRatio: 2.75,
  densityDpi: 440,
  isTablet: false,
  isEmulator: false,
  performanceTier: 'high',
  features: {
    nfc: true,
    bluetooth: true,
    biometrics: true,
    camera: true,
  },
}

// Common Android device profiles
export const DEVICE_PROFILES: Record<string, DeviceProfile> = {
  SEEKER: SOLANA_SEEKER_PROFILE,
  
  PIXEL_7: {
    name: 'Pixel 7',
    platform: 'android',
    screenSize: { width: 393, height: 851 },
    pixelRatio: 2.75,
    densityDpi: 440,
    isTablet: false,
    isEmulator: false,
    performanceTier: 'high',
    features: { nfc: true, bluetooth: true, biometrics: true, camera: true },
  },

  SAMSUNG_S23: {
    name: 'Samsung Galaxy S23',
    platform: 'android',
    screenSize: { width: 360, height: 780 },
    pixelRatio: 3,
    densityDpi: 480,
    isTablet: false,
    isEmulator: false,
    performanceTier: 'high',
    features: { nfc: true, bluetooth: true, biometrics: true, camera: true },
  },

  ANDROID_EMULATOR: {
    name: 'Android Emulator (API 34)',
    platform: 'android',
    screenSize: { width: 360, height: 640 },
    pixelRatio: 2,
    densityDpi: 320,
    isTablet: false,
    isEmulator: true,
    performanceTier: 'medium',
    features: { nfc: false, bluetooth: false, biometrics: false, camera: true },
  },

  LOW_END_DEVICE: {
    name: 'Budget Android Device',
    platform: 'android',
    screenSize: { width: 320, height: 568 },
    pixelRatio: 1.5,
    densityDpi: 240,
    isTablet: false,
    isEmulator: false,
    performanceTier: 'low',
    features: { nfc: false, bluetooth: true, biometrics: false, camera: true },
  },

  TABLET: {
    name: 'Android Tablet',
    platform: 'android',
    screenSize: { width: 800, height: 1280 },
    pixelRatio: 2,
    densityDpi: 320,
    isTablet: true,
    isEmulator: false,
    performanceTier: 'medium',
    features: { nfc: false, bluetooth: true, biometrics: false, camera: true },
  },
}

// Screen orientation testing
export type Orientation = 'portrait' | 'landscape'

export interface OrientationDimensions {
  width: number
  height: number
  orientation: Orientation
}

export const getOrientationDimensions = (
  profile: DeviceProfile, 
  orientation: Orientation
): OrientationDimensions => {
  const { width, height } = profile.screenSize
  
  if (orientation === 'landscape') {
    return {
      width: Math.max(width, height),
      height: Math.min(width, height),
      orientation: 'landscape',
    }
  }
  
  return {
    width: Math.min(width, height),
    height: Math.max(width, height),
    orientation: 'portrait',
  }
}

// Device capability testing
export class DeviceCapabilityTester {
  private currentProfile: DeviceProfile = DEVICE_PROFILES.SEEKER

  setDeviceProfile(profile: DeviceProfile) {
    this.currentProfile = profile
    this.mockDeviceAPIs()
  }

  private mockDeviceAPIs() {
    // Mock Dimensions
    const mockDimensions = {
      get: jest.fn(() => ({
        window: this.currentProfile.screenSize,
        screen: this.currentProfile.screenSize,
      })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    
    Object.defineProperty(Dimensions, 'get', {
      value: mockDimensions.get,
    })

    // Mock PixelRatio
    Object.defineProperty(PixelRatio, 'get', {
      value: jest.fn(() => this.currentProfile.pixelRatio),
    })

    // Mock Platform
    Object.defineProperty(Platform, 'OS', {
      value: this.currentProfile.platform,
    })
  }

  testNFCCapability(): boolean {
    return this.currentProfile.features.nfc
  }

  testBluetoothCapability(): boolean {
    return this.currentProfile.features.bluetooth
  }

  testBiometricsCapability(): boolean {
    return this.currentProfile.features.biometrics
  }

  testCameraCapability(): boolean {
    return this.currentProfile.features.camera
  }

  getPerformanceTier(): 'low' | 'medium' | 'high' {
    return this.currentProfile.performanceTier
  }

  isEmulator(): boolean {
    return this.currentProfile.isEmulator
  }

  isTablet(): boolean {
    return this.currentProfile.isTablet
  }

  getScreenCategory(): 'small' | 'normal' | 'large' | 'xlarge' {
    const { width, height } = this.currentProfile.screenSize
    const area = width * height

    if (area < 300000) return 'small'    // < ~320x960
    if (area < 500000) return 'normal'   // < ~360x1400
    if (area < 1000000) return 'large'   // < ~600x1600
    return 'xlarge'                      // Tablets and large phones
  }
}

// Performance testing utilities
export class PerformanceTester {
  private metrics: {
    renderTime: number[]
    frameRate: number[]
    memoryUsage: number[]
    cpuUsage: number[]
  } = {
    renderTime: [],
    frameRate: [],
    memoryUsage: [],
    cpuUsage: [],
  }

  startMonitoring() {
    this.metrics = {
      renderTime: [],
      frameRate: [],
      memoryUsage: [],
      cpuUsage: [],
    }
  }

  recordRenderTime(time: number) {
    this.metrics.renderTime.push(time)
  }

  recordFrameRate(fps: number) {
    this.metrics.frameRate.push(fps)
  }

  recordMemoryUsage(bytes: number) {
    this.metrics.memoryUsage.push(bytes)
  }

  getMetrics() {
    return {
      averageRenderTime: this.average(this.metrics.renderTime),
      averageFrameRate: this.average(this.metrics.frameRate),
      peakMemoryUsage: Math.max(...this.metrics.memoryUsage, 0),
      renderTimeP95: this.percentile(this.metrics.renderTime, 95),
      frameRateMin: Math.min(...this.metrics.frameRate, 60),
    }
  }

  private average(arr: number[]): number {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  }

  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0
    const sorted = [...arr].sort((a, b) => a - b)
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[index]
  }
}

// Touch target testing for different screen sizes
export class TouchTargetTester {
  private minTouchTarget = 44 // Minimum touch target size in dp

  validateTouchTarget(
    elementSize: { width: number; height: number },
    deviceProfile: DeviceProfile
  ): { isValid: boolean; recommendations: string[] } {
    const { pixelRatio } = deviceProfile
    const recommendations: string[] = []
    
    // Convert to dp
    const widthDp = elementSize.width / pixelRatio
    const heightDp = elementSize.height / pixelRatio
    
    let isValid = true

    if (widthDp < this.minTouchTarget) {
      isValid = false
      recommendations.push(`Increase width to ${this.minTouchTarget}dp (currently ${widthDp.toFixed(1)}dp)`)
    }

    if (heightDp < this.minTouchTarget) {
      isValid = false
      recommendations.push(`Increase height to ${this.minTouchTarget}dp (currently ${heightDp.toFixed(1)}dp)`)
    }

    // Additional recommendations for specific devices
    if (deviceProfile.name === 'Solana Seeker') {
      if (widthDp < 48) {
        recommendations.push('Consider 48dp minimum for Seeker hardware for better tap accuracy')
      }
    }

    return { isValid, recommendations }
  }
}

// Text readability testing
export class ReadabilityTester {
  testTextSize(
    fontSize: number,
    deviceProfile: DeviceProfile,
    userPreferences: { largeText: boolean }
  ): { isReadable: boolean; recommendations: string[] } {
    const recommendations: string[] = []
    let isReadable = true

    // Base minimum sizes
    const minSizes = {
      small: 12,
      normal: 14,
      large: 16,
    }

    const category = this.getScreenCategory(deviceProfile)
    const minSize = minSizes[category] || minSizes.normal

    let effectiveMinSize = minSize
    if (userPreferences.largeText) {
      effectiveMinSize = minSize * 1.3
    }

    if (fontSize < effectiveMinSize) {
      isReadable = false
      recommendations.push(`Increase font size to at least ${effectiveMinSize}sp`)
    }

    // Device-specific recommendations
    if (deviceProfile.performanceTier === 'low') {
      recommendations.push('Consider using system fonts for better performance')
    }

    return { isReadable, recommendations }
  }

  private getScreenCategory(profile: DeviceProfile): 'small' | 'normal' | 'large' {
    const { width, height } = profile.screenSize
    const diagonal = Math.sqrt(width * width + height * height) / profile.pixelRatio

    if (diagonal < 4.5) return 'small'
    if (diagonal > 6.5) return 'large'
    return 'normal'
  }
}

// Battery and thermal testing utilities
export class ResourceTester {
  private batteryLevel = 100
  private thermalState = 'normal'

  setBatteryLevel(level: number) {
    this.batteryLevel = Math.max(0, Math.min(100, level))
  }

  setThermalState(state: 'normal' | 'fair' | 'serious' | 'critical') {
    this.thermalState = state
  }

  shouldReduceAnimations(): boolean {
    return this.batteryLevel < 20 || this.thermalState !== 'normal'
  }

  shouldReduceBackgroundActivity(): boolean {
    return this.batteryLevel < 15 || this.thermalState === 'critical'
  }

  getPerformanceMode(): 'full' | 'reduced' | 'minimal' {
    if (this.thermalState === 'critical' || this.batteryLevel < 10) {
      return 'minimal'
    }
    if (this.thermalState !== 'normal' || this.batteryLevel < 30) {
      return 'reduced'
    }
    return 'full'
  }
}

// Test utilities for device compatibility
export const deviceTestUtils = {
  // Test component across multiple devices
  testAcrossDevices: async (
    testFn: (profile: DeviceProfile) => Promise<void>,
    profiles: DeviceProfile[] = Object.values(DEVICE_PROFILES)
  ) => {
    for (const profile of profiles) {
      try {
        await testFn(profile)
      } catch (error) {
        throw new Error(`Test failed on ${profile.name}: ${error}`)
      }
    }
  },

  // Test component in different orientations
  testOrientations: async (
    testFn: (dimensions: OrientationDimensions) => Promise<void>,
    profile: DeviceProfile = DEVICE_PROFILES.SEEKER
  ) => {
    const portrait = getOrientationDimensions(profile, 'portrait')
    const landscape = getOrientationDimensions(profile, 'landscape')

    await testFn(portrait)
    await testFn(landscape)
  },

  // Create device-specific test wrapper
  createDeviceTestWrapper: (profile: DeviceProfile) => {
    const tester = new DeviceCapabilityTester()
    tester.setDeviceProfile(profile)
    
    return {
      profile,
      tester,
      hasNFC: () => tester.testNFCCapability(),
      hasBluetooth: () => tester.testBluetoothCapability(),
      isEmulator: () => tester.isEmulator(),
      performanceTier: () => tester.getPerformanceTier(),
    }
  },

  // Validate responsive design
  validateResponsiveDesign: (
    element: { width: number; height: number },
    profile: DeviceProfile
  ) => {
    const touchTester = new TouchTargetTester()
    const results = touchTester.validateTouchTarget(element, profile)
    
    return {
      touchTargetValid: results.isValid,
      recommendations: results.recommendations,
      screenCategory: new DeviceCapabilityTester().getScreenCategory(),
    }
  },
}

// Export all testing utilities
export {
  DeviceCapabilityTester,
  PerformanceTester,
  TouchTargetTester,
  ReadabilityTester,
  ResourceTester,
}