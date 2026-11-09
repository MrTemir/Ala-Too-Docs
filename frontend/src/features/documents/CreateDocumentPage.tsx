"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { User } from "@/src/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

type CurrentUser = User | null;
type DocumentLanguage = "english" | "russian" | "kyrgyz";
type StudentSex = "male" | "female";

const LANGUAGE_OPTIONS: { value: DocumentLanguage; label: string }[] = [
  { value: "russian", label: "RU" },
  { value: "kyrgyz", label: "KG" },
  { value: "english", label: "EN" },
];

const PRESETS = [
  {
    topic: "Академический отпуск",
    reason: "Прошу предоставить академический отпуск по семейным обстоятельствам на один семестр.",
  },
  {
    topic: "Пересдача оценки",
    reason: "Прошу разрешить пересдачу оценки по дисциплине, указанной в теме заявления.",
  },
  {
    topic: "Позднее зачисление",
    reason: "Прошу зачислить меня на курс после установленного срока по уважительной причине.",
  },
  {
    topic: "Обращение",
    reason: "Прошу рассмотреть обращение по вопросу, указанному в теме заявления.",
  },
];

const SEX_OPTIONS: { value: StudentSex; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const PROMPT_LABELS: Record<
  DocumentLanguage,
  { fallbackFaculty: string; fallbackRecipient: string; topic: string }
> = {
  english: {
    fallbackFaculty: "General",
    fallbackRecipient: "Dean",
    topic: "Topic",
  },
  russian: {
    fallbackFaculty: "Общий",
    fallbackRecipient: "Декан",
    topic: "Тема",
  },
  kyrgyz: {
    fallbackFaculty: "Жалпы",
    fallbackRecipient: "Декан",
    topic: "Тема",
  },
};

export default function CreateDocumentPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState<DocumentLanguage>("russian");
  const [mode, setMode] = useState<"generate" | "translate">("generate");
  const [sex, setSex] = useState<StudentSex>("male");
  const [recipientId, setRecipientId] = useState("");
  const [reason, setReason] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [deans, setDeans] = useState<User[]>([]);
  const [currentUser] = useState<CurrentUser>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedUser = window.localStorage.getItem("current_user");
    return storedUser ? (JSON.parse(storedUser) as User) : null;
  });
  const [isLoadingDeans, setIsLoadingDeans] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  const selectedDean = useMemo(
    () => deans.find((dean) => dean.id === recipientId),
    [deans, recipientId],
  );

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadDeans() {
      try {
        const roles = ["dean", "teacher", "admin"];
        const responses = await Promise.all(
          roles.map((role) =>
            fetch(`${API_URL}/api/v1/users?role=${role}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ),
        );
        if (responses.some((response) => !response.ok)) {
          throw new Error("Failed to load recipients.");
        }
        const groups = await Promise.all(
          responses.map((response) => response.json() as Promise<User[]>),
        );
        const users = groups.flat();
        setDeans(users);
        setRecipientId(users[0]?.id ?? "");
      } catch {
        setError("Unable to load dean recipients.");
      } finally {
        setIsLoadingDeans(false);
      }
    }

    void loadDeans();
  }, [router]);

  async function handleGenerateWithAi() {
    setError("");

    if (!topic.trim() || !recipientId || !reason.trim()) {
      setError("Fill in the topic, recipient dean, and reason first.");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    setIsGenerating(true);
    const promptLabels = PROMPT_LABELS[language];

    try {
      const response = await fetch(`${API_URL}/api/documents/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: [
            `${promptLabels.topic}: ${topic}`,
            `Recipient: ${selectedDean?.full_name ?? promptLabels.fallbackRecipient}`,
            `Sex: ${sex}`,
            reason,
          ].join("\n"),
          language,
        }),
      });

      if (!response.ok) {
        throw new Error("AI generation failed.");
      }

      const data = (await response.json()) as { generated_text: string };
      setGeneratedText(data.generated_text);
    } catch {
      setError("Unable to generate text with AI.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleTranslate() {
    setError("");
    if (!generatedText.trim()) {
      setError("Generate or enter the application text before translating.");
      return;
    }
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    setIsTranslating(true);
    try {
      const response = await fetch(`${API_URL}/api/documents/translate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: generatedText, language }),
      });
      if (!response.ok) {
        throw new Error("Translation failed.");
      }
      const data = (await response.json()) as { generated_text: string };
      setGeneratedText(data.generated_text);
      setMode("translate");
    } catch {
      setError("Unable to translate the application text.");
    } finally {
      setIsTranslating(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    if (!topic.trim() || !recipientId || !generatedText.trim()) {
      setError("Complete the form and application text before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/documents/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: topic,
          raw_text: generatedText,
          recipient_id: recipientId,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error("Application submission failed.");
      }

      router.push("/dashboard/outbox");
      router.refresh();
    } catch {
      setError("Unable to submit application.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl bg-[#f4f7fb] px-4 py-8 text-[#1b1b1f] sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Create Application</h1>
        <p className="mt-2 text-sm text-[#49454f]">
          Выбери пресет или опиши цель. Текст можно поправить до отправки PDF.
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className={`rounded-3xl px-4 py-3 ${step === 1 ? "bg-[#d6e3ff]" : "bg-white"}`}>
          <p className="text-xs font-semibold uppercase text-[#00205c]">Шаг 1</p>
          <p className="mt-1 text-sm font-medium text-gray-950">Кому, тема и причина</p>
        </div>
        <div className={`rounded-3xl px-4 py-3 ${step === 2 ? "bg-[#d6e3ff]" : "bg-white"}`}>
          <p className="text-xs font-semibold uppercase text-[#00205c]">Шаг 2</p>
          <p className="mt-1 text-sm font-medium text-gray-950">Текст, перевод и отправка</p>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {step === 1 ? (
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-800">Тема</label>
                <input id="topic" value={topic} onChange={(event) => setTopic(event.target.value)} className="mt-2 block w-full rounded-2xl border-0 bg-[#ece6f0] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#00205c]" required />
              </div>
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-800">Язык документа</label>
                <select id="language" value={language} onChange={(event) => setLanguage(event.target.value as DocumentLanguage)} className="mt-2 block w-full rounded-2xl border-0 bg-[#ece6f0] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#00205c]">
                  {LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="recipient" className="block text-sm font-medium text-gray-800">Кому отправить</label>
                <select id="recipient" value={recipientId} onChange={(event) => setRecipientId(event.target.value)} disabled={isLoadingDeans} className="mt-2 block w-full rounded-2xl border-0 bg-[#ece6f0] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#00205c]" required>
                  <option value="">Выберите адресата</option>
                  {deans.map((dean) => <option key={dean.id} value={dean.id}>{dean.full_name} ({dean.role})</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="sex" className="block text-sm font-medium text-gray-800">Пол</label>
                <select id="sex" value={sex} onChange={(event) => setSex(event.target.value as StudentSex)} className="mt-2 block w-full rounded-2xl border-0 bg-[#ece6f0] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#00205c]">
                  {SEX_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-5">
              <p className="text-sm font-medium text-gray-800">Пресеты</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button key={preset.topic} type="button" onClick={() => { setTopic(preset.topic); setReason(preset.reason); }} className="rounded-full bg-[#d6e3ff] px-4 py-2 text-sm font-medium text-[#00205c]">
                    {preset.topic}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-800">Причина и уточнения</label>
              <textarea id="reason" value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 block min-h-32 w-full rounded-2xl border border-gray-300 px-3 py-2.5 text-sm" required />
            </div>
            {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            <div className="mt-5 flex justify-end">
              <button type="button" onClick={() => { if (!topic.trim() || !recipientId || !reason.trim()) { setError("Заполните тему, адресата и причину."); return; } setError(""); setStep(2); }} className="rounded-full bg-[#00205c] px-5 py-2.5 text-sm font-semibold text-white">Далее</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="w-full sm:max-w-xs">
                  <label htmlFor="language-step-2" className="block text-sm font-medium text-gray-800">Язык документа</label>
                  <select id="language-step-2" value={language} onChange={(event) => setLanguage(event.target.value as DocumentLanguage)} className="mt-2 block h-11 w-full rounded-2xl border-0 bg-[#ece6f0] px-4 text-sm outline-none focus:ring-2 focus:ring-[#00205c]">
                    {LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="h-11 rounded-full border border-[#00205c] px-5 text-sm font-semibold text-[#00205c]">Назад</button>
                  <button type="button" onClick={handleGenerateWithAi} disabled={isGenerating} className="h-11 rounded-full bg-[#00205c] px-5 text-sm font-semibold text-white disabled:bg-gray-400">{isGenerating ? "Генерация..." : "Сгенерировать"}</button>
                </div>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <label htmlFor="generated_text" className="block text-sm font-medium text-gray-800">Текст заявления</label>
                <textarea id="generated_text" value={generatedText} onChange={(event) => setGeneratedText(event.target.value)} className="mt-2 block min-h-80 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm" placeholder="Здесь появится текст" />
              </div>
              <div className="rounded-3xl bg-stone-50 p-5 shadow-sm">
                <p className="text-sm font-medium text-gray-800">Предпросмотр PDF</p>
                <div className="mt-3 min-h-80 whitespace-pre-wrap rounded-xl bg-white px-4 py-3 text-sm leading-6">{generatedText.trim() || "Предпросмотр появится здесь."}</div>
              </div>
            </div>
            {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            <div className="flex justify-end">
              <button type="submit" disabled={isSubmitting} className="rounded-full bg-[#00205c] px-5 py-2.5 text-sm font-semibold text-white disabled:bg-gray-400">{isSubmitting ? "Отправка..." : "Отправить заявление"}</button>
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
