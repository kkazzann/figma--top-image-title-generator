import { MESSAGES } from "./config/messages";
import { FormSettings } from "./config/defaultFormSettings";

const solidPaint = figma.util.solidPaint;

const post = (type: string, extra: Record<string, any> = {}) =>
  figma.ui.postMessage({ type, ...extra });

const hasText = (value: string) => !!value && value.trim().length > 0;

const asInt = (raw: string | undefined, fallback: number) => {
  const n = parseInt(String(raw ?? "").trim(), 10);
  return Number.isFinite(n) ? n : fallback;
};

const ensureFont = async (family: string, style: string) => {
  const font: FontName = { family, style };
  await figma.loadFontAsync(font);
  return font;
};

const buildTextNode = async ({
  content,
  baseFont,
  keywordFont,
  fontSize,
  keywordFontSize,
  lineHeight,
  keywordLineHeight,
  fill,
  keywords,
}: {
  content: string;
  baseFont: FontName;
  keywordFont: FontName;
  fontSize: number;
  keywordFontSize: number;
  lineHeight: { value: number; unit: "PIXELS" | "PERCENT" };
  keywordLineHeight?: { value: number; unit: "PIXELS" | "PERCENT" };
  fill: string;
  keywords: string;
}) => {
  const node = figma.createText();
  await ensureFont(baseFont.family, baseFont.style);
  if (keywordFont && keywordFont !== baseFont) {
    await ensureFont(keywordFont.family, keywordFont.style);
  }
  node.fontName = baseFont;
  node.fontSize = fontSize;
  node.characters = content;
  node.textAlignHorizontal = "CENTER";
  node.leadingTrim = "CAP_HEIGHT";
  node.lineHeight = { value: lineHeight.value, unit: "PIXELS" };
  node.fills = [solidPaint(fill)];

  if (keywords) {
    const list = keywords
      .split(",")
      .map((k) => k.toLowerCase().trim())
      .filter(Boolean);
    for (const k of list) {
      if (content.toLowerCase().includes(k)) {
        if (keywordFont && keywordFont !== baseFont)
          node.fontName = keywordFont;
        if (keywordFontSize !== fontSize) node.fontSize = keywordFontSize;
        if (keywordLineHeight) node.lineHeight = keywordLineHeight;
        break;
      }
    }
  }
  return node;
};

// hash of the outcome (text + style settings)
// we use it to detect unchanged frames quickly and skip font loads or node edits
// its faster than normal comparison of all individual settings
// but a little buggy if translations are removed from spreadsheet,
// if something is wrong remove the frames and it will be recreated
const computeSignature = (lines: string[], s: FormSettings) =>
  JSON.stringify([
    lines.map((l) => (l || "").trim()),
    s.primaryFontSize,
    s.primaryLineHeight,
    s.primaryFontWeight,
    s.secondaryFontSize,
    s.secondaryLineHeight,
    s.secondaryFontWeight,
    s.backgroundColor,
    s.textColor,
    s.highlightKeywords,
    s.keywordFontSize,
    s.keywordLineHeight,
    s.keywordFontWeight,
  ]);

