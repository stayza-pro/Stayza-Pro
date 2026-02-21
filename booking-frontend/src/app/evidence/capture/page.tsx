"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Camera,
  Circle,
  Download,
  Loader2,
  Video,
  VideoOff,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import {
  disputeService,
  type CaptureContextResponse,
} from "@/services/disputes";
import { bookingService } from "@/services/bookings";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import toast from "react-hot-toast";

const toWatermarkTimestamp = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

export default function EvidenceCapturePage() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-3xl p-6">
          <Card className="p-8 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            <span className="ml-2 text-sm text-gray-600">
              Loading capture page...
            </span>
          </Card>
        </div>
      }
    >
      <EvidenceCaptureContent />
    </React.Suspense>
  );
}

function EvidenceCaptureContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCurrentUser();

  const bookingId = searchParams.get("booking") || "";

  const [context, setContext] = React.useState<CaptureContextResponse | null>(
    null,
  );
  const [bookingTitle, setBookingTitle] = React.useState<string>("Booking");
  const [loading, setLoading] = React.useState(true);
  const [capturing, setCapturing] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [lastUploadedUrl, setLastUploadedUrl] = React.useState<string | null>(
    null,
  );
  const [lastCertificate, setLastCertificate] = React.useState<string | null>(
    null,
  );

  const [serverClock, setServerClock] = React.useState<Date | null>(null);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const hiddenSourceRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const animationRef = React.useRef<number | null>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  const releaseCamera = React.useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }

    const current = streamRef.current;
    if (current) {
      current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (hiddenSourceRef.current) {
      hiddenSourceRef.current.srcObject = null;
    }
  }, []);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const returnTo = `/evidence/capture?booking=${encodeURIComponent(bookingId)}`;
      router.push(`/guest/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [bookingId, isAuthenticated, isLoading, router]);

  React.useEffect(() => {
    const load = async () => {
      if (!bookingId || !isAuthenticated) return;
      setLoading(true);
      try {
        const [captureContext, booking] = await Promise.all([
          disputeService.getEvidenceCaptureContext(bookingId),
          bookingService.getBooking(bookingId),
        ]);
        setContext(captureContext);
        setBookingTitle(booking?.property?.title || "Booking");

        const serverMs = new Date(captureContext.serverNow).getTime();
        const localMs = Date.now();
        const id = window.setInterval(() => {
          const nowMs = serverMs + (Date.now() - localMs);
          setServerClock(new Date(nowMs));
        }, 250);
        setServerClock(new Date(serverMs));

        return () => window.clearInterval(id);
      } catch (error: any) {
        toast.error(error?.message || "Failed to load capture context");
      } finally {
        setLoading(false);
      }
    };

    const cleanupPromise = load();
    return () => {
      if (cleanupPromise instanceof Promise) {
        cleanupPromise.then((cleanup) => {
          if (typeof cleanup === "function") {
            cleanup();
          }
        });
      }
      releaseCamera();
    };
  }, [bookingId, isAuthenticated, releaseCamera]);

  const buildWatermark = React.useCallback(() => {
    const now = serverClock || new Date();
    return `Stayza Pro • ${toWatermarkTimestamp(now)} • ${bookingId}`;
  }, [bookingId, serverClock]);

  const startCamera = async () => {
    if (!bookingId) {
      toast.error("Missing booking id");
      return;
    }

    try {
      setCapturing(true);
      releaseCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if (hiddenSourceRef.current) {
        hiddenSourceRef.current.srcObject = stream;
        await hiddenSourceRef.current.play();
      }
    } catch (error: any) {
      setCapturing(false);
      toast.error(error?.message || "Unable to access camera");
    }
  };

  const drawFrameWithWatermark = React.useCallback(() => {
    const source = hiddenSourceRef.current;
    const canvas = canvasRef.current;
    if (!source || !canvas) return;

    const width = source.videoWidth || 1280;
    const height = source.videoHeight || 720;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const context2d = canvas.getContext("2d");
    if (!context2d) return;

    context2d.drawImage(source, 0, 0, width, height);

    const text = buildWatermark();
    const fontSize = Math.max(16, Math.floor(width * 0.018));
    context2d.font = `${fontSize}px Inter, Arial, sans-serif`;
    const padding = Math.max(12, Math.floor(fontSize * 0.7));
    const textWidth = context2d.measureText(text).width;
    const badgeWidth = textWidth + padding * 2;
    const badgeHeight = fontSize + padding;
    const x = 16;
    const y = height - badgeHeight - 16;

    context2d.fillStyle = "rgba(0, 0, 0, 0.62)";
    context2d.fillRect(x, y, badgeWidth, badgeHeight);

    context2d.fillStyle = "#ffffff";
    context2d.fillText(text, x + padding, y + badgeHeight - padding / 2);
  }, [buildWatermark]);

  const uploadBlob = async (blob: Blob, captureType: "PHOTO" | "VIDEO") => {
    if (!context) return;

    setUploading(true);
    try {
      const extension = captureType === "PHOTO" ? "jpg" : "webm";
      const mime =
        captureType === "PHOTO" ? "image/jpeg" : blob.type || "video/webm";
      const file = new File(
        [blob],
        `stayza-evidence-${Date.now()}.${extension}`,
        {
          type: mime,
        },
      );

      const uploaded = await disputeService.uploadTrustedEvidence(
        file,
        context.bookingId,
        captureType,
      );

      setLastUploadedUrl(uploaded.fileUrl);
      setLastCertificate(uploaded.certificateJwt);
      toast.success("Trusted evidence uploaded with certificate.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload trusted evidence");
    } finally {
      setUploading(false);
    }
  };

  const capturePhoto = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    drawFrameWithWatermark();

    await new Promise<void>((resolve) => {
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            toast.error("Failed to capture photo");
            resolve();
            return;
          }
          await uploadBlob(blob, "PHOTO");
          resolve();
        },
        "image/jpeg",
        0.92,
      );
    });
  };

  const startRecording = () => {
    const sourceStream = streamRef.current;
    const canvas = canvasRef.current;
    if (!sourceStream || !canvas) {
      toast.error("Start camera first");
      return;
    }

    chunksRef.current = [];

    const tick = () => {
      drawFrameWithWatermark();
      animationRef.current = requestAnimationFrame(tick);
    };
    tick();

    const captureStream = canvas.captureStream(24);
    sourceStream
      .getAudioTracks()
      .forEach((track) => captureStream.addTrack(track));

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";

    const recorder = new MediaRecorder(captureStream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = async () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setRecording(false);
      const blob = new Blob(chunksRef.current, { type: mimeType });
      if (blob.size > 0) {
        await uploadBlob(blob, "VIDEO");
      }
    };

    recorder.start(500);
    setRecording(true);
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  };

  const downloadLastCopy = () => {
    if (!lastUploadedUrl) return;
    window.open(lastUploadedUrl, "_blank", "noopener,noreferrer");
  };

  if (isLoading || loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Card className="p-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
          <span className="ml-2 text-sm text-gray-600">
            Loading capture page...
          </span>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <Card className="p-5 space-y-2">
        <h1 className="text-xl font-semibold text-gray-900">
          Verified Evidence Capture
        </h1>
        <p className="text-sm text-gray-600">{bookingTitle}</p>
        <p className="text-xs text-gray-500">Booking: {bookingId}</p>
        <p className="text-xs text-gray-500">
          Role: {context?.role || user?.role}
        </p>
        <p className="text-xs text-gray-700 font-medium">{buildWatermark()}</p>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="rounded-xl overflow-hidden bg-black/90">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full aspect-video object-cover"
          />
          <video
            ref={hiddenSourceRef}
            autoPlay
            muted
            playsInline
            className="hidden"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={startCamera} disabled={capturing || uploading}>
            <Camera className="h-4 w-4 mr-2" />
            Start Camera
          </Button>
          <Button
            onClick={capturePhoto}
            disabled={!capturing || recording || uploading}
            variant="outline"
          >
            <Circle className="h-4 w-4 mr-2" />
            Capture Photo
          </Button>
          {!recording ? (
            <Button
              onClick={startRecording}
              disabled={!capturing || uploading}
              variant="outline"
            >
              <Video className="h-4 w-4 mr-2" />
              Start Video
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              disabled={uploading}
              variant="outline"
            >
              <VideoOff className="h-4 w-4 mr-2" />
              Stop Video
            </Button>
          )}
          <Button
            onClick={releaseCamera}
            disabled={!capturing}
            variant="outline"
          >
            Stop Camera
          </Button>
        </div>

        {uploading && (
          <div className="text-sm text-indigo-600 flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading trusted
            evidence...
          </div>
        )}

        {lastUploadedUrl && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 space-y-1">
            <p>Trusted evidence uploaded successfully.</p>
            <p className="text-xs break-all">Certificate: {lastCertificate}</p>
            <div>
              <Button size="sm" variant="outline" onClick={downloadLastCopy}>
                <Download className="h-4 w-4 mr-2" />
                Download Copy
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
