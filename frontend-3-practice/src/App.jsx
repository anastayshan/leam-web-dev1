// App — корневой компонент приложения.
//
// ЗАДАНИЕ
// --------
// Перенесите свою страницу выбора даты и времени из нативного JS
// на React. У вас уже есть:
//   - готовая вёрстка (HTML);
//   - готовые стили (CSS);
//   - рабочий код на нативном JS (валидация дат, рендер календаря,
//     обработчики кликов, выбор слота).
//
// Теперь нужно то же самое сделать в React.
//
// ЧТО НУЖНО СДЕЛАТЬ
// ------------------
// 1. Разбить страницу на компоненты. Как именно — решайте сами.
//    Обычно выделяют: шапку, подвал, календарь, сетку слотов,
//    нижнюю панель.
//
// 2. Перенести вёрстку из HTML в JSX. Стили оставить как есть,
//    просто положить их в тот же проект (например, в src/styles/
//    или рядом с компонентами).
//
// 3. Заменить нативное состояние (переменные + прямые манипуляции
//    с DOM) на useState. Какие именно данные должны жить в состоянии —
//    подумайте сами. Скорее всего: текущий месяц, выбранный день,
//    выбранное время, массив слотов.
//
// 4. Рендер календаря и слотов делать через JSX и .map(),
//    без innerHTML и querySelector.
//
// 5. Обработчики кликов — через onClick прямо в JSX,
//    без addEventListener.
//
// 6. Функции для работы с датами, которые вы уже написали
//    на нативном JS (построение сетки календаря, сравнение дат,
//    проверка «не раньше сегодня»), можно переиспользовать.
//    Они чистые — не зависят от React. Создайте файл
//    src/utils/date.js и перенесите их туда.
//
//
// ПОДСКАЗКА
// ---------
// Если что-то не работает или непонятно, как перевести нативный
// код на React — вернитесь к лекции. Там разбирались все
// основные приёмы: состояние, пропсы, рендер списков, колбэки.
//
// Ниже — пустой каркас. Здесь можно начать писать.

import React, { useState } from 'react';

// ==========================================
// 1. КОНСТАНТЫ И СПРАВОЧНИКИ
// ==========================================
const MONTHS_NOMINATIVE = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

const DAYS_OF_WEEK = [
  'Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'
];

const DAYS_OF_WEEK_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// Доступные слоты времени
const AVAILABLE_SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

// База данных занятых слотов по датам
const RECORDED_TAKEN_SLOTS = {
  '2026-10-14': ['10:00', '11:00', '12:00'],
  '2026-10-15': ['10:00', '12:00', '14:00'],
  '2026-10-16': ['11:00', '13:00', '17:00'],
  '2026-10-17': ['10:00', '11:00', '15:00'],
  '2026-10-31': ['12:00', '13:00', '14:00', '15:00'],
  '2026-11-01': ['10:00', '17:00']
};

// ==========================================
// 2. ВСПОМОГАТЕЛЬНЫЕ ЧИСТЫЕ ФУНКЦИИ
// ==========================================
function compareDates(date1, date2) {
  if (!date1 || !date2) return 0;
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return d1.getTime() - d2.getTime();
}

function isDateSelectable(day, month, year, today) {
  const checkDate = new Date(year, month, day);
  const currentToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return checkDate >= currentToday;
}

function buildCalendarGrid(year, month) {
  const grid = [];
  const firstDayOfMonth = new Date(year, month, 1);
  let startDayOfWeek = firstDayOfMonth.getDay();
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  let currentDay = 1;
  let nextMonthDay = 1;

  for (let i = 0; i < 6; i++) {
    const week = [];
    let hasCurrentMonthDays = false;

    for (let j = 0; j < 7; j++) {
      const index = i * 7 + j;

      if (index < startDayOfWeek) {
        const pDay = daysInPrevMonth - startDayOfWeek + index + 1;
        week.push({ day: pDay, isCurrentMonth: false, monthOffset: -1 });
      } else if (currentDay <= daysInMonth) {
        week.push({ day: currentDay, isCurrentMonth: true, monthOffset: 0 });
        hasCurrentMonthDays = true;
        currentDay++;
      } else {
        week.push({ day: nextMonthDay, isCurrentMonth: false, monthOffset: 1 });
        nextMonthDay++;
      }
    }
    grid.push(week);
    if (currentDay > daysInMonth && !hasCurrentMonthDays) {
      grid.pop();
      break;
    }
  }
  return grid;
}

function getTakenSlotsForDate(date) {
  if (!date) return [];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return RECORDED_TAKEN_SLOTS[`${year}-${month}-${day}`] || ['11:00', '13:00'];
}

