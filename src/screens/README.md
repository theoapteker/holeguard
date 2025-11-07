# ProfileSetupScreen

A comprehensive profile setup screen that appears after first signup to collect user information.

## Features

### Required Fields
- **Username**: Unique identifier, 3-30 characters, alphanumeric + underscore only
- **Full Name**: User's display name
- **Position**: Water polo position (Goalie, Center, Driver, Wing)
- **Skill Level**: Player's skill level (Beginner, Intermediate, Advanced, Pro)
- **Location**: User's location (city, state, or region)

### Optional Fields
- **Bio**: Short biography (max 200 characters)
- **Avatar**: Profile picture uploaded to Supabase Storage

### UI Components
- **Progress Indicator**: Shows "Step 1 of 1" with visual progress bar
- **Avatar Upload**:
  - Tap to select image from library
  - Shows preview of selected image
  - Requests media library permissions
  - Uploads to Supabase Storage bucket 'avatars'
  - Displays loading indicator during upload
- **Position Picker**: Native dropdown/picker component
- **Skill Level Buttons**: Interactive button group with visual feedback
- **Text Inputs**: Clean, bordered inputs with hints and character counters
- **Action Buttons**:
  - "Complete Profile" - Validates and saves profile
  - "Skip for now" - Allows users to complete profile later (with confirmation)

## Form Validation

The screen includes comprehensive validation:
- Username: Required, 3-30 chars, alphanumeric + underscore format
- Full Name: Required
- Position: Required selection
- Skill Level: Required selection
- Location: Required
- Bio: Optional, max 200 characters
- All validation errors shown via native alerts

## Technical Implementation

### Avatar Upload Flow
1. User selects image from library (with permission request)
2. Image is displayed as preview
3. On submit, image is:
   - Converted to blob
   - Uploaded to Supabase Storage bucket 'avatars'
   - Stored with filename: `{userId}-{timestamp}.{ext}`
   - Public URL is generated and saved to profile

### Profile Save Flow
1. Form validation runs
2. Avatar uploads (if selected)
3. Profile data inserted into `profiles` table
4. Success alert shown
5. `onComplete` callback invoked to navigate to main app

### Error Handling
- Duplicate username (23505 error code) - specific message
- Upload failures - allows continuation without avatar
- Generic errors - user-friendly messages
- All errors logged to console for debugging

## Usage

```tsx
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';

function YourNavigator() {
  const handleProfileComplete = () => {
    // Navigate to main app
    navigation.navigate('Main');
  };

  return (
    <ProfileSetupScreen onComplete={handleProfileComplete} />
  );
}
```

## Supabase Setup Required

### Storage Bucket
Create a storage bucket named `avatars` with the following settings:
- Public bucket (for public URLs)
- File size limit: 5MB recommended
- Allowed MIME types: image/jpeg, image/png, image/webp

### RLS Policies
The bucket should have policies allowing:
- Authenticated users to upload their own avatars
- Public read access for avatar URLs

Example policy:
```sql
-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Styling

The screen uses a clean card-based layout with:
- Safe area handling for notched devices
- Responsive scroll view
- Consistent spacing and padding
- Primary color: #0066CC
- Clean white cards with subtle shadows
- Proper keyboard handling
- Touch feedback on interactive elements

All styles use the shared theme from `/src/theme/colors.ts`.

## Future Enhancements

Potential improvements:
- [ ] GPS location picker instead of text input
- [ ] Multi-step wizard for complex profiles
- [ ] Social media links
- [ ] Profile preview before submission
- [ ] Image cropping/editing
- [ ] Compress images before upload
- [ ] Offline support with queue
