// __tests__/utils/responsive.test.tsx

const mockDimensionsGet = jest.fn();

jest.mock('react-native', () => ({
  Dimensions: {
    get: mockDimensionsGet,
  },
  PixelRatio: {
    roundToNearestPixel: jest.fn((n) => n),
  },
}));

describe('responsive utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('scale returns correct value', () => {
    mockDimensionsGet.mockImplementation((key) =>
      key === 'window' ? { width: 375, height: 667 } : { width: 0, height: 0 }
    );
    const responsive = require('@utils/responsive');
    expect(responsive.scale(10)).toBe(10);
  });

  it('scaleFont returns correct value', () => {
    mockDimensionsGet.mockImplementation((key) =>
      key === 'window' ? { width: 375, height: 667 } : { width: 0, height: 0 }
    );
    const responsive = require('@utils/responsive');
    expect(responsive.scaleFont(12)).toBe(12);
  });

  it('getResponsivePadding returns tablet paddings', () => {
    mockDimensionsGet.mockImplementation((key) =>
      key === 'window' ? { width: 800, height: 1200 } : { width: 0, height: 0 }
    );
    const responsive = require('@utils/responsive');
    expect(responsive.getResponsivePadding()).toEqual({
      small: 12,
      medium: 20,
      large: 32,
      xlarge: 48,
    });
  });

  it('getResponsivePadding returns phone paddings', () => {
    mockDimensionsGet.mockImplementation((key) =>
      key === 'window' ? { width: 375, height: 667 } : { width: 0, height: 0 }
    );
    const responsive = require('@utils/responsive');
    expect(responsive.getResponsivePadding()).toEqual({
      small: 8,
      medium: 16,
      large: 24,
      xlarge: 32,
    });
  });

  it('isTablet returns true for tablet', () => {
    mockDimensionsGet.mockImplementation((key) =>
      key === 'window' ? { width: 800, height: 1200 } : { width: 0, height: 0 }
    );
    const responsive = require('@utils/responsive');
    expect(responsive.isTablet()).toBe(true);
  });

  it('isTablet returns false for phone', () => {
    mockDimensionsGet.mockImplementation((key) =>
      key === 'window' ? { width: 375, height: 667 } : { width: 0, height: 0 }
    );
    const responsive = require('@utils/responsive');
    expect(responsive.isTablet()).toBe(false);
  });
});
