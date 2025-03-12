import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import DartsBoard from '../components/DartsBoard';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: ${props => props.theme.spacing.lg};
`;

const Title = styled.h1`
  font-size: 3rem;
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Subtitle = styled.p`
  font-size: ${props => props.theme.fontSizes.large};
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.xl};
  max-width: 600px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.lg};
  margin-top: ${props => props.theme.spacing.xl};
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const MickeyImage = styled.img`
  max-width: 200px;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const RulesContainer = styled.div`
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  margin: ${props => props.theme.spacing.xl} 0;
  max-width: 800px;
  box-shadow: ${props => props.theme.shadows.medium};
  text-align: left;
  color: ${props => props.theme.colors.black};
`;

const RulesTitle = styled.h2`
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.md};
  font-size: 1.8rem;
`;

const RulesList = styled.ul`
  margin-left: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.black};
`;

const RulesItem = styled.li`
  margin-bottom: ${props => props.theme.spacing.sm};
  font-size: 1.1rem;
`;

const HomePage: React.FC = () => {
  return (
    <HomeContainer>
      <MickeyImage src="/mickey-mouse.png" alt="Mickey Mouse" />
      <Title>Mickey Mouse Darts Game</Title>
      <Subtitle>
        Welcome to the Mickey Mouse Darts Game! Challenge your friends to a fun game of darts
        with a Mickey Mouse twist. Keep track of scores, see who's winning, and have a great time!
      </Subtitle>
      
      <DartsBoard />
      
      <RulesContainer>
        <RulesTitle>How to Play Mickey Mouse Darts</RulesTitle>
        <RulesList>
          <RulesItem>
            <strong>Objective:</strong> Close all numbers from 20 down to 12 plus Bull's-eye before your opponents.
          </RulesItem>
          <RulesItem>
            <strong>Closing Numbers:</strong> To close a number, you need to hit it three times. The first hit marks a slash (/), 
            the second hit makes an X, and the third hit circles the X to close the number.
          </RulesItem>
          <RulesItem>
            <strong>Scoring:</strong> Once you close a number, you score points when hitting that number until all players have closed it.
          </RulesItem>
          <RulesItem>
            <strong>Winning:</strong> The player with the highest score after all numbers are closed (or when the game is ended) wins.
          </RulesItem>
          <RulesItem>
            <strong>Mobile Friendly:</strong> Play on any device with our responsive design.
          </RulesItem>
          <RulesItem>
            <strong>Multiple Players:</strong> Add as many players as you want to join the game.
          </RulesItem>
        </RulesList>
      </RulesContainer>
      
      <ButtonContainer>
        <Link to="/game">
          <Button variant="primary" size="large">
            Start New Game
          </Button>
        </Link>
        <Link to="/leaderboard">
          <Button variant="secondary" size="large">
            View Leaderboard
          </Button>
        </Link>
      </ButtonContainer>
    </HomeContainer>
  );
};

export default HomePage; 