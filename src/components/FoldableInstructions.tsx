import React, { useState } from "react";

const FoldableInstructions: React.FC = () => {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="w-full max-w-2xl mt-8 p-6 bg-gray-50 rounded-lg">
      <button
        className="w-full flex items-center justify-between text-xl font-bold text-gray-800 focus:outline-none"
        onClick={() => setShowInstructions((prev) => !prev)}
        aria-expanded={showInstructions}
        aria-controls="instructions-content"
      >
        <span>How to Use:</span>
        <span className="ml-2">
          {showInstructions ? (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d="M6 15l6-6 6 6"
              />
            </svg>
          ) : (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d="M6 9l6 6 6-6"
              />
            </svg>
          )}
        </span>
      </button>
      {showInstructions && (
        <div id="instructions-content" className="mt-4">
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
      )}
    </div>
  );
};

export default FoldableInstructions;
