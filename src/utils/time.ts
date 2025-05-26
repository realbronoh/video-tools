import type { Seconds, time_hhmmss } from "../types/time";
import { roundToPrecision } from "./misc";

export const convertTimeToSeconds = (time: time_hhmmss): number => {
  const { hours, minutes, seconds } = time;
  return hours * 3600 + minutes * 60 + seconds;
};

export const getTimeFormatString = (time: Seconds): string => {
  const { hours, minutes, seconds } = convertSecondsToTimeHHMMSS(time);

  // format as HH:MM:SS with pad 2
  const pad = (num: number) => {
    const [whole, decimal] = String(num).split(".");
    if (decimal === undefined) {
      return whole.padStart(2, "0");
    }
    return `${whole.padStart(2, "0")}.${decimal}`;
  };
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const getTimeDiff = (startTime: Seconds, endTime: Seconds): Seconds => {
  // diff with 2 decimal using string
  return parseFloat((endTime - startTime).toFixed(1));
};

export const convertSecondsToTimeHHMMSS = (time: Seconds): time_hhmmss => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = roundToPrecision(time % 60, 1);

  return {
    hours,
    minutes,
    seconds,
  };
};
