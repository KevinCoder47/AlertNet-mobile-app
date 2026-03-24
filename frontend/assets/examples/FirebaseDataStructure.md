# Firebase Offline Maps Data Structure

## Overview

All offline maps data is stored under the authenticated user's document in Firestore, ensuring data privacy and user-specific access.

## Data Structure

### 1. Offline Maps Collection

**Path:** `users/{userId}/offlineMaps/{mapId}`

```javascript
{
  id: "map_1703123456789",
  name: "Campus Map - Main Area",
  size: 45, // Size in MB
  downloadDate: Timestamp,
  expiryDate: Date, // 1 year from download
  region: {
    latitude: -26.183,
    longitude: 27.999,
    latitudeDelta: 0.04,
    longitudeDelta: 0.02
  },
  tileCount: 1250,
  accessCount: 15,
  lastAccessed: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 2. Map Usage Statistics Collection

**Path:** `users/{userId}/mapUsageStats/{mapId}`

```javascript
{
  mapId: "map_1703123456789",
  totalAccesses: 15,
  downloadDate: Timestamp,
  lastAccessed: Timestamp,
  accessHistory: [
    {
      timestamp: Timestamp,
      action: "accessed"
    }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 3. Map Update History Collection

**Path:** `users/{userId}/mapUpdateHistory/{historyId}`

```javascript
{
  mapId: "map_1703123456789",
  action: "downloaded", // 'downloaded', 'accessed', 'updated', 'deleted'
  description: "Map downloaded successfully with 1250 tiles",
  timestamp: Timestamp,
  userId: "user123"
}
```

## Features Implemented

### ✅ Required Data Storage

- **Downloaded map metadata**: Map name, size, download date, expiry date
- **Map region coordinates**: Latitude/longitude boundaries with deltas
- **Map usage statistics**: Access count, last accessed time, usage history
- **Map update history**: Complete audit trail of all map operations

### ✅ User Authentication Integration

- All data is linked to the authenticated user's UID
- Data is automatically synced when user logs in
- Local storage fallback when offline
- Automatic sync between local and Firebase storage

### ✅ Additional Features

- Real-time data updates
- Comprehensive error handling
- Offline-first approach with Firebase sync
- Usage analytics and statistics
- Complete audit trail
- Data privacy and security

## Usage Examples

### Save Offline Map Data

```javascript
import { OfflineMapFirebaseService } from "./OfflineMapFirebaseService";

const mapData = {
  id: "map_123",
  name: "Campus Map",
  size: 45,
  region: {
    latitude: -26.183,
    longitude: 27.999,
    latitudeDelta: 0.04,
    longitudeDelta: 0.02,
  },
  tileCount: 1250,
};

const result = await OfflineMapFirebaseService.saveOfflineMapData(mapData);
```

### Record Map Access

```javascript
await OfflineMapFirebaseService.recordMapAccess("map_123");
```

### Get User's Offline Maps

```javascript
const result = await OfflineMapFirebaseService.getUserOfflineMaps();
if (result.success) {
  // console.log($&);
}
```

### Get Map Usage Statistics

```javascript
const stats = await OfflineMapFirebaseService.getMapUsageStats("map_123");
```

### Get Map Update History

```javascript
const history = await OfflineMapFirebaseService.getMapUpdateHistory("map_123");
```

## Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own offline maps data
    match /users/{userId}/offlineMaps/{mapId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /users/{userId}/mapUsageStats/{mapId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /users/{userId}/mapUpdateHistory/{historyId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Integration with Existing Code

The Firebase offline maps functionality integrates seamlessly with your existing:

- `OfflineMapService.js` - Enhanced with Firebase sync
- `offlineMap.js` screen - Downloads now sync to Firebase
- `downloadedMaps.js` screen - Shows both local and Firebase maps
- User authentication system - All data linked to authenticated users

## Benefits

1. **Data Persistence**: Maps data survives app uninstalls and device changes
2. **Cross-Device Sync**: Access maps across multiple devices
3. **Usage Analytics**: Track how often maps are used
4. **Audit Trail**: Complete history of map operations
5. **Offline-First**: Works offline with automatic sync when online
6. **User Privacy**: All data is user-specific and secure
