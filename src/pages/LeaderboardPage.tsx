import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { GameHistory } from '../types';

const LeaderboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: ${props => props.theme.colors.primary};
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Card = styled.div`
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadows.medium};
  margin-bottom: ${props => props.theme.spacing.lg};
  
  @media (max-width: 768px) {
    padding: ${props => props.theme.spacing.md};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  @media (max-width: 768px) {
    font-size: ${props => props.theme.fontSizes.small};
  }
`;

const TableHeader = styled.th`
  text-align: left;
  padding: ${props => props.theme.spacing.sm};
  border-bottom: 2px solid ${props => props.theme.colors.secondary};
  color: ${props => props.theme.colors.tertiary};
  font-size: ${props => props.theme.fontSizes.medium};
  
  @media (max-width: 768px) {
    padding: ${props => props.theme.spacing.xs};
    font-size: ${props => props.theme.fontSizes.small};
  }
`;

const TableRow = styled.tr<{ isWinner?: boolean }>`
  background-color: ${props => props.isWinner ? 'rgba(255, 255, 0, 0.1)' : 'transparent'};
  
  &:hover {
    background-color: ${props => props.theme.colors.background};
  }
`;

const TableCell = styled.td`
  padding: ${props => props.theme.spacing.sm};
  border-bottom: 1px solid ${props => props.theme.colors.background};
  
  @media (max-width: 768px) {
    padding: ${props => props.theme.spacing.xs};
  }
`;

const WinnerCell = styled(TableCell)`
  font-weight: bold;
  color: ${props => props.theme.colors.success};
`;

const NoDataMessage = styled.p`
  text-align: center;
  font-size: ${props => props.theme.fontSizes.large};
  color: ${props => props.theme.colors.text};
  padding: ${props => props.theme.spacing.xl};
`;

interface PlayerStats {
  playerId: string;
  playerName: string;
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  averageScore: number;
}

const LeaderboardPage: React.FC = () => {
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchGameHistory = async () => {
      try {
        const historyQuery = query(
          collection(db, 'gameHistory'),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        
        const historySnapshot = await getDocs(historyQuery);
        const historyData: GameHistory[] = [];
        
        historySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<GameHistory, 'id'>;
          historyData.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp as unknown as number,
          });
        });
        
        setGameHistory(historyData);
        
        // Calculate player statistics
        const playerMap = new Map<string, PlayerStats>();
        
        historyData.forEach((game) => {
          if (!playerMap.has(game.playerId)) {
            playerMap.set(game.playerId, {
              playerId: game.playerId,
              playerName: game.playerName,
              gamesPlayed: 0,
              gamesWon: 0,
              totalScore: 0,
              averageScore: 0,
            });
          }
          
          const playerStat = playerMap.get(game.playerId)!;
          playerStat.gamesPlayed += 1;
          playerStat.totalScore += game.score;
          
          if (game.isWinner) {
            playerStat.gamesWon += 1;
          }
          
          playerStat.averageScore = playerStat.totalScore / playerStat.gamesPlayed;
          playerMap.set(game.playerId, playerStat);
        });
        
        // Sort players by games won (descending)
        const sortedStats = Array.from(playerMap.values()).sort(
          (a, b) => b.gamesWon - a.gamesWon || b.averageScore - a.averageScore
        );
        
        setPlayerStats(sortedStats);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching game history:', error);
        setLoading(false);
      }
    };
    
    fetchGameHistory();
  }, []);
  
  // Group game history by game ID
  const gameHistoryByGame = gameHistory.reduce((acc, game) => {
    if (!acc[game.gameId]) {
      acc[game.gameId] = [];
    }
    acc[game.gameId].push(game);
    return acc;
  }, {} as Record<string, GameHistory[]>);
  
  return (
    <LeaderboardContainer>
      <Title>Mickey Mouse Darts Leaderboard</Title>
      
      <Card>
        <h2>Player Rankings</h2>
        {loading ? (
          <NoDataMessage>Loading player statistics...</NoDataMessage>
        ) : playerStats.length === 0 ? (
          <NoDataMessage>No player statistics available yet.</NoDataMessage>
        ) : (
          <Table>
            <thead>
              <tr>
                <TableHeader>Rank</TableHeader>
                <TableHeader>Player</TableHeader>
                <TableHeader>Games Played</TableHeader>
                <TableHeader>Games Won</TableHeader>
                <TableHeader>Win Rate</TableHeader>
                <TableHeader>Avg. Score</TableHeader>
              </tr>
            </thead>
            <tbody>
              {playerStats.map((player, index) => (
                <TableRow key={player.playerId}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{player.playerName}</TableCell>
                  <TableCell>{player.gamesPlayed}</TableCell>
                  <WinnerCell>{player.gamesWon}</WinnerCell>
                  <TableCell>
                    {((player.gamesWon / player.gamesPlayed) * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell>{player.averageScore.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      
      <Card>
        <h2>Recent Games</h2>
        {loading ? (
          <NoDataMessage>Loading game history...</NoDataMessage>
        ) : Object.keys(gameHistoryByGame).length === 0 ? (
          <NoDataMessage>No game history available yet.</NoDataMessage>
        ) : (
          Object.entries(gameHistoryByGame).map(([gameId, games]) => (
            <Card key={gameId} style={{ marginBottom: '1rem' }}>
              <h3>Game ID: {gameId.substring(0, 8)}...</h3>
              <p>Played on: {new Date(games[0].timestamp).toLocaleString()}</p>
              <Table>
                <thead>
                  <tr>
                    <TableHeader>Player</TableHeader>
                    <TableHeader>Score</TableHeader>
                    <TableHeader>Result</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {games
                    .sort((a, b) => b.score - a.score)
                    .map((game) => (
                      <TableRow key={game.id} isWinner={game.isWinner}>
                        <TableCell>{game.playerName}</TableCell>
                        <TableCell>{game.score}</TableCell>
                        <TableCell>
                          {game.isWinner ? '🏆 Winner' : ''}
                        </TableCell>
                      </TableRow>
                    ))}
                </tbody>
              </Table>
            </Card>
          ))
        )}
      </Card>
    </LeaderboardContainer>
  );
};

export default LeaderboardPage; 