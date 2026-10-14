// JavaScript для страницы выбора даты и времени.
//
// ЗАДАНИЕ
// ========
// Оживить свою свёрстанную страницу. Скорее всего на ней будет работать:
//   1. При открытии страницы выбрать день по умолчанию.
//   2. По клику на день — день становится выбранным,
//      слоты обновляются.
//   3. По клику на слот — время становится выбранным,
//      попадает в нижнюю панель.
//   4. Стрелки «‹» и «›» листают месяцы.
//   5. Дни раньше «сегодня» нельзя выбрать.
//   6. Нижняя панель обновляется при выборе дня и времени.
//
// ГДЕ ЖИВУТ ДАННЫЕ
// ----------------
// Слотов пока нет с сервера. Захардкодьте массив в этом файле.
// Формат слота: { time: "10:00", available: true }.
// «Сегодня» можно взять из new Date() или захардкодить —
// как удобнее для проверки.
//
// СТРУКТУРА КОДА
// --------------
// Разделите код на смысловые части комментариями:
//   1. Данные (слоты, «сегодня»).
//   2. Состояние (месяц, день, время, слоты).
//   3. Чистые функции (для работы с датами).
//   4. Отрисовка и обработчики.
//   5. Инициализация.
//
// ЧИСТЫЕ ФУНКЦИИ
// --------------
// Если понадобится строить сетку календаря — вот функция,
// которую можно использовать. Она не зависит от DOM,
// просто принимает год и месяц и возвращает массив недель.
//
// function buildCalendarGrid(year, month) {
//   const firstDay = new Date(year, month, 1);
//   const lastDay = new Date(year, month + 1, 0);
//   const daysInMonth = lastDay.getDate();
//   const startDayOfWeek = firstDay.getDay();
//   const offset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
//   const prevMonthLastDay = new Date(year, month, 0).getDate();
//
//   const cells = [];
//
//   for (let i = offset - 1; i >= 0; i--) {
//     cells.push({ day: prevMonthLastDay - i, otherMonth: true });
//   }
//   for (let d = 1; d <= daysInMonth; d++) {
//     cells.push({ day: d, otherMonth: false });
//   }
//   const totalCells = Math.ceil(cells.length / 7) * 7;
//   let nextDay = 1;
//   while (cells.length < totalCells) {
//     cells.push({ day: nextDay, otherMonth: true });
//     nextDay++;
//   }
//
//   const weeks = [];
//   for (let i = 0; i < cells.length; i += 7) {
//     weeks.push(cells.slice(i, i + 7));
//   }
//   return weeks;
// }

// Начните писать код здесь.

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

// Все доступные временные слоты салона
const AVAILABLE_SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

// База данных занятых слотов на разные даты (формат ключа: ГГГГ-ММ-ДД)
const RECORDED_TAKEN_SLOTS = {
  '2026-10-14': ['10:00', '11:00', '12:00'], // Сегодня почти всё занято
  '2026-10-15': ['10:00', '12:00', '14:00'], // Занятые часы на 15 октября
  '2026-10-16': ['11:00', '13:00', '17:00'], // Занятые часы на 16 октября
  '2026-10-17': ['10:00', '11:00', '15:00'], // Занятые часы на 17 октября
  '2026-10-31': ['12:00', '13:00', '14:00', '15:00'], // Занятые часы на Хэллоуин
  '2026-11-01': ['10:00', '17:00']             // Слоты на ноябрь
};

// Функция, вычисляющая занятые слоты для переданной даты
function getTakenSlotsForDate(date) {
  if (!date) return [];
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Сдвиг на 1, так как месяцы 0-индексные
  const day = String(date.getDate()).padStart(2, '0');
  
  const dateKey = `${year}-${month}-${day}`;
  
  // Если даты нет в базе, по умолчанию возвращаем базовый набор занятого времени
  return RECORDED_TAKEN_SLOTS[dateKey] || ['11:00', '13:00'];
}

// ==========================================
// 2. СОСТОЯНИЕ ПРИЛОЖЕНИЯ (STATE)
// ==========================================
const state = {
  today: new Date(),   // Текущая дата для валидации прошлого
  currentYear: 2026,   // Календарный год на старте
  currentMonth: 9,     // Календарный месяц на старте (9 = Октябрь)
  selectedDate: null,  // Выбранный объект Date
  selectedTime: null   // Выбранное строковое время (например, '14:00')
};

