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

    const primaryCtas = screen.getAllByRole("button", {
      name: /get started free/i,
    });

    expect(primaryCtas.length).toBeGreaterThan(0);
    primaryCtas.forEach((cta) => {
      expect(cta).toBeVisible();
    });
  });
});
