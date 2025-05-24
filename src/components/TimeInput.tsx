import type React from "react";
import type { time_hhmmss } from "../types/time";

interface TimeInputProps {
  label: string;
  time: time_hhmmss;
  onChangeTime: (time: time_hhmmss) => void;
}

const EachTimeInput = (props: {
  mode: "hours" | "minutes" | "seconds";
  value: number;
  updateTime: (time: time_hhmmss) => void;
  time: time_hhmmss;
}) => {
  const { value, updateTime, mode } = props;

  return (
    <input
      type="number"
      value={value}
      className="w-16 p-2 border rounded text-center"
      min="0"
      max={mode === "seconds" || mode === "minutes" ? "59" : undefined}
      step="1"
      placeholder="0"
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        function isNonNegativeInteger(num: any) {
          return Number.isInteger(num) && num >= 0;
        }

        const valueNum = Number(e.target.value);
        if (isNaN(valueNum)) {
          alert("Please enter a valid number");
          e.target.value = "0";
          return;
        }
        // Ensure the value is a non-negative integer
        if (!isNonNegativeInteger(valueNum)) {
          alert("Please enter a non-negative integer");
          e.target.value = "0";
          return;
        }

        updateTime({
          ...props.time,
          [mode]: valueNum,
        });
      }}
    />
  );
};

const TimeInput = (props: TimeInputProps) => {
  const { label, time, onChangeTime } = props;
  const { hours, minutes, seconds } = time;

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">{label}</label>
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
