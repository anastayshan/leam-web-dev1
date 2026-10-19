import React, { useState, useEffect } from 'react';
import { fetchToday, fetchSlots } from './api'; // Убедитесь в правильности пути к файлу api.js
import TimeSlots from './TimeSlots'; // Убедитесь в правильности пути к компоненту слотов

// ==========================================
// КОНСТАНТЫ И СПРАВОЧНИКИ
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

// ==========================================
// ВСПОМОГАТЕЛЬНЫЕ ЧИСТЫЕ ФУНКЦИИ
// ==========================================
function compareDates(date1, date2) {
  if (!date1 || !date2) return false;
  return (
    date1.day === date2.day &&
    date1.month === date2.month &&
    date1.year === date2.year
  );
}

function isDateSelectable(day, month, year, todayFromServer) {
  if (!todayFromServer) return false;
  const checkDate = new Date(year, month, day);
  const currentToday = new Date(todayFromServer.year, todayFromServer.month, todayFromServer.day);
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

// ==========================================
// КОМПОНЕНТ ЭКРАНА
// ==========================================
function BookingScreen() {
  const [today, setToday] = useState(null); 
  const [currentYear, setCurrentYear] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [slotsData, setSlotsData] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Сценарий 1: Первичная загрузка «Сегодня»
  useEffect(() => {
    let active = true;
    setIsInitialLoading(true);
    setErrorMessage(null);

    fetchToday()
      .then((data) => {
        if (!active) return;
        setToday(data);
        setCurrentYear(data.year);
        setCurrentMonth(data.month);
        setSelectedDate(data);
        
        return fetchSlots(data);
      })
      .then((res) => {
        if (!active || !res) return;
        setSlotsData(res.slots || []);
      })
      .catch((err) => {
        if (active) setErrorMessage(err.message || 'Не удалось загрузить данные с сервера.');
      })
      .finally(() => {
        if (active) setIsInitialLoading(false);
      });

    return () => { active = false; };
  }, []);

  // Сценарий 2: Клик по дню (запрос новых слотов)
  const handleDayClick = (day, monthOffset) => {
    let cellYear = currentYear;
    let cellMonth = currentMonth + monthOffset;

    if (cellMonth < 0) { cellMonth = 11; cellYear--; }
    if (cellMonth > 11) { cellMonth = 0; cellYear++; }

    if (!isDateSelectable(day, currentMonth, currentYear, today) || monthOffset !== 0) {
      return;
    }

    const targetDateObj = { day, month: cellMonth, year: cellYear };
    
    setSelectedDate(targetDateObj);
    setSelectedTime(null);
    setIsSlotsLoading(true);
    setErrorMessage(null);

    fetchSlots(targetDateObj)
      .then((res) => {
        if (res && compareDates(res.date, targetDateObj)) {
          setSlotsData(res.slots || []);
        }
      })
      .catch((err) => {
        setErrorMessage(err.message || 'Ошибка загрузки слотов.');
      })
      .finally(() => {
        setIsSlotsLoading(false);
      });
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const renderBottomBarText = () => {
    if (!selectedDate) return 'Пожалуйста, выберите дату';
    
    const nativeDate = new Date(selectedDate.year, selectedDate.month, selectedDate.day);
    const dayOfWeek = DAYS_OF_WEEK[nativeDate.getDay()];
    const dayNum = selectedDate.day;
    const monthName = MONTHS_GENITIVE[selectedDate.month];
    const year = selectedDate.year;
    const timeText = selectedTime ? ` • ${selectedTime}` : ' • Время не выбрано';
    
    return `${dayOfWeek}, ${dayNum} ${monthName} ${year}${timeText}`;
  };

  if (errorMessage) {
    return (
      <div className="error-screen" style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
        <h2>Произошла ошибка</h2>
        <p>{errorMessage}</p>
        <button onClick={() => window.location.reload()} className="btn-back">Обновить страницу</button>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="loading-screen" style={{ padding: '100px', textAlign: 'center', fontSize: '24px' }}>
        Загрузка...
      </div>
    );
  }

  const calendarWeeks = buildCalendarGrid(currentYear, currentMonth);

  return (
    <div className="page">
      <main className="main-content">
        <div className="top-bar">
          <button className="btn-back">Назад</button>
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
              {DAYS_OF_WEEK_SHORT.map((dayName) => (
                <div key={dayName} className="day-name">{dayName}</div>
              ))}

              {calendarWeeks.map((week, weekIndex) =>
                week.map((dayObj, dayIndex) => {
                  let cellYear = currentYear;
                  let cellMonth = currentMonth + dayObj.monthOffset;
                  if (cellMonth < 0) { cellMonth = 11; cellYear--; }
                  if (cellMonth > 11) { cellMonth = 0; cellYear++; }

                  const isSelectable = isDateSelectable(dayObj.day, currentMonth, currentYear, today) && dayObj.monthOffset === 0;
                  const isSelected = selectedDate && compareDates(selectedDate, { day: dayObj.day, month: cellMonth, year: cellYear });

                  let className = 'day-num';
                  if (!dayObj.isCurrentMonth) className += ' day-prev-next';
                  if (isSelected && dayObj.isCurrentMonth) className += ' selected';
                  if (!isSelectable && dayObj.isCurrentMonth) className += ' disabled';

                  return (
                    <button
                      key={`${weekIndex}-${dayIndex}`}
                      className={className}
                      disabled={!isSelectable}
                      onClick={() => handleDayClick(dayObj.day, dayObj.monthOffset)}
                    >
                      {dayObj.day}
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* БЛОК 2: СЛОТЫ ВРЕМЕНИ */}
          <section className="card slots-card">
            <h2 className="slots-title">Доступные слоты</h2>
            
            {isSlotsLoading ? (
              <div className="slots-loading">Загрузка слотов...</div>
            ) : (
              /* Используем подключенный дочерний компонент TimeSlots */
              <TimeSlots 
                slots={slotsData} 
                selectedTime={selectedTime} 
                onPick={(time) => setSelectedTime(time)} 
              />
            )}
          </section>
        </div>
      </main>

      {/* НИЖНЯЯ ПАНЕЛЬ С ДИНАМИЧЕСКИМ ТЕКСТОМ */}
      <footer className="bottom-bar">
        <div className="bottom-bar-text">{renderBottomBarText()}</div>
        <button className="btn-next" disabled={!selectedTime}>
          Далее
        </button>
      </footer>
    </div>
  );
}

export default BookingScreen;
