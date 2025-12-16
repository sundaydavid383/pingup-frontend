// NotificationSkeleton.jsx
const NotificationSkeleton = () => {
  return (
    <div className="space-y-4 p-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="relative flex items-center gap-4 p-4 rounded-xl bg-gray-100 shadow-sm overflow-hidden"
        >
          {/* Circle skeleton for icon */}
          <div className="w-10 h-10 rounded-full bg-gray-300 relative overflow-hidden">
            <div className={`absolute inset-0 shimmer shimmer-${i}`}></div>
          </div>

          {/* Text skeleton */}
          <div className="flex-1 space-y-3">
            <div className="h-3 w-3/4 bg-gray-300 rounded relative overflow-hidden">
              <div className={`absolute inset-0 shimmer shimmer-${i}`}></div>
            </div>
            <div className="h-2 w-1/3 bg-gray-300 rounded relative overflow-hidden">
              <div className={`absolute inset-0 shimmer shimmer-${i}`}></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationSkeleton;