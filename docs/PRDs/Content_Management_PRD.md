# Feature: Content Management (Roadmap)

## 1. Overview
System for managing wordlists, passages, and content packs. Supports internal curated content, teacher-created content, and community sharing.

## 2. Status
* **Static Content**: Implemented (JSON files in `public/words` and `public/quotes`).
* **Session Content**: Implemented (Teachers can paste/upload text in Connect/Preset mode).
* **Persistent Library**: Planned.

## 3. Content Types (Implemented)
* **Wordlists**: Lists of words for "Word Mode". Currently managed via JSON files in the repo.
* **Passages**: Quotes/Texts for "Quote Mode". Managed via JSON files.

## 4. Content Packs (Planned)
* **Definition**: A bundle of content (wordlists/passages) + metadata.
* **Discovery**:
    * **Public Library**: Curated packs (e.g., "Famous Speeches", "STEM Terms").
    * **Search**: Filter by difficulty, language, tags.
* **Remixing**: Teachers can "clone" a pack to their library and edit it.

## 5. User-Generated Content (Planned)
* **Teacher Uploads**: Persistent storage of custom text. (Currently only available transiently in Session).
* **Visibility**:
    * `Private`: Only for the teacher.
    * `Class`: Visible to enrolled students.
    * `Public`: Submitted to community library (requires moderation).

## 6. Moderation Pipeline (Planned)
* **Submission**: Public submissions enter a "Pending" queue.
* **Review**: Staff/Admins approve or reject.
* **Flagging**: Automated checks for profanity/PII.
