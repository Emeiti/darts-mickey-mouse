import React, { useState, useEffect, FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { collection, addDoc, updateDoc, doc, getDoc, onSnapshot, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { Player, Game, DartHit } from '../types';
import PlayerForm from '../components/PlayerForm';
import PlayerCard from '../components/PlayerCard';
import Scoreboard from '../components/Scoreboard';
import GameControls from '../components/GameControls';
import MickeyMouseBoard from '../components/MickeyMouseBoard';
import Button from '../components/Button';

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};
`;

const Title = styled.h1`
  font-size: 2rem;
  color: white;
  text-align: center;
  margin: 0;
`;

const Header = styled.header`
  background-color: #444444;
  color: white;
  padding: ${props => props.theme.spacing.md};
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${props => props.theme.shadows.medium};
  position: relative;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  
  &:focus {
    outline: none;
  }
`;

const MenuContainer = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  background-color: #fff;
  box-shadow: ${props => props.theme.shadows.medium};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.md};
  width: 250px;
  z-index: 100;
  display: ${props => props.$isOpen ? 'block' : 'none'};
`;

const MenuItem = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  padding: ${props => props.theme.spacing.md};
  border: none;
  background: none;
  font-size: 1rem;
  cursor: pointer;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: ${props => props.theme.colors.background};
  }
`;

const PlayersContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  margin-top: ${props => props.theme.spacing.xl};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const GameInfo = styled.div`
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadows.medium};
  text-align: center;
  color: ${props => props.theme.colors.black};
  
  @media (max-width: 768px) {
    padding: ${props => props.theme.spacing.md};
  }
  
  h2 {
    color: ${props => props.theme.colors.primary};
    margin-bottom: ${props => props.theme.spacing.md};
  }
  
  p {
    font-size: 1.1rem;
    margin-bottom: ${props => props.theme.spacing.sm};
  }
`;

const LoadingMessage = styled.p`
  text-align: center;
  font-size: ${props => props.theme.fontSizes.large};
  color: ${props => props.theme.colors.text};
