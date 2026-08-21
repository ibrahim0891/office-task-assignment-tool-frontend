"use client";

import React, { useState, useRef, useCallback } from "react";
import ReactCrop, {
    Crop,
    PixelCrop,
    centerCrop,
    makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import toast from "react-hot-toast";

interface AvatarUploaderProps {
    avatarUrl: string;
    onChange: (url: string) => void;
}

// Helper to center a 1:1 square crop box automatically on image load
function centerAspectSquareCrop(mediaWidth: number, mediaHeight: number) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: "%",
                width: 90,
            },
            1, // 1:1 Aspect Ratio (Square)
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    );
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
    avatarUrl,
    onChange,
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(
        null,
    );
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [zoom, setZoom] = useState(1);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Process & validate selected image file
    const handleFileSelect = (file: File) => {
        if (!file) return;

        // Strict Image validation
        if (!file.type.startsWith("image/")) {
            toast.error(
                "Invalid file type! Please select an image (JPEG, PNG, WEBP, GIF).",
            );
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImageSrc(reader.result as string);
            setIsCropModalOpen(true);
            setZoom(1);
        };
        reader.readAsDataURL(file);
    };

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        imgRef.current = e.currentTarget;
        setCrop(centerAspectSquareCrop(width, height));
    };

    // Drag and Drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    // Compress cropped canvas by 70% (export JPEG at quality 0.3 / 30% quality)
    const handleCropSave = useCallback(() => {
        if (!imgRef.current || !completedCrop) {
            toast.error("Please select a crop region.");
            return;
        }

        const image = imgRef.current;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            toast.error("Failed to process image canvas.");
            return;
        }

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // Output square dimension (e.g. 400x400)
        const targetSize = 400;
        canvas.width = targetSize;
        canvas.height = targetSize;

        ctx.imageSmoothingQuality = "high";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, targetSize, targetSize);

        const cropX = completedCrop.x * scaleX;
        const cropY = completedCrop.y * scaleY;
        const cropWidth = completedCrop.width * scaleX;
        const cropHeight = completedCrop.height * scaleY;

        ctx.drawImage(
            image,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            targetSize,
            targetSize,
        );

        // Compress image quality by 70% (0.30 quality level = 70% compressed size)
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.3);

        onChange(compressedBase64);
        setIsCropModalOpen(false);
        setSelectedImageSrc(null);
    }, [completedCrop, onChange]);

    return (
        <div className="flex flex-col gap-3">
            <label className="text-[11px] font-medium text-[#888883]">
                Profile Picture (Drag & Drop or Select)
            </label>

            {/* Dropzone & Preview Box */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border border-dashed rounded-[3px] p-4 flex flex-col sm:flex-row items-center gap-4 transition-all cursor-pointer select-none ${isDragOver
                    ? "border-[#1A1A1A] bg-[#F5F5F3] scale-[1.01]"
                    : "border-[#E5E5E3] bg-[#FAFAF9] hover:border-[#888883] hover:bg-white"
                    }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            handleFileSelect(e.target.files[0]);
                        }
                    }}
                />

                {/* Avatar Display */}
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#E5E5E3] bg-white shrink-0 shadow-sm">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="Profile Avatar"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#E5E5E3] text-[#888883] font-bold text-lg">
                            ?
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col gap-1 text-center sm:text-left">
                    <span className="text-base font-medium text-[#1A1A1A]">
                        {avatarUrl
                            ? "Click or drag a new photo to replace current picture"
                            : "Drag & drop your photo here, or click to browse"}
                    </span>
                    <span className="text-base text-[#888883]">
                        Only image files (JPEG, PNG, WEBP, GIF). Auto-cropped to
                        square.
                    </span>
                </div>

                {avatarUrl && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange("");
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium text-[#CB2431] border border-[#CB2431]/20 hover:bg-[#CB2431]/10 rounded transition-colors shrink-0"
                    >
                        Remove Photo
                    </button>
                )}
            </div>

            {/* Interactive Square Crop Modal */}
            {isCropModalOpen && selectedImageSrc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white border border-[#E5E5E3] rounded-[6px] p-5 max-w-lg w-full flex flex-col gap-4 shadow-2xl text-left">
                        <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
                            <div>
                                <h3 className="font-heading text-base font-bold text-[#1A1A1A]">
                                    Crop Profile Picture
                                </h3>
                                <p className="text-[11px] text-[#888883]">
                                    Drag the box to frame your square profile
                                    photo.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCropModalOpen(false);
                                    setSelectedImageSrc(null);
                                }}
                                className="text-[#888883] hover:text-[#1A1A1A] text-lg font-semibold px-2"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Cropping Area */}
                        <div className="relative max-h-[350px] overflow-auto flex items-center justify-center bg-[#1A1A1A] p-2 rounded-[4px]">
                            <ReactCrop
                                crop={crop}
                                onChange={(_, percentCrop) =>
                                    setCrop(percentCrop)
                                }
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={1} // Strict Square aspect ratio
                                keepSelection
                                className="max-h-[320px]"
                            >
                                <img
                                    ref={imgRef}
                                    alt="Crop source"
                                    src={selectedImageSrc}
                                    onLoad={onImageLoad}
                                    style={{ transform: `scale(${zoom})` }}
                                    className="max-h-[320px] object-contain transition-transform"
                                />
                            </ReactCrop>
                        </div>

                        {/* Zoom control slider */}
                        <div className="flex items-center gap-3 px-1">
                            <span className="text-[11px] font-medium text-[#888883] shrink-0">
                                Zoom:
                            </span>
                            <input
                                type="range"
                                min={1}
                                max={2.5}
                                step={0.05}
                                value={zoom}
                                onChange={(e) =>
                                    setZoom(parseFloat(e.target.value))
                                }
                                className="w-full accent-[#1A1A1A]"
                            />
                            <span className="text-[11px] text-[#1A1A1A] font-mono shrink-0">
                                {Math.round(zoom * 100)}%
                            </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex justify-end gap-2 border-t border-[#E5E5E3] pt-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCropModalOpen(false);
                                    setSelectedImageSrc(null);
                                }}
                                className="px-3.5 py-1.5 text-base font-medium text-[#888883] hover:text-[#1A1A1A] border border-[#E5E5E3] rounded-[3px] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleCropSave}
                                className="px-4 py-1.5 text-base font-medium text-white bg-[#1A1A1A] hover:bg-[#333] rounded-[3px] transition-colors flex items-center gap-1.5"
                            >
                                ✂ Crop & Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
