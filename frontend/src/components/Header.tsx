"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  applyUiTheme,
  getCopy,
  readUiLanguage,
  readUiTheme,
  type UiLanguage,
} from "@/src/i18n";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [language, setLanguage] = useState<UiLanguage>("ru");

  useEffect(() => {
    function syncAuthState() {
      setIsAuthenticated(Boolean(localStorage.getItem("access_token")));
    }

    syncAuthState();
    setLanguage(readUiLanguage());
    applyUiTheme(readUiTheme());
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("ui-language", syncAuthState);
    window.addEventListener("ui-language", () => setLanguage(readUiLanguage()));

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("ui-language", syncAuthState);
    };
  }, [pathname]);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("current_user");
    setIsAuthenticated(false);
    router.push("/login");
    router.refresh();
  }

  const copy = getCopy(language);

  return (
    <header className="flex items-center justify-between rounded-b-3xl bg-[#00205c] px-6 py-4 text-white shadow-sm">
      <Link href="/dashboard" className="text-xl font-bold text-white">
        Alatoo-Doc
      </Link>

      <nav className="hidden items-center gap-4 text-sm font-medium text-white md:flex">
        {isAuthenticated ? (
          <>
            <Link className="transition hover:text-[#d6e3ff]" href="/dashboard">
              {copy.dashboard}
            </Link>
            <Link className="transition hover:text-[#d6e3ff]" href="/dashboard/create">
              {copy.create}
            </Link>
            <Link className="transition hover:text-[#d6e3ff]" href="/dashboard/inbox">
              {copy.inbox}
            </Link>
            <Link className="transition hover:text-[#d6e3ff]" href="/dashboard/outbox">
              {copy.outbox}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-[#d6e3ff] px-3 py-1.5 text-[#00205c] transition hover:bg-white"
            >
              {copy.logout}
            </button>
          </>
        ) : (
          <Link
            className="rounded-full border border-white px-3 py-1.5 transition hover:bg-white/10"
            href="/login"
          >
            {copy.login}
          </Link>
        )}
      </nav>

      <Image
        src="/logo.png"
        width={52}
        height={52}
        alt="University logo"
        priority
        className="h-12 w-12 rounded-full bg-white object-cover"
      />
    </header>
  );
}
