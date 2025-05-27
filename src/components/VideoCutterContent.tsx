import React, { useRef } from "react";
import TimeInput from "./TimeInput";
import { getTimeFormatString, getTimeDiff } from "../utils/time";
import type { Seconds } from "../types/time";

interface VideoCutterContentProps {
  videoFile: File | null;
  videoUrl: string;
  startTime: Seconds;
  endTime: Seconds;
  duration: number;
  errorMessage: string;
  isProcessing: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartTimeChange: (time: Seconds) => void;
  onEndTimeChange: (time: Seconds) => void;
  onProcess: () => void;
  handleLoadedMetadata: () => void;
}

const VideoCutterContent: React.FC<VideoCutterContentProps> = ({
  videoFile,
  videoUrl,
  startTime,
  endTime,
  duration,
  errorMessage,
  isProcessing,
  onFileChange,
  onStartTimeChange,
  onEndTimeChange,
  onProcess,
  handleLoadedMetadata,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="flex flex-col items-center justify-center p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Video Cutter</h1>

      {/* File Upload Section */}
      <div className="w-full mb-6">
        <label className="block text-lg font-medium mb-3 text-gray-700">
          Upload Video File:
        </label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="video/*"
            onChange={onFileChange}
            ref={fileInputRef}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg font-medium transition-colors"
          >
            Select Video File
          </button>
          {videoFile && (
            <span className="text-gray-600">
              {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
            </span>
          )}
        </div>
      </div>

      {/* Video Preview */}
      {videoUrl && (
        <div className="w-full mb-6">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
            onLoadedMetadata={handleLoadedMetadata}
          />
          {duration > 0 && (
            <div className="text-center mt-2 text-gray-600">
              <p>
                Duration: {getTimeFormatString(duration)} ({duration.toFixed(1)}s)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Time Input Fields */}
      <div className="w-full max-w-md grid grid-cols-2 gap-6 mb-6">
        <TimeInput
          label="Start Time"
          time={startTime}
          onChangeTime={onStartTimeChange}
        />
        <TimeInput
          label="End Time"
          time={endTime}
          onChangeTime={onEndTimeChange}
        />
      </div>

      {/* Time Preview */}
      <div className="w-full max-w-md mb-6 p-4 bg-gray-50 rounded-lg">
        {startTime < endTime ? (
          <p className="text-center text-gray-600">
            {`duration: ${getTimeDiff(startTime, endTime)}s`}
          </p>
        ) : (
          <p className="text-center">
            <span className="text-red-600 font-medium">
              Start time must be less than end time.
            </span>
          </p>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="w-full max-w-md mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* Process Button */}
      <button
        onClick={onProcess}
        disabled={!videoFile || isProcessing}
        className={`w-full max-w-md py-3 px-6 rounded-lg text-lg font-medium transition-colors ${
          !videoFile || isProcessing
            ? "bg-gray-400 cursor-not-allowed text-gray-600"
            : "bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl"
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            Processing Video...
          </div>
        ) : (
          "Cut Video & Download"
        )}
      </button>

      {/* Status Information */}
      <div className="w-full max-w-md mt-6 text-center">
        {isProcessing && (
          <p className="text-gray-600">
            This may take a while depending on your video size and device
            performance.
          </p>
        )}
      </div>

      {/* Instructions */}
      <div className="w-full max-w-2xl mt-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-800">How to Use:</h2>
        <ol className="list-decimal pl-6 space-y-2 text-gray-700">
          <li>Upload a video file using the "Select Video File" button</li>
          <li>Preview your video and note the total duration</li>
          <li>Enter the start time where you want the clip to begin</li>
          <li>Enter the end time where you want the clip to end</li>
          <li>Click "Cut Video & Download" to process and save the trimmed video</li>
          <li>The trimmed video will be automatically downloaded to your device</li>
        </ol>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> This tool runs entirely in your browser. No
            files are uploaded to any server. Larger videos may take longer to
            process.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoCutterContent;
