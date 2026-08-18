export function validateName(name: string): string | null {
  const trimmed = name?.trim();
  if (!trimmed || trimmed.length < 3) return "Ism kamida 3 ta harfdan iborat bo'lishi kerak";
  if (trimmed.length > 100) return "Ism juda uzun";
  if (!/^[\p{L} '-]+$/u.test(trimmed)) return "Ism faqat harflardan iborat bo'lishi kerak";
  return null;
}

export function normalizePhone(input: string): string | null {
  if (!input) return null;

  // Faqat raqamlar va + ni qoldirish
  let digits = input.replace(/[\s\-().]/g, "").trim();

  // 00 bilan boshlanganlar
  if (digits.startsWith("00")) digits = "+" + digits.slice(2);

  // + belgisi yo'q holatlar
  if (!digits.startsWith("+")) {
    if (digits.startsWith("998") && digits.length === 12) digits = "+" + digits;
    else if (digits.length === 9) digits = "+998" + digits;
    else if (digits.startsWith("0") && digits.length === 10) digits = "+998" + digits.slice(1);
  }

  // Yakuniy tekshiruv: +998XXXXXXXXX (12 ta belgi)
  if (!/^\+998\d{9}$/.test(digits)) return null;
  return digits;
}
