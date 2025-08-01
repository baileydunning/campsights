import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import WeatherCard from "./WeatherCard";
import * as CampsitesApi from "../../api/Campsites";

vi.mock("../../api/Campsites");

const mockWeather = [
    {
        number: 1,
        name: "Monday",
        isDaytime: true,
        temperature: 75,
        temperatureUnit: "F",
        windSpeed: "10 mph",
        windDirection: "NW",
        detailedForecast: "Sunny and warm.",
    },
    {
        number: 2,
        name: "Monday Night",
        isDaytime: false,
        temperature: 55,
        temperatureUnit: "F",
        windSpeed: "5 mph",
        windDirection: "N",
        detailedForecast: "Clear and cool.",
    },
];

describe("WeatherCard", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("renders loading spinner initially", () => {
        (CampsitesApi.getCampsiteById as any).mockReturnValue(new Promise(() => { }));
        render(<WeatherCard campsiteId="123" />);
        expect(document.querySelector(".spinner")).toBeInTheDocument();
    });

    it("renders weather data when fetched", async () => {
        (CampsitesApi.getCampsiteById as any).mockResolvedValue({ weather: mockWeather });
        render(<WeatherCard campsiteId="123" />);
        await waitFor(() => {
            expect(screen.getByText(/Monday \(Day\)/)).toBeInTheDocument();
            expect(screen.getAllByText(/Temp:/)).toHaveLength(2);
            expect(screen.getByText(/Sunny and warm/)).toBeInTheDocument();
            expect(screen.getByText(/Monday Night \(Night\)/)).toBeInTheDocument();
            expect(screen.getByText(/Clear and cool/)).toBeInTheDocument();
        });
    });

    it("renders no weather data message if weather is empty", async () => {
        (CampsitesApi.getCampsiteById as any).mockResolvedValue({ weather: [] });
        render(<WeatherCard campsiteId="123" />);
        await waitFor(() => {
            expect(screen.getByText(/no weather data available/i)).toBeInTheDocument();
        });
    });

    it("renders error message on fetch failure", async () => {
        (CampsitesApi.getCampsiteById as any).mockRejectedValue(new Error("fail"));
        render(<WeatherCard campsiteId="123" />);
        await waitFor(() => {
            expect(screen.getByText(/failed to fetch weather/i)).toBeInTheDocument();
        });
    });

    it("renders no weather data message if weather is not an array", async () => {
        (CampsitesApi.getCampsiteById as any).mockResolvedValue({ weather: null });
        render(<WeatherCard campsiteId="123" />);
        await waitFor(() => {
            expect(screen.getByText(/no weather data available/i)).toBeInTheDocument();
        });
    });
});