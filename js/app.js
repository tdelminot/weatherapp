// WeatherApp - Vanilla JS
// OpenWeatherMap API, localStorage favorites, performance logging

const API_KEY = 'be3595aee43ca862f41ef57adfbbd641';  
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

let favorites = [];

// load saved favorites from localStorage
function loadFavorites() {
    const saved = localStorage.getItem('weather_favorites');
    if (saved) {
        favorites = JSON.parse(saved);
        console.log(`${favorites.length} favorites loaded`);
    }
    renderFavorites();
}

// save favorites to localStorage
function saveFavorites() {
    localStorage.setItem('weather_favorites', JSON.stringify(favorites));
}

// add city to favorites
function addFavorite(city) {
    if (!favorites.includes(city)) {
        favorites.push(city);
        saveFavorites();
        renderFavorites();
        console.log(`added ${city} to favorites`);
    }
}

// remove city from favorites
function removeFavorite(city) {
    favorites = favorites.filter(f => f !== city);
    saveFavorites();
    renderFavorites();
    console.log(`removed ${city} from favorites`);
}

// display favorite buttons
function renderFavorites() {
    const container = document.getElementById('favoritesList');
    const fragment = document.createDocumentFragment();

    favorites.forEach(city => {
        const btn = document.createElement('button');
        btn.textContent = city;
        btn.className = 'favorite-btn';
        btn.onclick = () => {
            document.getElementById('cityInput').value = city;
            searchWeather();
        };
        fragment.appendChild(btn);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
}

// display weather data in UI
function displayWeather(data) {
    const container = document.getElementById('weatherResult');
    
    const html = `
        <div class="weather-card">
            <h2>${data.name}, ${data.sys.country}</h2>
            <div class="weather-temp">${Math.round(data.main.temp)}°C</div>
            <div class="weather-condition">
                <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="">
                ${data.weather[0].description}
            </div>
            <div class="weather-details">
                <p>💧 Humidity: ${data.main.humidity}%</p>
                <p>💨 Wind: ${data.wind.speed} km/h</p>
                <p>🌡️ Feels like: ${Math.round(data.main.feels_like)}°C</p>
            </div>
            <button id="saveFavBtn" class="favorite-btn" style="margin-top:15px;">⭐ Save to favorites</button>
        </div>
    `;
    
    container.innerHTML = html;
    
    const saveBtn = document.getElementById('saveFavBtn');
    if (saveBtn) {
        saveBtn.onclick = () => addFavorite(data.name);
    }
}

// show error message
function showError(msg) {
    const container = document.getElementById('weatherResult');
    container.innerHTML = `<div class="weather-card error">❌ ${msg}</div>`;
}

// fetch weather from API
async function fetchWeather(city) {
    const url = `${API_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    
    console.time(`weather-${city}`);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        console.timeEnd(`weather-${city}`);
        return data;
    } catch (err) {
        console.timeEnd(`weather-${city}`);
        throw err;
    }
}

// main search function
async function searchWeather() {
    const input = document.getElementById('cityInput');
    const city = input.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    
    document.getElementById('weatherResult').innerHTML = '<div class="loading">Loading...</div>';
    
    try {
        const data = await fetchWeather(city);
        displayWeather(data);
    } catch (err) {
        showError(`Could not get weather for "${city}"`);
    }
}

// init app
document.addEventListener('DOMContentLoaded', () => {
    console.log('WeatherApp started');
    
    loadFavorites();
    
    document.getElementById('searchBtn').onclick = searchWeather;
    document.getElementById('cityInput').onkeypress = (e) => {
        if (e.key === 'Enter') searchWeather();
    };
    
    document.getElementById('cityInput').value = 'Paris';
});