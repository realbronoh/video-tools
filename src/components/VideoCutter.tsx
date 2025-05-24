import React, { useState, useRef, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { time_hhmmss } from "../types/time";
import TimeInput from "./TimeInput";

const DEFAULT_TIME_HHMMSS: time_hhmmss = {
  hours: 0,
  minutes: 0,
  seconds: 0,
};

const convertTimeToSeconds = (time: time_hhmmss): number => {
  const { hours, minutes, seconds } = time;
  return hours * 3600 + minutes * 60 + seconds;
};

const getTimeFormatString = (time: time_hhmmss): string => {
  const { hours, minutes, seconds } = time;
  // format as HH:MM:SS with pad 2
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const getTimeDiffInSeconds = (
  startTime: time_hhmmss,
  endTime: time_hhmmss
): string => {
  const start = convertTimeToSeconds(startTime);
  const end = convertTimeToSeconds(endTime);
  return (end - start).toString();
};

const convertSecondsToTimeHHMMSS = (time: number): time_hhmmss => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);

  return {
    hours,
    minutes,
    seconds,
  };
};

const VideoCutter = () => {
  const ffmpegRef = useRef(new FFmpeg());
  const [loaded, setLoaded] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [startTime, setStartTime] = useState<time_hhmmss>(DEFAULT_TIME_HHMMSS);
  const [endTime, setEndTime] = useState<time_hhmmss>(DEFAULT_TIME_HHMMSS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingProgress, setLoadingProgress] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load FFmpeg on component mount
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        setLoadingProgress("Loading FFmpeg...");
        const baseURL = " https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";
        const ffmpeg = ffmpegRef.current;

        // Set up logging
        ffmpeg.on("log", ({ message }) => {
          console.log(message);
        });

        // Set up progress tracking
        ffmpeg.on("progress", ({ progress, time }) => {
          if (isProcessing) {
            console.log(
              `Processing: ${Math.round(progress * 100)}% (${time}s)`
            );
          }
        });

        // Load FFmpeg with core files
        await ffmpeg.load({
          coreURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.js`,
            "text/javascript"
          ),
          wasmURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            "application/wasm"
          ),
        });

        setLoaded(true);
        setLoadingProgress("FFmpeg loaded successfully!");
      } catch (error) {
        console.error("Failed to load FFmpeg:", error);
        setErrorMessage(
          "Failed to load video processing library. Please try again later."
        );
        setLoadingProgress("Failed to load FFmpeg");
      }
    };

    loadFFmpeg();

    // Cleanup function
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, []);

  // Update video duration when video metadata is loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      setDuration(videoDuration);
      setEndTime(convertSecondsToTimeHHMMSS(videoDuration));
    }
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      // Clean up previous URL if exists
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setErrorMessage("");
    }
  };

  // Validate time inputs
  const validateTimes = () => {
    const {
      hours: startHours,
      minutes: startMinutes,
      seconds: startSeconds,
    } = startTime;
    const {
      hours: endHours,
      minutes: endMinutes,
      seconds: endSeconds,
    } = endTime;

    if (
      startHours < 0 ||
      startMinutes < 0 ||
      startSeconds < 0 ||
      endHours < 0 ||
      endMinutes < 0 ||
      endSeconds < 0
    ) {
      setErrorMessage("Times cannot be negative.");
      return false;
    }

    const startTimeSeconds = convertTimeToSeconds(startTime);
    const endTimeSeconds = convertTimeToSeconds(endTime);

    if (startTimeSeconds >= endTimeSeconds) {
      setErrorMessage("End time must be greater than start time.");
      return false;
    }

    if (duration > 0 && endTimeSeconds > duration) {
      setErrorMessage(
        `End time cannot exceed video duration (${duration.toFixed(1)}s).`
      );
      return false;
    }

    setErrorMessage("");
    return true;
  };

  // Process the video with FFmpeg
  const processVideo = async () => {
    if (!videoFile || !loaded) return;

    if (!validateTimes()) return;

    try {
      setIsProcessing(true);
      const ffmpeg = ffmpegRef.current;

      // Write the input file to FFmpeg's virtual file system
      console.log("Writing input file...");
      await ffmpeg.writeFile("input.mp4", await fetchFile(videoFile));

      // Get file extension from original file
      const fileExtension = videoFile.name.split(".").pop() || "mp4";
      const outputFileName = `output.${fileExtension}`;

      console.log("Starting video processing...");

      // Run FFmpeg command to cut the video
      await ffmpeg.exec([
        "-ss",
        getTimeFormatString(startTime),
        "-i",
        "input.mp4",
        "-to",
        getTimeDiffInSeconds(startTime, endTime),
        "-c",
        "copy",
        outputFileName,
      ]);

      console.log("Reading output file...");

      // Read the result
      const data = await ffmpeg.readFile(outputFileName);

      // Create a Blob from the result
      const blob = new Blob([data], { type: `video/${fileExtension}` });

      // Create a download link
      const url = URL.createObjectURL(blob);

      // Create an invisible anchor element for download
      const a = document.createElement("a");
      a.href = url;
      a.download = `trimmed_${convertTimeToSeconds(
        startTime
      )}s_to_${convertTimeToSeconds(endTime)}s_${videoFile.name}`;

      // Programmatically click the anchor to trigger the save dialog
      document.body.appendChild(a);
      a.click();

      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log("Video processing completed successfully");
      setIsProcessing(false);
    } catch (error) {
      console.error("Error during video processing:", error);
      setErrorMessage(
        `Error processing video: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Video Cutter</h1>

      {/* Loading Status */}
      {!loaded && (
        <div className="w-full mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 font-medium">{loadingProgress}</p>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full animate-pulse"
              style={{ width: "70%" }}
            ></div>
          </div>
        </div>
      )}

      {/* File Upload Section */}
      <div className="w-full mb-6">
        <label className="block text-lg font-medium mb-3 text-gray-700">
          Upload Video File:
        </label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
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
                Duration:{" "}
                {getTimeFormatString(convertSecondsToTimeHHMMSS(duration))} (
                {duration.toFixed(1)}s)
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
          onChangeTime={setStartTime}
        />
        <TimeInput label="End Time" time={endTime} onChangeTime={setEndTime} />
      </div>

      {/* Time Preview */}
      <div className="w-full max-w-md mb-6 p-4 bg-gray-50 rounded-lg">
        {Number(getTimeDiffInSeconds(startTime, endTime)) >= 0 ? (
          <p className="text-center text-gray-600">
            {`duration: ${getTimeFormatString(
              convertSecondsToTimeHHMMSS(
                Number(getTimeDiffInSeconds(startTime, endTime))
              )
            )}`}
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
        onClick={processVideo}
        disabled={!videoFile || !loaded || isProcessing}
        className={`w-full max-w-md py-3 px-6 rounded-lg text-lg font-medium transition-colors ${
          !videoFile || !loaded || isProcessing
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

export default VideoCutter;
