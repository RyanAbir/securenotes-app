# SecureNotes Upgrade Status

This file tracks the upgrade roadmap progress so we can keep changes scoped and know what is still left.

## Phase 1 - UX Improvements

### Done
- Auto redirect after login/register
- Loading indicators on login/register buttons
- Toast notifications for auth and note actions
- Better dashboard empty/loading/error states
- Delete confirmation dialog
- Basic mobile responsiveness improvements
- Shared auth page layout

### Left
- Page-level loading polish beyond dashboard
- More consistent inline validation across auth and note forms
- Additional empty states where needed

## Phase 2 - Notes Features

### Done
- Search notes
- Pin important notes
- Tags / categories
- Filter by tags
- Sort notes (newest / oldest)
- Favorite notes

### Left
- Rich text editor

## Phase 3 - Security Upgrade

### Done
- Environment-based API configuration in frontend
- Rate limit on login/register
- Basic backend request validation
- Stronger auth deployment configuration fixes
- Confirm password on register
- Inline password validation aligned with backend minimum length
- Token expiration handling
- Auto logout on token expiry

### Left
- Strong JWT secret rotation/documentation
- Hide internal error details consistently
- Stronger password rules beyond minimum length

## Phase 4 - User Account Features

### Done
- Show logged-in username in UI

### Left
- Profile page
- Update name/email
- Change password
- Delete account

## Phase 5 - Backend Improvements

### Done
- Request validation middleware
- Central auth middleware structure

### Left
- Global error handling cleanup
- Cleaner folder structure
- More consistent API responses

## Phase 6 - Deployment & Production

### Done
- Frontend uses environment-based API URL
- Production CORS fixed
- Production frontend/backend connectivity fixed

### Left
- Deployment checklist documentation
- Stronger production environment documentation
- Seed/test-user strategy for production or staging
