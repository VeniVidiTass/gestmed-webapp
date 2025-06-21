# GestMed User WebApp

Interfaccia web per gli utenti finali di GestMed che permette di visualizzare i servizi medici disponibili e prenotare appuntamenti.

## Caratteristiche

- **Vista Servizi**: Visualizzazione di tutti i servizi medici disponibili con filtri per prezzo e durata
- **Prenotazione**: Sistema completo di prenotazione con selezione data/ora
- **Gestione Prenotazioni**: Visualizzazione e gestione delle proprie prenotazioni
- **Design Responsivo**: Interfaccia ottimizzata per desktop e mobile
- **Tema Personalizzato**: Design minimal con palette giallo scuro coerente con GestMed

## Tecnologie

- **Vue 3** con Composition API
- **PrimeVue** per i componenti UI
- **Vue Router** per la navigazione
- **Pinia** per la gestione dello stato
- **Axios** per le chiamate API
- **Vite** per il build e development

## Struttura

```
src/
├── components/          # Componenti riutilizzabili (future espansioni)
├── router/             # Configurazione routing
├── stores/             # Store Pinia per gestione stato
├── services/           # Servizi API
├── views/              # Pagine principali
│   ├── Home.vue        # Homepage con presentazione servizi
│   ├── Services.vue    # Lista completa servizi con filtri
│   ├── BookService.vue # Form prenotazione
│   └── MyBookings.vue  # Gestione prenotazioni utente
└── style.css          # Stili globali e tema personalizzato
```

## Setup Sviluppo

### Prerequisiti
- Node.js 18+
- npm

### Installazione
```bash
# Installa dipendenze
npm install

# Avvia server development
npm run dev

# Build per produzione
npm run build
```

### Docker
```bash
# Build immagine
docker build -t gestmed-user-webapp .

# Esegui container
docker run -p 80:80 gestmed-user-webapp
```

## Configurazione

L'app si connette al backend GestMed tramite API Gateway su `http://localhost:3000/api`.

### Variabili d'ambiente
- `VITE_API_BASE_URL`: URL base per le API (default: http://localhost:3000/api)

## Funzionalità Principali

### Homepage
- Presentazione del centro medico
- Anteprima servizi in evidenza
- Statistiche e informazioni
- Call-to-action per prenotazioni

### Catalogo Servizi
- Lista completa dei servizi medici
- Filtri per prezzo e durata
- Ricerca testuale
- Dettagli servizio con prenotazione rapida

### Prenotazione
- Form guidato per prenotazione
- Selezione data e orario
- Validazione input
- Conferma prenotazione

### Gestione Prenotazioni
- Vista appuntamenti futuri e passati
- Possibilità di cancellazione
- Stato prenotazioni
- Riprenotazione servizi

## API Integration

L'app si integra con i seguenti endpoint del backend GestMed:

- `GET /appointments/services` - Lista servizi
- `GET /appointments/services/:id` - Dettaglio servizio
- `POST /appointments` - Creazione prenotazione
- `GET /appointments?patient_id=:id` - Prenotazioni utente
- `DELETE /appointments/:id` - Cancellazione prenotazione

## Design System

### Colori
- Primary: #B8860B (Giallo scuro)
- Primary Light: #DAA520
- Secondary: #2C3E50
- Background: #1A1A1A
- Surface: #2D2D2D
- Success: #27AE60
- Warning: #F39C12
- Error: #E74C3C

### Componenti
- Design minimalista e moderno
- Card-based layout
- Hover effects e transizioni
- Responsive design con breakpoint mobile

## Note per Sviluppatori

- Il sistema attualmente usa dati simulati per l'autenticazione utente
- I servizi vengono caricati dall'API backend reale
- Le prenotazioni vengono salvate nel database tramite API
- Il design è ottimizzato per esperienza utente fluida
- Tutti i componenti sono accessibili e responsive
