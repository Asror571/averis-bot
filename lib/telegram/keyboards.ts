export function gradeInlineKeyboard() {
  const grades = [
    "1-sinf", "2-sinf", "3-sinf", "4-sinf",
    "5-sinf", "6-sinf", "7-sinf", "8-sinf",
    "9-sinf", "10-sinf", "11-sinf",
  ];

  // Two per row
  const rows: Array<Array<{ text: string; callback_data: string }>> = [];
  for (let i = 0; i < grades.length; i += 2) {
    const row: Array<{ text: string; callback_data: string }> = [
      { text: grades[i], callback_data: `grade:${grades[i]}` },
    ];
    if (grades[i + 1]) {
      row.push({ text: grades[i + 1], callback_data: `grade:${grades[i + 1]}` });
    }
    rows.push(row);
  }

  return { inline_keyboard: rows };
}

export function contactKeyboard() {
  return {
    keyboard: [
      [{ text: "📞 Telefon raqamimni yuborish", request_contact: true }],
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

export function removeKeyboard() {
  return { remove_keyboard: true };
}
