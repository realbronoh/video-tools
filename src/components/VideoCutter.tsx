import React, { useState, useRef, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { Seconds } from "../types/time";
import { getTimeFormatString, getTimeDiff } from "../utils/time";
import LoadingOverlay from "./LoadingOverlay";
import VideoCutterContent from "./VideoCutterContent";

const VideoCutter = () => {
  const ffmpegRef = useRef(new FFmpeg());
  const [loaded, setLoaded] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [startTime, setStartTime] = useState<Seconds>(0);
  const [endTime, setEndTime] = useState<Seconds>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingProgress, setLoadingProgress] = useState("");

  // Load FFmpeg on component mount
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        setLoadingProgress("Loading FFmpeg...");
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";
        const ffmpeg = ffmpegRef.current;

        ffmpeg.on("log", ({ message }) => {
          console.log(message);
        });

        ffmpeg.on("progress", ({ progress, time }) => {
          if (isProcessing) {
            console.log(
              `Processing: ${Math.round(progress * 100)}% (${time}s)`,
            );
          }
        });

        await ffmpeg.load({
          coreURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.js`,
            "text/javascript",
          ),
          wasmURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            "application/wasm",
          ),
        });

        setLoaded(true);
        setLoadingProgress("FFmpeg loaded successfully!");
      } catch (error) {
        console.error("Failed to load FFmpeg:", error);
        setErrorMessage(
          "Failed to load video processing library. Please try again later.",
        );
        setLoadingProgress("Failed to load FFmpeg");
      }
    };

    loadFFmpeg();

    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, []);

  const handleLoadedMetadata = () => {
    const video = document.querySelector("video");
    if (video) {
      const videoDuration = video.duration;
      setDuration(videoDuration);
      setEndTime(videoDuration);
    }
  };

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

  const validateTimes = () => {
    if (startTime < 0 || endTime < 0) {
      setErrorMessage("Times cannot be negative.");
      return false;
    }

    if (startTime >= endTime) {
      setErrorMessage("End time must be greater than start time.");
      return false;
    }

    if (duration > 0 && endTime > duration) {
      setErrorMessage(
        `End time cannot exceed video duration (${duration.toFixed(1)}s).`,
      );
      return false;
    }

    setErrorMessage("");
    return true;
  };

  const processVideo = async () => {
    if (!videoFile || !loaded) return;
    if (!validateTimes()) return;

    try {
      setIsProcessing(true);
      const ffmpeg = ffmpegRef.current;

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
        `Error processing video: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setIsProcessing(false);
    }
  };

  if (!loaded) {
    return (
      <LoadingOverlay
        message="Initializing Video Cutter"
        progress={loadingProgress}
      />
    );
  }

  return (
    <VideoCutterContent
      videoFile={videoFile}
      videoUrl={videoUrl}
      startTime={startTime}
      endTime={endTime}
      duration={duration}
      errorMessage={errorMessage}
      isProcessing={isProcessing}
      onFileChange={handleFileChange}
      onStartTimeChange={setStartTime}
      onEndTimeChange={setEndTime}
      onProcess={processVideo}
      handleLoadedMetadata={handleLoadedMetadata}
    />
  );
};

export default VideoCutter;
