export function shouldUseMobileAssets({ coarsePointer = false, touchPoints = 0, screenWidth = 1920, deviceMemory = 8, saveData = false } = {}) {
  return coarsePointer || (touchPoints > 0 && screenWidth <= 1366) || deviceMemory <= 4 || saveData
}
