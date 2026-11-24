// Replace with your active OpenWeatherMap API key
const API_KEY = typeof WEATHER_API_KEY !== "undefined" ? WEATHER_API_KEY : "";
const API_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

// DOM Elements
const formEl = document.getElementById("weather-form");
const cityInputEl = document.getElementById("city-input");
const searchBtnEl = document.getElementById("search-btn");
const chipButtons = document.querySelectorAll(".chip-btn");

const loadingSection = document.getElementById("loading-state");
const errorSection = document.getElementById("error-state");
const errorMessageEl = document.getElementById("error-message");
const weatherSection = document.getElementById("weather-result");

const cityHeadingEl = document.getElementById("city-heading");
const weatherDescEl = document.getElementById("weather-desc");
const weatherIconEl = document.getElementById("weather-icon");
const temperatureEl = document.getElementById("temperature");
const updatedTimeEl = document.getElementById("updated-time");
const feelsLikeEl = document.getElementById("feels-like");
const humidityEl = document.getElementById("humidity");
const windSpeedEl = document.getElementById("wind-speed");
const pressureEl = document.getElementById("pressure");

function setLoadingState(isLoading) {
  loadingSection.classList.toggle("hidden", !isLoading);
  searchBtnEl.disabled = isLoading;

  if (isLoading) {
    errorSection.classList.add("hidden");
    weatherSection.classList.add("hidden");
  }
}

function showError(message) {
  loadingSection.classList.add("hidden");
  weatherSection.classList.add("hidden");
  errorMessageEl.textContent = message;
  errorSection.classList.remove("hidden");
}

function renderWeatherData(data) {
  const {
    name,
    sys: { country } = {},
    main: { temp, feels_like, humidity, pressure } = {},
    wind: { speed } = {},
    weather = [],
  } = data;

  const condition = weather[0] || {};
  const windKmh = typeof speed === "number" ? (speed * 3.6).toFixed(1) : "--";

  cityHeadingEl.textContent = country ? `${name}, ${country}` : name;
  weatherDescEl.textContent = condition.description || "Current conditions";
  temperatureEl.textContent = `${Math.round(temp)}°C`;
  feelsLikeEl.textContent = `${Math.round(feels_like)}°C`;
  humidityEl.textContent = `${humidity}%`;
  windSpeedEl.textContent = `${windKmh} km/h`;
  pressureEl.textContent = `${pressure} hPa`;
  updatedTimeEl.textContent = `Updated at ${new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  if (condition.icon) {
    weatherIconEl.src = `https://openweathermap.org/img/wn/${condition.icon}@2x.png`;
    weatherIconEl.alt = condition.description || `${name} weather icon`;
    weatherIconEl.classList.remove("hidden");
  } else {
    weatherIconEl.classList.add("hidden");
  }

  errorSection.classList.add("hidden");
  loadingSection.classList.add("hidden");
  weatherSection.classList.remove("hidden");
}

async function fetchWeatherByCity(city) {
  const trimmedCity = city.trim();

  if (!trimmedCity) {
    showError("Please enter a city name before searching.");
    return;
  }

  if (!API_KEY || API_KEY === "YOUR_OPENWEATHERMAP_API_KEY") {
    showError("Please add your OpenWeatherMap API key in js/app.js before fetching data.");
    return;
  }

  setLoadingState(true);

  try {
    const endpoint = `${API_BASE_URL}?q=${encodeURIComponent(trimmedCity)}&units=metric&appid=${API_KEY}`;
    const response = await fetch(endpoint);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`No city found matching "${trimmedCity}". Check spelling and try again.`);
      }
      if (response.status === 401) {
        throw new Error("Invalid or inactive OpenWeatherMap API key. Please verify your key.");
      }
      throw new Error(`Weather request failed (HTTP ${response.status}). Please try again.`);
    }

    const data = await response.json();
    renderWeatherData(data);
  } catch (error) {
    if (error.name === "TypeError") {
      showError("Network error occurred. Check your internet connection and try again.");
    } else {
      showError(error.message || "Unexpected error while retrieving weather details.");
    }
  } finally {
    searchBtnEl.disabled = false;
  }
}

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  fetchWeatherByCity(cityInputEl.value);
});

chipButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const city = button.dataset.city;
    cityInputEl.value = city;
    fetchWeatherByCity(city);
  });
});

// Load a default city on initial page load
window.addEventListener("DOMContentLoaded", () => {
  if (API_KEY && API_KEY !== "YOUR_OPENWEATHERMAP_API_KEY") {
    fetchWeatherByCity("Karachi");
  }
});