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
    register: "Регистрация",
    universityId: "ID университета",
    loginTitle: "Вход в Alatoo-Doc",
    loginSubtitle: "Используйте student ID или почту университета.",
    registerTitle: "Регистрация",
    registerSubtitle: "Аккаунт студента: ID или почта университета, имя и пароль.",
    identifier: "Student ID или почта университета",
    identifierPlaceholder: "230101001 или name@alatoo.edu.kg",
    firstName: "Имя",
    lastName: "Фамилия",
    password: "Пароль",
    passwordConfirm: "Подтверждение пароля",
    createAccount: "Зарегистрироваться",
    creatingAccount: "Регистрация...",
    noAccount: "Нет аккаунта?",
    haveAccount: "Уже есть аккаунт?",
    signIn: "Войти",
    signingIn: "Вход...",
    passwordMismatch: "Пароли не совпадают.",
    invalidIdentifier: "Введите student ID или почту @alatoo.edu.kg.",
    invalidName: "Проверьте имя и фамилию. Используйте буквы.",
    passwordTooShort: "Пароль должен быть не короче 8 символов.",
    passwordTooLong: "Пароль слишком длинный.",
    identifierTaken: "Такой ID или почта уже зарегистрированы.",
    connectionError: "Не удалось подключиться к серверу.",
    invalidLogin: "Неверный ID, почта или пароль.",
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
    register: "Катталуу",
    universityId: "Университет ID",
    loginTitle: "Alatoo-Doc кирүү",
    loginSubtitle: "Студенттик ID же университеттик почтаны колдонуңуз.",
    registerTitle: "Катталуу",
    registerSubtitle: "Студенттик аккаунт: ID же университеттик почта, ат жана сырсөз.",
    identifier: "Студенттик ID же университеттик почта",
    identifierPlaceholder: "230101001 же name@alatoo.edu.kg",
    firstName: "Аты",
    lastName: "Фамилиясы",
    password: "Сырсөз",
    passwordConfirm: "Сырсөздү ырастоо",
    createAccount: "Катталуу",
    creatingAccount: "Катталууда...",
    noAccount: "Аккаунтуңуз жокпу?",
    haveAccount: "Аккаунтуңуз барбы?",
    signIn: "Кирүү",
    signingIn: "Кирүүдө...",
    passwordMismatch: "Сырсөздөр дал келген жок.",
    invalidIdentifier: "Студенттик ID же @alatoo.edu.kg почтасын жазыңыз.",
    invalidName: "Аты менен фамилияны текшериңиз.",
    passwordTooShort: "Сырсөз кеминде 8 белгиден турушу керек.",
    passwordTooLong: "Сырсөз өтө узун.",
    identifierTaken: "Мындай ID же почта мурун катталган.",
    connectionError: "Серверге туташуу мүмкүн болгон жок.",
    invalidLogin: "ID, почта же сырсөз туура эмес.",
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
    register: "Register",
    universityId: "University ID",
    loginTitle: "Sign in to Alatoo-Doc",
    loginSubtitle: "Use your student ID or university email.",
    registerTitle: "Create an account",
    registerSubtitle: "Student account with a student ID or university email.",
    identifier: "Student ID or university email",
    identifierPlaceholder: "230101001 or name@alatoo.edu.kg",
    firstName: "First name",
    lastName: "Last name",
    password: "Password",
    passwordConfirm: "Confirm password",
    createAccount: "Create account",
    creatingAccount: "Creating account...",
    noAccount: "No account?",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
    signingIn: "Signing in...",
    passwordMismatch: "Passwords do not match.",
    invalidIdentifier: "Enter a student ID or an @alatoo.edu.kg email.",
    invalidName: "Check the first and last name. Use letters.",
    passwordTooShort: "Password must be at least 8 characters.",
    passwordTooLong: "Password is too long.",
    identifierTaken: "This ID or email is already registered.",
    connectionError: "Unable to connect to the server.",
    invalidLogin: "Invalid ID, email, or password.",
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

export type UiCopy = {
  [K in keyof (typeof DICTIONARY)["ru"]]: string;
};

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
