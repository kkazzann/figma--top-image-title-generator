import React, { useState, useEffect } from "react";
import styles from "./styles.module.scss";
import Notification from "./components/Notification";
import { MESSAGES, logMessage } from "./config/messages";
import { useNotificationLog } from "./hooks/useNotificationLog";
import { defaultFormSettings } from "./config/defaultFormSettings";
import SettingsForm from "./components/SettingsForm";

const App: React.FC = () => {
  const [formSettings, setFormSettings] = useState(defaultFormSettings);
  const [isLoading, setIsLoading] = useState(false);
  const {
    notification,
    logHistory,
    addToLogHistory,
    showNotification,
    hideNotification,
    showTemporaryNotification,
    clearLog,
    setNotification,
  } = useNotificationLog();

  const handleInputChange = (field: string, value: string) => {
    const updated = { ...formSettings, [field]: value };

    setFormSettings(updated);

    window.parent.postMessage(
      { pluginMessage: { type: "SAVE_SETTINGS", settings: updated } },
      "*"
    );
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data.pluginMessage;

      if (!message) return;
      if ((window as any).__figmaMessageTimeout) {
        clearTimeout((window as any).__figmaMessageTimeout);
        delete (window as any).__figmaMessageTimeout;
      }

      switch (message.type) {
        case "MISSING_TAB_NAME":
          showNotification(message.message, "error", false, true, false);
          break;

        case "PAGE_CREATED":
        case "PAGE_SWITCHED":
          showNotification(message.message, "info", false, false, true);
          break;

        case "FRAME_PROCESSING_STARTED":
          logMessage.frameProcessingStarted(message.message);
          showNotification(message.message, "working", true, false);
          break;

        case "COUNTRY_PROCESSING":
          logMessage.countryProcessing(message.message);
          setNotification((prev) => ({
            ...prev,
            text: message.message,
            type: "working",
            disableClose: true,
            isVisible: true,
          }));
          break;

        case "MISSING_TRANSLATION":
          logMessage.missingTranslation(message.message);
          addToLogHistory(message.message, "error");
          break;

        case "FRAME_CREATED":
          logMessage.frameCreated(message.message);
          break;

        case "FRAME_UNCHANGED":
          logMessage.frameCreated(message.message);
          addToLogHistory(message.message, "info");
          break;

        case "FRAMES_CREATED":
          logMessage.processingSuccess(message.message);
          setIsLoading(false);
          if (message.missingTranslations?.length) {
            message.missingTranslations.forEach((country: string) =>
              addToLogHistory(
                `Created placeholder frame for ${country} - translations missing`,
                "error"
              )
            );
          }
          if (
            typeof message.framesUpdated === "number" ||
            typeof message.framesSkipped === "number"
          ) {
            const parts: string[] = [];

            if (message.framesUpdated)
              parts.push(`updated: ${message.framesUpdated}`);

            if (message.framesSkipped)
              parts.push(`unchanged: ${message.framesSkipped}`);

            if (parts.length)
              addToLogHistory(`Summary: ${parts.join(", ")}`, "info");
          }
          setNotification((prev) => ({
            ...prev,
            text: message.message,
            type: "success",
            disableClose: false,
            isVisible: true,
          }));
          break;

        case "SETTINGS_LOADED":
          if (message.settings) {
            logMessage.settingsLoaded(message.settings);
            setFormSettings(message.settings);
          }
          break;

        case "SETTINGS_SAVED":
          logMessage.settingsSaved(message.message);
          break;

        case "STORAGE_CLEARED":
          logMessage.storageCleared(message.message);
          setFormSettings(defaultFormSettings);
          showTemporaryNotification(
            MESSAGES.STORAGE.STORAGE_CLEARED,
            "success",
            1000
          );
          break;

        case "ERROR":
          logMessage.errorFromMain(message.message);
          setIsLoading(false);
          showNotification(
            MESSAGES.ERRORS.GENERAL_ERROR(message.message),
            "error",
            false,
            true
          );
          break;

        default:
          break;
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [
    addToLogHistory,
    showNotification,
    showTemporaryNotification,
    setNotification,
  ]);

  const handleGenerate = async () => {
    const { dataRange, spreadsheetTab } = formSettings;
    if (!spreadsheetTab.trim()) {
      showNotification(
        MESSAGES.VALIDATION.MISSING_TAB_NAME,
        "error",
        false,
        true,
        false
      );
      return;
    }
    if (!dataRange.trim()) {
      showNotification(
        MESSAGES.VALIDATION.MISSING_RANGE,
        "error",
        false,
        true,
        false
      );
      return;
    }
    
    let year = spreadsheetTab.split("::")[0];
    let spreadsheet = spreadsheetTab.split("::")[1];
    
    setIsLoading(true);
    clearLog();
    showNotification(MESSAGES.PROCESS.FETCHING_DATA, "working", true, false);
    
    try {
      // Build request URL from env to avoid hardcoding the base
      const baseUrl = import.meta.env.VITE_DYNAMIC_BASE_URL;
      const url = `${baseUrl}${year}/${spreadsheet}/${dataRange}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          skip_zrok_interstitial: "1",
          Origin: "https://figma.com",
          "User-Agent": "Figma-Plugin",
        },
      });

      if (!res.ok) {
        let errorMessage = `Failed to fetch data (${res.status})`;
        throw new Error(errorMessage);
      }

      const json = await res.json();

      if (!json.data || Object.keys(json.data).length === 0) {
        throw new Error(
          MESSAGES.ERRORS.NO_DATA_FOUND(dataRange, spreadsheetTab)
        );
      }

      showNotification(MESSAGES.PROCESS.DATA_FETCHED, "working", true, false);

      window.parent.postMessage(
        {
          pluginMessage: {
            type: "CREATE_FRAMES",
            data: json.data,
            settings: formSettings,
            pageName: "Top Image Title",
          },
        },
        "*"
      );
    } catch (error) {
      logMessage.generateError(error);
      setIsLoading(false);

      let message = "Unknown error occurred";

      if (error instanceof Error) message = error.message;
      else if (typeof error === "string") message = error;

      showNotification(message, "error", false, true, false);
    }
  };

  const handleClearStorage = () => {
    window.parent.postMessage(
      { pluginMessage: { type: "CLEAR_STORAGE" } },
      "*"
    );
  };

  const handleRecacheSheet = async () => {
    const { spreadsheetTab } = formSettings;
    if (!spreadsheetTab.trim()) {
      showNotification(
        MESSAGES.VALIDATION.MISSING_TAB_NAME,
        "error",
        false,
        true,
        false
      );
      return;
    }

    setIsLoading(true);
    showNotification("Recaching sheet data...", "working", true, false);

    
    let year = spreadsheetTab.split("::")[0];
    let spreadsheet = spreadsheetTab.split("::")[1];
    
    try {
      const baseUrl = import.meta.env.VITE_DYNAMIC_BASE_URL;
      const url = `${baseUrl}${year}/${spreadsheet}/force-refresh`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          skip_zrok_interstitial: "1",
          Origin: "https://figma.com",
          "User-Agent": "Figma-Plugin",
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to recache sheet (${res.status})`);
      }

      const json = await res.json();
      setIsLoading(false);

      const message = json.message || "Sheet recached successfully!";
      const isError = message.toLowerCase().includes("error");
      showNotification(message, isError ? "error" : "success", false, true, false);
    } catch (error) {
      setIsLoading(false);
      let message = "Failed to recache sheet";
      if (error instanceof Error) message = error.message;
      else if (typeof error === "string") message = error;
      showNotification(message, "error", false, true, false);
    }
  };

  return (
    <div className={styles.container}>
      <SettingsForm
        formSettings={formSettings}
        onChange={handleInputChange}
        onGenerate={handleGenerate}
        onClearStorage={handleClearStorage}
        onRecacheSheet={handleRecacheSheet}
        isLoading={isLoading}
      />
      {(notification.text || notification.isClosing) && (
        <Notification
          text={notification.text}
          type={notification.type}
          onClose={hideNotification}
          disableClose={notification.disableClose}
          isClosing={notification.isClosing}
          isRevealing={notification.isRevealing}
          hasRevealed={notification.hasRevealed}
          logHistory={logHistory}
        />
      )}
    </div>
  );
};

export default App;
