"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthCard, ErrorText, Field, SubmitButton } from "@/src/components/AuthCard";
import { getCopy, readUiLanguage, type UiLanguage } from "@/src/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function LoginPage() {
  const router = useRouter();
  const [universityId, setUniversityId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [language, setLanguage] = useState<UiLanguage>("ru");

  useEffect(() => {
    setLanguage(readUiLanguage());
    function syncLanguage() {
      setLanguage(readUiLanguage());
    }
    window.addEventListener("ui-language", syncLanguage);
    return () => window.removeEventListener("ui-language", syncLanguage);
  }, []);

  const copy = getCopy(language);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          university_id: universityId.trim(),
          password,
        }),
      });

      if (!response.ok) {
        setError(copy.invalidLogin);
        return;
      }

      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("current_user", JSON.stringify(data.user));
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(copy.connectionError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      language={language}
      onLanguageChange={setLanguage}
      title={copy.loginTitle}
      subtitle={copy.loginSubtitle}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Field
          id="university_id"
          label={copy.identifier}
          type="text"
          autoComplete="username"
          value={universityId}
          placeholder={copy.identifierPlaceholder}
          onChange={setUniversityId}
        />
        <Field
          id="password"
          label={copy.password}
          type="password"
          autoComplete="current-password"
          value={password}
          placeholder={copy.password}
          onChange={setPassword}
        />
        {error ? <ErrorText message={error} /> : null}
        <SubmitButton
          disabled={isSubmitting}
          label={isSubmitting ? copy.signingIn : copy.signIn}
        />
      </form>
      <p className="mt-5 text-center text-sm text-gray-600">
        {copy.noAccount}{" "}
        <Link href="/register" className="font-semibold text-[#00205c] hover:underline">
          {copy.register}
        </Link>
      </p>
    </AuthCard>
  );
}
