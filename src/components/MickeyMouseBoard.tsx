import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Player } from '../types';

interface MickeyMouseBoardProps {
  players: Player[];
  targetNumbers: string[];
  onScoreNumber: (number: string, multiplier: 1 | 2 | 3) => void;
  currentPlayerIndex: number;
}

// Track move history for undo/redo
interface MoveHistoryItem {
  playerId: string;
  number: string;
  multiplier: 1 | 2 | 3;
  prevMarks: { [key: string]: number };
  prevScore: number;
  prevArrowsThrown: number;
}

const BoardContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.large};
  box-shadow: ${props => props.theme.shadows.medium};
  overflow: hidden;
  border: 1px solid ${props => props.theme.colors.border};
`;

const PlayerHeader = styled.div`
  display: flex;
  width: 100%;
`;

const PlayerName = styled.div<{ $isActive: boolean }>`
  flex: 1;
  padding: ${props => props.theme.spacing.md};
  text-align: center;
  font-weight: bold;
  font-size: ${props => props.theme.fontSizes.large};
  background-color: ${props => 
    props.$isActive ? props.theme.colors.highlight : props.theme.colors.white};
  color: ${props => props.theme.colors.black};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  border-right: 1px solid ${props => props.theme.colors.border};
  
  &:last-child {
    border-right: none;
  }
`;

const DartsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 5px;
  margin-top: 5px;
`;

const Dart = styled.div<{ $active: boolean }>`
  width: 20px;
  height: 20px;
  display: ${props => props.$active ? 'block' : 'none'};
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: 10px;
    background-color: #333;
  }
  
  &:after {
    content: '';
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    width: 6px;
    height: 6px;
    background-color: #333;
    border-radius: 50%;
  }
`;

const BoardGrid = styled.div`
  display: flex;
  width: 100%;
`;

const Column = styled.div<{ $isActive?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => 
    props.$isActive ? props.theme.colors.highlight : props.theme.colors.white};
  
  &:last-child {
    border-right: none;
  }
`;

const NumberColumn = styled(Column)`
  background-color: ${props => props.theme.colors.multiplier};
  color: ${props => props.theme.colors.white};
  font-weight: bold;
`;

const TargetsColumn = styled(Column)`
  background-color: ${props => props.theme.colors.multiplier};
  color: ${props => props.theme.colors.white};
  font-weight: bold;
  flex: 1;
`;

const Cell = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  font-size: 1.2rem;
`;

const ScoreCell = styled(Cell)`
  font-weight: bold;
  font-size: 1.3rem;
  color: ${props => props.theme.colors.white};
  background-color: ${props => props.theme.colors.multiplier};
`;

const NumberCell = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
  font-weight: bold;
  color: ${props => props.theme.colors.white};
  background-color: ${props => props.theme.colors.multiplier};
  border: 1px solid ${props => props.theme.colors.border};
`;

const MarkCell = styled(Cell)<{ 
  $isActive: boolean; 
  $isClosedByPlayer: boolean;
  $isClosedByAll: boolean;
}>`
  font-size: 1.5rem;
  position: relative;
  cursor: ${props => props.$isActive && !props.$isClosedByPlayer ? 'pointer' : 'default'};
  opacity: 1; /* Always show marks at full opacity */
  background-color: ${props => 
    // Only show green in the control section for targets closed by player but not by all
    false ? '#00a000' : 'inherit'};
  
  &:hover {
    opacity: ${props => props.$isActive && !props.$isClosedByPlayer ? 0.8 : 1};
  }
`;

const ControlsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.tertiary};
  border-top: none;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const UndoRedoContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
`;

const MultiplierContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
`;

const ActionButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.white};
  color: ${props => props.theme.colors.black};
  font-weight: bold;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.small};
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ScoreButton = styled.button<{ 
  $variant?: 'primary' | 'secondary' | 'tertiary'; 
  $isClosedByPlayer?: boolean;
  $isClosedByAll?: boolean;
  disabled?: boolean 
}>`
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.medium};
  border: 1px solid ${props => props.theme.colors.border};
  font-weight: bold;
  font-size: ${props => props.theme.fontSizes.medium};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => (props.disabled) ? 0.5 : 1};
  background-color: ${props => 
    (props.$isClosedByPlayer && !props.$isClosedByAll) ? '#00a000' : props.theme.colors.white};
  color: ${props => props.theme.colors.black};
  
  &:hover {
    opacity: ${props => (props.disabled) ? 0.5 : 0.9};
    transform: ${props => (props.disabled) ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => (props.disabled) ? 'none' : props.theme.shadows.small};
  }
  
  &:active {
    transform: ${props => (props.disabled) ? 'none' : 'translateY(0)'};
  }
`;

const MultiplierButton = styled.button<{ $active: boolean }>`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.$active ? props.theme.colors.multiplier : props.theme.colors.white};
  color: ${props => props.$active ? props.theme.colors.white : props.theme.colors.black};
  font-weight: bold;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.small};
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ScoreButtonRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.tertiary};
  border-bottom: none;
`;

const RoundNumberButton = styled.button`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 1px solid ${props => props.theme.colors.border};
  background-color: white;
  color: #333333;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  box-shadow: ${props => props.theme.shadows.small};
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.medium};
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

// Helper function to render mark based on count
const renderMark = (markCount: number) => {
  // Ensure markCount is a valid number
  if (typeof markCount !== 'number' || isNaN(markCount)) {
    console.log(`Invalid markCount: ${markCount}, defaulting to 0`);
    markCount = 0;
  }
  
  // Ensure markCount is within valid range
  markCount = Math.max(0, Math.min(3, markCount));
  
  console.log(`Rendering mark with count: ${markCount}`);
  
  switch (markCount) {
    case 1:
      return <span style={{ color: '#333333', fontSize: '1.5rem', fontWeight: 'bold' }}>/</span>;
    case 2:
      return <span style={{ color: '#333333', fontSize: '1.5rem', fontWeight: 'bold' }}>X</span>;
    case 3:
      return (
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
          <div style={{ 
            position: 'absolute', 
            width: '25px', 
            height: '25px', 
            borderRadius: '50%', 
            border: '3px solid #333333',
            boxSizing: 'content-box',
            zIndex: 1
          }}></div>
          <span style={{ 
            color: '#000000', 
            fontSize: '1.5rem', 
            fontWeight: 'bold',
            position: 'absolute',
            zIndex: 2
          }}>X</span>
        </div>
      );
    default:
      return <span style={{ color: '#AAAAAA', fontSize: '1.2rem' }}>--</span>;
  }
};

