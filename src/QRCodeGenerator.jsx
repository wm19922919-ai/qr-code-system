import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';  // 使用命名导入 QRCodeSVG
import CryptoJS from 'crypto-js';
import { saveAs } from 'file-saver';
import styled from 'styled-components';

// 添加验证密钥常量
const VALIDATION_KEY = 'your-secret-key-here'; // 请更换为您自己的密钥

// 添加校验码生成函数
function generateChecksum(data) {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  // 使用密钥进一步混淆
  for (let i = 0; i < VALIDATION_KEY.length; i++) {
    const char = VALIDATION_KEY.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

const GeneratorContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
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
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px 15px;
  margin: 10px 5px 10px 0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #45a049;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const QROutput = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const EncryptionPanel = styled.div`
  margin-top: 15px;
  padding: 15px;
  background-color: #e8f5e9;
  border-radius: 4px;
`;

const BatchPanel = styled.div`
  margin-top: 15px;
  padding: 15px;
  background-color: #e3f2fd;
  border-radius: 4px;
`;

const QRCodeGenerator = () => {
  const [data, setData] = useState('');
  const [qrSize, setQrSize] = useState(256);
  const [qrMargin, setQrMargin] = useState(4);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [batchCount, setBatchCount] = useState(1);
  const [batchPrefix, setBatchPrefix] = useState('item-');
  const [generatedQRs, setGeneratedQRs] = useState([]);

  const generateQRCode = () => {
    let processedData = data;

    // 加密数据（如果启用）
    if (isEncrypted && encryptionKey) {
      processedData = CryptoJS.AES.encrypt(data, encryptionKey).toString();
    }

    // 添加时间戳和校验码
    const timestamp = new Date().getTime();
    const checksum = generateChecksum(processedData + timestamp);
    const encodedData = `${processedData}|${timestamp}|${checksum}`;

    // 为批量生成准备数据
    const qrData = [];
    for (let i = 0; i < batchCount; i++) {
      const batchData = batchCount > 1 ? `${batchPrefix}${i+1}: ${encodedData}` : encodedData;
      qrData.push({
        id: i,
        data: batchData
      });
    }

    setGeneratedQRs(qrData);
  };

  const downloadQRCode = (qrId) => {
    const canvas = document.getElementById(`qr-code-${qrId}`);
    if (canvas) {
      canvas.toBlob(blob => {
        saveAs(blob, `qr-code-${qrId + 1}.png`);
      });
    }
  };

  const downloadAllQRs = () => {
    generatedQRs.forEach((qr, index) => {
      setTimeout(() => downloadQRCode(index), index * 500);
    });
  };

  return (
    <GeneratorContainer>
      <h2>二维码生成验证系统</h2>

      <div>
        <label htmlFor="data-input">输入数据:</label>
        <InputField
          id="data-input"
          type="text"
          value={data}
          onChange={(e) => setData(e.target.value)}
          placeholder="请输入要生成二维码的数据"
        />
      </div>

      <div>
        <label htmlFor="qr-size">二维码大小:</label>
        <InputField
          id="qr-size"
          type="number"
          value={qrSize}
          onChange={(e) => setQrSize(parseInt(e.target.value))}
          min="128"
          max="512"
        />
      </div>

      <div>
        <label htmlFor="qr-margin">二维码边距:</label>
        <InputField
          id="qr-margin"
          type="number"
          value={qrMargin}
          onChange={(e) => setQrMargin(parseInt(e.target.value))}
          min="0"
          max="10"
        />
      </div>

      <EncryptionPanel>
        <h3>数据加密</h3>
        <div>
          <input
            type="checkbox"
            id="encrypt-checkbox"
            checked={isEncrypted}
            onChange={(e) => setIsEncrypted(e.target.checked)}
          />
          <label htmlFor="encrypt-checkbox">启用加密</label>
        </div>

        {isEncrypted && (
          <div>
            <label htmlFor="encryption-key">加密密钥:</label>
            <InputField
              id="encryption-key"
              type="password"
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
              placeholder="请输入加密密钥"
            />
          </div>
        )}
      </EncryptionPanel>

      <BatchPanel>
        <h3>批量生成</h3>
        <div>
          <label htmlFor="batch-count">生成数量:</label>
          <InputField
            id="batch-count"
            type="number"
            value={batchCount}
            onChange={(e) => setBatchCount(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            max="50"
          />
        </div>

        <div>
          <label htmlFor="batch-prefix">前缀文本:</label>
          <InputField
            id="batch-prefix"
            type="text"
            value={batchPrefix}
            onChange={(e) => setBatchPrefix(e.target.value)}
            placeholder="批量项目的前缀标识"
          />
        </div>
      </BatchPanel>

      <Button
        onClick={generateQRCode}
        disabled={!data}
      >
        生成二维码
      </Button>

      {generatedQRs.length > 0 && (
        <QROutput>
          <h3>生成的二维码</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            {generatedQRs.map((qr, index) => (
              <div key={qr.id} style={{ margin: '10px', textAlign: 'center' }}>
                <canvas id={`qr-code-${index}`} />
                <QRCodeSVG value={qr.data} size={qrSize} />
                <p>{batchCount > 1 ? `${batchPrefix}${index+1}` : '数据二维码'}</p>
                <Button onClick={() => downloadQRCode(index)}>下载</Button>
              </div>
            ))}
          </div>
          {batchCount > 1 && (
            <Button style={{ marginTop: '20px' }} onClick={downloadAllQRs}>
              下载全部
            </Button>
          )}
        </QROutput>
      )}
    </GeneratorContainer>
  );
};

export default QRCodeGenerator;