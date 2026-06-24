# WeatherApp - Sécured version 🔒

## 🌤️   Application météo avec sécurité renforcée

### Fonctionnalités

-   Météo en temps réel via **wttr.in** (sans clé API)
-   **Content Security Policy (CSP)** contre XSS
-   **Validation des entrées** utilisateur
-   **Rate Limiting** (2s entre requêtes, max 10/min)
-   **Cache localStorage** (5 minutes)
-   **Favoris** sauvegardés localement
-   **Performance monitoring** intégré
-   **Animations GPU-accélérées**

### Sécurité implémentée

| Protection | Statut |
|------------|--------|
| Clé API exposée | ✅ Éliminé (wttr.in) |
| XSS Protection | ✅ CSP + Sanitize HTML |
| Validation entrées | ✅ Regex + Longueur |
| Rate Limiting | ✅ Côté client |
| Cache | ✅ Réduit les appels |
| HTTPS | ✅ GitHub Pages |

### Démo

[Lien vers la démo](https://tdelminot.github.io/weatherapp)

### Technologies

- Vanilla JavaScript
- HTML5 / CSS3
- wttr.in API
- localStorage
- Performance API

### Installation

```bash
git clone https://github.com/tdelminot/weatherapp.git
cd weatherapp
# Ouvrir index.html dans le navigateur
Sécurité
Cette application est conçue pour être déployée sur GitHub Pages sans exposer de clé API. Toutes les mesures de sécurité sont implémentées côté client.