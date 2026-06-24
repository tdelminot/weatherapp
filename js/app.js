 
// WeatherApp - Version Sécurisée (wttr.in)
 
//   API publique sans clé (wttr.in)
//  CSP protection
//   Validation entrées
//   Rate limiting
//  Cache localStorage
//  Performance monitoring
 

// Configuration
const API_URL = 'https://wttr.in';

 
// SÉCURITÉ : Rate Limiting
 

const rateLimiter = {
    lastCall: 0,
    minInterval: 1000, //   1 seconde (  raisonnable)
    maxCallsPerMinute: 20, //   20 appels par minute
    callHistory: [],
    isBlocked: false,
    blockUntil: 0,
    
    canCall() {
        const now = Date.now();
        
        //   Vérifier si bloqué temporairement
        if (this.isBlocked && now < this.blockUntil) {
            const remaining = Math.ceil((this.blockUntil - now) / 1000);
            console.warn(`⚠️ Bloqué pour ${remaining} secondes`);
            return false;
        }
        
        //  Réinitialiser le blocage si dépassé
        if (this.isBlocked && now >= this.blockUntil) {
            this.isBlocked = false;
            this.callHistory = [];
            console.log('✅ Blocage levé');
        }
        
        // Nettoyer l'historique (garder 1 minute)
        this.callHistory = this.callHistory.filter(time => now - time < 60000);
        
        // Vérifier le nombre d'appels dans la dernière minute
        if (this.callHistory.length >= this.maxCallsPerMinute) {
            //   Bloquer pour 30 secondes
            this.isBlocked = true;
            this.blockUntil = now + 30000;
            console.warn('⚠️ Rate limit exceeded - bloqué 30s');
            return false;
        }
        
        // Vérifier l'intervalle minimum
        if (now - this.lastCall < this.minInterval) {
            console.warn('⚠️ Minimum interval not respected');
            return false;
        }
        
        this.lastCall = now;
        this.callHistory.push(now);
        return true;
    },
    
    //  Méthode pour réinitialiser manuellement
    reset() {
        this.lastCall = 0;
        this.callHistory = [];
        this.isBlocked = false;
        this.blockUntil = 0;
        console.log('🔄 Rate limiter réinitialisé');
    }
};

 
// SÉCURITÉ : Validation des entrées
 

function sanitizeInput(input) {
    if (!input || typeof input !== 'string') {
        return '';
    }
    
    // Nettoyage
    let clean = input.trim();
    
    // Supprimer les caractères dangereux
    clean = clean.replace(/[<>{}[\]/\\;'"()&$#%@!=+`~|]/g, '');
    
    // Limiter la longueur
    clean = clean.slice(0, 50);
    
    // Vérifier qu'il reste quelque chose
    if (clean.length < 2) {
        throw new Error('Le nom de la ville doit contenir au moins 2 caractères');
    }
    
    return clean;
}

 
// SÉCURITÉ : XSS Protection (Sanitize HTML)
 

function sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

 
// CACHE : localStorage pour réduire les appels
 

class WeatherCache {
    constructor() {
        this.cache = new Map();
        this.DURATION = 300000; // 5 minutes
        this.loadFromStorage();
    }
    
    get(city) {
        const key = city.toLowerCase();
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.DURATION) {
            console.log('📦 Cache hit for', city);
            return cached.data;
        }
        return null;
    }
    
    set(city, data) {
        const key = city.toLowerCase();
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
        this.saveToStorage();
    }
    
    saveToStorage() {
        try {
            const cacheData = Array.from(this.cache.entries());
            localStorage.setItem('weather_cache', JSON.stringify(cacheData));
        } catch (e) {
            // Ignorer les erreurs de localStorage
        }
    }
    
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('weather_cache');
            if (saved) {
                const data = JSON.parse(saved);
                data.forEach(([key, value]) => {
                    this.cache.set(key, value);
                });
                console.log(`📦 Cache chargé: ${data.length} entrées`);
            }
        } catch (e) {
            // Ignorer les erreurs de localStorage
        }
    }
}

const weatherCache = new WeatherCache();

 
// PERFORMANCE : Mesure du temps d'exécution
 

function measurePerformance(fn, label) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
    return result;
}

//   STORAGE LOCAL : Favoris

let favorites = [];

function loadFavorites() {
    const saved = localStorage.getItem('weather_favorites');
    if (saved) {
        favorites = JSON.parse(saved);
        console.log(`📦 Favoris chargés: ${favorites.length} villes`);
    }
    renderFavorites();
}

