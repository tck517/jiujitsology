"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Video {
  id: string;
  title: string;
  filename: string;
  status: string;
  duration_sec: number | null;
  error_message: string | null;
  created_at: string;
}

interface VideoListProps {
  videos: Video[];
}

const statusLabels: Record<string, { label: string; className: string }> = {
  uploaded: { label: "Uploaded", className: "text-muted-foreground" },
  transcribing: { label: "Transcribing", className: "text-blue-600" },
  embedding: { label: "Embedding", className: "text-blue-600" },
  extracting: { label: "Extracting", className: "text-blue-600" },
  complete: { label: "Complete", className: "text-green-600" },
  error: { label: "Error", className: "text-destructive" },
};

export function VideoList({ videos }: VideoListProps) {
  if (videos.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No videos uploaded yet. Upload your first BJJ instructional video to get
        started.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {videos.map((video) => {
        const status = statusLabels[video.status] ?? {
          label: video.status,
          className: "text-muted-foreground",
        };

        return (
          <Card key={video.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{video.title}</CardTitle>
                <span className={`text-xs font-medium ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <CardDescription>{video.filename}</CardDescription>
            </CardHeader>
            {video.error_message && (
              <CardContent>
                <p className="text-sm text-destructive">
                  {video.error_message}
                </p>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
