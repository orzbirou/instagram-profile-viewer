# Stories & Infinite Scroll Refactor

**Date:** 2026-02-09  
**Status:** ✅ COMPLETED

---

## Overview

Aligned Stories and Feed UX with assignment PDF requirements:
1. **Removed "View Stories" button** - Stories now open by clicking profile picture
2. **Replaced "Load More" buttons with infinite scroll** - Automatic pagination when scrolling to bottom

---

## Changes Made

### 1. Profile Picture Click for Stories

#### ProfileHeaderComponent
**Files Modified:**
- `apps/frontend/src/app/pages/profile/components/profile-header/profile-header.component.ts`
- `apps/frontend/src/app/pages/profile/components/profile-header/profile-header.component.html`
- `apps/frontend/src/app/pages/profile/components/profile-header/profile-header.component.scss`

**Changes:**
- Added `profilePictureClick` output event emitter
- Added `onProfilePictureClick()` method to emit event
- Added `onProfilePictureKeydown()` method for keyboard accessibility (Enter/Space)
- Made profile picture clickable with:
  - `role="button"`
  - `tabindex="0"`
  - `(click)` and `(keydown)` handlers
  - `aria-label="View Stories"`
- Added CSS styles:
  - `cursor: pointer`
  - Hover effect: `opacity: 0.9`
  - Focus visible outline: `2px solid #0095f6`

#### ProfileComponent
**File Modified:** `apps/frontend/src/app/pages/profile/profile.component.html`

**Changes:**
- Removed entire "View Stories" button section (lines with centered button)
- Wired up profile header click: `<app-profile-header (profilePictureClick)="openStories()" />`
- Stories functionality remains identical, just triggered differently

---

### 2. Infinite Scroll Implementation

#### HTML Template Changes
**File Modified:** `apps/frontend/src/app/pages/profile/profile.component.html`

**Changes for all tabs (Posts, Reels, Tagged, Reposts):**
- ❌ **Removed:** "Load More" button sections
- ✅ **Added:** Scroll sentinel divs with ViewChild references:
  ```html
  @if (moreAvailable() && !isLoading()) {
    <div #postsScrollSentinel class="scroll-sentinel"></div>
  }
  ```
- Sentinels added for each tab: `#postsScrollSentinel`, `#reelsScrollSentinel`, `#taggedScrollSentinel`, `#repostsScrollSentinel`

#### TypeScript Component Changes
**File Modified:** `apps/frontend/src/app/pages/profile/profile.component.ts`

**Imports Added:**
- `ViewChild`, `ElementRef`, `AfterViewInit`, `OnDestroy` from '@angular/core'

**Component Declaration:**
- Implements: `OnInit, AfterViewInit, OnDestroy`

**New Properties:**
```typescript
@ViewChild('postsScrollSentinel') postsScrollSentinel?: ElementRef<HTMLDivElement>;
@ViewChild('reelsScrollSentinel') reelsScrollSentinel?: ElementRef<HTMLDivElement>;
@ViewChild('taggedScrollSentinel') taggedScrollSentinel?: ElementRef<HTMLDivElement>;
@ViewChild('repostsScrollSentinel') repostsScrollSentinel?: ElementRef<HTMLDivElement>;

private intersectionObserver?: IntersectionObserver;
```

**New Lifecycle Methods:**

1. **`ngAfterViewInit()`**
   - Calls `setupInfiniteScroll()`
   - Sets up effect to re-observe when tab changes

2. **`setupInfiniteScroll()`**
   - Creates IntersectionObserver with:
     - `rootMargin: '100px'` - Triggers 100px before sentinel
     - `threshold: 0.1` - Fires when 10% visible
   - Callback checks: `isIntersecting && !isLoading() && moreAvailable()`
   - Calls existing `loadMore()` method when conditions met

3. **`observeCurrentSentinel(tab: ProfileTab)`**
   - Disconnects previous observers
   - Finds current tab's sentinel via switch statement
   - Observes only the active tab's sentinel

4. **`ngOnDestroy()`**
   - Cleans up IntersectionObserver on component destroy

**Behavior:**
- Existing `loadMore()` method unchanged (delegates to `loadPosts`, `loadReels`, etc.)
- Cursor-based pagination preserved (uses `endCursor` signal)
- Loading states and error handling unchanged

#### SCSS Styling
**File Modified:** `apps/frontend/src/app/pages/profile/profile.component.scss`

**Added:**
```scss
.scroll-sentinel {
  height: 1px;
  width: 100%;
  visibility: hidden;
}
```
- Invisible 1px div for IntersectionObserver target
- Does not affect layout or visual appearance

---

## Verification Checklist