// ==========================================
// 3. КОРНЕВОЙ КОМПОНЕНТ
// ==========================================
function App() {
  const [today] = useState(new Date());

  // Стартовое состояние (Октябрь 2026)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 9 = Октябрь (0-based)

  // Выбранный по умолчанию день (1 октября 2026)
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 9, 1));
  const [selectedTime, setSelectedTime] = useState(null);

  // Навигация кнопкой « ‹ »
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  // Навигация кнопкой « › »
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Клик по дню
  const handleDayClick = (day, monthOffset) => {
    let cellYear = currentYear;
    let cellMonth = currentMonth + monthOffset;

    if (cellMonth < 0) { cellMonth = 11; cellYear--; }
    if (cellMonth > 11) { cellMonth = 0; cellYear++; }

    // Активируем клики только по доступным дням текущего месяца
    if (!isDateSelectable(day, currentMonth, currentYear, today) || monthOffset !== 0) {
      return;
    }

    setSelectedDate(new Date(cellYear, cellMonth, day));
    setSelectedTime(null); // Обязательный сброс времени при смене дня!
  };

  // Текст нижней панели
  const renderBottomBarText = () => {
    if (!selectedDate) return 'Пожалуйста, выберите дату';
    const dayOfWeek = DAYS_OF_WEEK[selectedDate.getDay()];
    const dayNum = selectedDate.getDate();
    const monthName = MONTHS_GENITIVE[selectedDate.getMonth()];
    const year = selectedDate.getFullYear();
    const timeText = selectedTime ? ` • ${selectedTime}` : ' • Время не выбрано';
    return `${dayOfWeek}, ${dayNum} ${monthName} ${year}${timeText}`;
  };

  const calendarWeeks = buildCalendarGrid(currentYear, currentMonth);
  const currentTakenSlots = getTakenSlotsForDate(selectedDate);

  return (
    <>
      {/* 1. ШАПКА */}
      <header className="header">
        <div className="logo">LOGO</div>
        <nav className="nav">
          <a href="#" className="nav-link">Услуги</a>
          <a href="#" className="nav-link">Галерея</a>
          <a href="#" className="nav-link">Команда</a>
          <a href="#" className="nav-link">Отзывы</a>
          <a href="#" className="nav-link">Контакты</a>
        </nav>
      </header>

      {/* 2. ИНДИКАТОР ШАГОВ НА ВЕСЬ ЭКРАН */}
      <div className="steps-wrapper">
        <div className="steps-container">
          <div className="step active">1</div>
          <div className="step-line active"></div>
          <div className="step active">2</div>
          <div className="step-line active"></div>
          <div className="step active">3</div>
          <div className="step-line"></div>
          <div className="step">4</div>
          <div className="step-line"></div>
          <div className="step">5</div>
        </div>
      </div>

      {/* 3. ОСНОВНАЯ СТРАНИЦА */}
      <div className="page">
        <main className="main-content">
          <div className="top-bar">
            <button className="btn-back" onClick={() => { /* вернуть назад при необходимости */ }}>Назад</button>
            <h1 className="page-title">Выберите дату и время</h1>
          </div>

          <div className="booking-container">
            {/* БЛОК 1: КАЛЕНДАРЬ */}
            <section className="card calendar-card">
              <div className="calendar-header">
                <span className="month-title">
                  {MONTHS_NOMINATIVE[currentMonth]} {currentYear}
                </span>
                <div className="calendar-nav">
                  <button className="btn-nav" onClick={handlePrevMonth}>&lt;</button>
                  <button className="btn-nav" onClick={handleNextMonth}>&gt;</button>
                </div>
              </div>

              <div className="calendar-grid">
                {/* Названия дней недели */}
                {DAYS_OF_WEEK_SHORT.map((dayName) => (
                  <div key={dayName} className="day-name">{dayName}</div>
                ))}

                {/* Дни месяца через .map() */}
                {calendarWeeks.map((week, weekIndex) =>
                  week.map((dayObj, dayIndex) => {
                    let cellYear = currentYear;
                    let cellMonth = currentMonth + dayObj.monthOffset;
                    if (cellMonth < 0) { cellMonth = 11; cellYear--; }
                    if (cellMonth > 11) { cellMonth = 0; cellYear++; }

                    const cellDate = new Date(cellYear, cellMonth, dayObj.day);

                    let className = 'day-num';
                    const isSelectable = dayObj.isCurrentMonth && isDateSelectable(dayObj.day, currentMonth, currentYear, today);

                    if (!isSelectable) {
                      className += ' disabled';
                    }
                    if (isSelectable && selectedDate && compareDates(cellDate, selectedDate) === 0) {
                      className += ' active';
                    }

                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={className}
                        onClick={() => handleDayClick(dayObj.day, dayObj.monthOffset)}
                      >
                        {dayObj.day}
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* БЛОК 2: ДОСТУПНОЕ ВРЕМЯ */}
            <section className="card time-card">
              <h2 className="card-title">Доступное время</h2>
              <div className="time-grid">
                {AVAILABLE_SLOTS.map((slot) => {
                  const isTaken = currentTakenSlots.includes(slot);
                  let className = 'time-slot';
                  if (isTaken) className += ' taken';
                  if (!isTaken && selectedTime === slot) className += ' active';

                  const buttonStyle = {
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60px',
                    boxSizing: 'border-box'
                  };

                  return (
                    <button
                      key={slot}
                      className={className}
                      style={buttonStyle}
                      disabled={isTaken}
                      onClick={() => setSelectedTime(slot)}
                    >
                      <span style={{ fontWeight: 600 }}>{slot}</span>
                      {isTaken ? (
                        <span className="status" style={{ fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>Занято</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* НИЖНЯЯ ПАНЕЛЬ ДЕЙСТВИЯ */}
          <div className="action-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginTop: '30px' }}>
            <div style={{ fontWeight: 500, fontSize: '1.1rem', color: '#a0a0a0' }}>
              {renderBottomBarText()}
            </div>
            <button
              className="btn-next"
              onClick={() => {
                // Здесь можно вставить переход к форме ввода контактов
                console.log('Перейти к вводу контактных данных');
              }}
            >
              Перейти к вводу контактных данных
            </button>
          </div>

        </main>
      </div>

      {/* Футер (примерная часть, может быть стилизована по теме) */}
      <footer className="footer" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
        © 2026, Все права защищены. Политика конфиденциальности
      </footer>
    </>
  );
}

export default App;