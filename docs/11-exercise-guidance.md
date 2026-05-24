# Exercise Guidance

Purpose: define how the online program helps clients understand exercises without overbuilding a full training app.

## Current Workflow

Pete sometimes has to explain what an exercise means or how it works. Right now, he usually finds a video and sends the client a link.

That is a useful pattern, and the portal should support it directly.

## Recommended MVP

Each exercise in a workout can have:

- Exercise name
- Sets/reps or instructions
- Demo video link
- Pete/Lisa notes
- Optional substitution or modification

Example:

```text
Goblet Squat
3 sets of 10

Watch demo
Pete/Lisa notes:
Keep your chest up, sit between your knees, and do not let your heels come up.
If your knees hurt, message before doing this one.
```

## Why This Fits The Business

- Clients get clearer instructions without needing extra back-and-forth.
- Pete and Lisa can keep their personal coaching voice in the notes.
- The program feels closer to one-on-one training.
- It avoids building a huge exercise database before one is needed.
- It supports online clients while keeping the workflow simple.

## Industry Pattern

Online coaching platforms commonly include an exercise library with demo videos, and many allow coaches to add custom videos or links.

Useful patterns to copy:

- Attach demo videos directly to exercises.
- Allow coach-specific notes and cues.
- Start with public/unlisted links.
- Add custom videos over time for common exercises.

Examples checked:

- Trainerize: exercise library and custom exercise videos.
- TrueCoach: demo video library, custom video upload/import, and workout scheduling.
- My PT Hub: preloaded exercise video library plus custom uploads.

Avoid early:

- Building a large video library from scratch.
- Hosting uploaded videos ourselves.
- AI form correction.
- Complicated exercise search/filter systems.

## Product Implications

For the portal MVP, an exercise should probably support:

- `name`
- `sets`
- `reps`
- `instructions`
- `video_url`
- `coach_notes`
- `substitution_notes`

Later, if clients upload form videos, that becomes private client media and should be handled with stronger storage, privacy, and access-control planning.
