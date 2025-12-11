import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CrashReport {
  id: string;
  timestamp: number;
  error: { message: string; stack?: string; name: string };
  device: { platform: string; model?: string; version?: string };
  context?: any;
}

class CrashReporter {
  private static instance: CrashReporter;
  private readonly STORAGE_KEY = '@crash_reports';
  private maxReports = 10;

  private constructor() {}

  static getInstance(): CrashReporter {
    if (!CrashReporter.instance) {
      CrashReporter.instance = new CrashReporter();
    }
    return CrashReporter.instance;
  }

  // Promise is always handled (resolved/rejected) internally
  async reportCrash(error: Error, context?: any): Promise<void> {
    try {
      // Get device info safely
      let deviceModel = 'unknown';
      let deviceVersion = 'unknown';

      try {
        deviceModel = DeviceInfo.getModel();
      } catch (e) {
        console.log(e);
        // model remains 'unknown'
      }

      try {
        deviceVersion = DeviceInfo.getSystemVersion();
      } catch (e) {
        console.log(e);
        // version remains 'unknown'
      }

      const report: CrashReport = {
        id: `crash_${Date.now()}`,
        timestamp: Date.now(),
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        device: {
          platform: Platform.OS,
          model: deviceModel,
          version: deviceVersion,
        },
        context, // used for additional context, optional
      };

      // Always await, don't return promise to upper scope (no unhandled promise)
      await this.saveCrashReport(report);
    } catch (e) {
      console.error('Failed to report crash:', e);
    }
  }

  private async saveCrashReport(report: CrashReport): Promise<void> {
    try {
      const existingReports = await this.getStoredReports();
      const updatedReports = [report, ...existingReports].slice(0, this.maxReports);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedReports));
    } catch (error) {
      console.error('Failed to save crash report:', error);
    }
  }

  private async getStoredReports(): Promise<CrashReport[]> {
    try {
      const reports = await AsyncStorage.getItem(this.STORAGE_KEY);
      return reports ? JSON.parse(reports) : [];
    } catch (error) {
      console.error('Failed to get stored reports:', error);
      return [];
    }
  }

  async sendPendingReports(): Promise<void> {
    try {
      const reports = await this.getStoredReports();
      if (reports.length === 0) {
        return;
      }
    } catch (error) {
      console.error('Failed to send pending reports:', error);
    }
  }

  async clearReports(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear reports:', error);
    }
  }

  async getReportCount(): Promise<number> {
    try {
      const reports = await this.getStoredReports();
      return reports.length;
    } catch (error) {
      console.error('Failed to get report count:', error);
      return 0;
    }
  }

  async getLastReport(): Promise<CrashReport | null> {
    try {
      const reports = await this.getStoredReports();
      return reports.length > 0 ? reports[0] : null;
    } catch (error) {
      console.error('Failed to get last report:', error);
      return null;
    }
  }
}

export default CrashReporter.getInstance();
