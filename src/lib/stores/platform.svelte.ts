import {platform} from "@tauri-apps/plugin-os";

let isMobile = $state(false);
let isInitialized = $state(false);

export async function initPlatform() {
  if (isInitialized) return;
  try {
    const os = await platform();
    isMobile = os === "android" || os === "ios";
  } catch {
    isMobile = false;
  }
  isInitialized = true;
}

export function getIsMobile() {
  return isMobile;
}

export function getIsInitialized() {
  return isInitialized;
}
