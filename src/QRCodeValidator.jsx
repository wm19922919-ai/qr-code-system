import React, { useState } from 'react';
import CryptoJS from 'crypto-js';
import styled from 'styled-components';

const ValidatorContainer = styled.div`
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const InputField = styled.input`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
`;

const Button = styled.button`
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 10px 15px;
  margin: 10px 5px 10px 0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0b7dda;
  }
`;

const ResultBox = styled.div`
  margin-top: 20px;
  padding: 15px;
  background-color: #e8f5e9;
  border-radius: 4px;
  word-break: break-all;
`;

const EncryptionPanel = styled.div`
  margin-top: 15px;
  padding: 15px;
  background-color: #e8f5e9;
  border-radius: 4px;
`;

const QRCodeValidator = () => {
  const [qrData, setQrData] = useState('');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [validationResult, setValidationResult] = useState('');
  const [isValid, setIsValid] = useState(null);

  const validateQRCode = () => {
    if (!qrData) {
      setValidationResult('请输入二维码数据');
      setIsValid(null);
      return;
    }

    try {
      let decryptedData = qrData;

      // 解密数据（如果启用）
      if (isEncrypted && encryptionKey) {
        const bytes = CryptoJS.AES.decrypt(qrData, encryptionKey);
        decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      }

      // 这里可以添加自定义的验证逻辑
      // 例如检查数据格式、签名验证等
      setValidationResult(`验证成功！\n数据内容: ${decryptedData}`);
      setIsValid(true);
    } catch (error) {
      setValidationResult(`验证失败: ${error.message}`);
      setIsValid(false);
    }
  };

  return (
    <ValidatorContainer>
      <h2>二维码验证系统</h2>

      <div>
        <label htmlFor="qr-data">二维码数据:</label>
        <InputField
          id="qr-data"
          type="text"
          value={qrData}
          onChange={(e) => setQrData(e.target.value)}
          placeholder="请输入从二维码扫描得到的数据"
        />
      </div>

      <EncryptionPanel>
        <h3>数据解密</h3>
        <div>
          <input
            type="checkbox"
            id="decrypt-checkbox"
            checked={isEncrypted}
            onChange={(e) => setIsEncrypted(e.target.checked)}
          />
          <label htmlFor="decrypt-checkbox">启用解密</label>
        </div>

        {isEncrypted && (
          <div>
            <label htmlFor="decryption-key">解密密钥:</label>
            <InputField
              id="decryption-key"
              type="password"
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
              placeholder="请输入解密密钥"
            />
          </div>
        )}
      </EncryptionPanel>

      <Button onClick={validateQRCode}>
        验证二维码
      </Button>

      {validationResult && (
        <ResultBox style={{ backgroundColor: isValid === true ? '#e8f5e9' : isValid === false ? '#ffebee' : '#f5f5f5' }}>
          <h3>{isValid === true ? '验证成功' : isValid === false ? '验证失败' : '验证结果'}</h3>
          <pre>{validationResult}</pre>
        </ResultBox>
      )}
    </ValidatorContainer>
  );
};

export default QRCodeValidator;