import React, { useState } from 'react';
import QRCodeGenerator from './QRCodeGenerator';
import QRCodeValidator from './QRCodeValidator';
import styled from 'styled-components';
import './App.css';

const AppContainer = styled.div`
  font-family: 'Inter', sans-serif;
  padding: 2rem;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 2rem;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  overflow: hidden;
`;

const TabButton = styled.button`
  padding: 1rem 2.5rem;
  background-color: ${props => props.$active ? '#3b82f6' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#64748b'};
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    background-color: ${props => props.$active ? '#2563eb' : '#f1f5f9'};
    color: ${props => props.$active ? 'white' : '#334155'};
  }

  &:first-child {
    border-top-left-radius: 12px;
    border-bottom-left-radius: 12px;
  }

  &:last-child {
    border-top-right-radius: 12px;
    border-bottom-right-radius: 12px;
  }

  ${props => props.$active && `
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.4);
  `}
`;

function App() {
  const [activeTab, setActiveTab] = useState('generator');

  return (
    <AppContainer>
      <h1>二维码生成与验证系统</h1>
      <TabContainer>
        <TabButton
          $active={activeTab === 'generator'}
          onClick={() => setActiveTab('generator')}
        >
          生成二维码
        </TabButton>
        <TabButton
          $active={activeTab === 'validator'}
          onClick={() => setActiveTab('validator')}
        >
          验证二维码
        </TabButton>
      </TabContainer>

      {activeTab === 'generator' ? <QRCodeGenerator /> : <QRCodeValidator />}
    </AppContainer>
  );
}

export default App;
