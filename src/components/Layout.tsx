import React from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { theme } from '../theme';
import Header from './Header';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Main = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.xl};
  min-height: calc(100vh - 80px);
`;

const Footer = styled.footer`
  background-color: ${props => props.theme.colors.tertiary};
  color: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing.md};
  text-align: center;
  font-size: ${props => props.theme.fontSizes.small};
`;

const GlobalStyles = styled.div`
  font-family: ${props => props.theme.fonts.main};
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  min-height: 100vh;
`;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isGamePage = location.pathname.includes('/game');

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles>
        {!isGamePage && <Header />}
        <Main>{children}</Main>
        <Footer>
          &copy; {new Date().getFullYear()} Mickey Mouse Darts Game. All rights reserved.
        </Footer>
      </GlobalStyles>
    </ThemeProvider>
  );
};

export default Layout; 