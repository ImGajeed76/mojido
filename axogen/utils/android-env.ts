import * as fs from "fs";
import * as path from "path";

const ANDROID_HOME_PATHS = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  path.join(process.env.HOME || "", "Android/Sdk"),
  "/opt/android-sdk",
];

const NDK_VERSION = "27.0.12077973";

export async function ensureAndroidEnv(): Promise<void> {
  // Check ANDROID_HOME
  let androidHome = process.env.ANDROID_HOME;

  if (!androidHome) {
    // Try to find it
    for (const candidate of ANDROID_HOME_PATHS) {
      if (candidate && fs.existsSync(candidate)) {
        androidHome = candidate;
        process.env.ANDROID_HOME = androidHome;
        console.log(`Found Android SDK at: ${androidHome}`);
        break;
      }
    }
  }

  if (!androidHome || !fs.existsSync(androidHome)) {
    throw new Error(
      `ANDROID_HOME not set and Android SDK not found.\n` +
        `Please install Android SDK and set ANDROID_HOME environment variable.\n` +
        `See: https://tauri.app/start/prerequisites/#android`
    );
  }

  // Check NDK_HOME
  let ndkHome = process.env.NDK_HOME;

  if (!ndkHome) {
    // Try to find it
    const ndkPath = path.join(androidHome, "ndk", NDK_VERSION);
    if (fs.existsSync(ndkPath)) {
      ndkHome = ndkPath;
      process.env.NDK_HOME = ndkHome;
      console.log(`Found Android NDK at: ${ndkHome}`);
    } else {
      // Check for any NDK version
      const ndkDir = path.join(androidHome, "ndk");
      if (fs.existsSync(ndkDir)) {
        const versions = fs.readdirSync(ndkDir);
        if (versions.length > 0) {
          ndkHome = path.join(ndkDir, versions[0]);
          process.env.NDK_HOME = ndkHome;
          console.log(`Found Android NDK at: ${ndkHome}`);
        }
      }
    }
  }

  if (!ndkHome || !fs.existsSync(ndkHome)) {
    throw new Error(
      `NDK_HOME not set and Android NDK not found.\n` +
        `Please install Android NDK via: sdkmanager "ndk;${NDK_VERSION}"\n` +
        `See: https://tauri.app/start/prerequisites/#android`
    );
  }

  console.log(`Android environment OK:`);
  console.log(`  ANDROID_HOME: ${androidHome}`);
  console.log(`  NDK_HOME: ${ndkHome}`);
}
