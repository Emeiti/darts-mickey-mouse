import React from 'react';
import styled from 'styled-components';
import Button from './Button';

interface GameControlsProps {
  canStartGame: boolean;
  isGameActive: boolean;
  onStartGame: () => void;
  onEndGame: () => void;
  onNewGame: () => void;
}

const ControlsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.md};
  justify-content: center;
  margin-top: ${props => props.theme.spacing.lg};
`;

const GameControls: React.FC<GameControlsProps> = ({
  canStartGame,
  isGameActive,
  onStartGame,
  onEndGame,
  onNewGame
}) => {
  return (
    <ControlsContainer>
      {!isGameActive && (
        <Button 
          variant="primary" 
          onClick={onStartGame}
          disabled={!canStartGame}
        >
          Start Game
        </Button>
      )}
      
      <Button
        variant="secondary"
        onClick={onNewGame}
      >
        Reset Game
      </Button>
    </ControlsContainer>
  );
};

export default GameControls; 