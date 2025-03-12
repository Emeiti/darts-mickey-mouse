import React, { useState } from 'react';
import styled from 'styled-components';
import Button from './Button';

interface PlayerFormProps {
  onAddPlayer: (name: string) => void;
  existingPlayers: string[];
}

const FormContainer = styled.div`
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadows.medium};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const Title = styled.h2`
  font-size: ${props => props.theme.fontSizes.xlarge};
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.md};
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const Label = styled.label`
  font-size: ${props => props.theme.fontSizes.medium};
  color: ${props => props.theme.colors.text};
`;

const Input = styled.input`
  padding: ${props => props.theme.spacing.md};
  border: 2px solid ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.medium};
  font-size: ${props => props.theme.fontSizes.medium};
  transition: border-color ${props => props.theme.transitions.fast};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ErrorMessage = styled.p`
  color: ${props => props.theme.colors.error};
  font-size: ${props => props.theme.fontSizes.small};
  margin-top: ${props => props.theme.spacing.xs};
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${props => props.theme.spacing.md};
`;

const PlayerForm: React.FC<PlayerFormProps> = ({ onAddPlayer, existingPlayers }) => {
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate player name
    if (!playerName.trim()) {
      setError('Player name cannot be empty');
      return;
    }
    
    // Check if player name already exists
    if (existingPlayers.includes(playerName.trim())) {
      setError('A player with this name already exists');
      return;
    }
    
    // Add player
    onAddPlayer(playerName.trim());
    setPlayerName('');
    setError('');
  };
  
  return (
    <FormContainer>
      <Title>Add New Player</Title>
      <Form onSubmit={handleSubmit}>
        <InputGroup>
          <Label htmlFor="playerName">Player Name</Label>
          <Input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter player name"
          />
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </InputGroup>
        <ButtonContainer>
          <Button type="submit" variant="primary">
            Add Player
          </Button>
        </ButtonContainer>
      </Form>
    </FormContainer>
  );
};

export default PlayerForm; 