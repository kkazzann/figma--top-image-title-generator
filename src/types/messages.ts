import { FormSettings } from "../config/defaultFormSettings";

export interface UiMessageBase {
  type: string;
  message?: string;
  [key: string]: any;
}

export interface CreateFramesMessage {
  type: "CREATE_FRAMES";
  data: Record<string, string[]>; // countryCode -> [line1, line2]
  settings: FormSettings;
  pageName: string;
}

export interface SaveSettingsMessage {
  type: "SAVE_SETTINGS";
  settings: FormSettings;
}

export interface LoadSettingsMessage {
  type: "LOAD_SETTINGS";
}

export interface ClearStorageMessage {
  type: "CLEAR_STORAGE";
}

export type IncomingMessage =
  | CreateFramesMessage
  | SaveSettingsMessage
  | LoadSettingsMessage
  | ClearStorageMessage;
