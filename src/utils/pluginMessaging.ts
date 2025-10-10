import { MESSAGES } from "../config/messages";
import { FormSettings } from "../config/defaultFormSettings";
import { UiMessageBase } from "../types/messages";

export const STORAGE_KEY = "formSettings";

export const send = (msg: UiMessageBase) => figma.ui.postMessage(msg);

export const sendType = (type: string, extra: Record<string, any> = {}) =>
  send({ type, ...extra });

export const handleError = (context: string, error: unknown) => {
  console.error(`Error ${context}:`, error);
  sendType("ERROR", {
    message: `Error ${context}: ${
      error instanceof Error ? error.message : String(error)
    }`,
  });
};

export const saveSettings = async (settings: FormSettings) => {
  await figma.clientStorage.setAsync(STORAGE_KEY, settings);
  sendType("SETTINGS_SAVED", { message: MESSAGES.STORAGE.SETTINGS_SAVED });
};

export const loadSettings = async () => {
  const saved = (await figma.clientStorage.getAsync(STORAGE_KEY)) as
    | FormSettings
    | undefined;
  if (saved) sendType("SETTINGS_LOADED", { settings: saved });
};

export const clearSettings = async () => {
  await figma.clientStorage.deleteAsync(STORAGE_KEY);
  sendType("STORAGE_CLEARED", { message: MESSAGES.STORAGE.STORAGE_CLEARED });
};
