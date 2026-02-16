"use client";

import React from "react";
import Image from "next/image";
import { FileText, Download } from "lucide-react";
import { resolveAudioMimeType } from "@/utils/audio";

interface MessageAttachmentData {
  url: string;
  filename: string;
  type?: string;
}

interface MessageAttachmentProps {
  attachment: MessageAttachmentData;
  isOwn: boolean;
}

const inferAttachmentType = (attachment: MessageAttachmentData) => {
  if (attachment.type) {
    return attachment.type.toLowerCase();
  }

  const source =
    `${attachment.filename || ""} ${attachment.url || ""}`.toLowerCase();

  if (/\.(png|jpg|jpeg|gif|webp|avif|svg)(\?|$)/.test(source)) {
    return "image";
  }

  if (/\.(mp3|wav|ogg|m4a|aac|webm)(\?|$)/.test(source)) {
    return "audio";
  }

  return "file";
};

export function MessageAttachment({
  attachment,
  isOwn,
}: MessageAttachmentProps) {
  const resolvedType = inferAttachmentType(attachment);

  if (resolvedType.includes("image")) {
    return (
      <Image
        src={attachment.url}
        alt={attachment.filename}
        width={220}
        height={160}
        className="rounded-md max-w-full h-auto"
      />
    );
  }

  if (resolvedType.includes("audio") || resolvedType === "voice") {
    return (
      <audio
        controls
        preload="metadata"
        className="w-full min-w-[220px] max-w-full rounded-md"
      >
        <source src={attachment.url} type={resolveAudioMimeType(attachment)} />
      </audio>
    );
  }

  return (
    <a
      href={attachment.url}
      download
      className={`flex items-center gap-2 text-sm ${isOwn ? "text-white" : "text-gray-700"}`}
    >
      <FileText className="h-4 w-4" />
      <span className="truncate">{attachment.filename}</span>
      <Download className="h-4 w-4" />
    </a>
  );
}
