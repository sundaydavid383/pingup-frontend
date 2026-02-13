import React, { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "../../utils/cropImage"; // your helper
import { Pencil } from "lucide-react";
import axiosBase from "../../utils/axiosBase";
import CoverPhotoSkeleton from "../skeleton/CoverPhotoSkeleton";

const CoverPhotoEditor = ({ coverPreview, setCoverPreview, setFormData, setUploadingCover, uploadingCover, setMsg }) => {
  const [imageSrc, setImageSrc] = useState(coverPreview || "");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  useEffect(() => {
  if (coverPreview) {
    setImageSrc(coverPreview);
  }
}, [coverPreview]);


  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result);
      setIsCropping(true); // start cropping when a new image is loaded
    });
    reader.readAsDataURL(file);
  };

  const handleSaveCrop = async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);

      setCoverPreview(croppedImage);
      setImageSrc(croppedImage);
      setIsCropping(false); // done cropping

      // Convert to blob and upload
      const blob = await (await fetch(croppedImage)).blob();
      const fd = new FormData();
      fd.append("coverPhoto", blob, "cover.jpg");

      setUploadingCover(true);

      const { data } = await axiosBase.post("/api/auth/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = data?.url || data?.imageUrl || data?.imageUrlFull || "";
      if (!url) throw new Error("No image URL returned from server.");

      setFormData((p) => ({ ...p, coverPhotoUrl: url }));
      setCoverPreview(url);
      setMsg("Cover photo uploaded successfully.", "success");
    } catch (err) {
      console.error(err);
      setMsg(err?.response?.data?.message || err.message || "Cover photo upload failed.", "error");
    } finally {
      setUploadingCover(false);
    }
  };

  return (
<div className="relative w-full aspect-[16/5] rounded-lg overflow-hidden bg-gray-200">
  {imageSrc ? (
    <>
      {/* BLUR WRAPPER */}
      <div
        className={`w-full h-full transition-all duration-300 ${
          uploadingCover ? "blur-sm scale-105" : ""
        }`}
      >
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={16 / 5}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          cropShape="rect"
          showGrid={true}
          style={{
            containerStyle: { width: "100%", height: "100%" },
          }}
        />
      </div>

      {/* SHIMMER SKELETON OVERLAY */}
      {uploadingCover && (
        <div className="absolute inset-0 z-10 bg-white/70">
          <CoverPhotoSkeleton />
        </div>
      )}

{/* PENCIL OVERLAY — ONLY WHEN THERE IS NO IMAGE */}




      {isCropping && !uploadingCover && (
        <div className="absolute top-2 right-2 flex space-x-2 z-20">
          <button
            onClick={handleSaveCrop}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            Save
          </button>

          <label className="px-3 py-1 bg-gray-500 text-white rounded cursor-pointer">
            Change
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}
    </>
  ) : (
    <label className="w-full h-full flex items-center justify-center cursor-pointer">
      <span className="text-gray-500">Click to upload cover photo</span>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </label>
  )}
</div>

  );
};

export default CoverPhotoEditor;
