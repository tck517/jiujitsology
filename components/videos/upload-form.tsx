"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

interface UploadFormProps {
  onUploadComplete: () => void;
}

export function UploadForm({ onUploadComplete }: UploadFormProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Please select a video file.");
      return;
    }

    if (!file.type.startsWith("video/")) {
      setError("Only video files are accepted.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 500MB limit.");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/videos", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Upload failed.");
      setUploading(false);
      return;
    }

    // Reset form and notify parent
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setUploading(false);
    onUploadComplete();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="video-file">Video file</Label>
        <Input
          id="video-file"
          type="file"
          accept="video/*"
          ref={fileInputRef}
          disabled={uploading}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={uploading}>
        {uploading ? "Uploading..." : "Upload video"}
      </Button>
    </form>
  );
}
