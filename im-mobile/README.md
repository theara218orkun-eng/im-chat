# IM Mobile - Uniapp Version

Mobile version of Raingad IM using uniapp framework

## Project Structure

```
im-mobile/
├── src/                  # Source code
│   ├── components/       # Vue components
│   ├── pages/            # Page components
│   ├── static/           # Static resources
│   ├── store/            # Pinia stores
│   ├── utils/            # Utility functions
│   ├── App.vue           # Main App component
│   ├── main.js           # Entry file
│   ├── manifest.json     # App configuration
│   └── pages.json        # Pages routing
├── unpackage/            # Build output
├── package.json          # Project dependencies
└── README.md             # This file
```

## Technology Stack

- **Framework**: Uniapp with Vue 3
- **State Management**: Pinia
- **UI Components**: Custom + uView UI
- **Network**: Uniapp request API
- **WebSocket**: Uniapp WebSocket API

## Features

- Cross-platform mobile app (iOS, Android, H5)
- Real-time chat with WebSocket
- Audio/video calls
- Message notifications
- Internationalization support
- Background keep-alive

## Getting Started

### Prerequisites

- Node.js >= 14.0.0
- HBuilderX (for uniapp development)
- Android/iOS development environment (for native builds)

### Installation

```bash
# Install dependencies
npm install

# Run in H5 mode (web)
npm run dev:h5

# Run in App mode
npm run dev:app

# Build for production
npm run build:h5
npm run build:app
```

## Backend Connection

The mobile app connects to the same backend as the web version:

- API Base URL: Configure in `src/utils/config.js`
- WebSocket URL: Configure in `src/utils/socket.js`
- Authentication: JWT tokens (same as web version)

## Mobile-Specific Features

- Push notifications using uniapp push module
- Background message handling
- Mobile-optimized UI/UX
- Camera and microphone access for calls
- File upload/download with mobile permissions