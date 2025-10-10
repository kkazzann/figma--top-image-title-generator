import React from "react";
import styles from "../styles.module.scss";

interface FormFieldProps {
  label: string;
  type: "text" | "color" | "select";
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  style?: React.CSSProperties;
  labelOnTop?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  type,
  value,
  onChange,
  options = [],
  style,
  labelOnTop = false,
}) => {
  const renderInput = () => {
    switch (type) {
      case "text":
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={style}
          />
        );
      case "color":
        return (
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case "select":
        return (
          <select value={value} onChange={(e) => onChange(e.target.value)}>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
    }
  };

  return (
    <div className={styles.settingsItem}>
      <label className={labelOnTop ? styles.moveLabel : ""}>{label}</label>
      {renderInput()}
    </div>
  );
};

export default FormField;
