import React, { useRef, useState, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import TimeInput from "./TimeInput";
import { getTimeFormatString, getTimeDiff } from "../utils/time";
import type { Seconds } from "../types/time";

interface VideoCutterContentProps {
  ffmpeg: FFmpeg;
}

const VideoCutterContent: React.FC<VideoCutterContentProps> = ({ ffmpeg }) => {
  // File states
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");

  // Time states
  const [startTime, setStartTime] = useState<Seconds>(0);
  const [endTime, setEndTime] = useState<Seconds>(0);
  const [duration, setDuration] = useState(0);

  // UI states
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  // Validation effect
  useEffect(() => {
    if (startTime < 0 || endTime < 0) {
      setErrorMessage("Times cannot be negative.");
      return;
    }

    if (startTime >= endTime) {
      setErrorMessage("End time must be greater than start time.");
      return;
    }

    if (duration > 0 && endTime > duration) {
      setErrorMessage(
        `End time cannot exceed video duration (${duration.toFixed(1)}s).`,
      );
      return;
    }

    setErrorMessage("");
  }, [startTime, endTime, duration]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setErrorMessage("");
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      const videoDuration = video.duration;
      setDuration(videoDuration);
      setEndTime(videoDuration);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("video/")) {
      const fakeEvent = {
        target: {
          files: [droppedFile],
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(fakeEvent);
    }
  };

  const processVideo = async () => {
    if (!videoFile) return;

    try {
      setIsProcessing(true);

      await ffmpeg.writeFile("input.mp4", await fetchFile(videoFile));
      const fileExtension = videoFile.name.split(".").pop() || "mp4";
      const outputFileName = `output.${fileExtension}`;

      await ffmpeg.exec([
        "-ss",
        getTimeFormatString(startTime),
        "-i",
        "input.mp4",
        "-to",
        getTimeDiff(startTime, endTime).toString(),
        "-c",
        "copy",
        outputFileName,
      ]);

      const data = await ffmpeg.readFile(outputFileName);
      const blob = new Blob([data], { type: `video/${fileExtension}` });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `trimmed_${startTime.toString().replace(".", "_")}_to_${endTime.toString().replace(".", "_")}s_${videoFile.name}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setIsProcessing(false);
    } catch (error) {
      console.error("Error during video processing:", error);
      setErrorMessage(
        `Error processing video: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Video Cutter</h1>

      {/* File Upload Section */}
      <div
        className={`flex flex-col items-center w-full mb-6 p-6 border-dotted border-2 border-gray-300 rounded-2xl bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors duration-200 ease-in-out`}
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          className="w-full h-28 flex flex-col items-center justify-center gap-6 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
          />
          <p className={`text-gray-600 mb-2 text-lg font-bold`}>
            {`${videoFile ? "Replace" : "Upload"} Your Video by Click or Drag & Drop`}
          </p>
          {videoFile && (
            <span className="text-gray-600">
              UploadedFile: {videoFile.name} (
              {(videoFile.size / 1024 / 1024).toFixed(1)} MB)
            </span>
          )}
        </div>
      </div>

      {/* Conditionally Rendered UI Based on Video File */}
      {videoFile && (
        <>
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
                    Duration: {getTimeFormatString(duration)} (
                    {duration.toFixed(1)}s)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Time Input Fields */}
          <div className="w-full max-w-md flex justify-center items-center gap-8 mb-6">
            <TimeInput
              label="Start Time (s)"
              time={startTime}
              onChangeTime={setStartTime}
            />
            <TimeInput
              label="End Time (s)"
              time={endTime}
              onChangeTime={setEndTime}
            />
          </div>

          {/* Time Preview */}
          <div className="w-full max-w-md mb-6 p-4 bg-gray-50 rounded-lg">
            {startTime < endTime ? (
              <p className="text-center text-gray-600">{`duration: ${getTimeDiff(
                startTime,
                endTime,
              )}s`}</p>
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
            onClick={processVideo}
            disabled={!videoFile || isProcessing || !!errorMessage}
            className={`w-full max-w-md py-3 px-6 rounded-lg text-lg font-medium transition-colors ${
              !videoFile || isProcessing || !!errorMessage
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
        </>
      )}
      {/* Instructions */}
      <div className="w-full max-w-2xl mt-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-800">How to Use:</h2>
        <ol className="list-decimal pl-6 space-y-2 text-gray-700">
          <li>Upload your video</li>
          <li>Preview your video and note the total duration</li>
          <li>Enter the start time where you want the clip to begin</li>
          <li>Enter the end time where you want the clip to end</li>
          <li>
            Click "Cut Video & Download" to process and save the trimmed video
          </li>
          <li>
            The trimmed video will be automatically downloaded to your device
          </li>
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
