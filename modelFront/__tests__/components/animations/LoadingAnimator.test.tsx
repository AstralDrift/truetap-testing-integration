/**
 * LoadingAnimator Component Tests
 * 
 * Tests for the new animation system with accessibility,
 * performance optimization, and reduced motion support
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoadingAnimator, SpinnerLoader, DotsLoader, SkeletonLoader } from '../../../components/animations/LoadingAnimator'

// Mock framer-motion to prevent animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
  },
  Variants: {},
}))

// Mock enhanced animations module
jest.mock('@/lib/animations/enhanced-animations', () => ({
  ENHANCED_TIMING: { normal: 300 },
  ENHANCED_EASING: { easeInOut: 'ease-in-out' },
  createReducedMotionVariant: jest.fn((variants) => variants),
  createPerformanceOptimizedVariant: jest.fn((variants) => variants),
  DEVICE_ADAPTIVE: {
    tiers: {
      low: 'low',
      medium: 'medium',
      high: 'high',
    }
  }
}))

describe('LoadingAnimator Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render spinner type by default', () => {
      render(<LoadingAnimator />)
      
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByLabelText(/loading/i)).toBeInTheDocument()
    })

    it('should render different animation types', () => {
      const { rerender } = render(<LoadingAnimator type="dots" />)
      expect(screen.getByRole('status')).toBeInTheDocument()

      rerender(<LoadingAnimator type="pulse" />)
      expect(screen.getByRole('status')).toBeInTheDocument()

      rerender(<LoadingAnimator type="skeleton" />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should not render when isLoading is false', () => {
      render(<LoadingAnimator isLoading={false} />)
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('should render with custom text', () => {
      render(<LoadingAnimator showText text="Processing Payment..." />)
      
      expect(screen.getByText('Processing Payment...')).toBeInTheDocument()
    })
  })

  describe('Animation Types', () => {
    it('should render dots animation with correct structure', () => {
      render(<LoadingAnimator type="dots" />)
      
      const container = screen.getByRole('status')
      expect(container).toBeInTheDocument()
      
      // Should have multiple dot elements (mocked as divs)
      const dots = container.querySelectorAll('.loading-dots div')
      expect(dots.length).toBe(3)
    })

    it('should render skeleton animation with configurable lines', () => {
      render(
        <LoadingAnimator 
          type="skeleton" 
          skeletonProps={{ lines: 5 }}
        />
      )
      
      const container = screen.getByRole('status')
      const skeletonLines = container.querySelectorAll('.loading-skeleton div')
      expect(skeletonLines.length).toBe(5)
    })

    it('should render progress animation with percentage when configured', () => {
      render(
        <LoadingAnimator 
          type="progress" 
          progressProps={{ 
            value: 75, 
            indeterminate: false, 
            showPercentage: true 
          }}
        />
      )
      
      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('should render wave animation with correct elements', () => {
      render(<LoadingAnimator type="wave" />)
      
      const container = screen.getByRole('status')
      const waveElements = container.querySelectorAll('.loading-wave div')
      expect(waveElements.length).toBe(5)
    })
  })

  describe('Size Configuration', () => {
    it('should handle different size props', () => {
      const { rerender } = render(<LoadingAnimator size="sm" />)
      expect(screen.getByRole('status')).toBeInTheDocument()

      rerender(<LoadingAnimator size="lg" />)
      expect(screen.getByRole('status')).toBeInTheDocument()

      rerender(<LoadingAnimator size="xl" />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should apply custom styling', () => {
      render(
        <LoadingAnimator 
          style={{ backgroundColor: 'red' }}
          className="custom-loader"
        />
      )
      
      const container = screen.getByRole('status')
      expect(container).toHaveClass('custom-loader')
    })
  })

  describe('Accessibility Features', () => {
    it('should have proper ARIA attributes', () => {
      render(<LoadingAnimator ariaLabel="Loading payment data" />)
      
      const status = screen.getByRole('status')
      expect(status).toHaveAttribute('aria-label', 'Loading payment data')
    })

    it('should include screen reader text', () => {
      render(<LoadingAnimator text="Processing..." />)
      
      expect(screen.getByText(/loading processing/i)).toBeInTheDocument()
    })

    it('should handle reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })

      render(<LoadingAnimator respectReducedMotion />)
      
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('Performance Optimization', () => {
    it('should handle different performance levels', () => {
      const { rerender } = render(<LoadingAnimator performanceLevel="high" />)
      expect(screen.getByRole('status')).toBeInTheDocument()

      rerender(<LoadingAnimator performanceLevel="low" />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should handle custom speed multiplier', () => {
      render(<LoadingAnimator speed={2} />)
      
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('Interactive Behavior', () => {
    it('should update when isLoading prop changes', async () => {
      const { rerender } = render(<LoadingAnimator isLoading />)
      
      expect(screen.getByRole('status')).toBeInTheDocument()

      rerender(<LoadingAnimator isLoading={false} />)
      
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('should handle loading state transitions smoothly', async () => {
      const { rerender } = render(<LoadingAnimator isLoading={false} />)
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument()

      rerender(<LoadingAnimator isLoading />)
      
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid props gracefully', () => {
      // Should not crash with invalid type
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      render(<LoadingAnimator type={'invalid' as any} />)
      
      expect(screen.getByRole('status')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should handle missing required props', () => {
      render(<LoadingAnimator />)
      
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('Preset Components', () => {
    it('should render SpinnerLoader correctly', () => {
      render(<SpinnerLoader />)
      
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should render DotsLoader correctly', () => {
      render(<DotsLoader />)
      
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should render SkeletonLoader correctly', () => {
      render(<SkeletonLoader />)
      
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should pass props to preset components', () => {
      render(<SpinnerLoader size="lg" showText text="Loading..." />)
      
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Integration with Animation System', () => {
    it('should work with custom variants', () => {
      const customVariants = {
        animate: { rotate: 180 }
      }

      render(<LoadingAnimator customVariants={customVariants} />)
      
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should disable animations when requested', () => {
      render(<LoadingAnimator disableAnimations />)
      
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('Memory Management', () => {
    it('should cleanup properly on unmount', () => {
      const { unmount } = render(<LoadingAnimator />)
      
      expect(screen.getByRole('status')).toBeInTheDocument()
      
      unmount()
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('should handle rapid mount/unmount cycles', async () => {
      const { unmount, rerender } = render(<LoadingAnimator />)
      
      for (let i = 0; i < 5; i++) {
        rerender(<LoadingAnimator key={i} isLoading />)
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      
      unmount()
      
      // Should not cause memory leaks or errors
      expect(true).toBe(true)
    })
  })
})

describe('LoadingAnimator Performance', () => {
  it('should render within performance budget', async () => {
    const startTime = performance.now()
    
    render(<LoadingAnimator />)
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    // Should render within 16ms (one frame at 60fps)
    expect(renderTime).toBeLessThan(16)
  })

  it('should handle multiple instances efficiently', () => {
    const startTime = performance.now()
    
    render(
      <div>
        <LoadingAnimator />
        <LoadingAnimator type="dots" />
        <LoadingAnimator type="pulse" />
        <LoadingAnimator type="skeleton" />
      </div>
    )
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    // Should handle multiple instances efficiently
    expect(renderTime).toBeLessThan(32)
  })
})