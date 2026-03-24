<div align="center">



\# 🛡️ AlertNet — Student Safety Mobile App



\### A real-time community-driven safety platform for university students



!\[React Native](https://img.shields.io/badge/React\_Native-20232A?style=for-the-badge\&logo=react\&logoColor=61DAFB)

!\[Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge\&logo=firebase\&logoColor=black)

!\[Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge\&logo=nodedotjs\&logoColor=white)

!\[Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge\&logo=expo\&logoColor=white)

!\[Google Maps](https://img.shields.io/badge/Google\_Maps-4285F4?style=for-the-badge\&logo=googlemaps\&logoColor=white)



\*\*Built for the University of Johannesburg | Information Systems 3B\*\*



</div>



\---



\## 📱 About AlertNet



AlertNet is a cross-platform mobile safety application designed to protect students

in and around university campuses. It combines real-time location tracking,

emergency alerts, and community-based safety features into one lightweight,

affordable app — built specifically for the South African student environment.



> Addressing the gap left by existing safety apps like Namola and Life360,

> AlertNet introduces proactive, community-driven safety tools tailored for students.



\---



\## ✨ Key Features



| Feature | Description |

|---|---|

| 🆘 \*\*SOS Emergency Button\*\* | One-tap alert sends your live GPS location to your entire safety circle instantly |

| 🚶 \*\*Walk Partner System\*\* | Find a verified walking companion for your route — with live shared tracking |

| 📍 \*\*Real-Time Live Tracking\*\* | Continuous encrypted GPS broadcasting to trusted contacts |

| 🗺️ \*\*High-Crime Zone Alerts\*\* | Geofencing detects dangerous areas and suggests safer routes |

| 🎙️ \*\*Voice Activation\*\* | Hands-free SOS trigger using a custom passphrase |

| 🔳 \*\*QR Emergency Card\*\* | Scannable QR code gives first responders instant access to your emergency contacts |

| 📞 \*\*Emergency Helpline\*\* | One-tap access to Police (10111), Ambulance (10177), and Campus Security |

| 👥 \*\*Safety Circle\*\* | Manage trusted contacts who receive your alerts and can track your journey |



\---



\## 📸 Screenshots



<div align="center">



| Home \& Map | SOS Alert | Walk Partner | Helpline |

|---|---|---|---|

| Live map with safety markers | Emergency calling screen with QR | Find \& track walking partners | Quick-dial emergency services |



</div>



\---



\## 🏗️ Tech Stack



\### Frontend

\- \*\*React Native\*\* + \*\*Expo\*\* — single codebase for iOS \& Android

\- \*\*Kotlin / Swift\*\* native extensions for background location \& voice recognition

\- \*\*React Navigation\*\* — bottom tab navigation optimised for one-thumb use

\- \*\*Redux Toolkit\*\* — state management



\### Backend

\- \*\*Node.js\*\* — asynchronous real-time API handling thousands of GPS updates

\- \*\*Firebase Realtime Database\*\* — instant location sync and alert delivery

\- \*\*Firebase Authentication\*\* — secure user login and session management

\- \*\*Firebase Cloud Messaging\*\* — reliable push notifications



\### APIs \& Services

\- \*\*Google Maps API\*\* — interactive maps and location display

\- \*\*Google Geofencing API\*\* — high-crime zone detection

\- \*\*Google Directions API\*\* — safe route recommendations

\- \*\*Resend\*\* — emergency contact email notifications

\- \*\*YouTube API\*\* — linked safety resources



\---



\## ⚡ Performance Metrics



| Metric | Result |

|---|---|

| Average SOS alert response time | \*\*2.7 seconds\*\* |

| Location tracking accuracy | \*\*99%\*\* |

| Notification delivery success rate | \*\*98%\*\* |

| Target system uptime | \*\*99%+\*\* |

| Concurrent users supported | \*\*10,000+\*\* |



\---



\## 🏛️ System Architecture

```

┌─────────────────────────────────────┐

│     Presentation Tier (Frontend)    │

│     React Native + Expo             │

└────────────────┬────────────────────┘

&#x20;                │

┌────────────────▼────────────────────┐

│     Application Tier (Backend)      │

│     Node.js — Auth, Geofencing,     │

│     Walk Partner Matching, GPS      │

└────────────────┬────────────────────┘

&#x20;                │

┌────────────────▼────────────────────┐

│     Data Tier (Hybrid Database)     │

│     Firebase (real-time) +          │

│     SQL (structured/audit logs)     │

└─────────────────────────────────────┘

```



\---



\## 🚀 Getting Started



\### Prerequisites

\- Node.js v18+

\- Expo CLI

\- Android Studio (for Android builds) or Xcode (for iOS)



\### Installation

```bash

\# Clone the repository

git clone https://github.com/YOUR\_USERNAME/AlertNet-mobile-app.git



\# Navigate to frontend

cd AlertNet-mobile-app/frontend



\# Install dependencies

npm install



\# Start the app

npx expo start --go

```



\### Environment Setup

This app uses Firebase and Google APIs. You will need to configure:

\- `google-services.json` (Android) — from your Firebase project

\- Firebase project credentials in `app.config.js`



\---



\## 🧪 Testing Summary



| Test Case | Status |

|---|---|

| SOS activation \& alert delivery | ✅ Passed |

| Walk Partner request \& connection | ✅ Passed |

| Emergency notification with location | ✅ Passed |

| High-crime zone geofence alert | ✅ Passed |

| Voice activation (quiet environment) | ⚠️ Minor issue in noisy environments |



\---



\## 🗺️ Roadmap



\- \[ ] SMS fallback for offline emergencies

\- \[ ] SAPS \& campus security direct integration

\- \[ ] Multilingual support (Zulu, Sotho, Afrikaans)

\- \[ ] Adaptive GPS refresh for battery optimisation

\- \[ ] UJ campus pilot deployment



\---



\## 👥 Team



| Name | Student No. |

|---|---|

| Mpilonhle Radebe | 222087503 |

| Kevin Serakalala | 223088123 |

| Thembinkosi Madiba | 222223279 |

| Siphephile Mtshali | 223125261 |

| Okuhle Mgudlwa | 222073209 |

| Musa Buthelezi | 222023907 |

| Nathi Gumede | 222021634 |



\*\*Supervisor:\*\* Thamie Mhlanga

\*\*Institution:\*\* University of Johannesburg

\*\*Module:\*\* Information Systems 3B — 250PRO001



\---



\## 📄 License



This project was developed as an academic project at the University of Johannesburg.



\---



<div align="center">



\*\*AlertNet supports UN SDG Goal 11 — Safe and Inclusive Communities\*\*



\*Built with ❤️ to make South African campuses safer\*



</div>

