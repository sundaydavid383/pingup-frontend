import React from "react";
import { X } from "lucide-react";

const ImagePreview = ({ file, onRemove }) => {
  if (!file) return null;

  const previewURL =
    typeof file === "string" ? file : URL.createObjectURL(file);

  return (
    <div className="relative w-full flex justify-center mt-2">
      <div
        className="relative rounded-xl overflow-hidden shadow-md"
        style={{
          width: "220px",
          maxHeight: "260px",
          background: "rgba(200,200,200,0.5)",
          backdropFilter: "blur(10px)",
        }}
      >
        <img
          src={previewURL}
          alt="preview"
          className="w-full h-full object-cover"
        />

        {/* Close button */}
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black transition"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default ImagePreview;
