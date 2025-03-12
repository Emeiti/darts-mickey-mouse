import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import LeaderboardPage from './pages/LeaderboardPage';
import SharedGamePage from './pages/SharedGamePage';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Poppins', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #F5F5F5;
    color: #333333;
  }
  
  h1, h2, h3, h4, h5, h6 {
    color: #FF0000;
    margin-bottom: 1rem;
  }
  
  p {
    margin-bottom: 1rem;
    line-height: 1.5;
  }
  
  a {
    color: #4CAF50;
    text-decoration: none;
  }
  
  @media (max-width: 768px) {
    html {
      font-size: 14px;
    }
  }
`;

function App() {
  return (
    <>
      <GlobalStyle />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/game/:sessionId" element={<GamePage />} />
            <Route path="/shared-game/:sessionId" element={<SharedGamePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
          </Routes>
        </Layout>
      </Router>
    </>
  );
}

export default App;
