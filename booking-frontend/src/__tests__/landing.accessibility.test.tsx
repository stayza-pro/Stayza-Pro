import { render, screen } from "@testing-library/react";
import HomePage from "@/app/[locale]/page";

jest.mock("@/app/(marketing)/sections/HeroSection", () => ({
  HeroSection: () => <header role="banner">Hero</header>,
}));
jest.mock("@/app/(marketing)/sections/TrustBar", () => ({
  TrustBar: () => <div>Trust</div>,
}));
jest.mock("@/app/(marketing)/sections/WhySection", () => ({
  WhySection: () => <section>Why</section>,
}));
jest.mock("@/app/(marketing)/sections/CapabilitiesSection", () => ({
  CapabilitiesSection: () => <section>Capabilities</section>,
}));
jest.mock("@/app/(marketing)/sections/WorkflowSection", () => ({
  WorkflowSection: () => <section>Workflow</section>,
}));
jest.mock("@/app/(marketing)/sections/ControlCenterSection", () => ({
  ControlCenterSection: () => <section>Control</section>,
}));
jest.mock("@/app/(marketing)/sections/ExperienceSection", () => ({
  ExperienceSection: () => <section>Experience</section>,
}));
jest.mock("@/app/(marketing)/sections/SignalsSection", () => ({
  SignalsSection: () => <section>Signals</section>,
}));
jest.mock("@/app/(marketing)/sections/WaitlistSection", () => ({
  WaitlistSection: () => <section>Waitlist</section>,
}));
jest.mock("@/app/(marketing)/sections/FAQSection", () => ({
  FAQSection: () => <section>FAQ</section>,
}));
jest.mock("@/app/(marketing)/sections/FinalCTABand", () => ({
  FinalCTABand: () => (
    <a href="/get-started" aria-label="Start for free">
      Start for free
    </a>
  ),
}));
jest.mock("@/app/(marketing)/sections/FooterSection", () => ({
  FooterSection: () => <footer role="contentinfo">Footer</footer>,
}));

describe("Landing page accessibility", () => {
  it("renders core landmarks for the marketing page", () => {
    render(<HomePage />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("surfaces a primary start call-to-action", () => {
    render(<HomePage />);

    const cta = screen.getByRole("link", { name: /start for free/i });
    expect(cta).toBeVisible();
    expect(cta).toHaveAttribute("href", "/get-started");
  });
});
