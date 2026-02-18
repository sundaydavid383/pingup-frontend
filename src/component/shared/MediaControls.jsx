import React from "react";
import { ImageIcon, FileIcon, VideoIcon, ImageUpIcon } from "lucide-react";

const MediaControls = ({
    showMediaDropdown,
    onToggleDropdown,
    onMediaSelect,
    mediaDropdownRef,
    imageInputRef,
    fileInputRef,
    videoInputRef,
}) => {
    return (
        <div className="input-group">
            <div className="relative">
                {/* ATTACH MEDIA BUTTON */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleDropdown();
                    }}
                    className="media-button"
                    title="Attach media"
                    aria-label="Attach media (image, file, or video)"
                    aria-expanded={showMediaDropdown}
                    aria-haspopup="menu"
                >
                    <ImageUpIcon size={20} />
                </button>

                {/* MEDIA DROPDOWN - Fixed positioning with proper constraints */}
                {showMediaDropdown && (
                    <div
                        ref={mediaDropdownRef}
                        className="media-dropdown"
                        role="menu"
                        aria-label="Media upload options"
                    >
                        {/* IMAGE INPUT */}
                        <label
                            htmlFor="image"
                            className="cursor-pointer"
                            role="menuitem"
                        >
                            <ImageIcon size={18} />
                            <span>Upload Image</span>
                        </label>

                        {/* FILE INPUT */}
                        <label
                            htmlFor="file"
                            className="cursor-pointer"
                            role="menuitem"
                        >
                            <FileIcon size={18} />
                            <span>Upload File</span>
                        </label>

                        {/* VIDEO INPUT */}
                        <label
                            htmlFor="video"
                            className="cursor-pointer"
                            role="menuitem"
                        >
                            <VideoIcon size={18} />
                            <span>Upload Video</span>
                        </label>
                    </div>
                )}

                {/* HIDDEN INPUTS */}
                <input
                    ref={imageInputRef}
                    type="file"
                    id="image"
                    accept="image/*"
                    hidden
                    aria-hidden="true"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f instanceof File) {
                            onMediaSelect(f);
                        }
                        e.target.value = "";
                    }}
                />

                <input
                    ref={fileInputRef}
                    type="file"
                    id="file"
                    hidden
                    aria-hidden="true"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f instanceof File) {
                            onMediaSelect(f);
                        }
                        e.target.value = "";
                    }}
                />

                <input
                    ref={videoInputRef}
                    type="file"
                    id="video"
                    accept="video/*"
                    hidden
                    aria-hidden="true"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f instanceof File) {
                            onMediaSelect(f);
                        }
                        e.target.value = "";
                    }}
                />
            </div>
        </div>
    );
};

export default MediaControls;
