import React from 'react';
import styled, { css } from 'styled-components';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'success' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
}

const getButtonStyles = (variant: ButtonVariant = 'primary') => {
  switch (variant) {
    case 'primary':
      return css`
        background-color: ${props => props.theme.colors.primary};
        color: ${props => props.theme.colors.white};
        &:hover:not(:disabled) {
          background-color: #cc0000;
        }
      `;
    case 'secondary':
      return css`
        background-color: ${props => props.theme.colors.secondary};
        color: ${props => props.theme.colors.white};
        &:hover:not(:disabled) {
          background-color: #3d8b40;
        }
      `;
    case 'tertiary':
      return css`
        background-color: transparent;
        color: ${props => props.theme.colors.primary};
        border: 2px solid ${props => props.theme.colors.primary};
        &:hover:not(:disabled) {
          background-color: rgba(255, 0, 0, 0.1);
        }
      `;
    case 'success':
      return css`
        background-color: ${props => props.theme.colors.success};
        color: ${props => props.theme.colors.white};
        &:hover:not(:disabled) {
          background-color: #3d8b40;
        }
      `;
    case 'danger':
      return css`
        background-color: ${props => props.theme.colors.error};
        color: ${props => props.theme.colors.white};
        &:hover:not(:disabled) {
          background-color: #d32f2f;
        }
      `;
    default:
      return css`
        background-color: ${props => props.theme.colors.primary};
        color: ${props => props.theme.colors.white};
        &:hover:not(:disabled) {
          background-color: #cc0000;
        }
      `;
  }
};

const getButtonSize = (size: ButtonSize = 'medium') => {
  switch (size) {
    case 'small':
      return css`
        padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
        font-size: ${props => props.theme.fontSizes.small};
      `;
    case 'medium':
      return css`
        padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
        font-size: ${props => props.theme.fontSizes.medium};
      `;
    case 'large':
      return css`
        padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
        font-size: ${props => props.theme.fontSizes.large};
      `;
    default:
      return css`
        padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
        font-size: ${props => props.theme.fontSizes.medium};
      `;
  }
};

const StyledButton = styled.button<{
  $variant?: ButtonVariant;
  $size?: ButtonSize;
  $fullWidth?: boolean;
}>`
  border: none;
  border-radius: ${props => props.theme.borderRadius.medium};
  cursor: pointer;
  font-family: ${props => props.theme.fonts.main};
  font-weight: 600;
  transition: all ${props => props.theme.transitions.fast};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${props => (props.$fullWidth ? '100%' : 'auto')};
  
  ${props => getButtonStyles(props.$variant)}
  ${props => getButtonSize(props.$size)}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(255, 0, 0, 0.3);
  }
`;

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  children,
}) => {
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </StyledButton>
  );
};

export default Button; 