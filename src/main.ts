import { FormSettings } from "./config/defaultFormSettings";
import { formSettingsSchema } from "./config/formSettingsSchema";
import { handleFrameCreation } from "./frameCreation";
import { IncomingMessage } from "./types/messages";
import {
  sendType,
  handleError,
  saveSettings,
  loadSettings,
  clearSettings,
} from "./utils/pluginMessaging";

export default function () {
  figma.showUI(__html__, { width: 600, height: 600, themeColors: true });

  // slight delay until ui is ready - buggy
  setTimeout(
    () => loadSettings().catch((e) => handleError("loading settings", e)),
    80
  );

  figma.ui.onmessage = async (message: IncomingMessage) => {
    switch (message.type) {
      case "CREATE_FRAMES":
        try {
          const parsed = formSettingsSchema.safeParse(message.settings);
          if (!parsed.success) {
            sendType("ERROR", {
              message:
                "Invalid settings: " +
                parsed.error.errors.map((e) => e.message).join(", "),
            });
            break;
          }
          await handleFrameCreation(
            message.data,
            parsed.data as FormSettings,
            message.pageName
          );
        } catch (e) {
          handleError("creating frames", e);
        }
        break;
      case "SAVE_SETTINGS":
        try {
          const parsed = formSettingsSchema.safeParse(message.settings);
          if (!parsed.success) {
            sendType("ERROR", {
              message:
                "Invalid settings: " +
                parsed.error.errors.map((e) => e.message).join(", "),
            });
            break;
          }
          await saveSettings(parsed.data as FormSettings);
        } catch (e) {
          handleError("saving settings", e);
        }
        break;
      case "LOAD_SETTINGS":
        try {
          await loadSettings();
        } catch (e) {
          handleError("loading settings", e);
        }
        break;
      case "CLEAR_STORAGE":
        try {
          await clearSettings();
        } catch (e) {
          handleError("clearing storage", e);
        }
        break;
      default:
        console.warn("Unknown message type:", (message as any).type);
        break;
    }
  };
}
