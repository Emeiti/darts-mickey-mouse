# Mickey Mouse Darts Game

A beautiful and intuitive darts game with a Mickey Mouse theme. This web application allows multiple players to play darts together, keeping track of scores and game history.

## Features

- **Beautiful Mickey Mouse Theme**: Enjoy a fun and visually appealing Mickey Mouse themed darts game.
- **Multiple Players**: Add as many players as you want to join the game.
- **Real-time Score Tracking**: Keep track of scores in real-time.
- **Game History**: View past games and player statistics.
- **Share Links**: Share a link with friends to join your game session.
- **Mobile Friendly**: Play on any device with a responsive design.
- **No Login Required**: Start playing immediately without creating an account.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/mickey-mouse-darts.git
   cd mickey-mouse-darts
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a Firebase project:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Set up Firestore database
   - Register a web app in your Firebase project

4. Configure environment variables:
   - Copy the `.env.example` file to create a new `.env` file:
     ```
     cp .env.example .env
     ```
   - Edit the `.env` file and add your Firebase configuration:
     ```
     REACT_APP_FIREBASE_API_KEY=your-api-key
     REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
     REACT_APP_FIREBASE_PROJECT_ID=your-project-id
     REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
     REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
     REACT_APP_FIREBASE_APP_ID=your-app-id
     ```
   - Note: The `.env` file contains sensitive information and is excluded from version control in the `.gitignore` file.

5. Start the development server:
   ```
   npm start
   ```

6. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Deployment

1. Build the application:
   ```
   npm run build
   ```

2. Deploy to Firebase:
   ```
   npm install -g firebase-tools
   firebase login
   firebase init
   firebase deploy
   ```

## How to Play

1. Start a new game by clicking "Start New Game" on the home page.
2. Add players by entering their names.
3. Click "Start Game" to begin.
4. Each player takes turns throwing darts and scoring points.
5. Click on the score buttons to record points for the current player.
6. The game automatically moves to the next player after each turn.
7. End the game to see the winner and update the leaderboard.
8. Share the game link with friends to let them join your session.

## Technologies Used

- React
- TypeScript
- Firebase (Firestore)
- Styled Components
- React Router

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Mickey Mouse is a trademark of The Walt Disney Company.
- This project is for educational purposes only.
