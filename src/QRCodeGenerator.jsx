import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import CryptoJS from 'crypto-js';
import { saveAs } from 'file-saver';
import styled from 'styled-components';

// 验证密钥常量
const VALIDATION_KEY = 'your-secret-key-here';

// 固定配置
const FIXED_QR_SIZE = 150;
const FIXED_ENCRYPTION_KEY = 'jfly3964';
const IS_ENCRYPTED = true;
const DEFAULT_BATCH_COUNT = 1; // 默认生成1个
const DEFAULT_BATCH_PREFIX = 'item-';
const FIXED_INPUT_DATA = '金峰领域'; // 固定数据

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
  padding: 2rem;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);
  }
`;

const Button = styled.button`
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  margin: 1rem 0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);

  &:hover {
    background-color: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.5);
  }

  &:active {
    transform: translateY(1px);
  }
`;

const InputGroup = styled.div`
  margin: 1.5rem 0;
  text-align: left;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #475569;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-sizing: border-box;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const QROutput = styled.div`
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
`;

const QRGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 1.5rem;
`;

const QRItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }
`;

const FixedDataDisplay = styled.div`
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: #f1f5f9;
  border-radius: 8px;
  font-weight: 500;
  color: #3b82f6;
`;

const QRCodeGenerator = () => {
  const [generatedQRs, setGeneratedQRs] = useState([]);
  const [batchCount, setBatchCount] = useState(DEFAULT_BATCH_COUNT); // 默认生成1个
  const [batchPrefix, setBatchPrefix] = useState(DEFAULT_BATCH_PREFIX);
  const canvasRefs = useRef([]); // 用于存储 Canvas 引用

  const generateQRCode = () => {
    const count = Math.max(1, parseInt(batchCount) || 1); // 确保至少生成1个
    
    // 为批量生成准备数据
    const qrData = [];
    for (let i = 0; i < count; i++) {
      let processedData = FIXED_INPUT_DATA;

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
      
      {/* 删除FixedDataDisplay组件，不再显示固定数据内容 */}
      
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
                  margin={4}
                />
                {batchCount > 1 && (
                  <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>{`${batchPrefix}${index+1}`}</p>
                )}
                <Button 
                  onClick={() => downloadQRCode(index)} 
                  style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', marginTop: '0.5rem' }}
                >
                  下载
                </Button>
              </QRItem>
            ))}
          </QRGrid>
          {batchCount > 1 && (
            <Button style={{ marginTop: '1.5rem' }} onClick={downloadAllQRs}>
              下载全部
            </Button>
          )}
        </QROutput>
      )}
    </GeneratorContainer>
  );
};

export default QRCodeGenerator;