import type { Face } from '@react-native-ml-kit/face-detection';
import {
  filterFacesInFrameForPose,
  getFrameMetricsForPose,
  getSingleFaceFrameIssue,
  validateFacePose,
} from '../../src/utils/faceUploadFaceValidation';

function makeFace(overrides: Partial<Face> & { frame: Face['frame'] }): Face {
  return {
    // @ts-ignore
    frame: overrides.frame,
    rotationX: overrides.rotationX,
    rotationY: overrides.rotationY,
    rotationZ: overrides.rotationZ,
    ...overrides,
  } as Face;
}

describe('faceUploadFaceValidation', () => {
  describe('validateFacePose', () => {
    it('accepts center when both rotations are within threshold', () => {
      const face = makeFace({
        frame: { left: 0, top: 0, width: 100, height: 100 },
        rotationX: 5,
        rotationY: -8,
      });
      expect(validateFacePose(face, 'center')).toBe(true);
    });

    it('rejects center when rotation exceeds threshold', () => {
      const face = makeFace({
        frame: { left: 0, top: 0, width: 100, height: 100 },
        rotationX: 15,
        rotationY: 0,
      });
      expect(validateFacePose(face, 'center')).toBe(false);
    });

    it('accepts left pose when head turned left (negative Y) and tilt within limit', () => {
      const face = makeFace({
        frame: { left: 0, top: 0, width: 100, height: 100 },
        rotationX: 5,
        rotationY: -20,
      });
      expect(validateFacePose(face, 'left')).toBe(true);
    });

    it('accepts right pose when head turned right (positive Y)', () => {
      const face = makeFace({
        frame: { left: 0, top: 0, width: 100, height: 100 },
        rotationX: 0,
        rotationY: 20,
      });
      expect(validateFacePose(face, 'right')).toBe(true);
    });

    it('accepts up pose when rotationX above threshold', () => {
      const face = makeFace({
        frame: { left: 0, top: 0, width: 100, height: 100 },
        rotationX: 20,
        rotationY: 5,
      });
      expect(validateFacePose(face, 'up')).toBe(true);
    });

    it('accepts down pose when rotationX below negative threshold', () => {
      const face = makeFace({
        frame: { left: 0, top: 0, width: 100, height: 100 },
        rotationX: -20,
        rotationY: 5,
      });
      expect(validateFacePose(face, 'down')).toBe(true);
    });

    it('treats missing angles as valid for non-center poses', () => {
      const face = makeFace({
        frame: { left: 0, top: 0, width: 100, height: 100 },
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
      });
      expect(validateFacePose(face, 'left')).toBe(true);
      expect(validateFacePose(face, 'right')).toBe(true);
    });

    it('uses 0 when rotation fields are undefined', () => {
      const face = makeFace({
        frame: { left: 0, top: 0, width: 100, height: 100 },
      });
      delete (face as { rotationX?: number }).rotationX;
      delete (face as { rotationY?: number }).rotationY;
      expect(validateFacePose(face, 'center')).toBe(true);
    });

    it('normalizes large angles (e.g. equivalent to small positive)', () => {
      const face = makeFace({
        frame: { left: 0, top: 0, width: 100, height: 100 },
        rotationX: 350,
        rotationY: 350,
      });
      // 350 -> -10 after normalize, abs < 12
      expect(validateFacePose(face, 'center')).toBe(true);
    });
  });

  describe('getFrameMetricsForPose', () => {
    it('returns fixed metrics regardless of pose key', () => {
      const a = getFrameMetricsForPose('center');
      const b = getFrameMetricsForPose('left');
      expect(a).toEqual({
        frameMargin: 0.15,
        minOverlapRatio: 0.8,
        useMinOverlap: false,
      });
      expect(b).toEqual(a);
    });
  });

  describe('getSingleFaceFrameIssue', () => {
    const w = 1000;
    const h = 800;

    it('returns null when face is well inside frame and size is in range', () => {
      const face = makeFace({
        frame: { left: 200, top: 150, width: 400, height: 400 },
      });
      expect(getSingleFaceFrameIssue(face, w, h, 'center')).toBe(null);
    });

    it('returns outside when overlap is insufficient', () => {
      const face = makeFace({
        frame: { left: 0, top: 200, width: 500, height: 400 },
      });
      expect(getSingleFaceFrameIssue(face, w, h, 'center')).toBe('outside');
    });

    it('returns too_far when face box is small relative to image', () => {
      const face = makeFace({
        frame: { left: 400, top: 300, width: 50, height: 50 },
      });
      expect(getSingleFaceFrameIssue(face, w, h, 'center')).toBe('too_far');
    });

    it('does not report too_close when face fills inner frame (max ratio below 0.9 with default margin)', () => {
      const face = makeFace({
        frame: { left: 150, top: 120, width: 700, height: 560 },
      });
      expect(getSingleFaceFrameIssue(face, w, h, 'center')).toBe(null);
    });
  });

  describe('filterFacesInFrameForPose', () => {
    const w = 1000;
    const h = 800;

    it('keeps faces that pass size and overlap checks', () => {
      const good = makeFace({
        frame: { left: 200, top: 150, width: 400, height: 400 },
      });
      const bad = makeFace({
        frame: { left: 0, top: 0, width: 50, height: 50 },
      });
      const result = filterFacesInFrameForPose([good, bad], w, h, 'center');
      expect(result).toEqual([good]);
    });

    it('returns empty array when no face qualifies', () => {
      const face = makeFace({
        frame: { left: 0, top: 0, width: 30, height: 30 },
      });
      expect(filterFacesInFrameForPose([face], w, h, 'center')).toEqual([]);
    });
  });
});
