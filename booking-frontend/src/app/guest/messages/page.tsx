"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  File as FileIcon,
  Mic,
  Square,
  MoreVertical,
  Paperclip,
  Search,
  Send,
  X,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { messageService, type Conversation, type Message } from "@/services";
import { MessageAttachment } from "@/components/messaging/MessageAttachment";
import toast from "react-hot-toast";

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const bookingIdParam = searchParams.get("bookingId");
  const propertyIdParam = searchParams.get("propertyId");
  const hostIdParam = searchParams.get("hostId");

  const { brandColor: primaryColor } = useRealtorBranding();

  const [authChecked, setAuthChecked] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(bookingIdParam || propertyIdParam || hostIdParam || null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVoiceBlob, setRecordedVoiceBlob] = useState<Blob | null>(null);
  const [recordedVoiceUrl, setRecordedVoiceUrl] = useState<string | null>(null);
  const [hasMappedHostId, setHasMappedHostId] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!isLoading && (isAuthenticated || !authChecked)) {
      setAuthChecked(true);
    }
  }, [isLoading, isAuthenticated, authChecked]);

  useEffect(() => {
    if (authChecked && !isLoading && !isAuthenticated) {
      router.push("/guest/login?returnTo=/guest/messages");
    }
  }, [authChecked, isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!selectedConversation) {
      if (bookingIdParam) {
        setSelectedConversation(bookingIdParam);
      } else if (propertyIdParam) {
        setSelectedConversation(propertyIdParam);
      }
    }
  }, [bookingIdParam, propertyIdParam, selectedConversation]);

  useEffect(() => {
    if (!hostIdParam || hasMappedHostId) return;
    if (bookingIdParam || propertyIdParam) return;
    if (isLoadingConversations) return;

    if (selectedConversation && selectedConversation !== hostIdParam) {
      setHasMappedHostId(true);
      return;
    }

    const hostConversation = conversations.find(
      (conversation) => conversation.otherUser.id === hostIdParam,
    );

    if (hostConversation) {
      const conversationId =
        hostConversation.id ||
        hostConversation.bookingId ||
        hostConversation.propertyId ||
        hostConversation.otherUser.id ||
        null;

      if (conversationId) {
        setSelectedConversation(conversationId);
      }
    } else {
      setSelectedConversation(hostIdParam);
      toast.success("You can start a direct conversation with this host.");
    }

    setHasMappedHostId(true);
  }, [
    hostIdParam,
    hasMappedHostId,
    bookingIdParam,
    propertyIdParam,
    isLoadingConversations,
    selectedConversation,
    conversations,
  ]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchConversations();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (recordedVoiceUrl) {
        URL.revokeObjectURL(recordedVoiceUrl);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [recordedVoiceUrl]);

  const fetchConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await messageService.getConversations();
      const conversationsData = Array.isArray(response?.data)
        ? response.data
        : [];
      setConversations(conversationsData);
    } catch {
      toast.error("Failed to load conversations");
      setConversations([]);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const resolveConversationContext = () => {
    if (!selectedConversation) return null;

    const selectedConv = conversations.find(
      (c) =>
        c.id === selectedConversation ||
        c.propertyId === selectedConversation ||
        c.bookingId === selectedConversation ||
        c.otherUser.id === selectedConversation,
    );

    if (selectedConv?.propertyId) {
      return {
        id: selectedConv.propertyId,
        type: "property" as const,
        conversation: selectedConv,
      };
    }

    if (selectedConv?.bookingId) {
      return {
        id: selectedConv.bookingId,
        type: "booking" as const,
        conversation: selectedConv,
      };
    }

    if (selectedConv?.otherUser.id) {
      return {
        id: selectedConv.otherUser.id,
        type: "direct" as const,
        conversation: selectedConv,
      };
    }

    if (bookingIdParam && selectedConversation === bookingIdParam) {
      return { id: bookingIdParam, type: "booking" as const };
    }

    if (propertyIdParam && selectedConversation === propertyIdParam) {
      return { id: propertyIdParam, type: "property" as const };
    }

    if (hostIdParam && selectedConversation === hostIdParam) {
      return { id: hostIdParam, type: "direct" as const };
    }

    return null;
  };

  const fetchMessages = async () => {
    if (!selectedConversation) return;

    try {
      setIsLoadingMessages(true);
      const context = resolveConversationContext();

      if (!context) {
        setMessages([]);
        return;
      }

      let response;
      if (context.type === "property") {
        response = await messageService.getPropertyMessages(context.id);
      } else if (context.type === "booking") {
        response = await messageService.getBookingMessages(context.id);
      } else {
        response = await messageService.getDirectMessages(context.id);
      }

      if (response?.success && response.data) {
        setMessages(response.data);

        if (context.conversation) {
          await messageService.markConversationAsRead(
            context.conversation.propertyId,
            context.conversation.bookingId,
            context.conversation.otherUser?.id,
          );
          fetchConversations();
        }
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setMessages([]);
      } else {
        toast.error("Failed to load messages");
      }
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (
      (!messageText.trim() &&
        selectedFiles.length === 0 &&
        !recordedVoiceBlob) ||
      !selectedConversation
    ) {
      return;
    }

    const context = resolveConversationContext();
    if (!context) {
      toast.error("Select a conversation to send a message.");
      return;
    }

    try {
      setIsSending(true);

      const formData = new FormData();
      if (messageText.trim()) {
        formData.append("content", messageText.trim());
      }

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      if (recordedVoiceBlob) {
        formData.append("voiceNote", recordedVoiceBlob, "voice-note.webm");
      }

      let response;
      if (context.type === "property") {
        response = await messageService.sendPropertyInquiryWithAttachments(
          context.id,
          formData,
        );
      } else if (context.type === "booking") {
        response = await messageService.sendBookingMessageWithAttachments(
          context.id,
          formData,
        );
      } else {
        response = await messageService.sendDirectMessageWithAttachments(
          context.id,
          formData,
          propertyIdParam || undefined,
        );
      }

      if (response?.success) {
        setMessageText("");
        setSelectedFiles([]);
        setRecordedVoiceBlob(null);
        if (recordedVoiceUrl) {
          URL.revokeObjectURL(recordedVoiceUrl);
          setRecordedVoiceUrl(null);
        }
        await fetchMessages();
        await fetchConversations();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 5) {
      toast.error("Maximum 5 files allowed");
      return;
    }
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeRecordedVoice = () => {
    setRecordedVoiceBlob(null);
    if (recordedVoiceUrl) {
      URL.revokeObjectURL(recordedVoiceUrl);
      setRecordedVoiceUrl(null);
    }
  };

  const startVoiceRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Voice recording is not supported on this device.");
        return;
      }

      if (recordedVoiceUrl) {
        URL.revokeObjectURL(recordedVoiceUrl);
        setRecordedVoiceUrl(null);
      }
      setRecordedVoiceBlob(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        if (blob.size > 0) {
          setRecordedVoiceBlob(blob);
          setRecordedVoiceUrl(URL.createObjectURL(blob));
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error("Unable to access your microphone.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    }

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const filteredConversations = conversations.filter((conversation) => {
    const query = searchQuery.toLowerCase();
    const fullName =
      `${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`.toLowerCase();
    const propertyName = conversation.property?.name?.toLowerCase() || "";

    return fullName.includes(query) || propertyName.includes(query);
  });

  const selectedConversationData = conversations.find(
    (c) =>
      c.id === selectedConversation ||
      c.propertyId === selectedConversation ||
      c.bookingId === selectedConversation ||
      c.otherUser.id === selectedConversation,
  );

  if (!authChecked || isLoading) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: "#f8fafc" }}
      >
        <GuestHeader currentPage="messages" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-100 rounded w-1/4" />
            <div className="h-96 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#f8fafc" }}
    >
      <GuestHeader currentPage="messages" />

      <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-80px)] max-w-[1440px] mx-auto w-full">
        <div className="h-full grid md:grid-cols-[380px_1fr]">
          <div
            className={`border-r border-gray-200 bg-white flex flex-col ${selectedConversation ? "hidden md:flex" : "flex"}`}
          >
            <div className="p-6 border-b border-gray-200">
              <h1 className="font-semibold mb-4 text-[24px] text-gray-900">
                Messages
              </h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  className="pl-10 h-10 rounded-lg bg-gray-50 border-gray-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoadingConversations ? (
                <div className="text-center py-12 px-4">
                  <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3"
                    style={{ borderBottomColor: primaryColor }}
                  />
                  <p className="text-gray-600 text-sm">
                    Loading conversations...
                  </p>
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => {
                  const conversationId =
                    conversation.id ||
                    conversation.propertyId ||
                    conversation.bookingId ||
                    conversation.otherUser.id;

                  return (
                    <button
                      key={conversationId}
                      onClick={() => setSelectedConversation(conversationId)}
                      className={`w-full p-4 rounded-xl transition-all mb-2 text-left ${
                        selectedConversation === conversationId ? "" : ""
                      }`}
                      style={
                        selectedConversation === conversationId
                          ? { backgroundColor: `${primaryColor}14` }
                          : undefined
                      }
                    >
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0 flex items-center justify-center text-sm font-semibold text-gray-700">
                          {conversation.otherUser.avatar ? (
                            <img
                              src={conversation.otherUser.avatar}
                              alt={`${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            `${conversation.otherUser.firstName.charAt(0)}${conversation.otherUser.lastName.charAt(0)}`
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="font-semibold truncate text-gray-900">
                              {conversation.otherUser.firstName}{" "}
                              {conversation.otherUser.lastName}
                            </div>
                            <div className="text-xs text-gray-500 shrink-0">
                              {formatTime(conversation.lastMessage.createdAt)}
                            </div>
                          </div>

                          <div className="text-sm text-gray-500 truncate mb-1">
                            {conversation.property?.name ||
                              "Direct conversation"}
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm text-gray-600 truncate">
                              {conversation.lastMessage.content ||
                                "Sent an attachment"}
                            </div>
                            {conversation.unreadCount > 0 && (
                              <span
                                className="shrink-0 text-xs text-white rounded-full px-2 py-1 font-semibold"
                                style={{ backgroundColor: primaryColor }}
                              >
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-12 px-4">
                  <div className="text-muted-foreground mb-4">
                    No conversations yet
                  </div>
                  <Link href="/guest/browse">
                    <Button variant="primary">Browse Properties</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {selectedConversation ? (
            <div
              className={`flex-1 flex flex-col bg-white ${
                selectedConversation ? "flex" : "hidden md:flex"
              }`}
            >
              <div className="p-6 border-b border-gray-200 bg-white flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden !p-2"
                  onClick={() => setSelectedConversation(null)}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>

                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0 flex items-center justify-center text-sm font-semibold text-gray-700">
                  {selectedConversationData?.otherUser.avatar ? (
                    <img
                      src={selectedConversationData.otherUser.avatar}
                      alt={`${selectedConversationData.otherUser.firstName} ${selectedConversationData.otherUser.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    `${selectedConversationData?.otherUser.firstName?.charAt(0) || "?"}${selectedConversationData?.otherUser.lastName?.charAt(0) || ""}`
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate text-gray-900">
                    {selectedConversationData
                      ? `${selectedConversationData.otherUser.firstName} ${selectedConversationData.otherUser.lastName}`
                      : "Conversation"}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {selectedConversationData?.property?.name ||
                      "Direct conversation"}
                  </div>
                </div>

                <Button variant="ghost" size="sm" className="!p-2">
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                {isLoadingMessages ? (
                  <div className="text-center py-12">
                    <div
                      className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3"
                      style={{ borderBottomColor: primaryColor }}
                    />
                    <p className="text-gray-600">Loading messages...</p>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => {
                    const isOwn = msg.senderId === user?.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div className="max-w-[70%]">
                          <div
                            className="p-4 rounded-2xl"
                            style={
                              isOwn
                                ? { backgroundColor: primaryColor }
                                : { backgroundColor: "#F3F4F6" }
                            }
                          >
                            {msg.content ? (
                              <p
                                className="text-sm whitespace-pre-wrap break-words"
                                style={{ color: isOwn ? "#ffffff" : "#111827" }}
                              >
                                {msg.content}
                              </p>
                            ) : null}

                            {msg.attachments && msg.attachments.length > 0 && (
                              <div
                                className={`${msg.content ? "mt-2" : ""} space-y-1`}
                              >
                                {msg.attachments.map((attachment) => (
                                  <div
                                    key={attachment.id}
                                    className={
                                      isOwn ? "text-white" : "text-gray-700"
                                    }
                                  >
                                    <MessageAttachment
                                      attachment={attachment}
                                      isOwn={isOwn}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div
                            className={`text-xs mt-1 ${isOwn ? "text-right" : "text-left"}`}
                            style={{ color: "#6B7280" }}
                          >
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No messages yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Start a conversation
                    </p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="p-6 border-t border-gray-200 bg-white">
                {selectedFiles.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"
                      >
                        <FileIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700 max-w-[160px] truncate">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {recordedVoiceUrl && (
                  <div className="mb-3 flex items-center gap-3 p-3 rounded-xl bg-gray-100">
                    <audio controls preload="metadata" className="flex-1">
                      <source src={recordedVoiceUrl} type="audio/webm" />
                    </audio>
                    <button
                      type="button"
                      onClick={removeRecordedVoice}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*,application/pdf,.doc,.docx"
                    onChange={handleFileSelect}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="!p-2 mb-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSending}
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={`!p-2 mb-1 ${isRecording ? "text-red-500" : ""}`}
                    onClick={() => {
                      if (isRecording) {
                        stopVoiceRecording();
                      } else {
                        void startVoiceRecording();
                      }
                    }}
                    disabled={isSending}
                  >
                    {isRecording ? (
                      <Square className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </Button>

                  <Input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 h-12 rounded-xl bg-gray-50 border-gray-200"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={isSending}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />

                  <Button
                    type="button"
                    size="sm"
                    className="w-12 h-12 rounded-xl text-white"
                    style={{ backgroundColor: primaryColor }}
                    onClick={handleSendMessage}
                    disabled={
                      (!messageText.trim() &&
                        selectedFiles.length === 0 &&
                        !recordedVoiceBlob) ||
                      isSending
                    }
                  >
                    {isSending ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50/20">
              <div className="text-center">
                <div className="text-gray-500 mb-2">
                  Select a conversation to start messaging
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