function saveFavorites() {
    localStorage.setItem('weather_favorites', JSON.stringify(favorites));
    console.log(`💾 Favoris sauvegardés: ${favorites.length} villes`);
}

function addFavorite(city) {
    if (!favorites.includes(city)) {
        favorites.push(city);
        saveFavorites();
        renderFavorites();
        console.log(`⭐ Ville ajoutée aux favoris: ${city}`);
    }
}

function removeFavorite(city) {
    favorites = favorites.filter(f => f !== city);
    saveFavorites();
    renderFavorites();
    console.log(`🗑️ Ville retirée des favoris: ${city}`);
}

 
// RENDU OPTIMISÉ
 

function renderFavorites() {
    const container = document.getElementById('favoritesList');
    
    // ✅ Vérification
    if (!container) {
        console.error('❌ favoritesList element not found');
        return;
    }
    
    const fragment = document.createDocumentFragment();
    
    favorites.forEach(city => {
        const div = document.createElement('div');
        div.style.display = 'inline-block';
        div.style.margin = '5px';
        
        const btn = document.createElement('button');
        btn.textContent = sanitizeHTML(city);
        btn.className = 'favorite-btn';
        btn.onclick = () => {
            document.getElementById('cityInput').value = city;
            searchWeather();
        };
        
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '❌';
        removeBtn.style.marginLeft = '5px';
        removeBtn.style.background = 'none';
        removeBtn.style.border = 'none';
        removeBtn.style.cursor = 'pointer';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeFavorite(city);
        };
        
        div.appendChild(btn);
        div.appendChild(removeBtn);
        fragment.appendChild(div);
    });
    
    container.innerHTML = '';
    container.appendChild(fragment);
}

 
// API CALL : wttr.in (sans clé)
 

async function fetchWeather(city) {
    // Nettoyer et valider la ville
    const cleanCity = sanitizeInput(city);
    
    // Vérifier le cache
    const cached = weatherCache.get(cleanCity);
    if (cached) {
        return cached;
    }
    
    // Vérifier le rate limiting
    if (!rateLimiter.canCall()) {
        throw new Error('Trop de requêtes. Veuillez attendre quelques secondes.');
    }
    
    const url = `${API_URL}/${encodeURIComponent(cleanCity)}?format=j1&lang=fr`;
    
    console.time(`🌤️ API call for ${cleanCity}`);
    const startPerf = performance.now();
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Transformer les données pour correspondre au format attendu
        const weatherData = transformWeatherData(data, cleanCity);
        
        const endPerf = performance.now();
        console.log(`📊 Temps de réponse API: ${(endPerf - startPerf).toFixed(2)}ms`);
        console.timeEnd(`🌤️ API call for ${cleanCity}`);
        
        // Mettre en cache
        weatherCache.set(cleanCity, weatherData);
        
        return weatherData;
    } catch (error) {
        console.error(`❌ Erreur API: ${error.message}`);
        console.timeEnd(`🌤️ API call for ${cleanCity}`);
        throw error;
    }
}

function transformWeatherData(data, cityName) {
    // Gérer les cas où les données sont manquantes
    const current = data.current_condition?.[0] || {};
    const nearest = data.nearest_area?.[0] || {};
    
    return {
        name: cityName,
        sys: { 
            country: nearest.country?.[0]?.value || 'N/A' 
        },
        main: {
            temp: parseFloat(current.temp_C || 0),
            humidity: parseInt(current.humidity || 0),
            feels_like: parseFloat(current.FeelsLikeC || 0)
        },
        weather: [{
            description: current.weatherDesc?.[0]?.value || 'Météo inconnue',
            icon: current.weatherCode || '01d'
        }],
        wind: {
            speed: parseFloat(current.windspeedKmph || 0)
        }
    };
}

 
// AFFICHAGE OPTIMISÉ
 

