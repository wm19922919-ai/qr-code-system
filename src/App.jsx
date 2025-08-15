import React, { useState } from 'react';
import QRCodeGenerator from './QRCodeGenerator';
import QRCodeValidator from './QRCodeValidator';
import styled from 'styled-components';
import './App.css';

const AppContainer = styled.div`
  font-family: Arial, sans-serif;
  padding: 20px;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
`;

const TabButton = styled.button`
  padding: 10px 20px;
  background-color: ${props => props.$active ? '#4CAF50' : '#f1f1f1'};
  color: ${props => props.$active ? 'white' : 'black'};
  border: none;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${props => props.$active ? '#45a049' : '#ddd'};
  }

  &:first-child {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  &:last-child {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }
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
