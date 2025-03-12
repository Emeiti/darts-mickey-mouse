import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Game, Player } from '../types';
import Scoreboard from '../components/Scoreboard';
import MickeyMouseBoard from '../components/MickeyMouseBoard';
import Button from '../components/Button';

const SharedGameContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: ${props => props.theme.colors.primary};
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.lg};
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Card = styled.div`
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadows.medium};
  margin-bottom: ${props => props.theme.spacing.lg};
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

const GameInfo = styled.div`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const CurrentTurn = styled.div`
  font-size: ${props => props.theme.fontSizes.xlarge};
  font-weight: bold;
  color: ${props => props.theme.colors.primary};
  text-align: center;
  margin: ${props => props.theme.spacing.lg} 0;
  
  @media (max-width: 768px) {
    font-size: ${props => props.theme.fontSizes.large};
  }
`;

const ShareLink = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin: ${props => props.theme.spacing.lg} 0;
  
  h3 {
    color: ${props => props.theme.colors.black};
    margin-bottom: ${props => props.theme.spacing.sm};
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const LinkInput = styled.input`
  padding: ${props => props.theme.spacing.md};
  border: 2px solid ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.medium};
  font-size: ${props => props.theme.fontSizes.medium};
  width: 100%;
  max-width: 500px;
  
  @media (max-width: 768px) {
    font-size: ${props => props.theme.fontSizes.small};
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};
`;

const LoadingMessage = styled.p`
  text-align: center;
  font-size: ${props => props.theme.fontSizes.large};
  color: ${props => props.theme.colors.text};
  padding: ${props => props.theme.spacing.xl};
`;

const ErrorMessage = styled.p`
  text-align: center;
  font-size: ${props => props.theme.fontSizes.large};
  color: ${props => props.theme.colors.error};
  padding: ${props => props.theme.spacing.xl};
`;

// For React Router v6
type RouteParams = {
  sessionId?: string;
};

// Define the target numbers for Mickey Mouse game
const MICKEY_MOUSE_NUMBERS = ['20', '19', '18', '17', '16', '15', '14', '13', '12', 'B'];

const SharedGamePage: React.FC = () => {
  const { sessionId } = useParams<RouteParams>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  
  useEffect(() => {
    if (!sessionId) {
      setError('Invalid session ID');
      setLoading(false);
      return;
    }
    
    // Set share URL
    setShareUrl(`${window.location.origin}/shared-game/${sessionId}`);
    
    // First, try to get the initial game data
    const loadInitialData = async () => {
      try {
        const docRef = doc(db, 'games', sessionId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          console.error('Game not found:', sessionId);
          setError('Game not found. The game may have been deleted or the URL is incorrect. If you just created this game, please wait a moment and try again.');
          setLoading(false);
          return;
        }
        
        const gameData = docSnap.data() as Omit<Game, 'id'>;
        // Validate that the game data has all required fields
        if (!gameData.players || !gameData.targetNumbers) {
          console.error('Invalid game data:', gameData);
          setError('Invalid game data - missing required fields. Please ensure the game was created correctly.');
          setLoading(false);
          return;
        }
        
        setGame({
          id: docSnap.id,
          ...gameData,
        });
        setLoading(false);
      } catch (err) {
        console.error('Error loading initial game data:', err);
        setError(`Error loading game data: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setLoading(false);
      }
    };
    
    // Load initial data
    loadInitialData();
    
    // Subscribe to real-time updates for the game
    const unsubscribe = onSnapshot(
      doc(db, 'games', sessionId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const gameData = docSnapshot.data() as Omit<Game, 'id'>;
          // Validate that the game data has all required fields
          if (!gameData.players || !gameData.targetNumbers) {
            console.error('Invalid game data from snapshot:', gameData);
            setError('Invalid game data - missing required fields');
            return;
          }
          setGame({
            id: docSnapshot.id,
            ...gameData,
          });
          // Clear any previous errors since we got valid data
          setError(null);
        } else {
          console.error('Game not found in snapshot:', sessionId);
          setError('Game not found. The game may have been deleted or the URL is incorrect.');
        }
      },
      (err) => {
        console.error('Error getting game updates:', err);
        setError(`Error loading game data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    );
    
    // Cleanup subscription
    return () => unsubscribe();
  }, [sessionId]);
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        alert('Share link copied to clipboard!');
      })
      .catch((err) => {
        console.error('Could not copy text: ', err);
      });
  };
  
  const handleJoinGame = () => {
    navigate(`/game/${sessionId}`);
  };
  
  const getCurrentPlayerName = (): string => {
    if (!game || !game.players || game.players.length === 0) {
      return '';
    }
    
    const currentPlayer = game.players.find(player => player.currentTurn);
    return currentPlayer ? currentPlayer.name : '';
  };
  
  if (loading) {
    return (
      <SharedGameContainer>
        <Title>Mickey Mouse Darts Game</Title>
        <LoadingMessage>Loading game data...</LoadingMessage>
      </SharedGameContainer>
    );
  }
  
  if (error) {
    return (
      <SharedGameContainer>
        <Title>Mickey Mouse Darts Game</Title>
        <ErrorMessage>{error}</ErrorMessage>
        <ButtonContainer>
          <Button variant="primary" onClick={() => navigate('/')}>
            Go to Home
          </Button>
        </ButtonContainer>
      </SharedGameContainer>
    );
  }
  
  return (
    <SharedGameContainer>
      <Title>Mickey Mouse Darts Game</Title>
      
      <Card>
        <GameInfo>
          <h2>Game Session: {sessionId?.substring(0, 8)}...</h2>
          <p>Status: {game?.isActive ? 'In Progress' : 'Completed'}</p>
          {game?.isActive && (
            <CurrentTurn>
              Current Turn: {getCurrentPlayerName()}
            </CurrentTurn>
          )}
        </GameInfo>
        
        <ShareLink>
          <h3>Share this game with friends:</h3>
          <LinkInput
            type="text"
            value={shareUrl}
            readOnly
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <Button variant="secondary" onClick={handleCopyLink}>
            Copy Link
          </Button>
        </ShareLink>
      </Card>
      
      {game && game.players && game.isActive && (
        <MickeyMouseBoard
          players={game.players}
          targetNumbers={game.targetNumbers || MICKEY_MOUSE_NUMBERS}
          onScoreNumber={() => {}} // Read-only in shared view
          currentPlayerIndex={game.currentPlayerIndex}
        />
      )}
      
      {game && game.players && (
        <Scoreboard players={game.players} gameNumber={1} />
      )}
      
      <ButtonContainer>
        <Button variant="primary" onClick={handleJoinGame}>
          Join This Game
        </Button>
        <Button variant="secondary" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </ButtonContainer>
    </SharedGameContainer>
  );
};

export default SharedGamePage; 