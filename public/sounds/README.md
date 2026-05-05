Place an alert sound file here to enable large-transaction audio notifications.

- Filename (recommended): alert.mp3
- Path in project: /public/sounds/alert.mp3
- Allowed formats: .mp3, .wav, .ogg (mp3 is recommended for broad browser support)

Usage in the app:

- The dashboard loads the sound from `/sounds/alert.mp3` by default.
- To use a different path or filename, set the environment variable `NEXT_PUBLIC_ALERT_SOUND` to the public URL (for example `/sounds/my-alert.wav`).

Notes:

- If your browser blocks autoplay, click the "Test Sound" button in the dashboard to allow playback permissions.
- Keep the file size small (under 500KB) for faster loading.
