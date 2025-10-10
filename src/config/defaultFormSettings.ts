export type FormSettings = {
  spreadsheetTab: string;
  dataRange: string;
  primaryFontSize: string;
  primaryLineHeight: string;
  primaryFontWeight: string;
  secondaryFontSize: string;
  secondaryLineHeight: string;
  secondaryFontWeight: string;
  backgroundColor: string;
  textColor: string;
  highlightKeywords: string;
  keywordFontSize: string;
  keywordLineHeight: string;
  keywordFontWeight: string;
};

export const defaultFormSettings: FormSettings = {
  spreadsheetTab: "",
  dataRange: "",
  primaryFontSize: "",
  primaryLineHeight: "",
  primaryFontWeight: "Regular",
  secondaryFontSize: "",
  secondaryLineHeight: "",
  secondaryFontWeight: "Regular",
  backgroundColor: "#750000",
  textColor: "#ffffff",
  highlightKeywords: "",
  keywordFontSize: "",
  keywordLineHeight: "",
  keywordFontWeight: "Regular",
};
