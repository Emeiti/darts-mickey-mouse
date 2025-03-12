import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const HeaderContainer = styled.header`
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing.md};
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${props => props.theme.shadows.medium};
`;

const Logo = styled.div`
  font-size: ${props => props.theme.fontSizes.xxlarge};
  font-weight: bold;
  display: flex;
  align-items: center;
  
  img {
    height: 40px;
    margin-right: ${props => props.theme.spacing.sm};
  }
`;

const Nav = styled.nav`
  display: flex;
  gap: ${props => props.theme.spacing.md};
`;

const NavLink = styled(Link)`
  color: ${props => props.theme.colors.white};
  text-decoration: none;
  font-size: ${props => props.theme.fontSizes.medium};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.medium};
  transition: background-color ${props => props.theme.transitions.fast};
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const Header: React.FC = () => {
  return (
    <HeaderContainer>
      <Logo>
        <img src="/mickey-icon.png" alt="Mickey Mouse" />
        Mickey Mouse Darts
      </Logo>
      <Nav>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/new-game">New Game</NavLink>
        <NavLink to="/leaderboard">Leaderboard</NavLink>
      </Nav>
    </HeaderContainer>
  );
};

export default Header; 