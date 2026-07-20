# Security Specification for Taiz Media Platform

## 1. Data Invariants
- Users can only read/write their own private data (bookmarks, notes, highlights, stats).
- Public content (news, videos, events, leader, social_links, quran_series, etc.) is readable by everyone.
- Only admins/managers can write to public content collections.
- User profiles are created on first login and can only be modified by the owner or an admin.
- Roles can only be assigned by admins (not by the user themselves).

## 2. The "Dirty Dozen" Payloads (Anti-Patterns)

1. **Identity Spoofing**: Attempting to create a bookmark for another user.
   - Path: `/users/victim-uid/bookmarks/b1`
   - Payload: `{ "lessonId": "l1", "text": "Stolen", "createdAt": 123 }`
   - Expected: PERMISSION_DENIED

2. **Privilege Escalation**: User trying to make themselves an admin.
   - Path: `/users/my-uid`
   - Payload: `{ "role": "admin" }` (on update)
   - Expected: PERMISSION_DENIED (unless already admin)

3. **Orphaned Content**: Creating a lesson excerpt for a non-existent lesson.
   - Path: `/quran_excerpts/e1`
   - Payload: `{ "lessonId": "non-existent", "title": "...", "content": "..." }`
   - Expected: PERMISSION_DENIED (via `exists()` check)

4. **Resource Poisoning**: Injecting a massive string into a title.
   - Path: `/news/n1`
   - Payload: `{ "title": "A".repeat(100000), ... }`
   - Expected: PERMISSION_DENIED (via `.size()` check)

5. **State Shortcutting**: Updating a terminal status (if applicable).
   - Expected: PERMISSION_DENIED

6. **Shadow Update**: Adding a field not in the schema.
   - Path: `/news/n1`
   - Payload: `{ "title": "...", "hidden_admin_field": true }`
   - Expected: PERMISSION_DENIED (via `affectedKeys().hasOnly()`)

7. **Invalid Type**: Sending a number where a string is expected.
   - Path: `/videos/v1`
   - Payload: `{ "title": 123, ... }`
   - Expected: PERMISSION_DENIED

8. **Missing Required Fields**: Creating a news item without a category.
   - Expected: PERMISSION_DENIED

9. **Unauthorized Delete**: Regular user trying to delete a news item.
   - Expected: PERMISSION_DENIED

10. **Unverified Email**: User with unverified email trying to write (if mandated).
    - Expected: PERMISSION_DENIED

11. **ID Poisoning**: Using a document ID that is too long or has invalid characters.
    - Expected: PERMISSION_DENIED

12. **PII Leak**: Non-owner trying to read another user's private stats.
    - Expected: PERMISSION_DENIED

## 3. Test Runner (Conceptual)
Tests will be implemented in `firestore.rules.test.ts` using the Firebase Rules Unit Testing library.