export const handleFrameCreation = async (
  data: Record<string, string[]>,
  settings: FormSettings,
  pageName: string
) => {
  const {
    backgroundColor,
    textColor,
    primaryFontSize,
    primaryLineHeight,
    primaryFontWeight,
    secondaryFontSize,
    secondaryLineHeight,
    secondaryFontWeight,
    highlightKeywords,
    keywordFontSize,
    keywordLineHeight,
    keywordFontWeight,
  } = settings;

  const totalCountries = Object.keys(data).length;
  post("FRAME_PROCESSING_STARTED", {
    message: MESSAGES.PROCESS.FRAME_PROCESSING_START(totalCountries),
    totalCount: totalCountries,
  });

  let targetPage = figma.root.children.find((p) => p.name === pageName) as
    | PageNode
    | undefined;
  if (!targetPage) {
    targetPage = figma.createPage();
    targetPage.name = pageName;
    post("PAGE_CREATED", {
      message: MESSAGES.PROCESS.PAGE_CREATED(pageName),
    });
  } else {
    post("PAGE_SWITCHED", {
      message: MESSAGES.PROCESS.PAGE_SWITCHED(pageName),
    });
  }
  await figma.setCurrentPageAsync(targetPage);

  let currentY = 0;
  let processedCount = 0;
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  const missingTranslations: string[] = [];

  for (const countryCode in data) {
    processedCount++;
    const row = data[countryCode];
    const lines = [row[0] || "", row[1] || ""];

    post("COUNTRY_PROCESSING", {
      message: MESSAGES.PROCESS.COUNTRY_PROCESSING(
        countryCode,
        processedCount,
        totalCountries
      ),
      currentCountry: countryCode,
      progress: Math.round((processedCount / totalCountries) * 100),
    });

    const frameName = countryCode.toLowerCase();
    let frame = targetPage.children.find(
      (n) => n.name === frameName && n.type === "FRAME"
    ) as FrameNode | undefined;
    const newSignature = computeSignature(lines, settings); // compute prospective signature for this frame
    const existed = !!frame;
    if (frame) {
      const previousSignature = frame.getPluginData("signature"); // last run's signature
      if (previousSignature === newSignature) {
        // unchanged -> fast skip
        skippedCount++;
        post("FRAME_UNCHANGED", {
          message: MESSAGES.PROCESS.FRAME_UNCHANGED(countryCode),
          country: countryCode,
        });
        currentY = frame.y + frame.height + 128;
        continue;
      }
    } else {
      frame = figma.createFrame();
      frame.name = frameName;
    }

    frame.resize(650, 100);
    frame.layoutMode = "VERTICAL";
    frame.counterAxisSizingMode = "FIXED";
    frame.primaryAxisSizingMode = "AUTO";
    frame.fills = [solidPaint(backgroundColor)];
    frame.itemSpacing = 23;
    frame.paddingTop = 35;
    frame.paddingBottom = 35;
    frame.paddingLeft = 20;
    frame.paddingRight = 20;
    frame.counterAxisAlignItems = "CENTER";
    frame.primaryAxisAlignItems = "CENTER";
    frame.x = 0;
    frame.y = currentY;

    const bothMissing = !hasText(lines[0]) && !hasText(lines[1]);
    if (bothMissing) {
      missingTranslations.push(countryCode);
      post("MISSING_TRANSLATION", {
        message: MESSAGES.PROCESS.MISSING_TRANSLATION(countryCode),
        country: countryCode,
      });

      const mainFont = {
        family: "Poppins",
        style: primaryFontWeight,
      } as FontName;
      const keywordFont = {
        family: "Poppins",
        style: keywordFontWeight || "Regular",
      } as FontName;

      const ln = await buildTextNode({
        content: `${countryCode} translation missing!`,
        baseFont: mainFont,
        keywordFont,
        fontSize: asInt(primaryFontSize, 30),
        keywordFontSize: asInt(keywordFontSize, 20),
        lineHeight: { value: asInt(primaryLineHeight, 36), unit: "PIXELS" },
        keywordLineHeight: keywordLineHeight
          ? { value: asInt(keywordLineHeight, 24), unit: "PIXELS" }
          : undefined,
        fill: textColor,
        keywords: highlightKeywords || "",
      });
      frame.appendChild(ln);
      ln.layoutAlign = "STRETCH";
      ln.layoutSizingHorizontal = "FILL";
    }

    if (!bothMissing) {
      const existingTextNodes = frame.children.filter(
        (c) => c.type === "TEXT"
      ) as TextNode[];
      const desiredLines: { content: string; isPrimary: boolean }[] = [
        { content: lines[0], isPrimary: true },
        { content: lines[1], isPrimary: false },
      ].filter((l) => hasText(l.content));

      if (existingTextNodes.length > desiredLines.length) {
        existingTextNodes.slice(desiredLines.length).forEach((n) => n.remove());
      }

      for (let i = 0; i < desiredLines.length; i++) {
        const { content, isPrimary } = desiredLines[i];

        const currentFontSize = isPrimary ? primaryFontSize : secondaryFontSize;

        const currentLineHeight = isPrimary
          ? primaryLineHeight
          : secondaryLineHeight;

        const currentFontWeight = isPrimary
          ? primaryFontWeight
          : secondaryFontWeight;

        const mainFont = {
          family: "Poppins",
          style: currentFontWeight,
        } as FontName;

        const keywordFont = {
          family: "Poppins",
          style: keywordFontWeight || "Regular",
        } as FontName;

        const maybeExisting = existingTextNodes[i];
        if (maybeExisting) {
          if (maybeExisting.characters !== content) {
            await ensureFont(mainFont.family, mainFont.style);
            maybeExisting.fontName = mainFont;
            maybeExisting.characters = content;
            maybeExisting.fontSize = asInt(currentFontSize, 30);
            maybeExisting.lineHeight = {
              value: asInt(currentLineHeight, 36),
              unit: "PIXELS",
            };
            maybeExisting.fills = [solidPaint(textColor)];
          }
        } else {
          const ln = await buildTextNode({
            content,
            baseFont: mainFont,
            keywordFont,
            fontSize: asInt(currentFontSize, 30),
            keywordFontSize: asInt(keywordFontSize, 20),
            lineHeight: { value: asInt(currentLineHeight, 36), unit: "PIXELS" },
            keywordLineHeight: keywordLineHeight
              ? { value: asInt(keywordLineHeight, 24), unit: "PIXELS" }
              : undefined,
            fill: textColor,
            keywords: highlightKeywords || "",
          });
          frame.appendChild(ln);
          ln.layoutAlign = "STRETCH";
          ln.layoutSizingHorizontal = "FILL";
        }
      }
    }

    // persist latest signature for next run comparison
    frame.setPluginData("signature", newSignature);

    targetPage.appendChild(frame);
    if (existed) {
      updatedCount++;
      post("FRAME_CREATED", {
        message: MESSAGES.PROCESS.FRAME_UPDATED(countryCode),
        country: countryCode,
      });
    } else {
      createdCount++;
      post("FRAME_CREATED", {
        message: MESSAGES.PROCESS.FRAME_CREATED(countryCode),
        country: countryCode,
      });
    }
    currentY = frame.y + frame.height + 128;
  }

  const summary = MESSAGES.PROCESS.PROCESSING_COMPLETE(
    createdCount,
    missingTranslations.length,
    missingTranslations,
    updatedCount,
    skippedCount
  );
  post("FRAMES_CREATED", {
    message: summary,
    framesCount: createdCount,
    framesUpdated: updatedCount,
    framesSkipped: skippedCount,
    missingTranslations,
    totalProcessed: processedCount,
  });
};
