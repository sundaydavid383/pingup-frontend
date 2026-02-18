export default function ProfileSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 space-y-8 animate-pulse overflow-visible">

      {/* COVER */}
      <div className="w-full h-40 sm:h-48 md:h-56 bg-gray-200 rounded-xl" />

      {/* HEADER SECTION */}
      <div className="relative flex flex-col items-center md:items-start">

        {/* Avatar */}
        <div className="w-28 h-28 rounded-full bg-gray-200 -mt-14 border-4 border-white shadow-lg" />

        {/* Name + Actions */}
        <div className="w-full mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

          <div className="text-center md:text-left space-y-2">
            <div className="h-6 bg-gray-200 rounded w-48 mx-auto md:mx-0" />
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto md:mx-0" />
          </div>

          <div className="flex gap-3 justify-center">
            <div className="h-9 w-24 bg-gray-200 rounded-lg" />
            <div className="h-9 w-28 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>

      {/* BIO */}
      <div className="space-y-2 max-w-2xl mx-auto md:mx-0">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
      </div>

      {/* DETAILS */}
      <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4 border-t border-gray-100">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 border-y border-gray-100 py-6">
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>

      {/* CHAT BUTTON */}
      <div className="flex justify-center">
        <div className="h-10 w-40 bg-gray-200 rounded-lg" />
      </div>

      {/* PROFILE VIEWERS */}
      <div className="bg-gray-100 rounded-xl p-4">
        <div className="h-4 bg-gray-200 rounded w-32 mx-auto" />
      </div>

      {/* CONNECTIONS */}
      <div className="pt-4 space-y-4">
        <div className="h-5 bg-gray-200 rounded w-32 mx-auto md:mx-0" />
        <div className="flex justify-center md:justify-start gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-10 h-10 rounded-full bg-gray-200" />
          ))}
        </div>
      </div>

      {/* TABS */}
      <div className="flex justify-center md:justify-start gap-4 pt-4">
        <div className="h-8 w-20 bg-gray-200 rounded-full" />
        <div className="h-8 w-20 bg-gray-200 rounded-full" />
        <div className="h-8 w-20 bg-gray-200 rounded-full" />
      </div>

      {/* POSTS PLACEHOLDER */}
      <div className="space-y-4 pt-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
