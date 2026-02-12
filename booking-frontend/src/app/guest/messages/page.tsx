"use client";

import React, { useState, Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MessageCircle,
  Send,
  Search,
  Paperclip,
  Mic,
  X,
  File,
  Download,
} from "lucide-react";
import { Card, Input, Button } from "@/components/ui";
import Image from "next/image";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { Footer } from "@/components/guest/sections/Footer";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { messageService, type Conversation, type Message } from "@/services";
import toast from "react-hot-toast";

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const [authChecked, setAuthChecked] = useState(false);
  const bookingIdParam = searchParams.get("bookingId");
  const propertyIdParam = searchParams.get("propertyId");
  const hostIdParam = searchParams.get("hostId");

  // Use realtor branding hook for consistent styling
  const {
    brandColor: primaryColor, // Lighter touch - primary for CTAs
    secondaryColor, // Lighter touch - secondary for accents
    accentColor, // Lighter touch - accent for highlights
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();

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
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [hasMappedHostId, setHasMappedHostId] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mark auth as checked once we've gotten a result
  React.useEffect(() => {
    if (!isLoading && (isAuthenticated || !authChecked)) {
      setAuthChecked(true);
    }
  }, [isLoading, isAuthenticated, authChecked]);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (authChecked && !isLoading && !isAuthenticated) {
      router.push("/guest/login?returnTo=/guest/messages");
    }
  }, [isLoading, isAuthenticated, authChecked, router]);

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
      (conversation) => conversation.otherUser.id === hostIdParam
    );

    if (hostConversation) {
      const conversationId =
        hostConversation.bookingId || hostConversation.propertyId || null;
      if (conversationId) {
        setSelectedConversation(conversationId);
      }
    } else {
      if (selectedConversation === hostIdParam) {
        setSelectedConversation(null);
      }
      toast.error(
        "No existing conversation with that host yet. Open messages from a property or booking."
      );
    }

    setHasMappedHostId(true);
  }, [
    hostIdParam,
    hasMappedHostId,
    conversations,
    bookingIdParam,
    propertyIdParam,
    selectedConversation,
    isLoadingConversations,
  ]);

  // Fetch conversations on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchConversations();
    }
  }, [isAuthenticated, user]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await messageService.getConversations();

      // Handle different response structures
      let conversationsData: Conversation[] = [];

      if (response?.data) {
        if (Array.isArray(response.data)) {
          conversationsData = response.data;
        } else if (typeof response.data === "object") {
          const dataObj = response.data as any;
          if (Array.isArray(dataObj.conversations)) {
            conversationsData = dataObj.conversations;
          }
        }
      }

      setConversations(conversationsData);
    } catch (error) {
      
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
        c.propertyId === selectedConversation ||
        c.bookingId === selectedConversation
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

    if (bookingIdParam && selectedConversation === bookingIdParam) {
      return { id: bookingIdParam, type: "booking" as const };
    }

    if (propertyIdParam && selectedConversation === propertyIdParam) {
      return { id: propertyIdParam, type: "property" as const };
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
      } else {
        response = await messageService.getBookingMessages(context.id);
      }

      if (response?.success && response.data) {
        setMessages(response.data);

        // Mark conversation as read
        if (context.conversation) {
          await messageService.markConversationAsRead(
            context.conversation.propertyId,
            context.conversation.bookingId
          );
          // Refresh conversations to update unread count
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
      (!messageText.trim() && selectedFiles.length === 0 && !audioBlob) ||
      !selectedConversation
    )
      return;

    const context = resolveConversationContext();
    if (!context) {
      toast.error("Select a conversation or open messages from a booking or property.");
      return;
    }

    try {
      setIsSending(true);

      const formData = new FormData();
      if (messageText.trim()) {
        formData.append("content", messageText.trim());
      }

      // Add files
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      // Add voice note
      if (audioBlob) {
        formData.append("voiceNote", audioBlob, `voice_${Date.now()}.webm`);
      }

      let response;

      if (context.type === "property") {
        response = await messageService.sendPropertyInquiryWithAttachments(
          context.id,
          formData
        );
      } else {
        response = await messageService.sendBookingMessageWithAttachments(
          context.id,
          formData
        );
      }

      if (response?.success) {
        setMessageText("");
        setSelectedFiles([]);
        setAudioBlob(null);
        // Refresh messages
        await fetchMessages();
        // Refresh conversations to update last message
        await fetchConversations();
        toast.success("Message sent!");
      }
    } catch (error: any) {
      
      toast.error(error.response?.data?.error || "Failed to send message");
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
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error("Microphone access denied");
      
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);

    if (messageDate.toDateString() === today.toDateString()) {
      return formatTime(date);
    } else {
      return messageDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  // Show loading state while checking authentication
  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-100 rounded w-1/3"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <GuestHeader
        currentPage="messages"
        searchPlaceholder="Search messages..."
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-xs text-gray-400 mt-1">Powered by Stayza Pro</p>
        </div>

        <Card className="h-[600px] flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingConversations ? (
                <div className="p-4 sm:p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-3"></div>
                  <p className="text-gray-600 text-sm">
                    Loading conversations...
                  </p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 sm:p-8 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No conversations yet</p>
                </div>
              ) : (
                conversations
                  .filter(
                    (conversation) =>
                      conversation.otherUser.firstName
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      conversation.otherUser.lastName
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                  )
                  .map((conversation) => {
                    const conversationId =
                      conversation.propertyId || conversation.bookingId || "";
                    return (
                      <button
                        key={conversationId}
                        onClick={() => setSelectedConversation(conversationId)}
                        className="w-full p-4 flex items-start space-x-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                        style={
                          selectedConversation === conversationId
                            ? { backgroundColor: accentColor + "10" }
                            : {}
                        }
                      >
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {conversation.otherUser.firstName.charAt(0)}
                          {conversation.otherUser.lastName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-gray-900 truncate">
                              {conversation.otherUser.firstName}{" "}
                              {conversation.otherUser.lastName}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <span
                                className="text-white text-xs font-bold px-2 py-1 rounded-full"
                                style={{ backgroundColor: secondaryColor }}
                              >
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                          {conversation.property && (
                            <p className="text-xs text-gray-500 truncate mb-1">
                              {conversation.property.name}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(
                              new Date(conversation.lastMessage.createdAt)
                            )}
                          </p>
                        </div>
                      </button>
                    );
                  })
              )}
            </div>
          </div>

          {/* Message Thread */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Thread Header */}
                <div className="p-4 border-b border-gray-200 flex items-center">
                  {(() => {
                    const selectedConv = conversations.find(
                      (c) =>
                        c.propertyId === selectedConversation ||
                        c.bookingId === selectedConversation
                    );
                    if (!selectedConv) {
                      const context = resolveConversationContext();
                      if (!context) return null;

                      return (
                        <>
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold mr-3"
                            style={{ backgroundColor: primaryColor }}
                          >
                            ?
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {context.type === "booking"
                                ? "Booking Conversation"
                                : "Property Inquiry"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {context.type === "booking"
                                ? `Booking: ${context.id}`
                                : `Property: ${context.id}`}
                            </p>
                          </div>
                        </>
                      );
                    }

                    return (
                      <>
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold mr-3"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {selectedConv.otherUser.firstName.charAt(0)}
                          {selectedConv.otherUser.lastName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {selectedConv.otherUser.firstName}{" "}
                            {selectedConv.otherUser.lastName}
                          </p>
                          {selectedConv.property && (
                            <p className="text-sm text-gray-600">
                              {selectedConv.property.name}
                            </p>
                          )}
                          {selectedConv.booking && (
                            <p className="text-sm text-gray-600">
                              Booking: {selectedConv.booking.bookingReference}
                            </p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoadingMessages ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-3"></div>
                      <p className="text-gray-600">Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <p className="text-gray-600">No messages yet</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Start a conversation
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === user?.id
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className="max-w-[85%] sm:max-w-[70%] rounded-lg px-4 py-2"
                          style={
                            message.senderId === user?.id
                              ? {
                                  backgroundColor: primaryColor,
                                  color: "white",
                                }
                              : { backgroundColor: "#f3f4f6", color: "#111827" }
                          }
                        >
                          {message.content && <p>{message.content}</p>}

                          {/* Attachments */}
                          {message.attachments &&
                            message.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {message.attachments.map(
                                  (attachment: any, index: number) => (
                                    <div
                                      key={index}
                                      className={`p-2 rounded ${
                                        message.senderId === user?.id
                                          ? "bg-black bg-opacity-10"
                                          : "bg-gray-200"
                                      }`}
                                    >
                                      {attachment.type?.includes("image") ? (
                                        <Image
                                          src={attachment.url}
                                          alt={attachment.filename}
                                          width={200}
                                          height={150}
                                          className="rounded"
                                        />
                                      ) : attachment.type?.includes("audio") ? (
                                        <audio controls className="w-full">
                                          <source
                                            src={attachment.url}
                                            type={attachment.type}
                                          />
                                        </audio>
                                      ) : (
                                        <a
                                          href={attachment.url}
                                          download
                                          className="flex items-center space-x-2 hover:underline"
                                        >
                                          <File className="h-4 w-4" />
                                          <span className="text-sm">
                                            {attachment.filename}
                                          </span>
                                          <Download className="h-4 w-4" />
                                        </a>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            )}

                          <p
                            className="text-xs mt-1"
                            style={{
                              color:
                                message.senderId === user?.id
                                  ? "#ffffff"
                                  : "#6b7280",
                            }}
                          >
                            {formatTime(new Date(message.createdAt))}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg"
                        >
                          <File className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-700">
                            {file.name}
                          </span>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Voice Note Preview */}
                  {audioBlob && (
                    <div className="mb-3 flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                      <Mic className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">
                        Voice note ({formatRecordingTime(recordingTime)})
                      </span>
                      <button
                        onClick={cancelRecording}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,application/pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSending || isRecording}
                      className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      title="Attach files"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>

                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isSending}
                      className={`p-2 ${
                        isRecording
                          ? "text-red-500 animate-pulse"
                          : "text-gray-600 hover:text-gray-900"
                      } disabled:opacity-50`}
                      title={
                        isRecording ? "Stop recording" : "Record voice note"
                      }
                    >
                      <Mic className="h-5 w-5" />
                    </button>

                    <Input
                      type="text"
                      placeholder={
                        isRecording ? "Recording..." : "Type a message..."
                      }
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1"
                      disabled={isSending || isRecording}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={
                        (!messageText.trim() &&
                          selectedFiles.length === 0 &&
                          !audioBlob) ||
                        isSending
                      }
                      style={{ backgroundColor: primaryColor }}
                    >
                      {isSending ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Select a Conversation
                  </h3>
                  <p className="text-gray-600">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </main>

      <Footer
        realtorName={realtorName}
        logo={logoUrl}
        tagline={tagline || "Premium short-let properties"}
        description={description || "Experience luxury accommodations"}
        primaryColor={primaryColor}
      />
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

