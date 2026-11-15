# T7 Defense IQ Prep — V2.4

A browser-based, defence-preparation practice workspace with an offline question bank, reasoning drills, special-test practice, local progress tracking, and an optional Current Affairs question feed.

> **Independent study project.** This is not an official recruitment portal and is not affiliated with any defence service. Always verify recruitment requirements from official notices.

## Highlights

- **IQ practice:** mixed and category-based question practice with local progress tracking.
- **Special tests:** WAT, PPDT, planning-test activities, and related practice tools.
- **Training dashboard:** accuracy, attempts, topic mastery indicators, and a local training HUD.
- **Current Affairs question centre:** questions are hidden behind a dedicated entry card and open only when selected; a Back button returns to the Current Affairs landing view.
- **Always-available News Reading Desk:** remains directly on the Current Affairs page outside the expandable question centre, with Bangladesh, international, government, and defence source links. It includes the T7 site mark and adapts to desktop and mobile screens.
- **Manual CA editor:** add questions through the editor drawer. Manual questions are stored in the current browser and expire according to the UI's stated retention period. Export a JSON backup before clearing browser data.
- **Profile and guided tour:** profile preferences and the app walkthrough are stored locally in the browser.
- **Offline-ready core:** the main local question bank works without a live Current Affairs feed. External news links and automated updates require internet access.

## Automated Current Affairs updates (optional)

The workflow in `.github/workflows/daily-current-affairs.yml` runs the updater in GitHub Actions (scheduled for 02:00 UTC / 08:00 Bangladesh time, and also available via manual dispatch).

- **Automated content** can be incomplete or inaccurate. Check the source links and verify important facts independently. If the API secret is not configured, the feed may not update; the offline question bank remains separate.

## Data and privacy notes

- Practice progress, profile settings, and manual Current Affairs questions are stored locally in the browser unless a specific feature says otherwise.
- Clearing site/browser data can remove local records. Export manual CA questions if you want a backup.
- The Current Affairs feed and linked news websites need an internet connection.
- Do not enter passwords, private information, or sensitive personal data into practice fields.
- To add any question enter the password `22May_1Sep`

## Project structure

```text
T7_Defense_IQ_Prep_V2.1/
├── index.html                     # Main interface
├── style.css                      # Visual design and responsive layout
├── script.js                      # Core navigation and practice logic
├── questions.js                   # Main question bank
├── user-questions.js               # User-question support
├── current-affairs.js              # CA feed, practice, and manual editor
├── current-affairs.json            # Generated/current CA feed data
├── scripts/update-current-affairs.js
├── .github/workflows/daily-current-affairs.yml
└── README.md
```

## License

No license is specified in this repository, as it's free for all. `please give star for making it free`.