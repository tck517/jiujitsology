"use client";

import { useState, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { hashFile } from "@/lib/hash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

interface UploadFormProps {
  onUploadComplete: () => void;
}

export function UploadForm({ onUploadComplete }: UploadFormProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [instructor, setInstructor] = useState("");
  const [instructional, setInstructional] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setProgress(null);

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
      setError("File size exceeds 5GB limit.");
      return;
    }

    setUploading(true);

    // Step 1: Compute content hash
    setProgress("Computing file hash...");
    let contentHash: string;
    try {
      contentHash = await hashFile(file);
    } catch {
      setError("Failed to compute file hash.");
      setUploading(false);
      setProgress(null);
      return;
    }

    // Step 2: Check for duplicate
    setProgress("Checking for duplicates...");
    const dupResponse = await fetch("/api/videos/check-duplicate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content_hash: contentHash }),
    });

    if (dupResponse.ok) {
      const dupData = await dupResponse.json();
      if (dupData.duplicate) {
        setError(
          `This video has already been uploaded as "${dupData.existing_title}".`
        );
        setUploading(false);
        setProgress(null);
        return;
      }
    }

    // Step 3: Upload to storage
    setProgress("Uploading to storage...");

    const supabase = createBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to upload.");
      setUploading(false);
      setProgress(null);
      return;
    }

    const fileId = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${user.id}/${fileId}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      setProgress(null);
      return;
    }

    // Step 4: Create database record
    setProgress("Saving video record...");

    const response = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: file.name.replace(/\.[^/.]+$/, ""),
        filename: file.name,
        storage_path: storagePath,
        content_hash: contentHash,
        instructor: instructor.trim() || null,
        instructional: instructional.trim() || null,
      }),
    });

    if (!response.ok) {
      await supabase.storage.from("videos").remove([storagePath]);
      const data = await response.json();
      setError(data.error || "Failed to save video record.");
      setUploading(false);
      setProgress(null);
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setInstructor("");
    setInstructional("");
    setUploading(false);
    setProgress(null);
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
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="instructor">Instructor</Label>
          <Input
            id="instructor"
            type="text"
            placeholder="e.g., John Danaher"
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
            disabled={uploading}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="instructional">Instructional</Label>
          <Input
            id="instructional"
            type="text"
            placeholder="e.g., Enter the System"
            value={instructional}
            onChange={(e) => setInstructional(e.target.value)}
            disabled={uploading}
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {progress && (
        <p className="text-sm text-muted-foreground">{progress}</p>
      )}
      <Button type="submit" disabled={uploading}>
        {uploading ? "Uploading..." : "Upload video"}
      </Button>
    </form>
  );
}
