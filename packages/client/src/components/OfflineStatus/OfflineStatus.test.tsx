import { render, screen } from "@testing-library/react";
import OfflineStatus from "./OfflineStatus";

describe("OfflineStatus", () => {
    it("renders the offline status container", () => {
        render(<OfflineStatus />);
        const container = screen.getByLabelText(/offline status/i);
        expect(container).toBeInTheDocument();
        expect(container).toHaveClass("offline-status");
    });

    it("renders the offline icon with correct aria-label", () => {
        render(<OfflineStatus />);
        const icon = screen.getByRole("img", { name: /offline/i });
        expect(icon).toBeInTheDocument();
        expect(icon.parentElement).toHaveClass("offline-status__icon");
    });

    it("renders the SVG icon", () => {
        render(<OfflineStatus />);
        const svg = screen.getByRole("img", { name: /offline/i });
        expect(svg).toBeInTheDocument();
        expect(svg.tagName.toLowerCase()).toBe("svg");
        expect(svg).toHaveAttribute("width", "32");
        expect(svg).toHaveAttribute("height", "32");
    });

    it("container is focusable", () => {
        render(<OfflineStatus />);
        const container = screen.getByLabelText(/offline status/i);
        expect(container).toHaveAttribute("tabindex", "0");
    });
});