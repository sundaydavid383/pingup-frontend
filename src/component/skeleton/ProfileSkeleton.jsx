const ProfileSkeleton = () => {
  return (
    <div className="profile-main animate-pulse">
      {/* ================= PROFILE CARD ================= */}
      <div className="profile-card bg-white rounded-2xl shadow-lg overflow-hidden">

        {/* Cover */}
        <div className="cover-wrapper">
          <div className="h-48 md:h-56 w-full bg-gray-300" />
        </div>

        {/* USER INFO ROW */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 p-6 md:p-10">
          {/* Avatar */}
          <div className="flex justify-center md:justify-start">
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gray-300" />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="h-6 w-56 bg-gray-300 rounded mx-auto md:mx-0" />
            <div className="h-4 w-40 bg-gray-300 rounded mx-auto md:mx-0" />

            {/* Buttons */}
            <div className="flex gap-3 justify-center md:justify-start mt-4">
              <div className="h-9 w-28 bg-gray-300 rounded-lg" />
              <div className="h-9 w-32 bg-gray-300 rounded-lg" />
            </div>
          </div>
        </div>

        {/* BIO */}
        <div className="px-6 md:px-10 space-y-2">
          <div className="h-4 w-full bg-gray-300 rounded" />
          <div className="h-4 w-4/5 bg-gray-300 rounded" />
        </div>

        {/* DETAILS */}
        <div className="flex flex-wrap gap-x-6 gap-y-3 px-6 md:px-10 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-4 w-36 bg-gray-300 rounded"
            />
          ))}
        </div>

        {/* STATS */}
        <div className="flex justify-between border-t border-gray-200 mt-8 pt-5 px-6 md:px-10">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-1 text-center space-y-2">
              <div className="h-6 w-10 bg-gray-300 rounded mx-auto" />
              <div className="h-3 w-16 bg-gray-300 rounded mx-auto" />
            </div>
          ))}
        </div>

        {/* CONNECTIONS */}
        <div className="px-6 md:px-10 mt-10">
          <div className="h-6 w-32 bg-gray-300 rounded mb-6" />

          <div className="connections-stack flex">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="stack-item"
                style={{ zIndex: 100 - i }}
              >
                <div className="stack-img w-12 h-12 rounded-full bg-gray-300" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= TABS ================= */}
      <div className="tabs-wrapper mt-10">
        <div className="tabs-container flex gap-2 max-w-md mx-auto">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-9 bg-gray-300 rounded-lg"
            />
          ))}
        </div>
      </div>

      {/* ================= POSTS ================= */}
      <div className="posts-wrapper mt-10 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 p-4 bg-white rounded-xl shadow-md"
          >
            <div className="w-12 h-12 rounded-full bg-gray-300 shrink-0" />

            <div className="flex-1 space-y-3">
              <div className="h-4 w-1/3 bg-gray-300 rounded" />
              <div className="h-3 w-full bg-gray-300 rounded" />
              <div className="h-12 w-full bg-gray-300 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileSkeleton;
