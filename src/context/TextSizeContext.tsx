import React, { createContext, useContext, useEffect, useState } from "react";

export type TextSizeMode = "small" | "medium" | "large";

interface TextSizeContextType {
  textSize: TextSizeMode;
  sliderValue: number; // 1: تصغير, 2: وسط, 3: تكبير
  setTextSize: (mode: TextSizeMode) => void;
  setSliderValue: (val: number) => void;
  getTextSizeLabel: (mode?: TextSizeMode) => string;
}

const TextSizeContext = createContext<TextSizeContextType | undefined>(undefined);

export const TEXT_SIZE_STORAGE_KEY = "taiz_text_size_mode";

// Font size scale mappings in pixels (default root is 16px)
export const TEXT_SIZE_MAP: Record<TextSizeMode, { px: string; scale: number; label: string; sliderVal: number }> = {
  small: { px: "14px", scale: 0.875, label: "تصغير", sliderVal: 1 },
  medium: { px: "16px", scale: 1.0, label: "وسط", sliderVal: 2 },
  large: { px: "18.5px", scale: 1.15, label: "تكبير", sliderVal: 3 },
};

export const SLIDER_TO_MODE: Record<number, TextSizeMode> = {
  1: "small",
  2: "medium",
  3: "large",
};

export const TextSizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [textSize, setTextSizeState] = useState<TextSizeMode>(() => {
    try {
      const saved = localStorage.getItem(TEXT_SIZE_STORAGE_KEY) as TextSizeMode | null;
      if (saved === "small" || saved === "medium" || saved === "large") {
        return saved;
      }
    } catch (e) {
      console.warn("Failed to read text size preference", e);
    }
    return "medium";
  });

  // Apply root font-size scaling to document.documentElement
  useEffect(() => {
    try {
      const config = TEXT_SIZE_MAP[textSize] || TEXT_SIZE_MAP.medium;
      document.documentElement.style.fontSize = config.px;
      document.documentElement.setAttribute("data-text-scale", textSize);
    } catch (e) {
      console.warn("Error setting root font-size", e);
    }
  }, [textSize]);

  const setTextSize = (mode: TextSizeMode) => {
    setTextSizeState(mode);
    try {
      localStorage.setItem(TEXT_SIZE_STORAGE_KEY, mode);
      const config = TEXT_SIZE_MAP[mode] || TEXT_SIZE_MAP.medium;
      document.documentElement.style.fontSize = config.px;
      document.documentElement.setAttribute("data-text-scale", mode);
    } catch (e) {
      console.warn("Failed to save text size preference", e);
    }
  };

  const setSliderValue = (val: number) => {
    const clamped = Math.max(1, Math.min(3, Math.round(val)));
    const mode = SLIDER_TO_MODE[clamped] || "medium";
    setTextSize(mode);
  };

  const getTextSizeLabel = (mode?: TextSizeMode) => {
    const target = mode || textSize;
    return TEXT_SIZE_MAP[target]?.label || "وسط";
  };

  const sliderValue = TEXT_SIZE_MAP[textSize]?.sliderVal || 2;

  return (
    <TextSizeContext.Provider
      value={{
        textSize,
        sliderValue,
        setTextSize,
        setSliderValue,
        getTextSizeLabel,
      }}
    >
      {children}
    </TextSizeContext.Provider>
  );
};

export const useTextSize = (): TextSizeContextType => {
  const context = useContext(TextSizeContext);
  if (!context) {
    throw new Error("useTextSize must be used within a TextSizeProvider");
  }
  return context;
};