function displayWeather(data) {
    const container = document.getElementById('weatherResult');
    
    // Vérification
    if (!container) {
        console.error('❌ weatherResult element not found');
        return;
    }
    
    container.style.opacity = '0';
    container.style.transform = 'translateY(20px)';
    
    const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    
    const html = `
        <div class="weather-card">
            <h2>${sanitizeHTML(data.name)}, ${sanitizeHTML(data.sys.country)}</h2>
            <div class="weather-temp">${Math.round(data.main.temp)}°C</div>
            <div class="weather-condition">
                <img src="${iconUrl}" 
                     alt="${sanitizeHTML(data.weather[0].description)}"
                     style="vertical-align: middle;">
                ${sanitizeHTML(data.weather[0].description)}
            </div>
            <div class="weather-details" style="margin-top: 1rem;">
                <p>💧 Humidité: ${data.main.humidity}%</p>
                <p>💨 Vent: ${data.wind.speed} km/h</p>
                <p>🌡️ Ressenti: ${Math.round(data.main.feels_like)}°C</p>
            </div>
            <button id="addFavoriteBtn" class="favorite-btn" style="margin-top: 1rem;">
                ⭐ Ajouter aux favoris
            </button>
        </div>
    `;
    
    container.innerHTML = html;
    
    container.offsetHeight;
    container.style.opacity = '1';
    container.style.transform = 'translateY(0)';
    container.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    const addBtn = document.getElementById('addFavoriteBtn');
    if (addBtn) {
        addBtn.onclick = () => addFavorite(data.name);
    }
    
    displayPerformanceInfo();
}

 
function displayPerformanceInfo() {
    const perfDiv = document.getElementById('performanceInfo');
    
    //   Vérification pour  eviter erreur
    if (!perfDiv) {
        console.log('ℹ️ performanceInfo element not found, skipping display');
        return;
    }
    
    const navigation = performance.getEntriesByType('navigation')[0];
    
    if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        const domTime = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        const cacheSize = weatherCache ? weatherCache.cache.size : 0;
        
        perfDiv.innerHTML = `
            ⚡ Temps de chargement: ${loadTime.toFixed(0)}ms |
            🧩 DOM prêt: ${domTime.toFixed(0)}ms |
            📡 Cache: ${cacheSize} villes en cache
        `;
        perfDiv.style.display = 'block';
    } else {
        perfDiv.innerHTML = '📊 Performance API non disponible';
    }
}

function showError(message) {
    const container = document.getElementById('weatherResult');
    
    //  Vérification
    if (!container) {
        console.error('❌ weatherResult element not found');
        return;
    }
    
    container.innerHTML = `
        <div class="weather-card" style="background: #fee; color: #c00; padding: 20px; border-radius: 10px; text-align: center;">
            ❌ Erreur: ${sanitizeHTML(message)}
        </div>
    `;
}

 
// FONCTION PRINCIPALE
 

async function searchWeather() {
    const cityInput = document.getElementById('cityInput');
    let city;
    
    //   Vérification
    if (!cityInput) {
        console.error('❌ cityInput element not found');
        return;
    }
    
    try {
        city = sanitizeInput(cityInput.value);
    } catch (error) {
        showError(error.message);
        return;
    }
    
    const container = document.getElementById('weatherResult');
    
    //   Vérification
    if (!container) {
        console.error('❌ weatherResult element not found');
        return;
    }
    
    container.innerHTML = '<div class="loading"></div>';
    
    try {
        const data = await fetchWeather(city);
        displayWeather(data);
    } catch (error) {
        showError(`Impossible de trouver la météo pour "${sanitizeHTML(city)}". ${error.message}`);
    }
}

 
// INITIALISATION
 

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 WeatherApp sécurisé démarré');
    console.log('🔒 Mode: wttr.in (sans clé API)');
    console.log('🛡️ Sécurité: Rate limiting + XSS protection + Validation');
    
    //   Vérification des éléments HTML
    const requiredElements = ['cityInput', 'searchBtn', 'favoritesList', 'weatherResult'];
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.warn('⚠️ Éléments manquants dans HTML:', missingElements);
    } else {
        console.log('✅ Tous les éléments HTML sont présents');
    }
    
    measurePerformance(() => {
        loadFavorites();
    }, 'Initialisation');
    
    const searchBtn = document.getElementById('searchBtn');
    const cityInput = document.getElementById('cityInput');
    
    if (searchBtn && cityInput) {
        searchBtn.addEventListener('click', searchWeather);
        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchWeather();
        });
        cityInput.value = 'Paris';
    } else {
        console.error('❌ Éléments de recherche manquants');
    }
    
    //  Appeler displayPerformanceInfo au démarrage
    displayPerformanceInfo();
    
    console.log('✅ Application prête');
    console.log(`💾 localStorage disponible: ${typeof(Storage) !== 'undefined'}`);
});