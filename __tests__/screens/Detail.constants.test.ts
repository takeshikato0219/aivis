import {
  enterpriseAttendanceCodesFromFcmValue,
  getRuleCodesFromFcmData,
} from '@/screens/Detail/Detail.constants';

describe('Detail.constants FCM helpers', () => {
  describe('enterpriseAttendanceCodesFromFcmValue', () => {
    it('parses JSON string with double quotes', () => {
      expect(enterpriseAttendanceCodesFromFcmValue('{"in":1}')).toEqual([
        'enterprise_attendance_in',
      ]);
      expect(enterpriseAttendanceCodesFromFcmValue('{"out":1}')).toEqual([
        'enterprise_attendance_out',
      ]);
    });

    it('parses Python-style repr string with single quotes (FCM)', () => {
      expect(enterpriseAttendanceCodesFromFcmValue("{'in': 1}")).toEqual([
        'enterprise_attendance_in',
      ]);
      expect(enterpriseAttendanceCodesFromFcmValue("{'out': 1}")).toEqual([
        'enterprise_attendance_out',
      ]);
    });
  });

  describe('getRuleCodesFromFcmData', () => {
    it('maps enterprise_attendance Python repr to increment codes', () => {
      expect(
        getRuleCodesFromFcmData({
          enterprise_attendance: "{'in': 1}",
        })
      ).toEqual(['enterprise_attendance_in']);
    });
  });
});
