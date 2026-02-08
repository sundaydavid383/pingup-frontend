import {} from "react"
const CoverPhotoSkeleton = () => {
  return (
    <div className="w-full h-full animate-pulse flex flex-col justify-end p-6">
      <div className="h-6 w-48 bg-gray-300 rounded mb-2" />
      <div className="h-4 w-64 bg-gray-300 rounded" />
    </div>
  );
};

export default CoverPhotoSkeleton;