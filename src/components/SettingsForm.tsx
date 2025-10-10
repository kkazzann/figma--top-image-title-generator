import React from "react";
import FormField from "./FormField";
import Button from "./Button";
import styles from "../styles.module.scss";
import { FONT_WEIGHTS } from "../config/typography";
import { FormSettings } from "../config/defaultFormSettings";

interface SettingsFormProps {
  formSettings: FormSettings;
  onChange: (field: string, value: string) => void;
  onGenerate: () => void;
  onClearStorage: () => void;
  isLoading: boolean;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({
  formSettings,
  onChange,
  onGenerate,
  onClearStorage,
  isLoading,
}) => {
  return (
    <>
      <div className={styles.basicSettings}>
        <div className={styles.sheet}>
          <FormField
            label="Tab name"
            type="text"
            value={formSettings.spreadsheetTab}
            onChange={(value) => onChange("spreadsheetTab", value)}
            labelOnTop={!!formSettings.spreadsheetTab}
          />
          <FormField
            label="Range"
            type="text"
            value={formSettings.dataRange}
            onChange={(value) => onChange("dataRange", value)}
            style={{ width: "64px" }}
            labelOnTop={!!formSettings.dataRange}
          />
        </div>
        <div className={styles.colors}>
          <FormField
            label="Background"
            type="color"
            value={formSettings.backgroundColor}
            onChange={(value) => onChange("backgroundColor", value)}
          />
          <FormField
            label="Color"
            type="color"
            value={formSettings.textColor}
            onChange={(value) => onChange("textColor", value)}
          />
        </div>
      </div>

      <div className={styles.linesSettings}>
        <div className={styles.firstLine}>
          <FormField
            label="Size"
            type="text"
            value={formSettings.primaryFontSize}
            onChange={(value) => onChange("primaryFontSize", value)}
            labelOnTop={!!formSettings.primaryFontSize}
          />
          <FormField
            label="Line height"
            type="text"
            value={formSettings.primaryLineHeight}
            onChange={(value) => onChange("primaryLineHeight", value)}
            labelOnTop={!!formSettings.primaryLineHeight}
          />
          <FormField
            label="Weight"
            type="select"
            value={formSettings.primaryFontWeight}
            onChange={(value) => onChange("primaryFontWeight", value)}
            options={FONT_WEIGHTS as unknown as string[]}
          />
        </div>

        <div className={styles.secondLine}>
          <FormField
            label="Size (line 2)"
            type="text"
            value={formSettings.secondaryFontSize}
            onChange={(value) => onChange("secondaryFontSize", value)}
            labelOnTop={!!formSettings.secondaryFontSize}
          />
          <FormField
            label="Line height (line 2)"
            type="text"
            value={formSettings.secondaryLineHeight}
            onChange={(value) => onChange("secondaryLineHeight", value)}
            labelOnTop={!!formSettings.secondaryLineHeight}
          />
          <FormField
            label="Weight (line 2)"
            type="select"
            value={formSettings.secondaryFontWeight}
            onChange={(value) => onChange("secondaryFontWeight", value)}
            options={FONT_WEIGHTS as unknown as string[]}
          />
        </div>
      </div>

      <div className={styles.keywordSettings}>
        <FormField
          label="Keywords List (comma separated)"
          type="text"
          value={formSettings.highlightKeywords}
          onChange={(value) => onChange("highlightKeywords", value)}
          style={{ width: "90vw" }}
          labelOnTop={!!formSettings.highlightKeywords}
        />
        <FormField
          label="Size"
          type="text"
          value={formSettings.keywordFontSize}
          onChange={(value) => onChange("keywordFontSize", value)}
          labelOnTop={!!formSettings.keywordFontSize}
        />
        <FormField
          label="Line height"
          type="text"
          value={formSettings.keywordLineHeight}
          onChange={(value) => onChange("keywordLineHeight", value)}
          labelOnTop={!!formSettings.keywordLineHeight}
        />
        <FormField
          label="Weight"
          type="select"
          value={formSettings.keywordFontWeight}
          onChange={(value) => onChange("keywordFontWeight", value)}
          options={FONT_WEIGHTS as unknown as string[]}
        />
      </div>

      <div id="actionButtons" className={styles.actionButtons}>
        <Button text="Generate" onClick={onGenerate} disabled={isLoading} />
        <Button
          text="Clear Storage"
          onClick={onClearStorage}
          disabled={isLoading}
        />
      </div>
    </>
  );
};

export default SettingsForm;
