
import React, { useEffect, useState } from 'react';
import { fetchToday, fetchSlots } from '../api';
import TimeSlots from '../components/booking/TimeSlots';

function BookingScreen() {
  const [loadingToday, setLoadingToday] = useState(true);
  const [errorToday, setErrorToday] = useState(null);
  const [todayInfo, setTodayInfo] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errorSlots, setErrorSlots] = useState(null);
  const [slotsData, setSlotsData] = useState(null);

  useEffect(() => {
    let active = true;
    setLoadingToday(true);
    fetchToday()
      .then((data) => {
        if (!active) return;
        setTodayInfo(data);
        const today = new Date(data.year, data.month, data.day);
        setSelectedDate(today);
        setLoadingToday(false);

        setLoadingSlots(true);
        return fetchSlots(today);
      })
      .then((slotsResponse) => {
        if (!slotsResponse || !slotsResponse.slots) {
          setSlotsData(null);
        } else {
          setSlotsData(slotsResponse);
        }
        setLoadingSlots(false);
      })
      .catch((err) => {
        if (loadingToday) {
          setErrorToday(err.message);
          setLoadingToday(false);
        } else {
          setErrorSlots(err.message);
        }
        setLoadingSlots(false);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedDate) return;

    let active = true;
    setLoadingSlots(true);
    fetchSlots(selectedDate)
      .then((data) => {
        if (!active) return;
        setSlotsData(data);
        setErrorSlots(null);
        setLoadingSlots(false);
      })
      .catch((err) => {
        if (active) {
          setErrorSlots(err.message);
          setLoadingSlots(false);
        }
      });

    return () => { active = false; };
  }, [selectedDate && selectedDate.toDateString()]);

  // Пример упрощённого рендера
  return (
    <div className="booking-screen">
      {loadingToday ? (
        <div>Загрузка…</div>
      ) : errorToday ? (
        <div className="error">Ошибка загрузки даты: {errorToday}</div>
      ) : (
        <div className="calendar-and-slots">
          <div>Сегодня: {todayInfo ? `${todayInfo.day}.${todayInfo.month + 1}.${todayInfo.year}` : ''}</div>
        </div>
      )}

      {loadingSlots ? (
        <div>Загрузка слотов…</div>
      ) : errorSlots ? (
        <div className="error">Ошибка загрузки слотов: {errorSlots}</div>
      ) : slotsData ? (
        <TimeSlots slots={Array.isArray(slotsData.slots) ? slotsData.slots : []} />
      ) : (
        <TimeSlots slots={[]} />
      )}
    </div>
  );
}

export default BookingScreen;