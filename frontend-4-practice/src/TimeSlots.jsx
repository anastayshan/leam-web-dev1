
import React from 'react';

function TimeSlots({ slots = [], onPick }) {
  if (!slots.length) {
    return <div>Нет доступных слотов</div>;
  }

  return (
    <div className="time-grid">
      {slots.map((slot) => (
        <button
          key={slot}
          className="time-slot"
          onClick={() => onPick && onPick(slot)}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}

export default TimeSlots;