import { execSync, spawn, ChildProcess } from 'child_process';

export interface WebcamSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  gain: number;
  autoExposure: boolean;
  autoFocus: boolean;
  autoWhiteBalance: boolean;
  powerLineFrequency: number;
  exposureValue: number;
  focusValue: number;
  whiteBalanceValue: number;
}

export interface VideoFormat {
  width: number;
  height: number;
  pixelFormat: string;
  frameRate: number;
}

export class WebcamController {
  private device: string;

  constructor(device: string = '/dev/video0') {
    this.device = device;
  }

  checkDevice(): boolean {
    try {
      execSync(`test -e ${this.device}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  checkDependencies(): string[] {
    const missing: string[] = [];
    try {
      execSync('which v4l2-ctl', { stdio: 'ignore' });
    } catch {
      missing.push('v4l-utils');
    }
    return missing;
  }

  getCurrentSettings(): WebcamSettings {
    const getControl = (control: string): number => {
      try {
        const result = execSync(`v4l2-ctl -d ${this.device} --get-ctrl=${control}`, { encoding: 'utf8' });
        return parseInt(result.split(' ')[1]) || 0;
      } catch {
        return 0;
      }
    };

    return {
      brightness: getControl('brightness') || 128,
      contrast: getControl('contrast') || 128,
      saturation: getControl('saturation') || 128,
      sharpness: getControl('sharpness') || 128,
      gain: getControl('gain') || 0,
      autoExposure: getControl('auto_exposure') === 3,
      autoFocus: getControl('focus_automatic_continuous') === 1,
      autoWhiteBalance: getControl('white_balance_automatic') === 1,
      powerLineFrequency: getControl('power_line_frequency') || 2,
      exposureValue: getControl('exposure_time_absolute') || 250,
      focusValue: getControl('focus_absolute') || 0,
      whiteBalanceValue: getControl('white_balance_temperature') || 4000
    };
  }

  getCurrentVideoFormat(): VideoFormat {
    try {
      const result = execSync(`v4l2-ctl -d ${this.device} --get-fmt-video`, { encoding: 'utf8' });
      const widthHeight = result.match(/Width\/Height\s*:\s*(\d+)\/(\d+)/);
      const pixelFormat = result.match(/Pixel Format\s*:\s*'([^']+)'/);

      const parmResult = execSync(`v4l2-ctl -d ${this.device} --get-parm`, { encoding: 'utf8' });
      const frameRate = parmResult.match(/Frames per second:\s*([0-9.]+)/);

      return {
        width: widthHeight ? parseInt(widthHeight[1]) : 640,
        height: widthHeight ? parseInt(widthHeight[2]) : 480,
        pixelFormat: pixelFormat ? pixelFormat[1] : 'YUYV',
        frameRate: frameRate ? parseFloat(frameRate[1]) : 30
      };
    } catch {
      return { width: 640, height: 480, pixelFormat: 'YUYV', frameRate: 30 };
    }
  }

  setControl(control: string, value: number): boolean {
    try {
      execSync(`v4l2-ctl -d ${this.device} --set-ctrl=${control}=${value}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  setBrightness(value: number): boolean {
    return this.setControl('brightness', Math.max(0, Math.min(255, value)));
  }

  setContrast(value: number): boolean {
    return this.setControl('contrast', Math.max(0, Math.min(255, value)));
  }

  setSaturation(value: number): boolean {
    return this.setControl('saturation', Math.max(0, Math.min(255, value)));
  }

  setSharpness(value: number): boolean {
    return this.setControl('sharpness', Math.max(0, Math.min(255, value)));
  }

  setGain(value: number): boolean {
    return this.setControl('gain', Math.max(0, Math.min(255, value)));
  }

  setAutoExposure(enabled: boolean): boolean {
    return this.setControl('auto_exposure', enabled ? 3 : 1);
  }

  setAutoFocus(enabled: boolean): boolean {
    return this.setControl('focus_automatic_continuous', enabled ? 1 : 0);
  }

  setAutoWhiteBalance(enabled: boolean): boolean {
    return this.setControl('white_balance_automatic', enabled ? 1 : 0);
  }

  setPowerLineFrequency(frequency: number): boolean {
    return this.setControl('power_line_frequency', Math.max(0, Math.min(2, frequency)));
  }

  setExposureValue(value: number): boolean {
    return this.setControl('exposure_time_absolute', Math.max(3, Math.min(2047, value)));
  }

  setFocusValue(value: number): boolean {
    return this.setControl('focus_absolute', Math.max(0, Math.min(250, value)));
  }

  setWhiteBalanceValue(value: number): boolean {
    return this.setControl('white_balance_temperature', Math.max(2000, Math.min(6500, value)));
  }

  setVideoFormat(width: number, height: number, pixelFormat: string): { success: boolean; error?: string } {
    try {
      execSync(`v4l2-ctl -d ${this.device} --set-fmt-video=width=${width},height=${height},pixelformat=${pixelFormat}`, { stdio: 'ignore' });
      return { success: true };
    } catch (error: any) {
      const errorMsg = error.stderr?.toString() || error.message || '';
      if (errorMsg.includes('Device or resource busy')) {
        return { success: false, error: 'DEVICE_BUSY' };
      }
      return { success: false, error: 'UNKNOWN' };
    }
  }

  setFrameRate(fps: number): { success: boolean; error?: string } {
    try {
      execSync(`v4l2-ctl -d ${this.device} --set-parm=${fps}`, { stdio: 'ignore' });
      return { success: true };
    } catch (error: any) {
      const errorMsg = error.stderr?.toString() || error.message || '';
      if (errorMsg.includes('Device or resource busy')) {
        return { success: false, error: 'DEVICE_BUSY' };
      }
      return { success: false, error: 'UNKNOWN' };
    }
  }

  applyOptimalSettings(): { success: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Set optimal video format
      const formatResult = this.setVideoFormat(1920, 1080, 'MJPG');
      if (!formatResult.success) {
        if (formatResult.error === 'DEVICE_BUSY') {
          errors.push('Cannot change video format: camera is in use by another application');
        } else {
          errors.push('Failed to set video format');
        }
      }

      const frameRateResult = this.setFrameRate(30);
      if (!frameRateResult.success) {
        if (frameRateResult.error === 'DEVICE_BUSY') {
          errors.push('Cannot change frame rate: camera is in use by another application');
        } else {
          errors.push('Failed to set frame rate');
        }
      }

      // Set optimal controls (these usually work even when device is busy)
      this.setAutoExposure(true);
      this.setAutoFocus(true);
      this.setAutoWhiteBalance(true);
      this.setPowerLineFrequency(2); // 60Hz
      this.setSaturation(128);
      this.setSharpness(128);
      this.setBrightness(128);
      this.setContrast(128);

      return { success: errors.length === 0, errors };
    } catch (error) {
      errors.push('Unexpected error during optimization');
      return { success: false, errors };
    }
  }

  resetToDefaults(): { success: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Reset video format
      const formatResult = this.setVideoFormat(640, 480, 'YUYV');
      if (!formatResult.success) {
        if (formatResult.error === 'DEVICE_BUSY') {
          errors.push('Cannot reset video format: camera is in use by another application');
        } else {
          errors.push('Failed to reset video format');
        }
      }

      const frameRateResult = this.setFrameRate(30);
      if (!frameRateResult.success) {
        if (frameRateResult.error === 'DEVICE_BUSY') {
          errors.push('Cannot reset frame rate: camera is in use by another application');
        } else {
          errors.push('Failed to reset frame rate');
        }
      }

      // Reset all controls to defaults (these usually work even when device is busy)
      this.setBrightness(128);
      this.setContrast(128);
      this.setSaturation(128);
      this.setSharpness(128);
      this.setGain(0);
      this.setAutoExposure(false); // Manual mode
      this.setAutoFocus(false);
      this.setAutoWhiteBalance(true);
      this.setPowerLineFrequency(1); // 50Hz
      this.setControl('backlight_compensation', 0);

      return { success: errors.length === 0, errors };
    } catch (error) {
      errors.push('Unexpected error during reset');
      return { success: false, errors };
    }
  }

  checkDeviceBusy(): boolean {
    try {
      // Try a harmless operation to see if device is busy
      execSync(`v4l2-ctl -d ${this.device} --get-fmt-video`, { stdio: 'ignore' });
      return false; // Not busy
    } catch (error: any) {
      const errorMsg = error.stderr?.toString() || error.message || '';
      return errorMsg.includes('Device or resource busy');
    }
  }

  getDeviceStatus(): { available: boolean; inUse: boolean; error?: string } {
    try {
      execSync(`v4l2-ctl -d ${this.device} --get-fmt-video`, { stdio: 'ignore' });
      return { available: true, inUse: false };
    } catch (error: any) {
      const errorMsg = error.stderr?.toString() || error.message || '';
      if (errorMsg.includes('Device or resource busy')) {
        return { available: true, inUse: true };
      } else if (errorMsg.includes('No such file or directory')) {
        return { available: false, inUse: false, error: 'Device not found' };
      }
      return { available: false, inUse: false, error: 'Unknown error' };
    }
  }

  getDetailedInfo(): string {
    try {
      const fmt = execSync(`v4l2-ctl -d ${this.device} --get-fmt-video`, { encoding: 'utf8' });
      const parm = execSync(`v4l2-ctl -d ${this.device} --get-parm`, { encoding: 'utf8' });
      const controls = execSync(`v4l2-ctl -d ${this.device} --list-ctrls`, { encoding: 'utf8' });

      return `Video Format:\n${fmt}\nFrame Rate:\n${parm}\nAll Controls:\n${controls}`;
    } catch {
      return 'Unable to retrieve detailed information';
    }
  }
}
