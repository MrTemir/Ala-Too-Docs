export type UiLanguage = "ru" | "kg" | "en";

export const UI_LANGUAGE_KEY = "ui_language";

export const UI_LANGUAGES: UiLanguage[] = ["ru", "kg", "en"];

const DICTIONARY = {
  ru: {
    dashboard: "Главная",
    create: "Создать",
    inbox: "Входящие",
    outbox: "Исходящие",
    logout: "Выйти",
    login: "Войти",
    universityId: "ID университета",
    studentDashboard: "Кабинет студента",
    teacherDashboard: "Кабинет преподавателя",
    deanDashboard: "Кабинет декана",
    adminDashboard: "Кабинет администратора",
    createApplication: "Создать заявление",
    createStudentText: "Подготовьте заявление, сгенерируйте текст и отправьте адресату.",
    createStaffText: "Отправьте служебное заявление другому сотруднику.",
    openOutbox: "Открыть исходящие",
    outboxText: "Отслеживайте отправленные заявления и открывайте PDF.",
    review: "Проверить",
    inboxText: "Проверьте адресованные вам заявления, подпишите или отклоните.",
    broadcast: "Рассылка",
    broadcastText: "Отправьте документ всем студентам выбранного факультета.",
    language: "Язык сайта",
  },
  kg: {
    dashboard: "Башкы",
    create: "Түзүү",
    inbox: "Кирүүчү",
    outbox: "Чыгуучу",
    logout: "Чыгуу",
    login: "Кирүү",
    universityId: "Университет ID",
    studentDashboard: "Студенттин кабинети",
    teacherDashboard: "Мугалимдин кабинети",
    deanDashboard: "Декандын кабинети",
    adminDashboard: "Администратордун кабинети",
    createApplication: "Арыз түзүү",
    createStudentText: "Арыз даярдап, текстти түзүп, алуучуга жөнөтүңүз.",
    createStaffText: "Кызматтык арызды башка кызматкерге жөнөтүңүз.",
    openOutbox: "Чыгуучуну ачуу",
    outboxText: "Жөнөтүлгөн арыздарды көзөмөлдөп, PDF ачыңыз.",
    review: "Текшерүү",
    inboxText: "Сизге келген арыздарды текшерип, кол коюңуз же четке кагыңыз.",
    broadcast: "Жалпы жөнөтүү",
    broadcastText: "Тандалган факультеттин студенттерине документ жөнөтүңүз.",
    language: "Сайттын тили",
  },
  en: {
    dashboard: "Dashboard",
    create: "Create",
    inbox: "Inbox",
    outbox: "Outbox",
    logout: "Logout",
    login: "Login",
    universityId: "University ID",
    studentDashboard: "Student dashboard",
    teacherDashboard: "Teacher dashboard",
    deanDashboard: "Dean dashboard",
    adminDashboard: "Administrator dashboard",
    createApplication: "Create application",
    createStudentText: "Prepare an application, generate the text, and send it.",
    createStaffText: "Send an official application to another staff member.",
    openOutbox: "Open outbox",
    outboxText: "Track submitted applications and open PDF files.",
    review: "Review",
    inboxText: "Review applications addressed to you, then sign or reject them.",
    broadcast: "Broadcast",
    broadcastText: "Send a document to all students of a selected faculty.",
    language: "Site language",
  },
} as const;

export type UiCopy = { readonly [Key in keyof (typeof DICTIONARY)["ru"]]: string };

export function readUiLanguage(): UiLanguage {
  if (typeof window === "undefined") {
    return "ru";
  }
  const stored = window.localStorage.getItem(UI_LANGUAGE_KEY);
  if (stored === "ru" || stored === "kg" || stored === "en") {
    return stored;
  }
  const browser = window.navigator.language.toLowerCase();
  if (browser.startsWith("ky") || browser.startsWith("kg")) {
    return "kg";
  }
  if (browser.startsWith("en")) {
    return "en";
  }
  return "ru";
}

export function writeUiLanguage(language: UiLanguage) {
  window.localStorage.setItem(UI_LANGUAGE_KEY, language);
  window.dispatchEvent(new Event("ui-language"));
}

export type UiTheme = "light" | "dark" | "system";

export const UI_THEME_KEY = "ui_theme";

export function readUiTheme(): UiTheme {
  if (typeof window === "undefined") {
    return "light";
  }
  const stored = window.localStorage.getItem(UI_THEME_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return "light";
}

export function applyUiTheme(theme: UiTheme) {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && systemDark);
  document.documentElement.classList.toggle("dark", dark);
}

export function writeUiTheme(theme: UiTheme) {
  window.localStorage.setItem(UI_THEME_KEY, theme);
  applyUiTheme(theme);
  window.dispatchEvent(new Event("ui-theme"));
}

export function getCopy(language: UiLanguage): UiCopy {
  return DICTIONARY[language];
}
