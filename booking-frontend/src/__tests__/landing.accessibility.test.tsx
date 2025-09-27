import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

describe("Landing page accessibility", () => {
  const renderPage = () => render(<HomePage />);

  it("exposes the core landmarks", () => {
    renderPage();

    const banners = screen.getAllByRole("banner");

    expect(banners).toHaveLength(1);
    expect(banners[0]).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("provides a labelled primary navigation", () => {
    renderPage();

    expect(
      screen.getByRole("navigation", { name: /primary navigation/i })
    ).toBeInTheDocument();
  });

  it("surfaces the primary calls to action", () => {
    renderPage();

    const launchCta = screen.getByRole("link", {
      name: /launch your booking site/i,
    });

    expect(launchCta).toBeVisible();
    expect(launchCta).toHaveAttribute("href", "/get-started");

    const startForFreeCtas = screen.getAllByRole("link", {
      name: /start for free/i,
    });

    expect(startForFreeCtas.length).toBeGreaterThan(0);
    startForFreeCtas.forEach((cta) => {
      expect(cta).toBeVisible();
      expect(cta).toHaveAttribute("href", "/get-started");
    });
  });
});
