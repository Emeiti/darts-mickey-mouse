import React from 'react';
import styled from 'styled-components';
import { Player } from '../types';

interface ScoreboardProps {
  players: Player[];
  gameNumber: number;
}

const ScoreboardContainer = styled.div`
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadows.medium};
  overflow-x: auto;
`;

const ScoreTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  padding: ${props => props.theme.spacing.md};
  text-align: left;
  border-bottom: 2px solid ${props => props.theme.colors.border};
  color: #444444;
  font-weight: bold;
`;

const TableRow = styled.tr<{ $isActive?: boolean }>`
  background-color: ${props => props.$isActive ? props.theme.colors.highlight : 'transparent'};
  
  &:nth-child(even) {
    background-color: ${props => props.$isActive ? props.theme.colors.highlight : props.theme.colors.background};
  }
`;

const TableCell = styled.td`
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const Scoreboard: React.FC<ScoreboardProps> = ({ players, gameNumber }) => {
  // Sort players by score (descending)
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  
  return (
    <ScoreboardContainer>
      <ScoreTable>
        <thead>
          <tr>
            <TableHeader>Rank</TableHeader>
            <TableHeader>Player</TableHeader>
            <TableHeader>Score</TableHeader>
            <TableHeader>Games Won</TableHeader>
            <TableHeader>Status</TableHeader>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player, index) => (
            <TableRow key={player.id} $isActive={player.currentTurn}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{player.name}</TableCell>
              <TableCell>{player.score || 0}</TableCell>
              <TableCell>{player.gamesWon || 0}</TableCell>
              <TableCell>{player.currentTurn ? 'Current Turn' : ''}</TableCell>
            </TableRow>
          ))}
        </tbody>
      </ScoreTable>
    </ScoreboardContainer>
  );
};

export default Scoreboard; 