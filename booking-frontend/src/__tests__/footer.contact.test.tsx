import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Footer } from "@/components/guest/sections/Footer";
import { apiClient } from "@/services/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/services/api", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock("@/utils/subdomain", () => ({
  getRealtorSubdomain: jest.fn(() => null),
}));

jest.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: jest.fn(),
}));

const mockPost = apiClient.post as jest.Mock;
const mockUseCurrentUser = useCurrentUser as jest.Mock;

describe("Footer contact form", () => {
  beforeEach(() => {
    mockPost.mockReset();
    mockPush.mockReset();
    mockUseCurrentUser.mockReturnValue({ isAuthenticated: true });
  });

  it("submits a realtor contact request through the backend", async () => {
    mockPost.mockResolvedValue({
      success: true,
      data: {
        messageId: "msg-1",
        propertyId: "property-1",
        realtorUserId: "user-1",
      },
      message: "Inquiry sent successfully",
    });

    render(
      <Footer
        realtorName="Test Realty"
        tagline="Premium stays"
        description="Description"
        primaryColor="#1E3A8A"
        secondaryColor="#047857"
        accentColor="#F97316"
        realtorId="realtor-1"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Contact Us/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /Contact Test Realty/i })
    );

    fireEvent.change(screen.getByPlaceholderText("Tell us how we can help..."), {
      target: { value: "I need help choosing a property for next week." },
    });

    fireEvent.click(screen.getByRole("button", { name: /Send Message/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/realtors/realtor-1/contact", {
        message: "I need help choosing a property for next week.",
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Message Sent!/i)).toBeInTheDocument();
    });
  });
});
