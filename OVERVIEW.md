# Overview

## Components

- **SAuth Backend**: The core authentication server, responsible for managing sessions, device registration, verification logic, and integration with security services (e.g., DataDome, Recaptcha).
- **SAuth QRCode**: The web interface that generates and displays QR codes for user authentication. It interacts with the backend to create session-specific QR codes and handles user actions on the web.
- **SAuth Mobile**: The mobile application used by end-users to scan QR codes, register devices, and perform secure authentication. It implements cryptographic operations and communicates securely with the backend. SAuth Mobile can also be built as a dedicated SDK for each client, making integration seamless and customizable.

## Client Registration

Each client registers with the SAuth Backend and receives a unique ClientID, ClientSecret, and an API key for webhook integration. These credentials are used to securely authenticate and manage communication between the client and backend, as well as to receive verification results via webhook.

# Authenticate request

```mermaid
sequenceDiagram
    participant ClientApp as Client App (Backend)
    participant SAuthBackend as SAuth Backend (DataDome/Recaptcha)
    participant SAuthWeb as SAuth Web (QR Page)
    participant User as User (Browser)
    participant SAuthApp as SAuth App (Mobile)

    ClientApp->>SAuthBackend: 1. Send verification request (string id)
    SAuthBackend->>ClientApp: 2. Return SAuthWeb URL to Client App
    ClientApp->>User: 3. Embed SAuthWeb URL on web page for User
    User->>SAuthWeb: 4. User loads SAuthWeb (QR Page)
    SAuthWeb->>SAuthBackend: 5. Call API to generate QR code (session_id, expired_time, nonce)
    alt QR code expired
        SAuthWeb->>SAuthBackend: Auto-retry to generate new QR code
    end
    alt session_id invalid
        SAuthBackend->>ClientApp: Webhook to Client App with fail status immediately
    end
    SAuthBackend->>SAuthWeb: Return QR code data
    SAuthWeb->>User: Display QR code
    User->>SAuthApp: 6. User opens SAuth App on mobile

    SAuthApp->>SAuthBackend: 7. Register device (public key, signature, device info)
    alt DataDome/Recaptcha enabled
        SAuthBackend->>SAuthApp: Challenge if suspected bot
        SAuthApp->>SAuthBackend: User passes challenge
    end
    SAuthBackend->>SAuthApp: Return device_id

    SAuthApp->>SAuthBackend: 8. Scan QR code, sign (session_id, nonce), send verification (session_id, nonce, signature, device_id)
    SAuthBackend->>ClientApp: 9. Webhook to Client App if verification successful
```

---

## Note

Verification (Step 8) can also be protected by a special data encryption layer, similar to device registration. Without knowledge of this encryption algorithm, performing verification becomes extremely difficult, ensuring only authorized parties can complete the process.

# Register device

```mermaid
sequenceDiagram
    participant User as User
    participant SAuthApp as SAuth App (Mobile)
    participant SAuthBackend as SAuth Backend (DataDome/Recaptcha)

    User->>SAuthApp: Open SAuth App
    alt DataDome/Recaptcha enabled and suspicious
        SAuthBackend->>SAuthApp: Show challenge (CAPTCHA/DataDome)
        SAuthApp->>User: User solves challenge
        SAuthApp->>SAuthBackend: Submit challenge result
    end
    SAuthApp->>SAuthApp: Generate ed25519 key pair
    SAuthApp->>SAuthBackend: Send public key, signature (with timestamp/device info), device info
    SAuthBackend->>SAuthBackend: Verify signature, save device info & public key
    SAuthBackend->>SAuthApp: Return device_id
```

## Note

Device registration is secured by an encryption algorithm that is protected within both the mobile app and backend. Without knowledge of this encryption algorithm, device registration cannot be performed, ensuring only trusted devices can join the system.
