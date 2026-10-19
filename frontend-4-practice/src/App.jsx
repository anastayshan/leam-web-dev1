import React from 'react';
import BookingScreen from './BookingScreen'; // Проверьте путь к файлу BookingScreen.jsx

function App() {
  return (
    <>
      {/* 1. ГЛОБАЛЬНАЯ ШАПКА */}
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

      {/* 3. ОТОБРАЖАЕМ ЭКРАН БРОНИРОВАНИЯ С КАЛЕНДАРЕМ И СЛОТАМИ */}
      <BookingScreen />
    </>
  );
}

export default App;
