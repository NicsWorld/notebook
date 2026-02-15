import { useState, useRef, useCallback } from "react";
import { uploadPage } from "../api/client";

interface CameraCaptureProps {
    onUploadComplete: (pageId: string) => void;
}

export function CameraCapture({ onUploadComplete }: CameraCaptureProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            setError("File must be under 20MB");
            return;
        }

        setError(null);
        setSelectedFile(file);

        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setError(null);

        try {
            const result = await uploadPage(selectedFile);
            onUploadComplete(result.id);
            setPreview(null);
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const clearPreview = () => {
        setPreview(null);
        setSelectedFile(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div>
            <div
                className={`upload-zone ${dragOver ? "drag-over" : ""} ${uploading ? "uploading" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="upload-input"
                    onChange={handleInputChange}
                />
                <div className="upload-icon">📷</div>
                <div className="upload-title">
                    {uploading ? "Uploading..." : "Capture or Upload a Notebook Page"}
                </div>
                <div className="upload-subtitle">
                    Tap to open camera • Drag & drop an image • Click to browse
                </div>
            </div>

            {error && (
                <div className="toast error" style={{ position: "relative", bottom: "auto", right: "auto", marginTop: "var(--space-md)" }}>
                    ⚠️ {error}
                </div>
            )}

            {preview && (
                <div style={{ textAlign: "center", marginTop: "var(--space-lg)" }}>
                    <div className="image-preview">
                        <img src={preview} alt="Preview" />
                        <button className="image-preview-close" onClick={(e) => { e.stopPropagation(); clearPreview(); }}>
                            ✕
                        </button>
                    </div>
                    <div style={{ marginTop: "var(--space-md)" }}>
                        <button
                            className="btn btn-primary"
                            onClick={handleUpload}
                            disabled={uploading}
                        >
                            {uploading && <span className="spinner" />}
                            {uploading ? "Processing..." : "📓 Digitize This Page"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
