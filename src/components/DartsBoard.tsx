import React from 'react';
import styled from 'styled-components';

const BoardContainer = styled.div`
  position: relative;
  width: 300px;
  height: 300px;
  margin: 0 auto;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.tertiary};
  box-shadow: ${props => props.theme.shadows.large};
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xl};
  border: 4px solid ${props => props.theme.colors.white};
`;

const OuterRing = styled.div`
  position: absolute;
  width: 90%;
  height: 90%;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.primary};
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid ${props => props.theme.colors.white};
`;

const MiddleRing = styled.div`
  position: absolute;
  width: 70%;
  height: 70%;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.secondary};
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid ${props => props.theme.colors.white};
`;

const InnerRing = styled.div`
  position: absolute;
  width: 40%;
  height: 40%;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.primary};
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid ${props => props.theme.colors.white};
`;

const Bullseye = styled.div`
  position: absolute;
  width: 15%;
  height: 15%;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.tertiary};
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid ${props => props.theme.colors.white};
`;

const MickeyEar = styled.div<{ $left?: boolean }>`
  position: absolute;
  width: 30%;
  height: 30%;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.tertiary};
  top: -15%;
  left: ${props => (props.$left ? '15%' : 'auto')};
  right: ${props => (!props.$left ? '15%' : 'auto')};
  border: 4px solid ${props => props.theme.colors.white};
`;

const DartsBoard: React.FC = () => {
  return (
    <BoardContainer>
      <MickeyEar $left />
      <MickeyEar />
      <OuterRing>
        <MiddleRing>
          <InnerRing>
            <Bullseye />
          </InnerRing>
        </MiddleRing>
      </OuterRing>
    </BoardContainer>
  );
};

export default DartsBoard; 