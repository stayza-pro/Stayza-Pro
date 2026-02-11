import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Footer } from "@/components/guest/sections/Footer";
import { apiClient } from "@/services/api";

jest.mock("@/services/api", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock("@/utils/subdomain", () => ({
  getRealtorSubdomain: jest.fn(() => null),
}));

const mockPost = apiClient.post as jest.Mock;

describe("Footer contact form", () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it("submits a realtor contact request through the backend", async () => {
    mockPost.mockResolvedValue({
      success: true,
      message: "Message sent successfully",
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

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("john@example.com"), {
      target: { value: "jane@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Tell us how we can help..."), {
      target: { value: "I need help choosing a property for next week." },
    });

    fireEvent.click(screen.getByRole("button", { name: /Send Message/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/realtors/realtor-1/contact", {
        name: "Jane Doe",
        email: "jane@example.com",
        message: "I need help choosing a property for next week.",
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Message Sent!/i)).toBeInTheDocument();
    });
  });
});
