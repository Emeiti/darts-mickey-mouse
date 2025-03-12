import React from 'react';
import styled from 'styled-components';
import { Player } from '../types';

interface PlayerCardProps {
  player: Player;
  isActive: boolean;
  onScoreUpdate: (playerId: string, points: number) => void;
}

const Card = styled.div<{ isActive: boolean }>`
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadows.medium};
  transition: all ${props => props.theme.transitions.medium};
  border: 3px solid ${props => props.isActive ? props.theme.colors.primary : 'transparent'};
  transform: ${props => props.isActive ? 'scale(1.05)' : 'scale(1)'};
  
  &:hover {
    box-shadow: ${props => props.theme.shadows.large};
  }
`;

const PlayerName = styled.h2`
  font-size: ${props => props.theme.fontSizes.xlarge};
  color: ${props => props.theme.colors.tertiary};
  margin-bottom: ${props => props.theme.spacing.md};
  text-align: center;
`;

const ScoreDisplay = styled.div`
  font-size: ${props => props.theme.fontSizes.xxlarge};
  font-weight: bold;
  color: ${props => props.theme.colors.primary};
  text-align: center;
  margin: ${props => props.theme.spacing.lg} 0;
`;

const GamesWon = styled.div`
  font-size: ${props => props.theme.fontSizes.medium};
  color: ${props => props.theme.colors.text};
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const ScoreButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.lg};
`;

const ScoreButton = styled.button<{ value: number }>`
  background-color: ${props => 
    props.value === 25 ? props.theme.colors.secondary : 
    props.value === 50 ? props.theme.colors.primary : 
    props.theme.colors.background
  };
  color: ${props => 
    (props.value === 25 || props.value === 50) ? props.theme.colors.white : 
    props.theme.colors.text
  };
  border: 1px solid ${props => props.theme.colors.text};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.fontSizes.medium};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.small};
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const PlayerCard: React.FC<PlayerCardProps> = ({ player, isActive, onScoreUpdate }) => {
  const scoreValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 50];
  
  return (
    <Card isActive={isActive}>
      <PlayerName>{player.name}</PlayerName>
      <GamesWon>Games Won: {player.gamesWon}</GamesWon>
      <ScoreDisplay>{player.score}</ScoreDisplay>
      
      {isActive && (
        <ScoreButtons>
          {scoreValues.map(value => (
            <ScoreButton 
              key={value} 
              value={value}
              onClick={() => onScoreUpdate(player.id, value)}
            >
              {value}
            </ScoreButton>
          ))}
        </ScoreButtons>
      )}
    </Card>
  );
};

export default PlayerCard; 