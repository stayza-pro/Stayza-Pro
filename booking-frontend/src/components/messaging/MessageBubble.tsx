"use client";

import React from "react";
import type { Message } from "@/services";
import { MessageAttachment } from "./MessageAttachment";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  primaryColor: string;
  timestamp: string;
  className?: string;
}

export function MessageBubble({
  message,
  isOwn,
  primaryColor,
  timestamp,
  className,
}: MessageBubbleProps) {
  return (
    <div className={className}>
      <div
        className="rounded-2xl px-4 py-3 shadow-sm"
        style={
          isOwn
            ? { backgroundColor: primaryColor, color: "#ffffff" }
            : {
                backgroundColor: "#ffffff",
                color: "#111827",
                border: "1px solid #e5e7eb",
              }
        }
      >
        {message.content && (
          <p className="text-sm break-words">{message.content}</p>
        )}

        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment, index) => (
              <div
                key={`${message.id}-attachment-${index}`}
                className="p-2 rounded"
                style={
                  isOwn
                    ? { backgroundColor: "rgba(0,0,0,0.12)" }
                    : { backgroundColor: "#f3f4f6" }
                }
              >
                <MessageAttachment attachment={attachment} isOwn={isOwn} />
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">{timestamp}</p>
    </div>
  );
}
