# Infrastructure Options

Purpose: choose boring, reliable infrastructure that matches the actual complexity of the project.

## Current Recommendation

Use GitHub Pages for the first proposal and possibly the first public static website.

Why:

- The current site is simple static HTML.
- It is free for this use case.
- It is easy to share.
- It has very little maintenance.
- It is good enough for the pitch and early public website.

## Decision Ladder

### Level 1: Static Site

Best for:

- Proposal page
- Public marketing site
- Services and contact info
- Testimonials
- No private client data

Good options:

- GitHub Pages
- Netlify
- Cloudflare Pages
- Vercel

### Level 2: Static Site Plus Forms

Best for:

- Consultation request form
- Contact form
- Newsletter or inquiry capture

Likely needs:

- Form provider
- Email notification
- Spam protection

### Level 3: Lightweight Web App

Best for:

- Trainer login
- Client login
- Diet plans
- Workout programs
- Exercise demo links
- Health intake/readiness screening
- Session notes
- Private data

Likely needs:

- Authentication
- Database
- Basic admin UI
- Backups
- Privacy/security decisions

### Level 4: Full Product

Best for:

- Payments
- File uploads
- Progress photos
- Client-uploaded form videos
- Hosted exercise demo videos
- Automated reminders
- Client messaging

Likely needs:

- More careful security design
- Storage for images
- Payment provider
- Ongoing maintenance

## Hosting Options To Revisit

### GitHub Pages

Use for the current static pitch and possibly the first public site.

Tradeoff: not meant for private client portals or server-side app logic.

### Netlify

Useful if the static site needs easier form handling, redirects, previews, or simple deploy workflows.

### Cloudflare Pages

Useful for static sites with strong performance and a path toward serverless functions later.

### Vercel

Useful if the project becomes a React/Next.js app with a client portal.

## Decision Questions

- Is this still just public information?
- Does it store private client data?
- Does Dad need to log in?
- Do clients need to log in?
- Are clients uploading photos or measurements?
- Are clients submitting health or medical condition information?
- Are clients uploading form videos?
- Are Pete and Lisa only linking exercise videos, or hosting their own videos?
- Are payments involved?
- How much maintenance are we willing to own?

## Current Decision Log

| Date | Decision | Why |
| --- | --- | --- |
| 2026-05-24 | Use GitHub Pages for the proposal page. | Static HTML is enough for sharing the pitch. |
