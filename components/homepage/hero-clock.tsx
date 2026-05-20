'use client';

import { useEffect, useState } from 'react';

export function HeroClock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    function update() {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      setTime(`${h}:${m}`);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      setDate(`${year}·${month}·${day}  ·  ${weekdays[d.getDay()]}`);
    }
    update();
    const interval = setInterval(update, 30000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') update();
    });
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <span className="clock" id="clock">{time || '\u00A0'}</span>
      <span>{date}</span>
    </>
  );
}
