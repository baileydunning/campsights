import { render, screen, fireEvent } from "@testing-library/react";
import InfoTip from "./InfoTip";

describe("InfoTip", () => {
  it("toggles the note when the button is tapped and closes on Escape", () => {
    render(<InfoTip label="About this data">Not every location is a campsite.</InfoTip>);
    const button = screen.getByRole("button", { name: "About this data" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Not every location is a campsite.");
    expect(button).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    fireEvent.click(button);
    fireEvent.click(button);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("closes when tapping somewhere else", () => {
    render(
      <div>
        <InfoTip label="About this data">Note</InfoTip>
        <p>Elsewhere</p>
      </div>
    );
    fireEvent.click(screen.getByRole("button", { name: "About this data" }));
    fireEvent.pointerDown(screen.getByText("Elsewhere"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
