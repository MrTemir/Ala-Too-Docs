"use client";

import type { ReactNode } from "react";

import LanguageSwitch from "@/src/components/LanguageSwitch";
import type { UiLanguage } from "@/src/i18n";

const inputClassName =
  "mt-2 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#00205c] focus:ring-2 focus:ring-[#d6e3ff]";

type AuthCardProps = {
  language: UiLanguage;
  onLanguageChange: (language: UiLanguage) => void;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthCard({
  language,
  onLanguageChange,
  title,
  subtitle,
  children,
}: AuthCardProps) {
  return (
    <section className="flex min-h-[calc(100vh-78px)] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <LanguageSwitch language={language} onChange={onLanguageChange} />
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-950">{title}</h1>
          <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

type FieldProps = {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

export function Field({
  id,
  label,
  type,
  autoComplete,
  value,
  placeholder,
  onChange,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-800">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
        placeholder={placeholder}
      />
    </div>
  );
}

export function ErrorText({ message }: { message: string }) {
  return (
    <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
  );
}

export function SubmitButton({
  disabled,
  label,
}: {
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full rounded-full bg-[#00205c] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16356f] focus:outline-none focus:ring-2 focus:ring-[#00205c] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
    >
      {label}
    </button>
  );
}
