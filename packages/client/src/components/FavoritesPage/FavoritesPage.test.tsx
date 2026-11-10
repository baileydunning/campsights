import { render, screen, fireEvent, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router";
import campsiteSlice from "../../store/campsiteSlice";
import FavoritesPage from "./FavoritesPage";
import FavoriteButton from "../FavoriteButton/FavoriteButton";
import { __resetFavorites } from "../../favorites";

const site = (id: string, name: string) => ({
  id, name, url: "", lat: 40, lng: -105, state: "Utah", mapLink: "", activities: ["HIKING"], source: "BLM" as const,
});

const renderPage = (ui: React.ReactElement) => {
  const store = configureStore({
    reducer: { campsites: campsiteSlice },
    preloadedState: { campsites: { campsites: [site("a", "Alpha Flats"), site("b", "Bravo Wash")], loading: false, error: null } },
  });
  return render(<Provider store={store}><MemoryRouter>{ui}</MemoryRouter></Provider>);
};

describe("favorites", () => {
  beforeEach(() => {
    localStorage.clear();
    __resetFavorites();
  });

  it("shows an empty state with no favorites", () => {
    renderPage(<FavoritesPage />);
    expect(screen.getByText("No favorites yet")).toBeInTheDocument();
  });

  it("saves favorites to localStorage, lists them newest first, and removes them", () => {
    renderPage(
      <>
        <FavoriteButton id="a" name="Alpha Flats" />
        <FavoriteButton id="b" name="Bravo Wash" />
        <FavoritesPage />
      </>
    );
    fireEvent.click(screen.getByRole("button", { name: "Save Alpha Flats to favorites" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Bravo Wash to favorites" }));
    expect(JSON.parse(localStorage.getItem("campsights:favorites")!)).toEqual(["b", "a"]);

    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((li) => within(li).getByRole("heading").textContent)).toEqual(["Bravo Wash", "Alpha Flats"]);
    expect(within(items[0]).getByRole("link")).toHaveAttribute("href", "/campsites/b");

    fireEvent.click(within(items[0]).getByRole("button", { name: "Remove Bravo Wash from favorites" }));
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem("campsights:favorites")!)).toEqual(["a"]);
  });

  it("ignores saved IDs that are no longer in the data", () => {
    localStorage.setItem("campsights:favorites", JSON.stringify(["gone", "a"]));
    renderPage(<FavoritesPage />);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("Alpha Flats")).toBeInTheDocument();
  });
});
