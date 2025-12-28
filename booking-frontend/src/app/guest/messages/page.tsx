"use client";

import React, { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageCircle, Send, Search } from "lucide-react";
import { Card, Input, Button } from "@/components/ui";
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
  >(searchParams.get("hostId") || null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

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

  // Fetch conversations on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchConversations();
    }
  }, [isAuthenticated, user]);

  // Fetch messages when constring | Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDate = (date: string |= async () => {
    try {
      setIsLoadingConversations(true);
      const response = await messageService.getConversations();
      if (response.success && response.data) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation) return;

    try {
      setIsLoadingMessages(true);
      const selectedConv = conversations.find(
        (c) => c.propertyId === selectedConversation || c.bookingId === selectedConversation
      );

      if (!selectedConv) return;

      let response;
      if (selectedConv.propertyId) {
        response = await messageService.getPropertyMessages(selectedConv.propertyId);
      } else if (selectedConv.bookingId) {
        response = await messageService.getBookingMessages(selectedConv.bookingId);
      }

      if (response?.success && response.data) {
        setMessages(response.data);
        
        // Mark conversation as read
        if (selectedConv.propertyId || selectedConv.bookingId) {
          await messageService.markConversationAsRead(
            selectedConv.propertyId,
            selectedConv.bookingId
          );
          // Refresh conversations to update unread count
          fetchConversations();
        }
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    const selectedConv = conversations.find(
      (c) => c.propertyId === selectedConversation || c.bookingId === selectedConversation
    );

    if (!selectedConv) return;

    try {
      setIsSending(true);
      let response;

      if (selectedConv.propertyId) {
        response = await messageService.sendPropertyInquiry(selectedConv.propertyId, {
          content: messageText.trim(),
        });
      } else if (selectedConv.bookingId) {
        response = await messageService.sendBookingMessage(selectedConv.bookingId, {
          content: messageText.trim(),
        });
      }

      if (response?.success) {
        setMessageText("");
        // Refresh messages
        await fetchMessages();
        // Refresh conversations to update last message
        await fetchConversations();
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);
      toast.error(error.response?.data?.error || "Failed to send message");
    } finally {
      setIsSending(false);
    }
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
        <div className="flex items-start justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
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
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-3"></div>
                  <p className="text-gray-600 text-sm">Loading conversations...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No conversations yet</p>
                </div>
              ) : (
                conversations
                  .filter((conversation) =>
                    conversation.otherUser.firstName
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    conversation.otherUser.lastName
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
                  )
                  .map((conversation) => {
                    const conversationId = conversation.propertyId || conversation.bookingId || "";
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
                            {formatDate(conversation.lastMessage.createdAt)}
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
                      (c) => c.propertyId === selectedConversation || c.bookingId === selectedConversation
                    );
                    if (!selectedConv) return null;
                    
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
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-3"></div>
                      <p className="text-gray-600">Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
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
                          className="max-w-[70%] rounded-lg px-4 py-2"
                          style={
                            message.senderId === user?.id
                              ? {
                                  backgroundColor: primaryColor,
                                  color: "white",
                                }
                              : { backgroundColor: "#f3f4f6", color: "#111827" }
                          }
                        >
                          <p>{message.content}</p>
                          <p
                            className="text-xs mt-1"
                            style={{
                              color:
                                message.senderId === user?.id
                                  ? "#ffffff"
                                  : "#6b7280",
                            }}
                          >
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1"
                      disabled={isSending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || isSending}
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
