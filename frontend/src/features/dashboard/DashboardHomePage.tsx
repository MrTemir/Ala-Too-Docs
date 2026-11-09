"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getCopy,
  readUiLanguage,
  readUiTheme,
  UI_LANGUAGES,
  writeUiLanguage,
  writeUiTheme,
  type UiLanguage,
  type UiTheme,
} from "@/src/i18n";
import type { User } from "@/src/types";

const ROLE_LABEL = {
  student: "studentDashboard",
  teacher: "teacherDashboard",
  dean: "deanDashboard",
  admin: "adminDashboard",
} as const;

export default function DashboardHomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [language, setLanguage] = useState<UiLanguage>("ru");
  const [theme, setTheme] = useState<UiTheme>("system");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("current_user");
    if (!token || !storedUser) {
      router.replace("/login");
      return;
    }
    setCurrentUser(JSON.parse(storedUser) as User);
    setLanguage(readUiLanguage());
    setTheme(readUiTheme());
    setIsReady(true);

    function syncLanguage() {
      setLanguage(readUiLanguage());
    }
    window.addEventListener("ui-language", syncLanguage);
    return () => window.removeEventListener("ui-language", syncLanguage);
  }, [router]);

  if (!isReady || !currentUser) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-5 text-sm text-gray-600 shadow-sm">
          ...
        </div>
      </section>
    );
  }

  const copy = getCopy(language);
  const roleKey = ROLE_LABEL[currentUser.role as keyof typeof ROLE_LABEL];
  const actions =
    currentUser.role === "admin"
      ? [
          {
            href: "/dashboard/inbox",
            title: copy.inbox,
            description: copy.inboxText,
            label: copy.review,
          },
          {
            href: "/dashboard/admin/broadcast",
            title: copy.broadcast,
            description: copy.broadcastText,
            label: copy.broadcast,
          },
          {
            href: "/dashboard/outbox",
            title: copy.outbox,
            description: copy.outboxText,
            label: copy.openOutbox,
          },
        ]
      : currentUser.role === "student"
        ? [
            {
              href: "/dashboard/create",
              title: copy.createApplication,
              description: copy.createStudentText,
              label: copy.create,
            },
            {
              href: "/dashboard/outbox",
              title: copy.outbox,
              description: copy.outboxText,
              label: copy.openOutbox,
            },
          ]
        : [
            {
              href: "/dashboard/create",
              title: copy.createApplication,
              description: copy.createStaffText,
              label: copy.create,
            },
            {
              href: "/dashboard/inbox",
              title: copy.inbox,
              description: copy.inboxText,
              label: copy.review,
            },
          ];

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#00205c]">{copy[roleKey]}</p>
            <h1 className="mt-2 text-2xl font-semibold text-gray-950">
              {currentUser.full_name}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {copy.universityId}: {currentUser.university_id}
              {currentUser.faculty ? ` · ${currentUser.faculty}` : ""}
              {currentUser.group_name ? ` · ${currentUser.group_name}` : ""}
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-gray-500">
              {copy.language}
            </p>
            <div className="flex rounded-full bg-[#d6e3ff] p-1">
              {UI_LANGUAGES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    writeUiLanguage(item);
                    setLanguage(item);
                  }}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold uppercase ${
                    language === item
                      ? "bg-[#00205c] text-white"
                      : "text-[#00205c]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <p className="mb-2 mt-4 text-xs font-medium uppercase text-gray-500">
              Тема
            </p>
            <div className="flex rounded-full bg-[#d6e3ff] p-1">
              {(["light", "dark"] as UiTheme[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    writeUiTheme(item);
                    setTheme(item);
                  }}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    theme === item ? "bg-[#00205c] text-white" : "text-[#00205c]"
                  }`}
                >
                  {item === "light" ? "Светлая" : "Тёмная"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {actions.map((action) => (
          <div key={action.href} className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-950">{action.title}</h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-gray-600">
              {action.description}
            </p>
            <Link
              href={action.href}
              className="mt-5 inline-flex rounded-full bg-[#00205c] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16356f]"
            >
              {action.label}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
