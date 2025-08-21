import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import CryptoJS from 'crypto-js';
import { saveAs } from 'file-saver';
import styled from 'styled-components';

// 验证密钥常量（请确保与验证器中的密钥匹配）
const VALIDATION_KEY = 'your-secret-key-here';

// 固定配置
const FIXED_QR_SIZE = 128;
const FIXED_QR_MARGIN = 4;
const FIXED_ENCRYPTION_KEY = 'jfly3964';
const IS_ENCRYPTED = true;
const DEFAULT_BATCH_COUNT = 1; // 默认生成1个
const DEFAULT_BATCH_PREFIX = 'item-';

// 校验码生成函数
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
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const Button = styled.button`
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  margin: 10px 0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #45a049;
  }
`;

const InputGroup = styled.div`
  margin: 15px 0;
  text-align: left;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
`;

const QROutput = styled.div`
  margin-top: 20px;
`;

const QRGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
`;

const QRItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 5px;
  padding: 10px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const QRCodeGenerator = () => {
  const [generatedQRs, setGeneratedQRs] = useState([]);
  const [inputData, setInputData] = useState('金峰领域'); // 默认数据
  const [batchCount, setBatchCount] = useState(DEFAULT_BATCH_COUNT); // 默认生成1个
  const [batchPrefix, setBatchPrefix] = useState(DEFAULT_BATCH_PREFIX);
  const canvasRefs = useRef([]); // 用于存储 Canvas 引用

  const generateQRCode = () => {
    if (!inputData.trim()) {
      alert('请输入数据内容');
      return;
    }

    const count = Math.max(1, parseInt(batchCount) || 1); // 确保至少生成1个
    
    // 为批量生成准备数据
    const qrData = [];
    for (let i = 0; i < count; i++) {
      let processedData = inputData;

      // 加密数据
      if (IS_ENCRYPTED && FIXED_ENCRYPTION_KEY) {
        processedData = CryptoJS.AES.encrypt(processedData, FIXED_ENCRYPTION_KEY).toString();
      }

      // 添加时间戳和校验码
      const timestamp = new Date().getTime();
      const checksum = generateChecksum(processedData + timestamp);
      const encodedData = `${processedData}|${timestamp}|${checksum}`;
      const batchData = count > 1 ? `${batchPrefix}${i+1}: ${encodedData}` : encodedData;

      qrData.push({
        id: i,
        data: batchData
      });
    }

    setGeneratedQRs(qrData);
  };

  const downloadQRCode = (qrId) => {
    const canvas = canvasRefs.current[qrId];
    if (canvas) {
      canvas.toBlob(blob => {
        saveAs(blob, `qr-code-${qrId + 1}.png`);
      });
    }
  };

  const downloadAllQRs = () => {
    generatedQRs.forEach((qr, index) => {
      setTimeout(() => downloadQRCode(index), index * 100);
    });
  };

  return (
    <GeneratorContainer>
      <h2>二维码生成系统</h2>
      
      <InputGroup>
        <Label>数据内容:</Label>
        <Input 
          type="text" 
          value={inputData} 
          onChange={(e) => setInputData(e.target.value)} 
          placeholder="请输入二维码数据内容"
        />
      </InputGroup>
      
      <InputGroup>
        <Label>生成数量:</Label>
        <Input 
          type="number" 
          min="1" 
          value={batchCount} 
          onChange={(e) => setBatchCount(e.target.value)} 
          placeholder="请输入生成数量"
        />
      </InputGroup>
      
      <InputGroup>
        <Label>批量前缀 (可选):</Label>
        <Input 
          type="text" 
          value={batchPrefix} 
          onChange={(e) => setBatchPrefix(e.target.value)} 
          placeholder="如 'item-'，生成多个时将显示为 'item-1', 'item-2'..."
        />
      </InputGroup>
      
      <Button onClick={generateQRCode}>
        生成二维码
      </Button>

      {generatedQRs.length > 0 && (
        <QROutput>
          <h3>生成的二维码</h3>
          <QRGrid>
            {generatedQRs.map((qr, index) => (
              <QRItem key={qr.id}>
                {/* 只使用 Canvas 组件，既用于显示也用于下载 */}
                <QRCodeCanvas 
                  ref={el => canvasRefs.current[index] = el} 
                  value={qr.data} 
                  size={FIXED_QR_SIZE} 
                />
                {batchCount > 1 && (
                  <p style={{ margin: '5px 0', fontSize: '12px' }}>{`${batchPrefix}${index+1}`}</p>
                )}
                <Button 
                  onClick={() => downloadQRCode(index)} 
                  style={{ fontSize: '12px', padding: '5px 10px' }}
                >
                  下载
                </Button>
              </QRItem>
            ))}
          </QRGrid>
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