export interface AudioAttachmentLike {
  type?: string;
  filename?: string;
  url?: string;
}

export const resolveAudioMimeType = (attachment: AudioAttachmentLike) => {
  const rawType = (attachment.type || "").toLowerCase();
  if (rawType.startsWith("audio/")) return rawType;

  const sourceName = `${attachment.filename || ""} ${attachment.url || ""}`.toLowerCase();
  if (sourceName.includes(".mp3")) return "audio/mpeg";
  if (sourceName.includes(".wav")) return "audio/wav";
  if (sourceName.includes(".ogg")) return "audio/ogg";
  if (sourceName.includes(".m4a")) return "audio/mp4";

  return "audio/webm";
};
