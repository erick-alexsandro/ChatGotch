# ChatGotch

A feature-rich Discord bot that combines digital pet mechanics with invasion events, built using Discord.js.

## Features

- **Digital Pet**: Take care of a digital pet. Feed, fight, and more!
- **Invasion Events**: Regular invasion events where users can participate in fights
- **Help page**: Simple help page with all the commands of the bot

## Prerequisites

- Node.js v16.9.0 or higher
- Discord Bot Token
- Discord Developer Application with proper intents enabled
- A MongoDB collection following the model structure


## Installation

1. Clone the repository:
```bash
git clone https://github.com/erick-alexsandro/Chat-Gotch.git
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add all necessary token:
```env
token=YOUR_DISCORD_BOT_TOKEN
clientId= YOUR_DISCORD_CLIENT_ID
mongoDbUrl = YOUR_MONGODB_URL
IMGUR_SECRET= YOUR_IMGUR_SECRET
IMGUR_ID= YOUR_IMGUR_ID
CHANNEL_ID= YOUR_CHANNEL_ID
```

## Project Structure

- `/commands` - Contains all bot commands organized in folders
- `app.js` - Main application file
- `random_pet.js` - Handles pet spawning system
- `invasion_fight.js` - Manages invasion events
- `index.html` - Page with the commands of the bot

## Features Explanation

#### Pet System
- Pets randomly spawn every hour asking for food
- Users can feed their pets using commands, if not, the pet will eventually die
- Each pet has unique properties

#### Invasion System
- Regular invasion events occur
- Users can participate in fights
- It victorious, the user pet gains another life count

## Running the Bot

Start the bot using:
```bash
node app.js
```

The bot will start and display "Ready!" when successfully connected to Discord. The web interface will be available at http://localhost:8080.

## Contributing
Thank you for considering making a contribution thank you for considering making a contribution! 