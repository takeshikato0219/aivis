import type { CountDetectionData } from '@/screens/Detail/Detail.types';
import {
  applyCountIncrement,
  applyCountIncrements,
  emitCountDetectionEvent,
  subscribeCountDetectionEvent,
} from '@/services/countDetectionEventService';

describe('countDetectionEventService', () => {
  describe('subscribeCountDetectionEvent / emitCountDetectionEvent', () => {
    it('notifies all subscribers with the same payload', () => {
      const a = jest.fn();
      const b = jest.fn();
      const unsubA = subscribeCountDetectionEvent(a);
      subscribeCountDetectionEvent(b);

      emitCountDetectionEvent({ codes: ['visitor_count'], camera_id: 'cam-1' });

      expect(a).toHaveBeenCalledTimes(1);
      expect(a).toHaveBeenCalledWith({ codes: ['visitor_count'], camera_id: 'cam-1' });
      expect(b).toHaveBeenCalledWith({ codes: ['visitor_count'], camera_id: 'cam-1' });

      unsubA();
    });

    it('unsubscribe removes listener', () => {
      const fn = jest.fn();
      const unsub = subscribeCountDetectionEvent(fn);
      unsub();

      emitCountDetectionEvent({ codes: ['x'] });
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('applyCountIncrement', () => {
    it('returns null when data is null', () => {
      expect(applyCountIncrement(null, 'visitor_count')).toBeNull();
    });

    it('increments a plain numeric rule key', () => {
      const data: CountDetectionData = { visitor_count: 3 };
      expect(applyCountIncrement(data, 'visitor_count')).toEqual({ visitor_count: 4 });
    });

    it('caps home_return_count current against total', () => {
      const data: CountDetectionData = {
        home_return_count: { current: 4, total: 5 },
      };
      expect(applyCountIncrement(data, 'home_return_count')).toEqual({
        home_return_count: { current: 5, total: 5 },
      });
    });

    it('does not change data when key is missing', () => {
      const data: CountDetectionData = { visitor_count: 1 };
      expect(applyCountIncrement(data, 'vip_customer_detection')).toEqual(data);
    });

    it('attendance_checkin bumps checkin when attendance is subcounts', () => {
      const data: CountDetectionData = {
        attendance: { checkin: 2, checkout: 1 },
      };
      expect(applyCountIncrement(data, 'attendance_checkin')).toEqual({
        attendance: { checkin: 3, checkout: 1 },
      });
    });

    it('attendance_checkout bumps checkout when attendance is subcounts', () => {
      const data: CountDetectionData = {
        attendance: { checkin: 1, checkout: 0 },
      };
      expect(applyCountIncrement(data, 'attendance_checkout')).toEqual({
        attendance: { checkin: 1, checkout: 1 },
      });
    });

    it('attendance_checkin when attendance is number creates subcounts from number', () => {
      const data: CountDetectionData = { attendance: 5 };
      expect(applyCountIncrement(data, 'attendance_checkin')).toEqual({
        attendance: { checkin: 6, checkout: 0 },
      });
    });

    it('attendance_checkout when attendance is number', () => {
      const data: CountDetectionData = { attendance: 5 };
      expect(applyCountIncrement(data, 'attendance_checkout')).toEqual({
        attendance: { checkin: 5, checkout: 1 },
      });
    });

    it('attendance increments checkin for subcounts', () => {
      const data: CountDetectionData = {
        attendance: { checkin: 1, checkout: 2 },
      };
      expect(applyCountIncrement(data, 'attendance')).toEqual({
        attendance: { checkin: 2, checkout: 2 },
      });
    });

    it('attendance when attendance is number increases checkin', () => {
      const data: CountDetectionData = { attendance: 10 };
      expect(applyCountIncrement(data, 'attendance')).toEqual({
        attendance: { checkin: 11, checkout: 0 },
      });
    });

    it('attendance when attendance key missing initializes checkin', () => {
      const data: CountDetectionData = { people_count_ws_url: 'wss://x' };
      expect(applyCountIncrement(data, 'attendance')).toEqual({
        people_count_ws_url: 'wss://x',
        attendance: { checkin: 1, checkout: 0 },
      });
    });

    it('attendance returns data unchanged when attendance present but not subcounts nor number', () => {
      const data = { attendance: 'bad' } as unknown as CountDetectionData;
      expect(applyCountIncrement(data, 'attendance')).toBe(data);
    });
  });

  describe('applyCountIncrements', () => {
    it('returns data unchanged when codes is empty', () => {
      const data: CountDetectionData = { visitor_count: 1 };
      expect(applyCountIncrements(data, [])).toEqual(data);
    });

    it('applies increments in order', () => {
      const data: CountDetectionData = { visitor_count: 0, vip_customer_detection: 0 };
      const result = applyCountIncrements(data, ['visitor_count', 'vip_customer_detection']);
      expect(result).toEqual({ visitor_count: 1, vip_customer_detection: 1 });
    });

    it('returns null when starting from null and codes non-empty', () => {
      expect(applyCountIncrements(null, ['visitor_count'])).toBeNull();
    });
  });
});
