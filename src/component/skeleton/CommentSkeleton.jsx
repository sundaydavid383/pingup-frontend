    function CommentSkeleton() {
    return (
        <div className="flex items-start gap-3 animate-pulse">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0"></div>

        {/* Comment content */}
        <div className="flex-1 space-y-2 mb-3">
            {/* Username */}
            <div className="w-24 h-3 bg-gray-200 rounded"></div>

            {/* Text lines */}
            <div className="space-y-1">
            <div className="w-full h-3 bg-gray-200 rounded"></div>
            <div className="w-5/6 h-3 bg-gray-200 rounded"></div>
            </div>

            {/* Timestamp / meta */}
            <div className="w-16 h-2 bg-gray-200 rounded mt-1"></div>
        </div>

        {/* Actions (optional) */}
        <div className="flex flex-col gap-2">
            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
        </div>
        </div>
    );
    }
    export default CommentSkeleton;

