# TradeLab — AI-Powered Trading Arcade

Welcome to TradeLab, a sophisticated, AI-powered paper trading simulator designed for both novice and experienced traders. TradeLab provides a safe, real-time environment to experiment with trading strategies, compete against AI, and hone your market analysis skills without any financial risk.

## Features

- **Simulated Market Feeds**: Trade a variety of synthetic assets that mimic real-world market volatility and behavior.
- **AI-Powered Trade Ideas**: Leverage Gemini AI to get multiple trading signals, complete with rationales and technical analysis snapshots for each decision point.
- **Simplified Trading UX**: A beginner-friendly interface with a QuickTrade dock, one-tap trading, and automated risk management (Stop-Loss/Take-Profit).
- **Guided Onboarding**: An interactive tour for first-time users to get them trading in seconds.
- **Competitive Tournaments**: Participate in daily challenges on a level playing field or go head-to-head with other players in PvP matches.
- **Global Leaderboards**: See how your performance stacks up against other traders worldwide and in daily competitions.
- **Unlock Achievements**: Earn badges and recognition for reaching key trading milestones and accomplishments.
- **Performance Analytics**: Dive deep into your trading history with detailed analytics on your performance, decision-making patterns, and profitability by asset.
- **Safe Learning Environment**: Learn the ropes of trading with zero risk. Since it's a simulation, no real money is ever involved.

## Quickstart

Get TradeLab running locally using Docker.

```bash
# Clone the repository
git clone https://github.com/your-repo/tradelab.git
cd tradelab

# Build and run the containers
docker-compose up --build
```

Once the containers are running, open your browser and navigate to `http://localhost:5173`.

## Quality Assurance & Testing

To assist with testing the first-time user experience, you can reset specific features using your browser's developer console:

- **Reset the Guided Tour**: To re-trigger the initial guided tour, run the following command:
  ```javascript
  localStorage.removeItem('tourDone');
  ```
- **Reset the Inactivity Nudge**: To test the inactivity prompt that appears after 15 seconds, run this command (this uses `sessionStorage`, so it resets with the browser session):
  ```javascript
  sessionStorage.removeItem('nudgeShown');
  ```
- **Reset Disclaimer Acceptance**: To re-trigger the initial disclaimer modal:
  ```javascript
  localStorage.removeItem('disclaimerAccepted');
  ```

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Database**: SQLite
- **AI Integration**: Google Gemini API

## Roadmap

TradeLab is constantly evolving. Here's what we have planned for the future:

- **TradeLab Pro**: An advanced simulator with more complex order types, institutional-grade analytics, and custom strategy back-testing.
- **TradeLab Connect**: An API service allowing users to connect their paper or live brokerage accounts to test strategies in a real-world environment.
- **TradeLab AI**: A standalone, trainable trading bot that users can configure and deploy based on their winning strategies from the simulator.

## Contact & Contribution

Have questions, feedback, or want to contribute? Please open an issue on our GitHub repository. We welcome all contributions!