### Stories (Profile Picture Click)
- ✅ No "View Stories" button visible on profile page
- ✅ Profile picture shows `cursor: pointer` on hover
- ✅ Profile picture has hover effect (opacity 0.9)
- ✅ Clicking profile picture opens Stories viewer
- ✅ Keyboard navigation works (Tab to focus, Enter/Space to activate)
- ✅ Focus visible outline appears (blue 2px)
- ✅ `aria-label="View Stories"` for screen readers

### Infinite Scroll
- ✅ No "Load More" buttons on any tab (Posts/Reels/Tagged/Reposts)
- ✅ Scrolling to bottom automatically loads next page
- ✅ IntersectionObserver triggers 100px before reaching bottom
- ✅ Loading state shows "Loading more..." while fetching
- ✅ No duplicate requests (guarded by `isLoading()`)
- ✅ Respects `moreAvailable()` flag (stops when no more items)
- ✅ Observer switches correctly when changing tabs
- ✅ Cursor pagination works correctly (no duplicate items)
- ✅ Network tab shows sequential paginated API calls

### No Regressions
- ✅ Profile header displays correctly
- ✅ Highlights carousel works
- ✅ Tab switching works
- ✅ Post modal opens correctly
- ✅ Reels viewer works
- ✅ Error states display properly
- ✅ Empty states display when no content
- ✅ Mobile responsive layout unchanged
- ✅ No console errors

---

## Technical Details

### IntersectionObserver Configuration
```typescript
{
  root: null,              // Use viewport
  rootMargin: '100px',     // Trigger before reaching sentinel
  threshold: 0.1,          // Fire when 10% visible
}
```

**Why 100px rootMargin?**
- Provides smoother UX (starts loading before user reaches bottom)
- Prevents visible "loading" delay
- Matches Instagram's behavior

### Load Triggering Logic
```typescript
if (entry.isIntersecting && !this.isLoading() && this.moreAvailable()) {
  this.loadMore();
}
```

**Guards:**
1. `isIntersecting` - Sentinel is in viewport
2. `!isLoading()` - Prevents duplicate requests
3. `moreAvailable()` - Respects backend pagination end

### Tab Switching Behavior
- Observer disconnects when tab changes
- Small `setTimeout(0)` delay allows DOM to update
- Re-observes new tab's sentinel
- Prevents observing stale/detached elements

---

## Files Modified

1. **Profile Header Component:**
   - `apps/frontend/src/app/pages/profile/components/profile-header/profile-header.component.ts`
   - `apps/frontend/src/app/pages/profile/components/profile-header/profile-header.component.html`
   - `apps/frontend/src/app/pages/profile/components/profile-header/profile-header.component.scss`

2. **Profile Component:**
   - `apps/frontend/src/app/pages/profile/profile.component.ts`
   - `apps/frontend/src/app/pages/profile/profile.component.html`
   - `apps/frontend/src/app/pages/profile/profile.component.scss`

---

## Alignment with Assignment PDF

### ✅ Requirements Met

1. **Stories Open via Profile Picture Click**
   - ❌ BEFORE: Dedicated "View Stories" button
   - ✅ AFTER: Click profile picture (Instagram-authentic UX)

2. **Infinite Scroll for Feed**
   - ❌ BEFORE: Manual "Load More" buttons on all tabs
   - ✅ AFTER: Automatic loading on scroll (Instagram-authentic UX)

3. **No Breaking Changes**
   - Backend pagination unchanged (cursor-based)
   - Existing API calls preserved
   - Same data structures
   - Same error handling

---

## Benefits

### UX Improvements
- ✨ **More intuitive Stories access** - Profile picture is natural clickable element
- ✨ **Seamless content discovery** - No need to click "Load More"
- ✨ **Reduced friction** - Automatic pagination feels native
- ✨ **Instagram parity** - Matches actual Instagram desktop behavior

### Technical Benefits
- ✅ **Native browser API** - IntersectionObserver is performant and well-supported
- ✅ **Clean implementation** - Reuses existing `loadMore()` method
- ✅ **No breaking changes** - Backend unchanged, signals preserved
- ✅ **Proper cleanup** - Observer destroyed on component unmount

---

## Testing Notes

### Manual Testing
1. Navigate to `/profile/instagram`
2. Verify no "View Stories" button
3. Hover over profile picture → pointer cursor
4. Click profile picture → Stories viewer opens
5. Scroll to bottom of Posts grid → auto-loads more
6. Switch to Reels tab → auto-loads more on scroll
7. Switch to Tagged tab → auto-loads more on scroll
8. Switch to Reposts tab → auto-loads more on scroll

### Edge Cases Tested
- ✅ Tab switching mid-scroll
- ✅ Fast scrolling (no duplicate requests)
- ✅ Empty tabs (no infinite loop)
- ✅ Error states (retry button still works)
- ✅ Last page (stops loading when `moreAvailable() === false`)

---

**Status:** ✅ Complete and verified  
**Testing:** Manual browser testing confirmed all functionality  
**Alignment:** Fully matches assignment PDF requirements
