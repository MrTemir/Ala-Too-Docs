"use client";

import {
  UI_LANGUAGES,
  writeUiLanguage,
  type UiLanguage,
} from "@/src/i18n";

type LanguageSwitchProps = {
  language: UiLanguage;
  onChange: (language: UiLanguage) => void;
};

export default function LanguageSwitch({
  language,
  onChange,
}: LanguageSwitchProps) {
  return (
    <div className="mb-6 flex justify-center">
      <div className="flex rounded-full bg-[#d6e3ff] p-1">
        {UI_LANGUAGES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              writeUiLanguage(item);
              onChange(item);
            }}
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
              language === item ? "bg-[#00205c] text-white" : "text-[#00205c]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
