// __tests__/utils/crashReporter.test.ts
import CrashReporter from '../../src/utils/crashReporter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));
jest.mock('react-native-device-info', () => ({
  getModel: jest.fn(() => 'iPhone 13'),
  getSystemVersion: jest.fn(() => '16.0'),
}));
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

describe('CrashReporter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('should not throw if DeviceInfo fails', async () => {
    const originalLog = console.log;
    console.log = jest.fn(); // Silence logs

    (DeviceInfo.getModel as jest.Mock).mockImplementation(() => {
      throw new Error('fail');
    });
    (DeviceInfo.getSystemVersion as jest.Mock).mockImplementation(() => {
      throw new Error('fail');
    });
    const error = new Error('DeviceInfo fail');
    await CrashReporter.reportCrash(error);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
    const saved = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
    expect(saved[0].device.model).toBe('unknown');
    expect(saved[0].device.version).toBe('unknown');

    console.log = originalLog; // Restore log
  });

  it('should clear reports', async () => {
    await CrashReporter.clearReports();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@crash_reports');
  });

  it('should get report count', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([{}, {}]));
    const count = await CrashReporter.getReportCount();
    expect(count).toBe(2);
  });

  it('should get last report', async () => {
    const report = { id: '1', error: {}, device: {}, timestamp: 1 };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([report]));
    const last = await CrashReporter.getLastReport();
    expect(last).toEqual(report);
  });

  it('should return null if no last report', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const last = await CrashReporter.getLastReport();
    expect(last).toBeNull();
  });

  it('should handle sendPendingReports with no reports', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));
    await CrashReporter.sendPendingReports();
    expect(AsyncStorage.getItem).toHaveBeenCalled();
  });
});
