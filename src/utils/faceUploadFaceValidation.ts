import { Face } from '@react-native-ml-kit/face-detection';

export type FacePoseKey = 'center' | 'left' | 'right' | 'up' | 'down';

function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized > 180) normalized -= 360;
  if (normalized < -180) normalized += 360;
  return normalized;
}
export function validateFacePose(face: Face, position: FacePoseKey): boolean {
  const rotX = face.rotationX ?? 0;
  const rotY = face.rotationY ?? 0;

  const angleMissing =
    Math.abs(rotX) < 0.5 && Math.abs(rotY) < 0.5 && Math.abs(face.rotationZ ?? 0) < 0.5;
  if (position !== 'center' && angleMissing) {
    return true;
  }

  const rotationX = normalizeAngle(rotX);
  const rotationY = normalizeAngle(rotY);

  const rotationThreshold = 12;
  const tiltLimit = rotationThreshold * 2.5;

  switch (position) {
    case 'center':
      return Math.abs(rotationX) < rotationThreshold && Math.abs(rotationY) < rotationThreshold;
    case 'left':
      return rotationY < -rotationThreshold && Math.abs(rotationX) < tiltLimit;
    case 'right':
      return rotationY > rotationThreshold && Math.abs(rotationX) < tiltLimit;
    case 'up':
      return rotationX > rotationThreshold && Math.abs(rotationY) < tiltLimit;
    case 'down':
      return rotationX < -rotationThreshold && Math.abs(rotationY) < tiltLimit;
    default:
      return false;
  }
}

export function getFrameMetricsForPose(_positionKey?: FacePoseKey) {
  return {
    frameMargin: 0.15,
    minOverlapRatio: 0.8,
    useMinOverlap: false,
  };
}

const MIN_FACE_RATIO = 0.1;
const MAX_FACE_RATIO = 0.9;

export type FaceFrameIssue = 'outside' | 'too_far' | 'too_close';

export function getSingleFaceFrameIssue(
  face: Face,
  width: number,
  height: number,
  positionKey: FacePoseKey
): FaceFrameIssue | null {
  const { frameMargin, minOverlapRatio, useMinOverlap } = getFrameMetricsForPose(positionKey);
  const marginX = width * frameMargin;
  const marginY = height * frameMargin;
  const frameLeft = marginX;
  const frameTop = marginY;
  const frameRight = width - marginX;
  const frameBottom = height - marginY;

  const fl = face.frame.left;
  const ft = face.frame.top;
  const fr = face.frame.left + face.frame.width;
  const fb = face.frame.top + face.frame.height;
  const overlapLeft = Math.max(fl, frameLeft);
  const overlapTop = Math.max(ft, frameTop);
  const overlapRight = Math.min(fr, frameRight);
  const overlapBottom = Math.min(fb, frameBottom);
  const overlapW = Math.max(0, overlapRight - overlapLeft);
  const overlapH = Math.max(0, overlapBottom - overlapTop);
  const overlapRatioW = overlapW / face.frame.width;
  const overlapRatioH = overlapH / face.frame.height;
  const overlapScore = Math.min(overlapRatioW, overlapRatioH);
  const enoughInFrame = useMinOverlap
    ? overlapScore >= minOverlapRatio
    : overlapRatioW >= minOverlapRatio && overlapRatioH >= minOverlapRatio;
  if (!enoughInFrame) return 'outside';

  const faceSizeRatio = Math.max(face.frame.width / width, face.frame.height / height);
  if (faceSizeRatio < MIN_FACE_RATIO) return 'too_far';
  if (faceSizeRatio > MAX_FACE_RATIO) return 'too_close';
  return null;
}

export function filterFacesInFrameForPose(
  allFaces: Face[],
  width: number,
  height: number,
  positionKey: FacePoseKey
): Face[] {
  const { frameMargin, minOverlapRatio, useMinOverlap } = getFrameMetricsForPose(positionKey);
  const marginX = width * frameMargin;
  const marginY = height * frameMargin;
  const frameLeft = marginX;
  const frameTop = marginY;
  const frameRight = width - marginX;
  const frameBottom = height - marginY;

  return allFaces.filter((face) => {
    const fl = face.frame.left;
    const ft = face.frame.top;
    const fr = face.frame.left + face.frame.width;
    const fb = face.frame.top + face.frame.height;
    const overlapLeft = Math.max(fl, frameLeft);
    const overlapTop = Math.max(ft, frameTop);
    const overlapRight = Math.min(fr, frameRight);
    const overlapBottom = Math.min(fb, frameBottom);
    const overlapW = Math.max(0, overlapRight - overlapLeft);
    const overlapH = Math.max(0, overlapBottom - overlapTop);
    const overlapRatioW = overlapW / face.frame.width;
    const overlapRatioH = overlapH / face.frame.height;
    const overlapScore = Math.min(overlapRatioW, overlapRatioH);
    const enoughInFrame = useMinOverlap
      ? overlapScore >= minOverlapRatio
      : overlapRatioW >= minOverlapRatio && overlapRatioH >= minOverlapRatio;
    if (!enoughInFrame) return false;
    const faceSizeRatio = Math.max(face.frame.width / width, face.frame.height / height);
    return faceSizeRatio >= MIN_FACE_RATIO && faceSizeRatio <= MAX_FACE_RATIO;
  });
}
