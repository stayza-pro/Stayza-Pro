"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  Send,
  Search,
  Paperclip,
  Mic,
  X,
  File,
} from "lucide-react";
import { Input, Button } from "@/components/ui";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { messageService, type Conversation, type Message } from "@/services";
import toast from "react-hot-toast";

export default function RealtorMessagesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const { brandColor: primaryColor, accentColor } = useRealtorBranding();

  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
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

  const getConversationKey = (conversation: Conversation): string =>
    conversation.id ||
    conversation.bookingId ||
    conversation.propertyId ||
    conversation.otherUser.id;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/realtor/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await messageService.getConversations();
      setConversations(Array.isArray(response?.data) ? response.data : []);
    } catch {
      toast.error("Failed to load conversations");
      setConversations([]);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const fetchMessages = useCallback(async () => {
    if (!selectedConversation) return;

    try {
      setIsLoadingMessages(true);
      const conversation = conversations.find(
        (c) => getConversationKey(c) === selectedConversation,
      );

      if (!conversation) {
        setMessages([]);
        return;
      }

      const response = conversation.bookingId
        ? await messageService.getBookingMessages(conversation.bookingId)
        : conversation.propertyId
          ? await messageService.getPropertyMessages(
              conversation.propertyId,
              conversation.otherUser?.id,
            )
          : conversation.otherUser?.id
            ? await messageService.getDirectMessages(conversation.otherUser.id)
            : null;

      if (response) {
        setMessages(response.data || []);
        if (conversation.bookingId || conversation.propertyId) {
          await messageService.markConversationAsRead(
            conversation.propertyId,
            conversation.bookingId,
          );
        } else if (conversation.otherUser?.id) {
          await messageService.markConversationAsRead(
            undefined,
            undefined,
            conversation.otherUser.id,
          );
        }
      }
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedConversation, conversations]);

  useEffect(() => {
    if (selectedConversation) {
      void fetchMessages();
    }
  }, [selectedConversation, fetchMessages]);

  const handleSendMessage = async () => {
    if (
      (!messageText.trim() && selectedFiles.length === 0 && !audioBlob) ||
      !selectedConversation
    )
      return;

    try {
      setIsSending(true);
      const conversation = conversations.find(
        (c) => getConversationKey(c) === selectedConversation,
      );

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

      if (conversation?.bookingId) {
        await messageService.sendBookingMessageWithAttachments(
          conversation.bookingId,
          formData,
        );
      } else if (conversation?.propertyId) {
        if (!conversation.otherUser?.id) {
          toast.error("Unable to identify inquiry recipient");
          return;
        }

        await messageService.sendPropertyInquiryWithAttachments(
          conversation.propertyId,
          formData,
          conversation.otherUser.id,
        );
      } else if (conversation?.otherUser?.id) {
        await messageService.sendDirectMessageWithAttachments(
          conversation.otherUser.id,
          formData,
        );
      }

      setMessageText("");
      setSelectedFiles([]);
      setAudioBlob(null);
      void fetchMessages();
      toast.success("Message sent!");
    } catch (error: unknown) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } })
          .response?.data?.message === "string"
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Failed to send message";
      toast.error(message || "Failed to send message");
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredConversations = Array.isArray(conversations)
    ? conversations.filter((conv) => {
        const searchLower = searchQuery.toLowerCase();
        const otherUserName =
          `${conv.otherUser.firstName} ${conv.otherUser.lastName}`.toLowerCase();
        const propertyName = conv.property?.name?.toLowerCase() || "";
        return (
          otherUserName.includes(searchLower) ||
          propertyName.includes(searchLower)
        );
      })
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderBottomColor: primaryColor }}
        ></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="flex items-center justify-center p-8">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2"
                style={{ borderBottomColor: primaryColor }}
              ></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-600">No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={getConversationKey(conversation)}
                onClick={() =>
                  setSelectedConversation(getConversationKey(conversation))
                }
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                  selectedConversation === getConversationKey(conversation)
                    ? ""
                    : ""
                }`}
                style={
                  selectedConversation === getConversationKey(conversation)
                    ? { backgroundColor: `${primaryColor}14` }
                    : undefined
                }
              >
                <div className="flex items-start space-x-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {conversation.otherUser.firstName[0]}
                    {conversation.otherUser.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {conversation.otherUser.firstName}{" "}
                        {conversation.otherUser.lastName}
                      </h3>
                      {conversation.unreadCount > 0 && (
                        <span
                          className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white rounded-full"
                          style={{ backgroundColor: accentColor }}
                        >
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    {conversation.property && (
                      <p className="text-xs text-gray-500 mb-1">
                        {conversation.property.name}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage?.content || "No messages yet"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConversation ? (
          <>
            {/* Messages Header */}
            <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
              {conversations.find(
                (c) => getConversationKey(c) === selectedConversation,
              ) && (
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {
                      conversations.find(
                        (c) => getConversationKey(c) === selectedConversation,
                      )?.otherUser.firstName[0]
                    }
                    {
                      conversations.find(
                        (c) => getConversationKey(c) === selectedConversation,
                      )?.otherUser.lastName[0]
                    }
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {
                        conversations.find(
                          (c) => getConversationKey(c) === selectedConversation,
                        )?.otherUser.firstName
                      }{" "}
                      {
                        conversations.find(
                          (c) => getConversationKey(c) === selectedConversation,
                        )?.otherUser.lastName
                      }
                    </h2>
                    <p className="text-sm text-gray-500">
                      {
                        conversations.find(
                          (c) => getConversationKey(c) === selectedConversation,
                        )?.property?.name
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2"
                    style={{ borderBottomColor: primaryColor }}
                  ></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-600">No messages yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Start the conversation!
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.senderId === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isOwn ? "justify-end" : "justify-start"
                      }`}
                    >
                      <MessageBubble
                        message={message}
                        isOwn={isOwn}
                        primaryColor={primaryColor}
                        timestamp={new Date(
                          message.createdAt,
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        className={`max-w-md ${isOwn ? "order-2" : "order-1"}`}
                      />
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg"
                    >
                      <File className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-gray-500"
                        style={{ color: primaryColor }}
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
                    Voice note ({formatTime(recordingTime)})
                  </span>
                  <button
                    onClick={cancelRecording}
                    className="text-gray-500"
                    style={{ color: primaryColor }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="flex items-end space-x-2">
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
                >
                  <Paperclip className="h-5 w-5" />
                </button>

                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isSending}
                  className={`p-2 ${
                    isRecording
                      ? "animate-pulse"
                      : "text-gray-600 hover:text-gray-900"
                  } disabled:opacity-50`}
                  style={isRecording ? { color: primaryColor } : undefined}
                >
                  <Mic className="h-5 w-5" />
                </button>

                <div className="flex-1">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={
                      isRecording ? "Recording..." : "Type a message..."
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
                    style={{
                      outlineColor: primaryColor,
                    }}
                    rows={1}
                    disabled={isSending || isRecording}
                  />
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={
                    (!messageText.trim() &&
                      selectedFiles.length === 0 &&
                      !audioBlob) ||
                    isSending
                  }
                  style={{ backgroundColor: primaryColor }}
                  className="text-white"
                >
                  {isSending ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-600">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
