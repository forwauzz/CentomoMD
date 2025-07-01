# New Visit Workflow Test Plan

## Test Scenario: Complete New Visit Workflow

### Step 1: Form Selection
1. Navigate to `/` or `/forms`
2. Click on "MI Template" form
3. Visit Selection Modal appears

### Step 2: Visit Creation
1. Click "Nouvelle visite" (New Visit)
2. Enter visit name: "Test Patient - Jan 2025"
3. Click "Commencer la visite"
4. Should navigate to `/forms/cnesst-medical?visit=new&name=Test%20Patient%20-%20Jan%202025`

### Step 3: Form Initialization (CRITICAL)
**Expected behavior:**
- Form should be completely blank
- All localStorage keys should be cleared:
  - `medical-form-draft`
  - `centMD_formData`
  - `medical-form-data`
  - `medical-form-autosave`
- Session storage should be cleared:
  - `dictationResult`
  - `dictationField`
  - `scrollToSection`
  - `highlightField`
- Status should show: "Nouvelle visite: Test Patient - Jan 2025"

### Step 4: Form Data Entry
1. Fill in Section A (patient info)
2. Fill in Section B (diagnosis)
3. Move to Section 7 (Histoire et évolution)

### Step 5: Voice Dictation Test
1. Click on "Histoire et évolution" text field
2. Click floating record button
3. Should navigate to `/dictation` with preserved language and return path
4. Dictation page should start blank (not load old data)
5. Record some text: "Patient reports improvement in symptoms"
6. Click "Sauvegarder à la section"
7. Should return to form with text populated in correct field

### Step 6: Form Saving
1. Click "Sauvegarder copie" button
2. Save dialog should appear with pre-filled title including visit name
3. Save the form
4. Should create new saved form in database

### Step 7: Verification
1. Navigate back to forms page
2. Check saved forms - should see the new copy
3. Verify no old data contamination occurred

## Expected Issues Fixed:
1. ✅ Duplicate API routes removed
2. ✅ Comprehensive localStorage clearing
3. ✅ Visit name preservation through dictation workflow
4. ✅ Session storage management
5. ✅ Proper new visit detection in dictation page

## Test Results:
- [ ] Step 1: Form selection works
- [ ] Step 2: Visit creation with name works
- [ ] Step 3: Form properly clears all data
- [ ] Step 4: Data entry works normally
- [ ] Step 5: Dictation workflow preserves context
- [ ] Step 6: Saving works with proper visit name
- [ ] Step 7: No data contamination between visits