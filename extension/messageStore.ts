// extension/messageStore.ts

import type { CapturedMessage } from './messageCapture';

let lastCaptured: CapturedMessage | null = null;

export function storeCapturedMessage(msg: CapturedMessage) {
  lastCaptured = msg;
}

export function getLastCapturedMessage() {
  return lastCaptured;
}

export function clearCapturedMessage() {
  lastCaptured = null;
}