// ==========================================
// 3. ЧИСТЫЕ ФУНКЦИИ (HELPERS)
// ==========================================

// Сравнение двух дат без учета времени (чистые объекты Date)
function compareDates(date1, date2) {
  if (!date1 || !date2) return 0;
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return d1.getTime() - d2.getTime();
}

// Проверка: можно ли кликнуть на день (только сегодня или будущие даты текущего месяца)
function isDateSelectable(day, month, year, today) {
  const checkDate = new Date(year, month, day);
  const currentToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return checkDate >= currentToday;
}

// Построение сетки календаря в виде массива недель
function buildCalendarGrid(year, month) {
  const grid = [];
  const firstDayOfMonth = new Date(year, month, 1);
  
  let startDayOfWeek = firstDayOfMonth.getDay();
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Превращаем ВС из 0 в 6, а ПН в 0

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

// ==========================================
// 4. ФУНКЦИИ РЕНДЕРИНГА (RENDER)
// ==========================================

// Отрисовка календаря
function renderCalendar() {
  const monthTitle = document.getElementById('month-title');
  const calendarGrid = document.getElementById('calendar-grid');
  
  if (!monthTitle || !calendarGrid) return;

  // Обновление текстового заголовка ("Октябрь 2026")
  monthTitle.textContent = `${MONTHS_NOMINATIVE[state.currentMonth]} ${state.currentYear}`;

  let html = '';
  
  // Добавление статичных заголовков дней недели (Пн, Вт...)
  DAYS_OF_WEEK_SHORT.forEach(dayName => {
    html += `<div class="day-name">${dayName}</div>`;
  });

  const weeks = buildCalendarGrid(state.currentYear, state.currentMonth);

  weeks.forEach(week => {
    week.forEach(dayObj => {
      let cellYear = state.currentYear;
      let cellMonth = state.currentMonth + dayObj.monthOffset;
      
      // Обработка перехода через границы года при сдвиге месяцев
      if (cellMonth < 0) { cellMonth = 11; cellYear--; }
      if (cellMonth > 11) { cellMonth = 0; cellYear++; }

      const cellDate = new Date(cellYear, cellMonth, dayObj.day);
      let classes = ['day-num'];
      let isSelectable = true;

      // Приглушаем дни чужого месяца и дни, оставшиеся в прошлом
      if (!dayObj.isCurrentMonth || !isDateSelectable(dayObj.day, state.currentMonth, state.currentYear, state.today)) {
        classes.push('disabled');
        isSelectable = false;
      }

      // Подсвечиваем активный выбранный день
      if (isSelectable && state.selectedDate && compareDates(cellDate, state.selectedDate) === 0) {
        classes.push('active'); 
      }

      const dataAttrs = `data-day="${dayObj.day}" data-month="${cellMonth}" data-year="${cellYear}" data-selectable="${isSelectable}"`;
      html += `<div class="${classes.join(' ')}" ${dataAttrs}>${dayObj.day}</div>`;
    });
  });

  calendarGrid.innerHTML = html;
  
  // Заново регистрируем слушатели кликов на новые сгенерированные DOM-элементы дней
  setupDayClickListeners();
}

// Отрисовка временных слотов с учетом выбранного дня
function renderTimeSlots() {
  const timeGrid = document.getElementById('time-grid');
  if (!timeGrid) return;

  let html = '';
  
  // Получаем список занятых слотов для выбранной даты
  const currentTakenSlots = getTakenSlotsForDate(state.selectedDate);

  AVAILABLE_SLOTS.forEach(slot => {
    const isTaken = currentTakenSlots.includes(slot);
    let classes = ['time-slot'];
    
    if (isTaken) {
      classes.push('taken');
    } else if (state.selectedTime === slot) {
      classes.push('active');
    }

    // Принудительно задаем кнопкам одинаковое внутреннее выравнивание (flex) и высоту
    const buttonStyle = `
      display: inline-flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      min-height: 60px; 
      box-sizing: border-box;
    `;

    if (isTaken) {
      html += `
        <button class="${classes.join(' ')}" style="${buttonStyle}" disabled>
          <span style="font-weight: 600;">${slot}</span> 
          <span class="status" style="font-size: 0.8rem; margin-top: 4px; display: block;">Занято</span>
        </button>`;
    } else {
      html += `
        <button class="${classes.join(' ')}" style="${buttonStyle}" data-time="${slot}">
          <span style="font-weight: 600;">${slot}</span> 
          <!-- Добавляем невидимый текст такой же высоты, чтобы пустая кнопка не сжималась -->
          <span class="status" style="font-size: 0.8rem; margin-top: 4px; display: block; opacity: 0; visibility: hidden;">Занято</span>
        </button>`;
    }
  });

  timeGrid.innerHTML = html;
  setupTimeClickListeners();
}



// Обновление текста нижней информационной панели
function updateBottomBar() {
  const bottomBar = document.getElementById('bottom-info-bar');
  if (!bottomBar) return;

  if (!state.selectedDate) {
    bottomBar.textContent = 'Пожалуйста, выберите дату';
    return;
  }

  const dayOfWeek = DAYS_OF_WEEK[state.selectedDate.getDay()];
  const dayNum = state.selectedDate.getDate();
  const monthName = MONTHS_GENITIVE[state.selectedDate.getMonth()];
  const year = state.selectedDate.getFullYear();
  
  let resultString = `${dayOfWeek}, ${dayNum} ${monthName} ${year}`;
  
  if (state.selectedTime) {
    resultString += ` • ${state.selectedTime}`;
  } else {
    resultString += ` • Время не выбрано`;
  }

  bottomBar.textContent = resultString;
}

// ==========================================
// 5. ОБРАБОТЧИКИ СОБЫТИЙ (EVENT LISTENERS)
// ==========================================

function setupDayClickListeners() {
  const days = document.querySelectorAll('#calendar-grid .day-num');
  days.forEach(dayEl => {
    dayEl.addEventListener('click', (event) => {
      const target = event.currentTarget;
      
      if (target.getAttribute('data-selectable') === 'false' || target.classList.contains('disabled')) {
        return;
      }

      const day = parseInt(target.getAttribute('data-day'), 10);
      const month = parseInt(target.getAttribute('data-month'), 10);
      const year = parseInt(target.getAttribute('data-year'), 10);

      // Обновляем выбранный день в состоянии
      state.selectedDate = new Date(year, month, day);
      
      // ВАЖНО: сбрасываем старое выбранное время, так как день сменился
      state.selectedTime = null; 

      // Вызываем каскад обновлений интерфейса
      renderCalendar();
      renderTimeSlots(); // Перерисует слоты уже с новыми занятыми часами для этого дня!
      updateBottomBar();
    });
  });
}

function setupTimeClickListeners() {
  const slots = document.querySelectorAll('#time-grid .time-slot:not(.taken)');
  slots.forEach(slotEl => {
    slotEl.addEventListener('click', (event) => {
      const target = event.currentTarget;
      
      // Записываем выбранное время
      state.selectedTime = target.getAttribute('data-time');

      renderTimeSlots();
      updateBottomBar();
    });
  });
}

function setupMonthNavigation() {
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      state.currentMonth--;
      if (state.currentMonth < 0) {
        state.currentMonth = 11;
state.currentYear--;
}
renderCalendar();
});
}
if (btnNext) {
btnNext.addEventListener('click', () => {
state.currentMonth++;
if (state.currentMonth > 11) {
state.currentMonth = 0;
state.currentYear++;
}
renderCalendar();
});
}
}
// ==========================================
// 6. ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ (INIT)
// ==========================================
function init() {
// Определяем стартовую дефолтную дату при открытии страницы
const defaultStartDate = new Date(state.currentYear, state.currentMonth, 1);
if (state.today > defaultStartDate) {
// Если реальное "сегодня" позже, чем октябрь 2026, открываем календарь на текущем системном дне
state.selectedDate = new Date(state.today.getFullYear(), state.today.getMonth(), state.today.getDate());
state.currentMonth = state.today.getMonth();
state.currentYear = state.today.getFullYear();
} else {
// В ином случае активируем дефолтное 1-е число Октября 2026 года из учебного макета
state.selectedDate = defaultStartDate;
}
// Первичный рендеринг компонентов
renderCalendar();
renderTimeSlots();
updateBottomBar();
// Вешаем постоянные слушатели на стрелки переключения месяцев
setupMonthNavigation();
}
// Старт кода только после готовности DOM структуры в браузере
document.addEventListener('DOMContentLoaded', init);