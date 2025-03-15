# Iftar-Sehri Timer

A simple Progressive Web App (PWA) for tracking Sehri and Iftar times during the month of Ramadan.

## Features

- Automatically determines Sehri and Iftar timings based on the user's current location
- Supports both Shia and Sunni calculation methods
- Dark and Light Mode for better accessibility
- Multiple language support: Arabic, Urdu, Hindi, and English
- Notification alerts for Sehri and Iftar times
- Installable as a Progressive Web App (PWA)

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS for styling
- i18next for internationalization
- Al-Adhan API for prayer times
- next-pwa for PWA functionality
- next-themes for theme management

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/iftar-sehri-timer.git
   cd iftar-sehri-timer
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Building for Production

```bash
npm run build
# or
yarn build
```

## Deployment

The app can be deployed to any static hosting service like Vercel, Netlify, or GitHub Pages.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Al-Adhan API](https://aladhan.com/prayer-times-api) for providing prayer times data
- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for styling 