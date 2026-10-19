
import React from 'react';

function TimeSlots({ slots = [], selectedTime, onPick }) {
  if (!slots.length) {
    return <div className="slots-empty">Нет доступных слотов на выбранную дату</div>;
  }

  return (
    <div className="slots-grid">
      {slots.map((slot) => (
        <button
          key={slot.time}
          className={`slot-btn ${!slot.available ? 'disabled' : ''} ${selectedTime === slot.time ? 'selected' : ''}`}
          disabled={!slot.available}
          onClick={() => onPick && onPick(slot.time)}
        >
          {slot.time}
        </button>
      ))}
    </div>
  );
}

export default TimeSlots;
