// Arabic (default). Every UI string lives here and in fr.ts.
export const ar = {
  app: {
    name: "تأكيد الطلبيات",
    tagline: "تأكيد الطلبيات، تتبع التوصيل والأرباح",
  },
  nav: {
    main: "القائمة",
    dashboard: "لوحة التحكم",
    orders: "الطلبيات",
    confirmation: "التأكيد",
    customers: "الزبائن",
    delivery: "التوصيل",
    stats: "الإحصائيات",
    settings: "الإعدادات",
    menu: "القائمة الرئيسية",
    menuDescription: "روابط صفحات لوحة التحكم",
    toggleSidebar: "إظهار أو إخفاء القائمة",
  },
  header: {
    theme: "المظهر",
    light: "فاتح",
    dark: "داكن",
    system: "حسب الجهاز",
    language: "اللغة",
    account: "الحساب",
    owner: "صاحب المتجر",
    logout: "تسجيل الخروج",
  },
  login: {
    title: "تسجيل الدخول",
    subtitle: "أدخل كلمة المرور للوصول إلى لوحة التحكم",
    password: "كلمة المرور",
    submit: "دخول",
    submitting: "جارٍ الدخول…",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    errors: {
      required: "أدخل كلمة المرور",
      invalid: "كلمة المرور غير صحيحة",
      tooMany: "محاولات كثيرة. حاول بعد بضع دقائق.",
      notSetUp: "المتجر غير مُهيّأ بعد. شغّل أمر التهيئة (seed) أولاً.",
      unknown: "حدث خطأ. حاول مرة أخرى.",
    },
  },
  pages: {
    dashboard: { title: "لوحة التحكم", description: "ملخص نشاط متجرك اليوم" },
    orders: { title: "الطلبيات", description: "كل الطلبيات مع البحث والتصفية" },
    confirmation: { title: "التأكيد", description: "الطلبيات التي تنتظر الاتصال، الأقدم أولاً" },
    customers: { title: "الزبائن", description: "سجل كل زبون والزبائن المشبوهون" },
    delivery: { title: "التوصيل", description: "الطلبيات المرسلة، المسلّمة والمرتجعة" },
    stats: { title: "الإحصائيات", description: "نسب التأكيد والتوصيل والربح الحقيقي" },
    settings: { title: "الإعدادات", description: "المتجر، المنتجات، أسعار التوصيل وكلمة المرور" },
  },
  empty: {
    title: "لا شيء هنا بعد",
    soon: "هذه الصفحة قيد الإنشاء وستكون جاهزة قريباً.",
  },
  cards: {
    todayOrders: "طلبيات اليوم",
    toConfirm: "في انتظار التأكيد",
    confirmationRate: "نسبة التأكيد",
    returnRate: "نسبة الإرجاع",
    profit: "الربح",
  },
} as const;

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type Dictionary = Widen<typeof ar>;
