# Logo Control Flow Analysis Summary

## Quick Reference

This document provides a quick summary of the logo control flow in the Nav-Item project.

## Architecture Overview

```
Database (SQLite) → Backend API (Express) → Frontend Display (Vue 3)
                          ↑
                    Admin Panel (Vue 3)
```

## Key Files

| Layer | File | Purpose |
|-------|------|---------|
| **Database** | `/db.js` | Table schema with `logo_url` and `custom_logo_path` fields |
| **Backend API** | `/routes/card.js` | Card CRUD API with logo priority logic |
| **Backend API** | `/routes/upload.js` | File upload handling with multer |
| **Backend API** | `/app.js` | Static file serving for `/uploads` directory |
| **Admin UI** | `/web/src/views/admin/CardManage.vue` | Card management interface ⚠️ **Missing file upload UI** |
| **Frontend API** | `/web/src/api.js` | API wrappers including `uploadLogo()` (unused) |
| **Frontend Display** | `/web/src/components/CardGrid.vue` | Logo rendering with fallback logic |
| **Frontend Display** | `/web/src/views/Home.vue` | Main page displaying cards |

## Database Schema

**Table**: `cards`

```sql
CREATE TABLE cards (
  id INTEGER PRIMARY KEY,
  menu_id INTEGER,
  sub_menu_id INTEGER,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  logo_url TEXT,              -- External logo URL
  custom_logo_path TEXT,      -- Uploaded file name
  desc TEXT,
  "order" INTEGER DEFAULT 0
);
```

## Logo Priority Logic

### Backend (Express)
Location: `/routes/card.js` lines 23-29

```javascript
if (!card.custom_logo_path) {
  card.display_logo = card.logo_url || (card.url + '/favicon.ico');
} else {
  card.display_logo = '/uploads/' + card.custom_logo_path;
}
```

### Frontend (Vue 3)
Location: `/web/src/components/CardGrid.vue` lines 122-132

```javascript
function getLogo(card) {
  if (card.custom_logo_path) {
    return 'http://localhost:3000/uploads/' + card.custom_logo_path;
  }
  if (card.logo_url) {
    return card.logo_url;
  }
  // Fallback to website's favicon
  return new URL(card.url).origin + '/favicon.ico';
}
```

## Priority Order

```
1. custom_logo_path (uploaded file)
   ↓ if not present
2. logo_url (external URL)
   ↓ if not present
3. {website_domain}/favicon.ico
   ↓ if loading fails
4. /default-favicon.png (fallback icon)
```

## API Endpoints

### Card Management
- `GET /api/cards/:menuId` - Get cards with computed `display_logo`
- `POST /api/cards` - Create card with logo fields
- `PUT /api/cards/:id` - Update card including logos
- `DELETE /api/cards/:id` - Delete card

### File Upload
- `POST /api/upload` - Upload logo file
  - Accepts `FormData` with `logo` field
  - Saves to `/uploads/` with timestamp filename
  - Returns `{ filename, url }`

### Static Files
- `GET /uploads/:filename` - Serve uploaded files

## Data Flow

### Upload Flow (Backend is ready, Admin UI not implemented)

```
Admin Panel → Select File
    ↓
POST /api/upload (FormData)
    ↓
Multer saves to /uploads/timestamp.ext
    ↓
Returns { filename: 'timestamp.ext' }
    ↓
Admin creates card with custom_logo_path
    ↓
POST /api/cards { custom_logo_path: 'timestamp.ext' }
    ↓
Saved to SQLite database
```

### Display Flow

```
Home Page loads
    ↓
GET /api/cards/:menuId
    ↓
Backend calculates display_logo for each card
    ↓
Returns JSON with display_logo field
    ↓
CardGrid component renders
    ↓
getLogo(card) determines final logo URL
    ↓
<img src="..."> displays logo
    ↓
@error fallback to default-favicon.png if fails
```

## Current Status

### ✅ Implemented
1. Database schema supports both external URLs and uploaded files
2. Backend API fully supports file upload
3. Backend correctly calculates logo priority
4. Frontend display handles all logo types with fallback
5. Static file serving works for `/uploads` directory

### ❌ Missing / Issues
1. **Admin UI has no file upload control** - Only text input for external URLs
2. `uploadLogo()` function exists in `api.js` but is not used
3. Cannot manage uploaded logos from admin panel
4. No way to delete/replace uploaded logo files

## Improvement Suggestions

To complete the logo management feature, add to `CardManage.vue`:

```vue
<template>
  <!-- Current: text input only -->
  <input v-model="newCardLogo" placeholder="Logo URL (optional)" />
  
  <!-- Add: file upload -->
  <input type="file" @change="handleFileUpload" accept="image/*" />
</template>

<script setup>
import { uploadLogo } from '../../api';

const uploadedLogoPath = ref('');

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const res = await uploadLogo(file);
  uploadedLogoPath.value = res.data.filename;
}

async function addCard() {
  await apiAddCard({ 
    title: newCardTitle.value,
    url: newCardUrl.value,
    logo_url: newCardLogo.value,
    custom_logo_path: uploadedLogoPath.value || null  // Add this
  });
}
</script>
```

## Example Data

### Card with External URL
```json
{
  "id": 1,
  "title": "YouTube",
  "url": "https://www.youtube.com",
  "logo_url": "https://img.icons8.com/youtube.png",
  "custom_logo_path": null,
  "display_logo": "https://img.icons8.com/youtube.png"
}
```

### Card with Uploaded File
```json
{
  "id": 2,
  "title": "My Site",
  "url": "https://mysite.com",
  "logo_url": null,
  "custom_logo_path": "1732456789123.png",
  "display_logo": "/uploads/1732456789123.png"
}
```

### Card with Default Favicon
```json
{
  "id": 3,
  "title": "GitHub",
  "url": "https://github.com",
  "logo_url": "",
  "custom_logo_path": null,
  "display_logo": "https://github.com/favicon.ico"
}
```

## Architecture Evaluation

**Strengths**:
- ✅ Flexible database design supporting multiple logo sources
- ✅ Complete backend API implementation
- ✅ Robust frontend rendering with error handling
- ✅ Clean separation of concerns

**Weaknesses**:
- ❌ Incomplete admin panel functionality
- ❌ Backend capabilities not fully exposed to users
- ❌ File upload infrastructure exists but is unused

**Conclusion**: The logo control flow is well-designed and mostly implemented, but the admin panel UI needs enhancement to expose the full capabilities of the backend system.

---

**Analysis Date**: 2024-11-24  
**Project**: Nav-Item  
**Component**: Logo Management System