const MickeyMouseBoard: React.FC<MickeyMouseBoardProps> = ({ 
  players, 
  targetNumbers,
  onScoreNumber,
  currentPlayerIndex
}) => {
  const [selectedMultiplier, setSelectedMultiplier] = useState<1 | 2 | 3>(1);
  const [moveHistory, setMoveHistory] = useState<MoveHistoryItem[]>([]);
  const [undoHistory, setUndoHistory] = useState<MoveHistoryItem[]>([]);
  const [selectionMode, setSelectionMode] = useState<null | 'double' | 'triple'>(null);
  
  // Define the complete set of numbers including D and T
  const completeTargetNumbers = ['D', 'T', 'B', ...targetNumbers];
  
  // Create a safe version of players with initialized marks
  const safetyPlayers = players.map(player => {
    // Create a deep copy of the player
    const safePlayer = {
      ...player,
      marks: { ...(player.marks || {}) },
      arrowsThrown: player.arrowsThrown !== undefined ? player.arrowsThrown : 0
    };
    
    // Ensure arrowsThrown is a valid number
    if (typeof safePlayer.arrowsThrown !== 'number' || isNaN(safePlayer.arrowsThrown)) {
      console.log(`Fixing invalid arrowsThrown for ${safePlayer.name} in MickeyMouseBoard`);
      safePlayer.arrowsThrown = 0;
    }
    
    // Ensure arrowsThrown is within valid range (0-3)
    if (safePlayer.arrowsThrown < 0) safePlayer.arrowsThrown = 0;
    if (safePlayer.arrowsThrown > 3) safePlayer.arrowsThrown = 3;
    
    // Initialize marks for all numbers
    completeTargetNumbers.forEach(number => {
      if (safePlayer.marks[number] === undefined) {
        safePlayer.marks[number] = 0;
      }
    });
    
    return safePlayer;
  });
  
  // Log the current state of players for debugging
  useEffect(() => {
    console.log("MickeyMouseBoard received players:", players.map(p => ({
      name: p.name,
      arrowsThrown: p.arrowsThrown,
      score: p.score,
      marks: Object.entries(p.marks || {}).filter(([_, val]) => val > 0).map(([key, val]) => `${key}:${val}`).join(',')
    })));
    console.log("Current player index:", currentPlayerIndex);
    
    // Debug log for marks
    logPlayerMarks();
  }, [players, currentPlayerIndex]);
  
  // Debug function to log player marks
  const logPlayerMarks = () => {
    console.log("DETAILED PLAYER MARKS:");
    safetyPlayers.forEach(player => {
      console.log(`${player.name}'s marks:`, Object.entries(player.marks || {})
        .filter(([key]) => completeTargetNumbers.includes(key))
        .map(([key, val]) => `${key}:${val}`)
        .join(', '));
    });
  };
  
  // Check if a player has closed all numbers
  const hasPlayerClosedAll = (player: Player) => {
    return completeTargetNumbers.every(number => player.marks[number] === 3);
  };
  
  // Check if all numbers are closed by all players
  const areAllNumbersClosed = () => {
    return completeTargetNumbers.every(number => 
      safetyPlayers.every(player => player.marks[number] === 3)
    );
  };
  
  // Handle cell click for the current player
  const handleCellClick = (number: string) => {
    console.log("Cell clicked", { 
      currentPlayerIndex, 
      playerName: safetyPlayers[currentPlayerIndex]?.name,
      arrowsThrown: safetyPlayers[currentPlayerIndex]?.arrowsThrown,
      number,
      multiplier: selectedMultiplier
    });
    
    if (currentPlayerIndex >= 0 && currentPlayerIndex < players.length) {
      const currentPlayer = safetyPlayers[currentPlayerIndex];
      
      // Check if player has darts left to throw
      if (currentPlayer && currentPlayer.arrowsThrown >= 3) {
        console.log("Player has no darts left to throw");
        return;
      }
      
      // Check if this number is already closed by current player
      if (currentPlayer.marks[number] === 3) {
        console.log(`${number} is already closed by ${currentPlayer.name}`);
        return;
      }
      
      // Save the move for undo history
      const moveHistoryItem: MoveHistoryItem = {
        playerId: currentPlayer.id,
        number,
        multiplier: selectedMultiplier,
        prevMarks: { ...currentPlayer.marks },
        prevScore: currentPlayer.score || 0,
        prevArrowsThrown: currentPlayer.arrowsThrown
      };
      
      // Add to move history
      setMoveHistory([...moveHistory, moveHistoryItem]);
      // Clear undo history when a new move is made
      setUndoHistory([]);
      
      // Register the hit and increment arrows thrown
      onScoreNumber(number, selectedMultiplier);
      
      // Reset multiplier to 1 after each throw
      setSelectedMultiplier(1);
    }
  };
  
  // Toggle multiplier selection
  const toggleMultiplier = (multiplier: 1 | 2 | 3) => {
    if (selectedMultiplier === multiplier) {
      // If already selected, toggle back to 1
      setSelectedMultiplier(1);
    } else {
      // Otherwise, select the new multiplier
      setSelectedMultiplier(multiplier);
    }
  };
  
  // Handle undo
  const handleUndo = () => {
    if (moveHistory.length > 0) {
      const lastMove = moveHistory[moveHistory.length - 1];
      const updatedMoveHistory = moveHistory.slice(0, -1);
      setMoveHistory(updatedMoveHistory);
      setUndoHistory([...undoHistory, lastMove]);
      
      // Find the player by ID
      const playerIndex = players.findIndex(p => p.id === lastMove.playerId);
      if (playerIndex !== -1) {
        // Create a copy of the players array
        const updatedPlayers = [...players];
        
        // Update the player with the previous state
        updatedPlayers[playerIndex] = {
          ...updatedPlayers[playerIndex],
          marks: { ...lastMove.prevMarks },
          score: lastMove.prevScore,
          arrowsThrown: lastMove.prevArrowsThrown
        };
        
        // Call onScoreNumber with a special 'UNDO' operation
        onScoreNumber('UNDO', 1);
        
        // Reset multiplier to 1 after undoing
        setSelectedMultiplier(1);
      }
    }
  };
  
  // Handle redo
  const handleRedo = () => {
    if (undoHistory.length > 0) {
      const lastUndo = undoHistory[undoHistory.length - 1];
      const updatedUndoHistory = undoHistory.slice(0, -1);
      setUndoHistory(updatedUndoHistory);
      setMoveHistory([...moveHistory, lastUndo]);
      
      // Re-apply the move
      onScoreNumber(lastUndo.number, lastUndo.multiplier);
    }
  };
  
  // Handle button click with multiplier
  const handleButtonClick = (number: string) => {
    console.log("Button clicked", { 
      number,
      currentPlayerIndex, 
      playerName: safetyPlayers[currentPlayerIndex]?.name,
      arrowsThrown: safetyPlayers[currentPlayerIndex]?.arrowsThrown,
      multiplier: selectedMultiplier,
      selectionMode
    });
    
    if (currentPlayerIndex >= 0 && currentPlayerIndex < players.length) {
      const currentPlayer = safetyPlayers[currentPlayerIndex];
      
      // Check if player has darts left to throw
      if (currentPlayer && currentPlayer.arrowsThrown >= 3) {
        console.log("Player has no darts left to throw");
        return;
      }

      // Handle Double/Triple selection process
      if (number === 'D') {
        setSelectionMode('double');
        return;
      } else if (number === 'T') {
        setSelectionMode('triple');
        return;
      }

      // If we're in selection mode and a number is clicked, use that for the Double/Triple
      if (selectionMode && /^\d+$/.test(number)) {
        // Create a new dart number based on the selection
        const baseNumber = parseInt(number, 10);
        let dartNumber = number;
        let dartMultiplier = selectedMultiplier;
        
        // Adjust for Double or Triple calculation
        if (selectionMode === 'double') {
          // We use normal number but mark it as Double with 'D' prefix
          dartNumber = 'D';
          // In GamePage.tsx, doubles use the baseNumber * 2 for scoring
        } else if (selectionMode === 'triple') {
          // We use normal number but mark it as Triple with 'T' prefix
          dartNumber = 'T';
          // In GamePage.tsx, triples use the baseNumber * 3 for scoring
        }
        
        // Save the move for undo history
        const moveHistoryItem: MoveHistoryItem = {
          playerId: currentPlayer.id,
          number: dartNumber,
          multiplier: dartMultiplier,
          prevMarks: { ...currentPlayer.marks },
          prevScore: currentPlayer.score || 0,
          prevArrowsThrown: currentPlayer.arrowsThrown
        };
        
        // Add to move history
        setMoveHistory([...moveHistory, moveHistoryItem]);
        // Clear undo history when a new move is made
        setUndoHistory([]);
        
        // Register the specific double/triple score
        // Send both the type (D/T) and specific number
        onScoreNumber(`${dartNumber}_${baseNumber}`, dartMultiplier);
        
        // Reset selection mode and multiplier
        setSelectionMode(null);
        setSelectedMultiplier(1);
        return;
      }
      
      // Reset selection mode if any other button is clicked
      if (selectionMode) {
        setSelectionMode(null);
      }
      
      // If the player has closed this number but all players haven't, it's a scoring opportunity
      const isScoring = currentPlayer.marks[number] === 3 && !isNumberClosedByAll(number);
      
      // Check if this number is already closed by current player and not a scoring opportunity
      if (currentPlayer.marks[number] === 3 && !isScoring) {
        console.log(`${number} is already closed by ${currentPlayer.name} and cannot be used for scoring`);
        return;
      }
      
      // Log specific information about the scoring opportunity
      if (isScoring) {
        console.log(`SCORING OPPORTUNITY: ${currentPlayer.name} scoring on ${number} (multiplier: ${selectedMultiplier})`);
      }
      
      // Save the move for undo history
      const moveHistoryItem: MoveHistoryItem = {
        playerId: currentPlayer.id,
        number,
        multiplier: selectedMultiplier,
        prevMarks: { ...currentPlayer.marks },
        prevScore: currentPlayer.score || 0,
        prevArrowsThrown: currentPlayer.arrowsThrown
      };
      
      // Add to move history
      setMoveHistory([...moveHistory, moveHistoryItem]);
      // Clear undo history when a new move is made
      setUndoHistory([]);
      
      // Call the parent component's onScoreNumber function
      onScoreNumber(number, selectedMultiplier);
      
      // Reset multiplier to 1 after each throw
      setSelectedMultiplier(1);
    }
  };
  
  // Calculate if a player can score points on a number
  const canScorePoints = (player: Player, number: string) => {
    // A player can score points if they have closed the number (marks === 3)
    // AND the number is not closed by all players
    return player.marks[number] === 3 && !isNumberClosedByAll(number);
  };
  
  // Check if all players have closed a number
  const isNumberClosedByAll = (number: string) => {
    const allClosed = safetyPlayers.every(player => {
      const marks = player.marks[number];
      return marks === 3;
    });
    
    if (allClosed) {
      console.log(`Number ${number} is closed by ALL players`);
    }
    
    return allClosed;
  };
  
  // Check if current player has closed a number
  const isNumberClosedByPlayer = (number: string) => {
    const currentPlayer = safetyPlayers[currentPlayerIndex];
    if (!currentPlayer) return false;
    
    const marks = currentPlayer.marks[number];
    const isClosed = marks === 3;
    
    if (isClosed) {
      console.log(`Number ${number} is closed by ${currentPlayer.name} (marks: ${marks})`);
    }
    
    return isClosed;
  };
  
  // Render darts for the current player
  const renderDarts = () => {
    // Ensure we have a valid current player
    const currentPlayer = safetyPlayers[currentPlayerIndex];
    if (!currentPlayer) return null;
    
    // Ensure arrowsThrown is a valid number
    let arrowsThrown = currentPlayer.arrowsThrown || 0;
    if (typeof arrowsThrown !== 'number' || isNaN(arrowsThrown)) {
      console.log(`Fixing invalid arrowsThrown for ${currentPlayer.name} in renderDarts`);
      arrowsThrown = 0;
    }
    
    // Ensure arrowsThrown is within valid range
    if (arrowsThrown < 0) arrowsThrown = 0;
    if (arrowsThrown > 3) arrowsThrown = 3;
    
    // Calculate remaining arrows
    const remaining = Math.max(0, 3 - arrowsThrown);
    
    console.log("Rendering darts", { 
      playerName: currentPlayer.name, 
      arrowsThrown, 
      remaining 
    });
    
    return (
      <DartsContainer>
        <Dart $active={remaining >= 1} />
        <Dart $active={remaining >= 2} />
        <Dart $active={remaining >= 3} />
      </DartsContainer>
    );
  };
  
  return (
    <BoardContainer>
      {/* Player names header */}
      <PlayerHeader>
        {safetyPlayers.map((player, index) => (
          <PlayerName 
            key={player.id} 
            $isActive={index === currentPlayerIndex}
          >
            {player.name}
            {index === currentPlayerIndex && renderDarts()}
          </PlayerName>
        ))}
        <PlayerName 
          $isActive={false} 
          style={{ 
            backgroundColor: '#666666', 
            color: 'white' 
          }}
        >
          Targets
        </PlayerName>
      </PlayerHeader>
      
      {/* Game board grid */}
      <BoardGrid>
        {/* Player columns (left side) */}
        {safetyPlayers.map((player, playerIndex) => (
          <Column 
            key={`left-${player.id}`}
            $isActive={playerIndex === currentPlayerIndex}
          >
            {completeTargetNumbers.map(number => (
              <MarkCell 
                key={`left-${player.id}-${number}`}
                $isActive={playerIndex === currentPlayerIndex}
                $isClosedByPlayer={player.marks[number] === 3}
                $isClosedByAll={isNumberClosedByAll(number)}
                onClick={() => playerIndex === currentPlayerIndex && !isNumberClosedByPlayer(number) && handleCellClick(number)}
                style={{ 
                  cursor: (playerIndex === currentPlayerIndex && !isNumberClosedByPlayer(number)) ? 'pointer' : 'default'
                }}
              >
                {renderMark(player.marks[number] || 0)}
              </MarkCell>
            ))}
            <ScoreCell>{player.score || 0}</ScoreCell>
          </Column>
        ))}
        
        {/* Numbers column (right) */}
        <TargetsColumn>
          {completeTargetNumbers.map(number => (
            <NumberCell 
              key={`number-${number}`}
              style={{
                textDecoration: isNumberClosedByAll(number) ? 'line-through' : 'none'
              }}
            >
              {number}
            </NumberCell>
          ))}
          <ScoreCell>Score</ScoreCell>
        </TargetsColumn>
      </BoardGrid>
      
      {/* Score buttons */}
      <ScoreButtonRow>
        {selectionMode === 'double' || selectionMode === 'triple' ? (
          // Show only the selected mode label when in selection mode
          <>
            <ScoreButton 
              $variant="secondary" 
              onClick={() => setSelectionMode(null)}
              style={{ 
                backgroundColor: '#f8f8f8',
                fontWeight: 'bold',
                color: '#333'
              }}
            >
              {selectionMode === 'double' ? 'Double' : 'Triple'} Selection
            </ScoreButton>
            <div></div>
            <div></div>
            <div></div>
          </>
        ) : (
          // Show normal buttons when not in selection mode
          <>
            {!isNumberClosedByAll('D') && (
              <ScoreButton 
                $variant="secondary" 
                onClick={() => handleButtonClick('D')}
                disabled={safetyPlayers[currentPlayerIndex]?.arrowsThrown >= 3}
                $isClosedByPlayer={isNumberClosedByPlayer('D')}
                $isClosedByAll={isNumberClosedByAll('D')}
              >
                Double
              </ScoreButton>
            )}
            {!isNumberClosedByAll('T') && (
              <ScoreButton 
                $variant="secondary" 
                onClick={() => handleButtonClick('T')}
                disabled={safetyPlayers[currentPlayerIndex]?.arrowsThrown >= 3}
                $isClosedByPlayer={isNumberClosedByPlayer('T')}
                $isClosedByAll={isNumberClosedByAll('T')}
              >
                Triple
              </ScoreButton>
            )}
            {!isNumberClosedByAll('B') && (
              <ScoreButton 
                $variant="secondary" 
                onClick={() => handleButtonClick('B')}
                disabled={safetyPlayers[currentPlayerIndex]?.arrowsThrown >= 3}
                $isClosedByPlayer={isNumberClosedByPlayer('B')}
                $isClosedByAll={isNumberClosedByAll('B')}
              >
                Bull
              </ScoreButton>
            )}
            <div></div> {/* Empty space to keep grid layout */}
          </>
        )}
      </ScoreButtonRow>
      
      {/* Controls for current player */}
      <ControlsContainer style={selectionMode ? { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '20px',
        padding: '20px'
      } : {}}>
        {selectionMode === 'double' || selectionMode === 'triple' ? (
          // Show round number buttons 12-20 in grid layout
          <>
            {['12', '13', '14', '15', '16', '17', '18', '19', '20'].map(num => (
              <div key={`${selectionMode}-${num}`} style={{ display: 'flex', justifyContent: 'center' }}>
                <RoundNumberButton
                  onClick={() => handleButtonClick(num)}
                  disabled={safetyPlayers[currentPlayerIndex]?.arrowsThrown >= 3}
                  title={`${selectionMode === 'double' ? 'Double' : 'Triple'} ${num}`}
                >
                  {num}
                </RoundNumberButton>
              </div>
            ))}
            <div style={{ gridColumn: '1 / span 3', display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
              <ActionButton
                onClick={() => setSelectionMode(null)}
                title="Cancel"
                style={{ 
                  width: 'auto', 
                  padding: '0 20px',
                  borderRadius: '20px', 
                  backgroundColor: '#f2f2f2',
                  fontSize: '0.9rem'
                }}
              >
                Cancel
              </ActionButton>
            </div>
          </>
        ) : (
          // Show normal number buttons when not in selection mode
          targetNumbers.filter((num: string) => num !== 'B').map((targetNumber: string) => (
            // Show the button as long as not closed by ALL players
            !isNumberClosedByAll(targetNumber) && (
              <ScoreButton 
                key={`button-${targetNumber}`}
                $variant="secondary" 
                onClick={() => handleButtonClick(targetNumber)}
                disabled={(isNumberClosedByPlayer(targetNumber) && canScorePoints(safetyPlayers[currentPlayerIndex], targetNumber) === false) || safetyPlayers[currentPlayerIndex]?.arrowsThrown >= 3}
                $isClosedByPlayer={isNumberClosedByPlayer(targetNumber)}
                $isClosedByAll={isNumberClosedByAll(targetNumber)}
              >
                {targetNumber}
              </ScoreButton>
            )
          ))
        )}
      </ControlsContainer>
      
      {/* Multiplier and action buttons */}
      <ActionButtonsContainer>
        <UndoRedoContainer>
          <ActionButton 
            onClick={handleUndo} 
            title="Undo"
            disabled={moveHistory.length === 0}
          >
            ↩
          </ActionButton>
          
          <ActionButton 
            onClick={handleRedo} 
            title="Redo"
            disabled={undoHistory.length === 0}
          >
            ↪
          </ActionButton>
        </UndoRedoContainer>
        
        {/* Miss button styled to match multiplier buttons but with smaller font */}
        <MultiplierButton 
          $active={false} 
          onClick={() => onScoreNumber('MISS', 1)}
          title="Miss"
          disabled={safetyPlayers[currentPlayerIndex]?.arrowsThrown >= 3}
          style={{ 
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}
        >
          MISS
        </MultiplierButton>
        
        <MultiplierContainer>
          <MultiplierButton 
            $active={selectedMultiplier === 2} 
            onClick={() => toggleMultiplier(2)}
          >
            x2
          </MultiplierButton>
          
          <MultiplierButton 
            $active={selectedMultiplier === 3} 
            onClick={() => toggleMultiplier(3)}
          >
            x3
          </MultiplierButton>
        </MultiplierContainer>
      </ActionButtonsContainer>
    </BoardContainer>
  );
};

export default MickeyMouseBoard;