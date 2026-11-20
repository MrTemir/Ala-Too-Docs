"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthCard, ErrorText, Field, SubmitButton } from "@/src/components/AuthCard";
import { getCopy, readUiLanguage, type UiCopy, type UiLanguage } from "@/src/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const IDENTIFIER_PATTERN = /^[A-Za-z0-9]{3,32}$/;
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@alatoo\.edu\.kg$/i;

export default function RegisterPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
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
    const nextError = validateRegistration(copy, {
      identifier,
      password,
      passwordConfirm,
    });
    if (nextError) {
      setError(nextError);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          university_id: identifier.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          password,
          password_confirm: passwordConfirm,
        }),
      });

      if (!response.ok) {
        setError(await registrationError(copy, response));
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
      title={copy.registerTitle}
      subtitle={copy.registerSubtitle}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Field
          id="university_id"
          label={copy.identifier}
          type="text"
          autoComplete="username"
          value={identifier}
          placeholder={copy.identifierPlaceholder}
          onChange={setIdentifier}
        />
        <Field
          id="first_name"
          label={copy.firstName}
          type="text"
          autoComplete="given-name"
          value={firstName}
          placeholder={copy.firstName}
          onChange={setFirstName}
        />
        <Field
          id="last_name"
          label={copy.lastName}
          type="text"
          autoComplete="family-name"
          value={lastName}
          placeholder={copy.lastName}
          onChange={setLastName}
        />
        <Field
          id="password"
          label={copy.password}
          type="password"
          autoComplete="new-password"
          value={password}
          placeholder={copy.password}
          onChange={setPassword}
        />
        <Field
          id="password_confirm"
          label={copy.passwordConfirm}
          type="password"
          autoComplete="new-password"
          value={passwordConfirm}
          placeholder={copy.passwordConfirm}
          onChange={setPasswordConfirm}
        />
        {error ? <ErrorText message={error} /> : null}
        <SubmitButton
          disabled={isSubmitting}
          label={isSubmitting ? copy.creatingAccount : copy.createAccount}
        />
      </form>
      <p className="mt-5 text-center text-sm text-gray-600">
        {copy.haveAccount}{" "}
        <Link href="/login" className="font-semibold text-[#00205c] hover:underline">
          {copy.signIn}
        </Link>
      </p>
    </AuthCard>
  );
}

function validateRegistration(
  copy: UiCopy,
  values: { identifier: string; password: string; passwordConfirm: string },
) {
  const identifier = values.identifier.trim();
  const identifierIsValid = identifier.includes("@")
    ? EMAIL_PATTERN.test(identifier)
    : IDENTIFIER_PATTERN.test(identifier);
  if (!identifierIsValid) {
    return copy.invalidIdentifier;
  }
  if (values.password.length < 8) {
    return copy.passwordTooShort;
  }
  if (values.password.length > 128) {
    return copy.passwordTooLong;
  }
  if (values.password !== values.passwordConfirm) {
    return copy.passwordMismatch;
  }
  return "";
}

async function registrationError(copy: UiCopy, response: Response) {
  const messages: Record<string, string> = {
    password_mismatch: copy.passwordMismatch,
    invalid_identifier: copy.invalidIdentifier,
    invalid_name: copy.invalidName,
    password_too_short: copy.passwordTooShort,
    password_too_long: copy.passwordTooLong,
    identifier_taken: copy.identifierTaken,
  };
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === "string" && messages[body.detail]) {
      return messages[body.detail];
    }
  } catch {
    return copy.connectionError;
  }
  if (response.status === 409) {
    return copy.identifierTaken;
  }
  return copy.invalidIdentifier;
}
