// Device Security & Workplace Verification Utility

export interface DeviceAuthResult {
  success: boolean;
  message: string;
  deviceId?: string;
}

/**
 * Check if the current browser/device supports WebAuthn / Platform Authenticator
 */
export async function isDeviceAuthAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return true;
  } catch {
    return false;
  }
}
