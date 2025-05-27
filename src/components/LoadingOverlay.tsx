import React from "react";

interface LoadingOverlayProps {
  message: string;
  progress?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message,
  progress,
}) => {
  return (
    <div className="fixed inset-0 bg-gray-300 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <h2 className="text-xl font-semibold text-gray-800">{message}</h2>
          {progress && (
            <div className="w-64">
              <div className="text-sm text-gray-600 mb-2">{progress}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
