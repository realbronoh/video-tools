import type React from "react";
import type { Seconds, time_hhmmss } from "../types/time";
import {
  convertSecondsToTimeHHMMSS,
  convertTimeToSeconds,
} from "../utils/time";

interface TimeInputProps {
  label: string;
  time: Seconds;
  onChangeTime: (time: Seconds) => void;
}

const EachTimeInput = (props: {
  mode: "hours" | "minutes" | "seconds";
  value: number;
  updateTime: (time: Seconds) => void;
  time: Seconds;
}) => {
  const { value, updateTime, mode, time } = props;

  const isHours = mode === "hours";
  const isMinutes = mode === "minutes";
  const isSeconds = mode === "seconds";

  return (
    <input
      type="number"
      value={value}
      className="w-18 p-2 border rounded text-center"
      min="0"
      max={isSeconds || isMinutes ? "59" : undefined}
      step={isSeconds ? "0.1" : "1"}
      placeholder="0"
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        const isNonNegativeInteger = (num: any) => {
          return Number.isInteger(num) && num >= 0;
        };
        const resetValue = () => {
          e.target.value = "0";
        };

        const valueNum = Number(e.target.value);
        if (isNaN(valueNum)) {
          alert("Please enter a valid number");
          e.target.value = "0";
          return;
        }
        if (isHours) {
          if (!isNonNegativeInteger(valueNum)) {
            alert("Please enter a non-negative integer for hours.");
            resetValue();
            return;
          }
        } else if (isMinutes) {
          if (!isNonNegativeInteger(valueNum) || valueNum > 59) {
            alert(
              "Please enter a non-negative integer between 0 and 59 for minutes.",
            );
            resetValue();
            return;
          }
        } else {
          // isSeconds
          if (valueNum < 0 || valueNum >= 60) {
            alert(
              "Please enter a non-negative number between 0 and 60 for seconds.",
            );
            resetValue();
            return;
          }
        }

        const { hours, minutes, seconds } = convertSecondsToTimeHHMMSS(time);
        const newTimeHHMMSS: time_hhmmss = {
          hours,
          minutes,
          seconds,
          [mode]: valueNum,
        };
        const newTime = convertTimeToSeconds(newTimeHHMMSS);
        updateTime(newTime);
      }}
    />
  );
};

const TimeInput = (props: TimeInputProps) => {
  const { label, time, onChangeTime } = props;
  const { hours, minutes, seconds } = convertSecondsToTimeHHMMSS(time);

  return (
    <div className="mb-4">
      <label className="block text-sm font-bold mb-2">{label}</label>
      <div className="flex items-center space-x-2">
        <EachTimeInput
          mode="hours"
          value={hours}
          updateTime={onChangeTime}
          time={time}
        />
        <span>:</span>
        <EachTimeInput
          mode="minutes"
          value={minutes}
          updateTime={onChangeTime}
          time={time}
        />
        <span>:</span>
        <EachTimeInput
          mode="seconds"
          value={seconds}
          updateTime={onChangeTime}
          time={time}
        />
      </div>
    </div>
  );
};

export default TimeInput;