`;

// For React Router v6
type RouteParams = {
  sessionId?: string;
};

// Define the target numbers for Mickey Mouse game
const MICKEY_MOUSE_NUMBERS = ['20', '19', '18', '17', '16', '15', '14', '13', '12', 'B'];

// Add new types for the enhanced data structure
interface DartThrow {
  playerId: string;
  number: string;
  multiplier: 1 | 2 | 3;
  timestamp: number;
}

interface TargetStatus {
  number: string;
  playerHits: {
    [playerId: string]: number; // Number of times player has hit this target
  };
  isClosedByAll: boolean;
}

interface GameSession {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  isActive: boolean;
  startTime: number;
  endTime?: number;
  gameType: string;
  targetNumbers: string[];
  winner?: string;
  dartThrows: DartThrow[]; // All darts thrown in the game
  targetStatuses: TargetStatus[]; // Status of each target
}

const GamePage: FC = () => {
  const { sessionId } = useParams<RouteParams>();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameActive, setGameActive] = useState(false);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameNumber, setGameNumber] = useState(1);
  const [gameId, setGameId] = useState(sessionId || '');
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(sessionId ? true : false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Initialize a player with empty marks for all target numbers
  const initializePlayerMarks = () => {
    const marks: { [key: string]: number } = {};
    MICKEY_MOUSE_NUMBERS.forEach(number => {
      marks[number] = 0;
    });
    return marks;
  };
  
  // Check if any player has closed all numbers
  const hasPlayerClosedAll = (player: Player) => {
    return MICKEY_MOUSE_NUMBERS.every(num => player.marks[num] === 3);
  };
  
  // Check if all players have closed a number
  const isNumberClosedByAll = (number: string) => {
    // Make sure we're checking if ALL players have closed the number (marks === 3)
    // This is important for scoring - players can score on numbers they've closed
    // as long as not all players have closed them
    return players.length > 0 && players.every(player => (player.marks && player.marks[number] === 3));
  };
  
  // Move to the next player
  const moveToNextPlayer = async (finalScoreOverride?: number) => {
    // Capture the current state of players one more time before changing player
    const playersBeforeSwitch = [...players];
    const currentPlayerBeforeSwitch = currentPlayerIndex;
    
    // Retrieve and log the exact score to confirm what we're working with
    // Use finalScoreOverride if provided, otherwise use the state value
    const currentPlayerScore = finalScoreOverride !== undefined 
      ? finalScoreOverride 
      : playersBeforeSwitch[currentPlayerBeforeSwitch]?.score || 0;
    
    console.log("🔄 PLAYER SWITCH: Moving to next player", { 
      currentPlayerIndex, 
      nextPlayerIndex: (currentPlayerIndex + 1) % players.length,
      currentPlayerName: players[currentPlayerIndex]?.name,
      nextPlayerName: players[(currentPlayerIndex + 1) % players.length]?.name,
      finalCurrentPlayerScore: currentPlayerScore,
      usingOverrideScore: finalScoreOverride !== undefined,
      playerScoresBeforeSwitch: playersBeforeSwitch.map(p => `${p.name}: ${p.score}`).join(', ')
    });
    
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    
    // Create a deep copy of the players array to avoid state mutation issues
    const updatedPlayers = players.map(player => ({
      ...player,
      marks: { ...(player.marks || {}) },
      closedNumbers: [...(player.closedNumbers || [])]
    }));
    
    // CRITICAL: Ensure we preserve the final score of the current player
    if (currentPlayerBeforeSwitch >= 0 && currentPlayerBeforeSwitch < updatedPlayers.length) {
      // Make sure the score from before the switch is preserved
      // Use the override score if provided
      updatedPlayers[currentPlayerBeforeSwitch].score = currentPlayerScore;
      console.log(`💾 PRESERVED: ${updatedPlayers[currentPlayerBeforeSwitch].name}'s score as ${currentPlayerScore}`);
    }
    
    // Update current turn status and reset arrows thrown
    updatedPlayers.forEach((player, index) => {
      const isNextPlayer = index === nextPlayerIndex;
      player.currentTurn = isNextPlayer;
      
      // Always ensure arrowsThrown is a valid number
      if (typeof player.arrowsThrown !== 'number' || isNaN(player.arrowsThrown)) {
        player.arrowsThrown = 0;
      }
      
      // Reset arrows thrown for the next player
      if (isNextPlayer) {
        player.arrowsThrown = 0;
      }
      
      // Ensure the current player has thrown all 3 darts
      if (index === currentPlayerIndex && player.arrowsThrown < 3) {
        console.log(`Ensuring current player ${player.name} has thrown all 3 darts before moving`);
        player.arrowsThrown = 3;
      }
    });
    
    console.log("PLAYER SCORES AFTER UPDATE:", updatedPlayers.map((p) => ({ 
      name: p.name, 
      score: p.score,
      arrowsThrown: p.arrowsThrown,
      currentTurn: p.currentTurn,
    })));
    
    // Update local state first
    setPlayers(updatedPlayers);
    setCurrentPlayerIndex(nextPlayerIndex);
    
    // Update game in Firestore
    try {
      if (gameId) {
        const docRef = doc(db, 'games', gameId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          // Update the game with the next player and mark the switch as a turn change
          await updateDoc(docRef, {
            players: updatedPlayers,
            currentPlayerIndex: nextPlayerIndex,
            dartThrows: arrayUnion({
              playerId: updatedPlayers[currentPlayerIndex].id,
              number: 'TURN_CHANGE',
              multiplier: 1,
              timestamp: Date.now(),
            })
          });
          
          // Verify the update was successful
          console.log(`PLAYER SWITCH COMPLETE: Final score for ${updatedPlayers[currentPlayerBeforeSwitch].name}: ${updatedPlayers[currentPlayerBeforeSwitch].score}`);
          
          // Double-check the final state after all updates
          const finalCheck = await getDoc(docRef);
          if (finalCheck.exists()) {
            const finalData = finalCheck.data() as any;
            let finalPlayers = finalData.players;
            
            // Ensure players is an array
            if (!Array.isArray(finalPlayers)) {
              finalPlayers = Object.values(finalPlayers);
            }
            
            // Log the final score as it exists in Firestore
            if (finalPlayers && finalPlayers.length > currentPlayerBeforeSwitch) {
              console.log(`FINAL DB CHECK: ${updatedPlayers[currentPlayerBeforeSwitch].name}'s score in Firestore: ${finalPlayers[currentPlayerBeforeSwitch].score}`);
            }
          }
        } else {
          // Create a new game document if it doesn't exist
          await setDoc(docRef, {
            players: updatedPlayers,
            currentPlayerIndex: nextPlayerIndex,
            isActive: true,
            startTime: Date.now(),
            gameType: 'mickeyMouse',
            targetNumbers: MICKEY_MOUSE_NUMBERS,
            dartThrows: [{
              playerId: updatedPlayers[currentPlayerIndex].id,
              number: 'TURN_CHANGE',
              multiplier: 1,
              timestamp: Date.now(),
            }],
            targetStatuses: MICKEY_MOUSE_NUMBERS.map(num => ({
              number: num,
              playerHits: {},
              isClosedByAll: false
            }))
          });
          
          // Update URL without reloading the page if not already set
          if (!sessionId) {
            window.history.pushState({}, '', `/game/${gameId}`);
            setShareUrl(`${window.location.origin}/shared-game/${gameId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error updating game:', error);
    }
  };
  
  // Update the handle score number function to handle the new Double/Triple format
  const handleScoreNumber = async (number: string, multiplier: 1 | 2 | 3) => {
    if (!gameActive) {
      console.log("Game not active, ignoring score");
      return;
    }
    
    // Special case for undo/redo operations
    if (number === 'UNDO' || number === 'REDO') {
      // For undo/redo, we just refresh the UI without recording it in Firestore
      console.log(`${number} operation applied - refreshing UI only`);
      
      // Force UI refresh by updating state
      setPlayers([...players]);
      
      return;
    }
    
    console.log("SCORING: handleScoreNumber called", { 
      number, 
      multiplier, 
      currentPlayerIndex,
      playerName: players[currentPlayerIndex]?.name,
      arrowsThrown: players[currentPlayerIndex]?.arrowsThrown,
      currentScore: players[currentPlayerIndex]?.score 
    });
    
    // Create a deep copy of the players array to avoid state mutation issues
    const updatedPlayers = JSON.parse(JSON.stringify(players));
    const currentPlayer = updatedPlayers[currentPlayerIndex];
    
    if (!currentPlayer) {
      console.error("Current player not found!", { currentPlayerIndex, playersLength: players.length });
      return;
    }
    
    // Initialize arrowsThrown if it doesn't exist
    if (currentPlayer.arrowsThrown === undefined) {
      console.log("Initializing arrowsThrown for", currentPlayer.name);
      currentPlayer.arrowsThrown = 0;
    }
    
    // Ensure arrowsThrown is a valid number
    if (typeof currentPlayer.arrowsThrown !== 'number' || isNaN(currentPlayer.arrowsThrown)) {
      console.log("Fixing invalid arrowsThrown value for", currentPlayer.name);
      currentPlayer.arrowsThrown = 0;
    }
    
    // Ensure arrowsThrown is within valid range (0-3)
    if (currentPlayer.arrowsThrown < 0) {
      console.log("Fixing negative arrowsThrown for", currentPlayer.name);
      currentPlayer.arrowsThrown = 0;
    }
    if (currentPlayer.arrowsThrown > 3) {
      console.log("Player has thrown too many arrows, resetting to 3 and moving to next player");
      currentPlayer.arrowsThrown = 3;
      setPlayers(updatedPlayers);
      await moveToNextPlayer(currentPlayer.score);
      return;
    }
    
    // Handle miss or OK button (move to next player)
    if (number === 'MISS' || number === 'OK') {
      console.log("Moving to next player due to MISS or OK");
      
      // For MISS, increment arrows thrown and record the throw
      if (number === 'MISS') {
        currentPlayer.arrowsThrown = (currentPlayer.arrowsThrown || 0) + 1;
        
        // Record the miss in Firestore
        try {
          if (gameId) {
            const dartThrow: DartThrow = {
              playerId: currentPlayer.id,
              number: 'MISS',
              multiplier: 1,
              timestamp: Date.now(),
            };
            
            const docRef = doc(db, 'games', gameId);
            await updateDoc(docRef, {
              dartThrows: arrayUnion(dartThrow)
            });
          }
        } catch (error) {
          console.error('Error recording miss:', error);
        }
        
        // If player has thrown 3 arrows after this miss, move to next player
        if (currentPlayer.arrowsThrown >= 3) {
          setPlayers(updatedPlayers);
          await moveToNextPlayer(currentPlayer.score);
          return;
        }
      } else {
        // For OK, just move to next player
        setPlayers(updatedPlayers);
        await moveToNextPlayer(currentPlayer.score);
      }
      
      // Update players state if we're not moving to next player
      if (number === 'MISS' && currentPlayer.arrowsThrown < 3) {
        setPlayers(updatedPlayers);
      }
      
      return;
    }
    
    // Ensure current player has arrows left
    const currentArrowsThrown = currentPlayer.arrowsThrown || 0;
    console.log("Current arrows thrown:", currentArrowsThrown);
    
    if (currentArrowsThrown >= 3) {
      // No arrows left, move to next player
      console.log("No arrows left, moving to next player");
      setPlayers(updatedPlayers); // Make sure to update players before moving to next player
      await moveToNextPlayer(currentPlayer.score);
      return;
    }
    
    // Increment arrows thrown
    const newArrowsThrown = currentArrowsThrown + 1;
    console.log("Incrementing arrows thrown to", newArrowsThrown);
    currentPlayer.arrowsThrown = newArrowsThrown;
    
    // Initialize marks object if it doesn't exist
    if (!currentPlayer.marks) {
      currentPlayer.marks = initializePlayerMarks();
    }
    
    // Parse the Double/Triple format if it's in the format "D_15" or "T_18"
    let targetNumber = number;
    let baseNumber = 0;
    let specialMultiplier = 1;
    
    if (number.includes('_')) {
      const [type, value] = number.split('_');
      targetNumber = type; // D or T
      baseNumber = parseInt(value, 10); // The actual number (12-20)
      
      if (type === 'D') {
        specialMultiplier = 2; // Double
      } else if (type === 'T') {
        specialMultiplier = 3; // Triple
      }
      
      console.log(`Processing special hit: ${type} on number ${baseNumber}, worth ${baseNumber * specialMultiplier} points`);
    }
    
    // Get current marks for this number
    const currentMarks = currentPlayer.marks[targetNumber] || 0;
    console.log(`Current marks for ${targetNumber}:`, currentMarks);
    
    // Validate current marks
    if (typeof currentMarks !== 'number' || isNaN(currentMarks)) {
      console.log(`Invalid marks value for ${targetNumber}, resetting to 0`);
      currentPlayer.marks[targetNumber] = 0;
    }
    
    // Convert number to numeric value for scoring
    let pointValue = 0;
    if (targetNumber === 'B') {
      pointValue = 25; // Bull's-eye value
    } else if (targetNumber === 'D') {
      if (baseNumber > 0) {
        // For specific Double score (D_15, D_18, etc.)
        pointValue = baseNumber * 2;
      } else {
        // For general D on the board
        pointValue = 25; // Default Double value
      }
    } else if (targetNumber === 'T') {
      if (baseNumber > 0) {
        // For specific Triple score (T_15, T_18, etc.)
        pointValue = baseNumber * 3;
      } else {
        // For general T on the board
        pointValue = 30; // Default Triple value
      }
    } else {
      pointValue = parseInt(targetNumber, 10);
    }
    
    // Record the dart throw in Firestore
    try {
      if (gameId) {
        // For special formats, store both pieces of information
        const dartThrow: DartThrow = {
          playerId: currentPlayer.id,
          number: number.includes('_') ? number : targetNumber, // Store the full format for double/triple specifics
          multiplier, // Store the actual multiplier
          timestamp: Date.now(),
        };
        
        const docRef = doc(db, 'games', gameId);
        
        // First check if the document exists
        const initialDocSnap = await getDoc(docRef);
        if (!initialDocSnap.exists()) {
          // If document doesn't exist, create it with initial data
          await setDoc(docRef, {
            id: gameId,
            players: updatedPlayers,
            currentPlayerIndex,
            isActive: true,
            startTime: Date.now(),
            gameType: 'MickeyMouse',
            targetNumbers: MICKEY_MOUSE_NUMBERS,
            dartThrows: [dartThrow],
            targetStatuses: MICKEY_MOUSE_NUMBERS.map(number => ({
              number,
              playerHits: {},
              isClosedByAll: false
            }))
          });
        } else {
          // Document exists, just update it
          await updateDoc(docRef, {
            dartThrows: arrayUnion(dartThrow)
          });
        }
        
        // Fetch the game to get the current target statuses
        const updatedDocSnap = await getDoc(docRef);
        if (updatedDocSnap.exists()) {
          const gameData = updatedDocSnap.data() as any;
          
          // Initialize targetStatuses if they don't exist
          let targetStatuses = gameData.targetStatuses || [];
          if (!targetStatuses || !Array.isArray(targetStatuses) || targetStatuses.length === 0) {
            targetStatuses = MICKEY_MOUSE_NUMBERS.map(num => ({
              number: num,
              playerHits: {},
              isClosedByAll: false
            }));
          }
          
          // Find the target status for the current number
          let targetStatus = targetStatuses.find((ts: TargetStatus) => ts.number === targetNumber);
          if (!targetStatus) {
            targetStatus = {
              number: targetNumber,
              playerHits: {},
              isClosedByAll: false
            };
            targetStatuses.push(targetStatus);
          }
          
          // Initialize player hits if needed
          if (!targetStatus.playerHits) {
            targetStatus.playerHits = {};
          }
          
          if (!targetStatus.playerHits[currentPlayer.id]) {
            targetStatus.playerHits[currentPlayer.id] = 0;
          }
          
          // Calculate how many hits to add (use the multiplier to add marks)
          const currentHits = targetStatus.playerHits[currentPlayer.id];
          const newHits = Math.min(currentHits + multiplier, 3);
          
          // Update player hits
          targetStatus.playerHits[currentPlayer.id] = newHits;
          
          // Check if all players have closed this number
          const allPlayersClosedNumber = players.every(p => 
            targetStatus.playerHits[p.id] === 3
          );
          
          targetStatus.isClosedByAll = allPlayersClosedNumber;
          
          // Calculate scoring based on the updated target statuses
          // Case 1: Player has already closed this number
          const initialScore = currentPlayer.score || 0;
          if (currentHits >= 3) {
            // If the number is not closed by all players, player scores points
            if (!targetStatus.isClosedByAll) {
              // For standard numbers, use the multiplier passed
              // For special double/triple formats, use the calculated point value
              const pointsToAdd = number.includes('_') ? pointValue : (pointValue * multiplier);
              
              // Add points to the player's score
              currentPlayer.score = (currentPlayer.score || 0) + pointsToAdd;
              console.log(`SCORED: ${currentPlayer.name} scored ${pointsToAdd} points, new score: ${currentPlayer.score}, previous: ${initialScore}`);
            } else {
              console.log(`Number ${targetNumber} is closed by all players, no points scored`);
            }
          } 
          // Case 2: Player closed this number with this hit
          else if (newHits >= 3 && currentHits < 3) {
            console.log(`Player closed ${targetNumber} with this hit`);
            
            // If number is not closed by all players, check if there are extra marks to score points
            if (!targetStatus.isClosedByAll) {
              // Calculate extra marks (beyond closing)
              const extraMarks = (currentHits + multiplier) - 3;
              // Score points for the extra marks
              let pointsScored = 0;
              if (number.includes('_')) {
                // For special double/triple formats, use the special value
                pointsScored = pointValue * extraMarks;
              } else {
                // For standard numbers, calculate points based on the base number value
                const basePointValue = targetNumber === 'B' ? 25 : parseInt(targetNumber, 10);
                pointsScored = basePointValue * extraMarks;
              }
              currentPlayer.score = (currentPlayer.score || 0) + pointsScored;
              console.log(`SCORED EXTRA: ${currentPlayer.name} scored ${pointsScored} points from ${extraMarks} extra marks after closing ${targetNumber}`);
            }
          }
          
          // Update marks for UI display based on the target statuses
          currentPlayer.marks[targetNumber] = newHits;
          
          // Update the closedNumbers array
          currentPlayer.closedNumbers = Object.keys(currentPlayer.marks)
            .filter(num => currentPlayer.marks[num] === 3);
          
          // Update target statuses in Firestore
          await updateDoc(docRef, {
            targetStatuses,
            players: updatedPlayers
          });
        }
      }
    } catch (error) {
      console.error('Error recording dart throw:', error);
    }
    
    // Debug log the updated marks
    console.log(`${currentPlayer.name}'s marks for ${targetNumber} after update:`, currentPlayer.marks[targetNumber]);
    console.log(`All marks for ${currentPlayer.name}:`, Object.entries(currentPlayer.marks)
      .filter(([_, val]) => val as number > 0)
      .map(([key, val]) => `${key}:${val}`)
      .join(', '));
    
    // Always update the players state immediately to reflect changes
    console.log("Updating players:", updatedPlayers.map((p: Player) => ({ 
      name: p.name, 
      arrowsThrown: p.arrowsThrown,
      score: p.score,
      marks: Object.entries(p.marks || {}).filter(([_, val]) => val > 0).map(([key, val]) => `${key}:${val}`).join(',')
    })));
    
    // Update local state first
    setPlayers(updatedPlayers);
    
    // Check if the player has closed all numbers
    const playerClosedAllTargets = hasPlayerClosedAll(currentPlayer);
    
    // Only end the game if a player has closed ALL targets
    if (playerClosedAllTargets) {
      console.log("Player has closed all targets, ending game");
      await handleEndGame();
      return;
    }
    
    // Check if player has thrown 3 arrows
    let shouldMoveToNextPlayer = false;
    if (newArrowsThrown >= 3) {
      // Move to the next player
      console.log("Player has thrown 3 arrows, moving to next player");
      shouldMoveToNextPlayer = true;
    }
    
    // Move to next player if needed but only after we've processed the points for this hit
    if (shouldMoveToNextPlayer) {
      console.log("CRITICAL SECTION: Preparing to switch players - ensuring score is saved first");
      
      // IMPORTANT: We need to make sure the database update happens BEFORE we switch players
      // This is a critical section to ensure scores are properly saved
      if (gameId) {
        try {
          // First, make a direct update to just save the score for the current player
          // This focuses on one critical field to minimize race conditions
          console.log(`DIRECT SAVE: Saving ${currentPlayer.name}'s score of ${currentPlayer.score}`);
          
          const docRef = doc(db, 'games', gameId);
          
          // First, get the latest state to ensure we don't overwrite other changes
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const gameData = docSnap.data() as any;
            let firestorePlayers = gameData.players;
            
            // Ensure Firestore players is an array
            if (!Array.isArray(firestorePlayers)) {
              firestorePlayers = Object.values(firestorePlayers);
            }
            
            // Make sure we have enough players
            if (firestorePlayers && firestorePlayers.length > currentPlayerIndex) {
              // Force the current player's score to be updated in Firestore data
              firestorePlayers[currentPlayerIndex].score = currentPlayer.score;
              
              // Store the final score to pass to moveToNextPlayer
              const finalScore = currentPlayer.score;
              
              // Log the state before saving to Firestore
              console.log(`PREPARE SAVE: Setting ${currentPlayer.name}'s final score to ${finalScore} in Firestore`);
              
              // CRITICAL: Use a try/catch block to ensure we can continue even if this update fails
              try {
                // Update Firestore with the merged data
                await updateDoc(docRef, {
                  players: firestorePlayers
                });
                console.log(`SAVE SUCCESS: Confirmed ${currentPlayer.name}'s score is ${finalScore} in Firestore`);
              } catch (error) {
                console.error("ERROR: Failed to save final score:", error);
              }
              
              // CRITICAL: Add a small delay before switching player to allow UI to refresh
              console.log("DELAY: Waiting before moving to next player...");
              
              // Update the local state once more to ensure it has the final score
              setPlayers(prevPlayers => {
                const finalState = [...prevPlayers];
                if (finalState[currentPlayerIndex]) {
                  // Ensure the score is set correctly in local state
                  finalState[currentPlayerIndex].score = finalScore;
                }
                return finalState;
              });
              
              // Now move to next player after ensuring the score is saved
              // Pass the final score directly to avoid closure issues
              setTimeout(async () => {
                console.log(`SWITCH: Moving to next player after saving ${currentPlayer.name}'s score of ${finalScore}`);
                await moveToNextPlayer(finalScore);
              }, 200);
            } else {
              console.error("ERROR: Player index mismatch between local and Firestore");
              // Still try to move to next player after a delay, passing the score directly
              setTimeout(async () => await moveToNextPlayer(currentPlayer.score), 200);
            }
          } else {
            console.error("ERROR: Game document not found in Firestore");
            
            // Check if we need to create a new game document
            try {
              console.log("Attempting to create a new game document since none was found");
              const newGameSession = {
                players: updatedPlayers,
                currentPlayerIndex: currentPlayerIndex,
                isActive: true,
                startTime: Date.now(),
                gameType: 'mickeyMouse',
                targetNumbers: MICKEY_MOUSE_NUMBERS,
                dartThrows: [{
                  playerId: currentPlayer.id,
                  number: number,
                  multiplier: multiplier,
                  timestamp: Date.now(),
                }],
                targetStatuses: MICKEY_MOUSE_NUMBERS.map(num => ({
                  number: num,
                  playerHits: {},
                  isClosedByAll: false
                }))
              };
              
              await setDoc(doc(db, 'games', gameId), newGameSession);
              console.log("Created new game document with ID:", gameId);
              
              // Still try to move to the next player after document creation
              setTimeout(async () => await moveToNextPlayer(currentPlayer.score), 200);
            } catch (createError) {
              console.error("Failed to create new game document:", createError);
              setTimeout(async () => await moveToNextPlayer(currentPlayer.score), 200);
            }
          }
        } catch (error) {
          console.error("ERROR: Failed in player switching process:", error);
          // If there's an error, still try to move to the next player with the score
          setTimeout(async () => {
            console.warn("RECOVERY: Moving to next player despite errors");
            await moveToNextPlayer(currentPlayer.score);
          }, 200);
        }
      } else {
        // If there's no gameId, just move to the next player with the score
        setTimeout(async () => {
          await moveToNextPlayer(currentPlayer.score);
        }, 200);
      }
    }
  };
  
  // Load existing game if sessionId is provided
  useEffect(() => {
    if (sessionId) {
      // Set share URL
      setShareUrl(`${window.location.origin}/shared-game/${sessionId}`);
      
      // Flag to track if this is the initial load
      let isInitialLoad = true;
      
      // Subscribe to real-time updates for the game
      const unsubscribe = onSnapshot(
        doc(db, 'games', sessionId),
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const gameData = docSnapshot.data() as any;
            
            // Log the incoming data from Firestore for debugging
            console.log("Firestore update received:", {
              firestoreCurrentPlayerIndex: gameData.currentPlayerIndex,
              localCurrentPlayerIndex: currentPlayerIndex,
              isInitialLoad,
              dartThrowsCount: gameData.dartThrows?.length || 0,
              targetStatusesCount: gameData.targetStatuses?.length || 0,
              playersIsArray: Array.isArray(gameData.players),
              playersCount: Array.isArray(gameData.players) ? gameData.players.length : 'not an array'
            });
            
            // IMPORTANT FIX: Ensure gameData.players is ALWAYS an array before using it
            let playersArray: Player[] = [];
            
            if (gameData.players) {
              // If players exists but is not an array, convert it from object to array
              if (!Array.isArray(gameData.players)) {
                console.log("Converting players from object to array", gameData.players);
                playersArray = Object.values(gameData.players);
              } else {
                playersArray = gameData.players;
              }
              
              // Now safely process the array
              playersArray = playersArray.map((player: Player) => {
                // Make a deep copy to avoid reference issues
                const playerCopy = {
                  ...player,
                  // Ensure marks object exists
                  marks: player.marks ? {...player.marks} : initializePlayerMarks(),
                  // Ensure closedNumbers array exists
                  closedNumbers: player.closedNumbers ? [...player.closedNumbers] : []
                };
                
                // Ensure arrowsThrown is a valid number
                if (typeof playerCopy.arrowsThrown !== 'number' || isNaN(playerCopy.arrowsThrown)) {
                  console.log(`Fixing invalid arrowsThrown for ${playerCopy.name} from Firestore`);
                  playerCopy.arrowsThrown = 0;
                }
                
                // Ensure arrowsThrown is within valid range
                if (playerCopy.arrowsThrown < 0) playerCopy.arrowsThrown = 0;
                if (playerCopy.arrowsThrown > 3) playerCopy.arrowsThrown = 3;
                
                return playerCopy;
              });
            } else {
              // If no players data at all, initialize as empty array
              console.warn("No players data found in Firestore");
            }
            
            // Update gameData.players with our properly formatted array
            gameData.players = playersArray;
            
            // Only update the local state with the Firestore data on initial load
            // or if the game is not active (to prevent overriding local state during active gameplay)
            if (isInitialLoad || !gameActive) {
              setPlayers(gameData.players || []);
              setCurrentPlayerIndex(gameData.currentPlayerIndex || 0);
              setGameActive(gameData.isActive || false);
              setGameId(docSnapshot.id);
              
              // Sync player marks with target statuses if they exist
              if (gameData.targetStatuses && Array.isArray(gameData.targetStatuses) && gameData.targetStatuses.length > 0) {
                console.log("Initial sync of player marks from target statuses");
                // Don't call syncPlayerMarksFromTargetStatuses directly to avoid setting state again
                // Just update the initial players state with the computed marks
                const updatedPlayers = computePlayerMarksFromTargetStatuses(
                  gameData.players || [], 
                  gameData.targetStatuses
                );
                setPlayers(updatedPlayers);
              } else if (gameData.dartThrows && Array.isArray(gameData.dartThrows) && gameData.dartThrows.length > 0) {
                // If we have dart throws but no target statuses, initialize them
                console.log("Creating target statuses from dart throws history");
                const targetStatuses = initializeTargetStatusesFromDartThrows(gameData.dartThrows);
                
                // Update Firestore with the new target statuses
                updateDoc(docSnapshot.ref, {
                  targetStatuses
                }).then(() => {
                  console.log("Target statuses added to Firestore");
                }).catch(error => {
                  console.error("Error adding target statuses to Firestore:", error);
                });
                
                // Update the players with computed marks
                const updatedPlayers = computePlayerMarksFromTargetStatuses(
                  gameData.players || [], 
                  targetStatuses
                );
                setPlayers(updatedPlayers);
              }
              
              isInitialLoad = false;
            } else {
              // For subsequent updates during active gameplay, check if we need to sync
              // but avoid updating state unnecessarily to prevent loops
              const localPlayerLen = players.length;
              const firestorePlayerLen = gameData.players?.length || 0;
              
              // Only update in special cases to avoid loops
              if (localPlayerLen !== firestorePlayerLen || gameData.currentPlayerIndex !== currentPlayerIndex) {
                console.log("Player count or current player changed, syncing with Firestore");
                setCurrentPlayerIndex(gameData.currentPlayerIndex || 0);
                
                // When we detect a significant change, update players once
                if (localPlayerLen !== firestorePlayerLen) {
                  setPlayers(gameData.players || []);
                }
              }
              
              // Always update game status
              setGameActive(gameData.isActive || false);
            }
            
            setLoading(false);
          } else {
            console.error('Game not found');
            setLoading(false);
          }
        },
        (err) => {
          console.error('Error getting game updates:', err);
          setLoading(false);
        }
      );
      
      // Cleanup subscription
      return () => unsubscribe();
    } else {
      // New game, generate a new ID
      const newGameId = uuidv4();
      setGameId(newGameId);
      setShareUrl(`${window.location.origin}/shared-game/${newGameId}`);
    }
  }, [sessionId, currentPlayerIndex, gameActive]); // Removed players from dependency array
  
  // Compute player marks from target statuses without setting state
  // This avoids infinite loops by separating computation from state updates
  const computePlayerMarksFromTargetStatuses = (playerList: Player[], targetStatuses: TargetStatus[]) => {
    // Create a deep copy of the players array to avoid state mutation
    const updatedPlayers = playerList.map(player => ({
      ...player,
      marks: player.marks ? {...player.marks} : initializePlayerMarks(),
      closedNumbers: player.closedNumbers ? [...player.closedNumbers] : []
    }));
    
    // Update player marks based on target statuses
    updatedPlayers.forEach((player: Player) => {
      // Update marks for each target number
      targetStatuses.forEach(status => {
        // Ensure playerHits exists
        if (!status.playerHits) {
          status.playerHits = {};
        }
        
        const hits = status.playerHits[player.id] || 0;
        player.marks[status.number] = hits;
      });
      
      // Update closedNumbers array
      player.closedNumbers = Object.keys(player.marks)
        .filter(number => player.marks[number] === 3);
      
      console.log(`Computed ${player.name}'s marks:`, 
        Object.entries(player.marks)
          .filter(([_, val]) => (val as number) > 0)
          .map(([key, val]) => `${key}:${val}`)
          .join(', ')
      );
    });
    
    return updatedPlayers;
  };
  
  // Sync player marks from target statuses - modified to avoid loops
  const syncPlayerMarksFromTargetStatuses = (targetStatuses: TargetStatus[]) => {
    console.log("Syncing player marks from target statuses");
    
    // Compute the updated players
    const updatedPlayers = computePlayerMarksFromTargetStatuses(players, targetStatuses);
    
    // Update the state with the refreshed players
    setPlayers(updatedPlayers);
    
    // Also update the game in Firestore to ensure consistency
    // But don't do this from within useEffect to avoid loops
    try {
      if (gameId) {
        const docRef = doc(db, 'games', gameId);
        updateDoc(docRef, {
          players: updatedPlayers
        });
      }
    } catch (error) {
      console.error("Error updating players in Firestore after mark refresh:", error);
    }
  };
  
  // Add a new player
  const handleAddPlayer = (name: string) => {
    const newPlayer: Player = {
      id: uuidv4(),
      name,
      score: 0,
      gamesWon: 0,
      currentTurn: false,
      marks: initializePlayerMarks(),
      closedNumbers: []
    };
    
    setPlayers([...players, newPlayer]);
  };
  
  // Start a new game
  const handleStartGame = async () => {
    if (players.length < 1) return;
    
    console.log("Starting new game");
    
    // Reset scores and set first player's turn
    const updatedPlayers = players.map((player, index) => {
      console.log(`Initializing player ${player.name}, index ${index}`);
      
      // Create a fresh marks object for each player
      const freshMarks = initializePlayerMarks();
      
      return {
        ...player,
        score: 0,
        currentTurn: index === 0,
        marks: freshMarks,
        closedNumbers: [],
        arrowsThrown: 0 // Explicitly set to 0 for all players
      };
    });
    
    // Generate a new game session
    const gameSession = {
      players: updatedPlayers,
      currentPlayerIndex: 0,
      isActive: true,
      startTime: Date.now(),
      gameType: 'MickeyMouse',
      targetNumbers: MICKEY_MOUSE_NUMBERS,
      dartThrows: [],
      targetStatuses: MICKEY_MOUSE_NUMBERS.map(number => ({
        number,
        playerHits: {} as { [playerId: string]: number },
        isClosedByAll: false
      }))
    };
    
    try {
      // If we have an existing game ID, update it
      if (gameId) {
        const docRef = doc(db, 'games', gameId);
        // First check if the document exists
        const docSnap = await getDoc(docRef);
        
        // Always create/update with a complete game session
        await setDoc(docRef, {
          ...gameSession,
          id: gameId,
          lastUpdated: Date.now()
        });
        console.log("Game updated with ID:", gameId);
        
        // Set the share URL
        setShareUrl(`${window.location.origin}/shared-game/${gameId}`);
        
        // Update URL without reloading the page if not already set
        if (!sessionId) {
          window.history.pushState({}, '', `/game/${gameId}`);
        }
      } else {
        // Otherwise, create a new game
        const newGameId = uuidv4();
        const docRef = doc(db, 'games', newGameId);
        await setDoc(docRef, {
          ...gameSession,
          id: newGameId,
          lastUpdated: Date.now()
        });
        setGameId(newGameId);
        setShareUrl(`${window.location.origin}/shared-game/${newGameId}`);
        console.log("New game created with ID:", newGameId);
        
        // Update URL without reloading the page
        window.history.pushState({}, '', `/game/${newGameId}`);
      }
      
      // Update local state first to ensure UI reflects changes immediately
      setPlayers(updatedPlayers);
      setCurrentPlayerIndex(0);
      setGameActive(true);
      
      // Force a refresh of the marks to ensure they're properly initialized
      setTimeout(() => {
        forceRefreshMarks();
      }, 500);
      
    } catch (error) {
      console.error("Error creating/updating game:", error);
    }
  };
  
  // End the current game
  const handleEndGame = async () => {
    if (!gameActive) return;
    
    try {
      // Find the winner (highest score)
      const winner = [...players].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
      
      // Update the winner's games won count
      const updatedPlayers = players.map(player => {
        if (player.id === winner.id) {
          return {
            ...player,
            gamesWon: (player.gamesWon || 0) + 1,
            currentTurn: false
          };
        }
        return {
          ...player,
          currentTurn: false
        };
      });
      
      // Update the game document
      if (gameId) {
        const docRef = doc(db, 'games', gameId);
        await updateDoc(docRef, {
          isActive: false,
          endTime: Date.now(),
          winner: winner.id,
          players: updatedPlayers
        });
      }
      
      // Update local state
      setPlayers(updatedPlayers);
      setGameActive(false);
      
      console.log(`Game ended. Winner: ${winner.name}`);
    } catch (error) {
      console.error("Error ending game:", error);
    }
  };
  
  // Handle reset game
  const handleNewGame = () => {
    if (gameActive) {
      handleEndGame();
    }
    
    setGameNumber(prevGameNumber => prevGameNumber + 1);
    
    // Generate a new game ID for the new game
    const newGameId = uuidv4();
    setGameId(newGameId);
    setShareUrl(`${window.location.origin}/shared-game/${newGameId}`);
    
    // Update URL without reloading the page
    window.history.pushState({}, '', `/game/${newGameId}`);
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        alert('Share link copied to clipboard!');
        setMenuOpen(false);
      })
      .catch((err) => {
        console.error('Could not copy text: ', err);
      });
  };
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  // Force refresh player marks
  const forceRefreshMarks = async () => {
    try {
      // Fetch the latest game data from Firestore
      const docRef = doc(db, 'games', gameId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.log("Game not found in Firestore, can't refresh marks");
        return;
      }
      
      const gameData = docSnap.data() as any;
      const targetStatuses = gameData.targetStatuses || [];
      
      // If we don't have target statuses yet, try to initialize them
      if (!targetStatuses || targetStatuses.length === 0) {
        console.log("No target statuses found in Firestore, initializing them");
        
        // Initialize target statuses based on dart throws
        const dartThrows = gameData.dartThrows || [];
        const freshTargetStatuses = initializeTargetStatusesFromDartThrows(dartThrows);
        
        // Update the game with the new target statuses
        await updateDoc(docRef, {
          targetStatuses: freshTargetStatuses
        });
        
        // Use the new target statuses for syncing
        console.log("Created fresh target statuses from dart throws");
        syncPlayerMarksFromTargetStatuses(freshTargetStatuses);
      } else {
        // Use existing target statuses
        console.log("Syncing player marks from existing target statuses");
        syncPlayerMarksFromTargetStatuses(targetStatuses);
      }
    } catch (error) {
      console.error("Error refreshing marks:", error);
    }
  };
  
  // Initialize target statuses from dart throws history
  const initializeTargetStatusesFromDartThrows = (dartThrows: DartThrow[]) => {
    // Create empty target statuses
    const targetStatuses = MICKEY_MOUSE_NUMBERS.map(number => ({
      number,
      playerHits: {} as { [playerId: string]: number },
      isClosedByAll: false
    }));
    
    // Initialize player hits for all players
    players.forEach(player => {
      targetStatuses.forEach(status => {
        status.playerHits[player.id] = 0;
      });
    });
    
    // Process all dart throws to calculate actual target statuses
    dartThrows
      .filter(throw_ => 
        throw_.number !== 'MISS' && 
        throw_.number !== 'TURN_CHANGE' && 
        throw_.number !== 'GAME_END' &&
        throw_.number !== 'OK'
      )
      .forEach(throw_ => {
        // Find the target status for this number
        const targetStatus = targetStatuses.find(ts => ts.number === throw_.number);
        if (!targetStatus) return;
        
        // Update the player hits - use the multiplier to add marks
        const playerId = throw_.playerId;
        const currentHits = targetStatus.playerHits[playerId] || 0;
        
        // Add hits based on the multiplier value, capped at 3
        const hitsToAdd = throw_.multiplier || 1; // Default to 1 if multiplier is missing
        targetStatus.playerHits[playerId] = Math.min(currentHits + hitsToAdd, 3);
      });
    
    // Calculate which targets are closed by all players
    targetStatuses.forEach(status => {
      status.isClosedByAll = players.length > 0 && players.every(
        player => status.playerHits[player.id] === 3
      );
    });
    
    return targetStatuses;
  };
  
  if (loading) {
    return (
      <GameContainer>
        <Header>
          <Title>Mickey Mouse</Title>
        </Header>
        <LoadingMessage>Loading game data...</LoadingMessage>
      </GameContainer>
    );
  }
  
  return (
    <GameContainer>
      <Header>
        <Title>Mickey Mouse</Title>
        <MenuButton onClick={toggleMenu}>☰</MenuButton>
        <MenuContainer $isOpen={menuOpen}>
          <MenuItem onClick={() => { navigate('/'); setMenuOpen(false); }}>
            Home
          </MenuItem>
          <MenuItem onClick={() => { handleStartGame(); setMenuOpen(false); }} disabled={!players.length || gameActive}>
            Start Game
          </MenuItem>
          <MenuItem onClick={() => { handleNewGame(); setMenuOpen(false); }}>
            Reset Game
          </MenuItem>
          <MenuItem onClick={() => { navigate('/leaderboard'); setMenuOpen(false); }}>
            Leaderboard
          </MenuItem>
          <MenuItem onClick={handleCopyLink}>
            Share Game
          </MenuItem>
        </MenuContainer>
      </Header>
      
      <GameInfo>
        <h2>Game #{gameNumber}</h2>
        <p>{gameActive ? 'Game in progress' : 'Game not started'}</p>
      </GameInfo>
      
      {gameActive && players.length > 0 && (
        <>
          <MickeyMouseBoard
            players={players}
            targetNumbers={MICKEY_MOUSE_NUMBERS}
            onScoreNumber={handleScoreNumber}
            currentPlayerIndex={currentPlayerIndex}
          />
        </>
      )}
      
      <GameControls
        canStartGame={players.length > 0}
        isGameActive={gameActive}
        onStartGame={handleStartGame}
        onEndGame={handleEndGame}
        onNewGame={handleNewGame}
      />
      
      {players.length > 0 && (
        <Scoreboard players={players} gameNumber={gameNumber} />
      )}
      
      {!gameActive && (
        <PlayerForm
          onAddPlayer={handleAddPlayer}
          existingPlayers={players.map(player => player.name)}
        />
      )}
    </GameContainer>
  );
};

export default GamePage; 