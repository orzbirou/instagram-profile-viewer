# Architecture Decision: Search Placement

## Context

The assignment PDF is not available in the repository. Based on the REQUIREMENTS_CHECKLIST.md, the requirements specify:
- Search bar with autocomplete dropdown
- Profile page with header, stats, highlights, and posts grid
- No explicit mention of a "Home page" requirement

## Decision

**Moving search from dedicated Home page to Profile page header** to match authentic Instagram desktop UX.

## Rationale

### Instagram Desktop UX Reference
On Instagram's actual desktop website (instagram.com):
1. **No dedicated home page** - The main feed or explore page is the default
2. **Search is in top navigation** - Persistent search bar in the header, available on all pages
3. **Search doesn't navigate away** - Selecting a user navigates to their profile without leaving the context

### Current Implementation Issues
- Dedicated Home page at `/` with search only
- User must navigate from Home → Profile → Back to Home to search again
- Not how Instagram actually works

### New Architecture
1. **Default route (`/`)** - Renders Profile page with search in header
2. **Profile route (`/profile/:username`)** - Same component, username from params
3. **Search always visible** - No need to navigate back to Home
4. **Idle state** - When no username is selected, show placeholder content

## Implementation Plan

1. Move `SearchInputComponent` and `SearchResultsDropdownComponent` to Profile page header ✅
2. Update routing to make ProfileComponent the default route ✅
3. Handle `username` as optional parameter (show idle state if missing) ✅
4. Remove Home page component from routes (keep files for reference) ✅
5. Search functionality remains identical (debounce, cache, keyboard nav) ✅

**Note:** The `apps/frontend/src/app/pages/home` folder is kept for now as it contains the search components that are imported by ProfileComponent. Future refactor could move search components to a shared location.

## Benefits

✅ **Authentic Instagram UX** - Matches actual Instagram desktop experience  
✅ **Better navigation** - Search always accessible, no need to go back to Home  
✅ **Simplified routing** - One main page instead of two separate pages  
✅ **Improved discoverability** - Users can search from anywhere  

## Trade-offs

⚠️ **Breaking change** - Existing `/` route behavior changes  
⚠️ **Complexity** - Profile component now handles both search and profile display  

## Verification

After implementation:
- `http://localhost:4200/` - Shows Profile page with search bar, no profile loaded
- `http://localhost:4200/profile/instagram` - Shows Instagram's profile with search bar
- Search works from both routes
- Selecting a user navigates to `/profile/:username`
- No console errors, all features functional

---

**Date:** 2026-02-09  
**Status:** Implemented  
