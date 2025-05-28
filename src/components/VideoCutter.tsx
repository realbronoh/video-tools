import { useState, useRef, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import LoadingOverlay from "./LoadingOverlay";
import VideoCutterContent from "./VideoCutterContent";

const VideoCutter = () => {
  const ffmpegRef = useRef(new FFmpeg());
  const [loaded, setLoaded] = useState(false);
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
          console.log(`Processing: ${Math.round(progress * 100)}% (${time}s)`);
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
        setLoadingProgress("Failed to load FFmpeg");
      }
    };

    loadFFmpeg();
  }, []);

  if (!loaded) {
    return (
      <LoadingOverlay
        message="Initializing Video Cutter"
        progress={loadingProgress}
      />
    );
  }

  return <VideoCutterContent ffmpeg={ffmpegRef.current} />;
};

export default VideoCutter;
