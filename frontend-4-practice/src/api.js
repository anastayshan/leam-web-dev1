// API-клиент. Все запросы к серверу — здесь.
//
// Компоненты не должны знать про fetch, URL и JSON. Они вызывают
// функцию и получают данные или ошибку. Когда backend переедет
// с JS-имитации на Python — правится только этот файл.

// Общая обёртка над fetch.
// Делает запрос, проверяет статус, парсит JSON.
// src/api.js
// Общая обёртка над fetch
async function request(url) {
  const response = await fetch(url);

  if (!response.ok) {
    let message = `HTTP error ${response.status}`;
    try {
      const data = await response.json();
      if (data && data.error) message = data.error;
    } catch (e) {
      // тело не JSON — оставить базовый текст
    }
    throw new Error(message);
  }

  return response.json();
}

// GET /api/booking/today
export async function fetchToday() {
  return request("/api/booking/today");
}

// Преобразователь: принимает Date или обычный объект { day, month, year }
function extractDateParts(inputDate) {
  if (inputDate instanceof Date) {
    return {
      day: inputDate.getDate(),
      month: inputDate.getMonth(), // 0-индексный месяц
      year: inputDate.getFullYear(),
    };
  }
  if (inputDate && typeof inputDate === 'object' && 'day' in inputDate && 'month' in inputDate && 'year' in inputDate) {
    return {
      day: inputDate.day,
      month: inputDate.month,
      year: inputDate.year,
    };
  }
  throw new Error('Invalid date input for fetchSlots');
}

// GET /api/slots?day=&month=&year=
export async function fetchSlots(date) {
  const { day, month, year } = extractDateParts(date);
  const url = `/api/slots?day=${day}&month=${month}&year=${year}`;
  return request(url);
}

// GET /api/booking/today
// Возвращает «сегодня» по мнению сервера: { day, month, year }.
// Месяц — 0-индексный, как в new Date().
export async function fetchToday() {
  return request("/api/booking/today");
}

// GET /api/slots?day=&month=&year=
// Возвращает слоты для указанной даты.
// Формат ответа: { date: { day, month, year }, slots: [{ time, available }] }.
//
// date в ответе — та же дата, что пришла в запросе. Нужна,
// чтобы понять, к какому дню относятся слоты. Если пользователь
// быстро кликает по дням, ответы могут прийти не в том порядке —
// по этому полю клиент поймёт, какой из них актуальный.
export async function fetchSlots(date) {
  const url = `/api/slots?day=${date.day}&month=${date.month}&year=${date.year}`;
  return request(url);
}
