import { HebrewCalendar, HDate, Location } from '@hebcal/core';

const ISRAEL_LOCATION = Location.lookup('Jerusalem');

const isHoliday = (date) => {
  const hdate = new HDate(date);
  const events = HebrewCalendar.getHolidaysOnDate(hdate, ISRAEL_LOCATION) || [];
  return events.length > 0;
};

const getHolidayName = (date) => {
  const hdate = new HDate(date);
  const events = HebrewCalendar.getHolidaysOnDate(hdate, ISRAEL_LOCATION) || [];
  if (events.length > 0) {
    return events[0].render('he');
  }
  return null;
};

export { isHoliday, getHolidayName };