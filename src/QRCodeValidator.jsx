import React, { useState, useEffect, useRef } from 'react';
import CryptoJS from 'crypto-js';
import jsQR from 'jsqr';
import styled from 'styled-components';

// 添加验证密钥常量（必须与生成器中的密钥保持一致）
const VALIDATION_KEY = 'your-secret-key-here'; // 请确保与生成器中的密钥匹配

// 添加校验码验证函数
function validateChecksum(data, timestamp, checksum) {
  // 修改为与生成器一致的计算方式：将数据和时间戳合并后计算校验码
  const combinedData = data + timestamp;
  let hash = 0;
  for (let i = 0; i < combinedData.length; i++) {
    const char = combinedData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  // 使用密钥进一步混淆
  for (let i = 0; i < VALIDATION_KEY.length; i++) {
    const char = VALIDATION_KEY.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const generatedChecksum = Math.abs(hash).toString(16);
  return generatedChecksum === checksum;
}

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

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ResultBox = styled.div`
  margin-top: 20px;
  padding: 15px;
  border-radius: 4px;
  word-break: break-all;
`;

const EncryptionPanel = styled.div`
  margin-top: 15px;
  padding: 15px;
  background-color: #e8f5e9;
  border-radius: 4px;
`;

const CameraContainer = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const VideoElement = styled.video`
  max-width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const QRCodeValidator = () => {
  const [qrData, setQrData] = useState('');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [validationResult, setValidationResult] = useState('');
  const [isValid, setIsValid] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // 校验二维码数据
  const validateQRCode = () => {
    if (!qrData) {
      setValidationResult('请输入二维码数据');
      setIsValid(null);
      return;
    }

    try {
      // 解析二维码数据（处理可能的批量前缀）
      let rawData = qrData;
      // 检查是否有批量前缀格式（例如 "item-1: "）
      const prefixMatch = rawData.match(/^[^:]+: /);
      if (prefixMatch) {
        // 移除前缀
        rawData = rawData.replace(prefixMatch[0], '');
      }

      // 解析格式：数据|时间戳|校验码
      const parts = rawData.split('|');
      if (parts.length !== 3) {
        throw new Error('二维码数据格式不正确');
      }

      let processedData = parts[0];
      const timestamp = parts[1];
      const checksum = parts[2];

      // 验证校验码
      if (!validateChecksum(processedData, timestamp, checksum)) {
        throw new Error('校验码验证失败，数据可能被篡改');
      }

      // 验证时间戳（可选：检查是否在有效期内）
      const currentTime = new Date().getTime();
      const timestampMs = parseInt(timestamp);
      const oneDay = 24 * 60 * 60 * 1000;

      if (currentTime - timestampMs > oneDay) {
        setValidationResult(`警告：二维码已过期（超过24小时）\n数据内容: ${processedData}`);
        setIsValid(true); // 仍标记为有效，但显示警告
      } else {
        // 解密数据（如果启用）
        if (isEncrypted && encryptionKey) {
          const bytes = CryptoJS.AES.decrypt(processedData, encryptionKey);
          processedData = bytes.toString(CryptoJS.enc.Utf8);
          if (!processedData) {
            throw new Error('解密失败，密钥可能不正确');
          }
        }

        setValidationResult(`验证成功！\n数据内容: ${processedData}\n生成时间: ${new Date(timestampMs).toLocaleString()}`);
        setIsValid(true);
      }
    } catch (error) {
      setValidationResult(`验证失败: ${error.message}`);
      setIsValid(false);
    }
  };

  // 开始扫描
  const startScan = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setIsScanning(true);
      setShowCamera(true);
      setScanResult('正在扫描...');

      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();

            // 设置扫描间隔
            scanIntervalRef.current = setInterval(() => {
              scanQRCode();
            }, 1000);
          }
        })
        .catch((error) => {
          console.error('无法访问摄像头:', error);
          setScanResult(`无法访问摄像头: ${error.message}`);
          setIsScanning(false);
        });
    } else {
      setScanResult('您的浏览器不支持摄像头访问');
      setIsScanning(false);
    }
  };

  // 停止扫描
  const stopScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();

      tracks.forEach((track) => {
        track.stop();
      });

      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
    setShowCamera(false);
  };

  // 扫描二维码
  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // 设置画布尺寸与视频相同
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 绘制视频帧到画布
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 获取图像数据
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // 解析二维码
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      setScanResult(`扫描成功: ${code.data}`);
      setQrData(code.data);
      stopScan();
    }
  };

  // 组件卸载时停止扫描
  useEffect(() => {
    return () => {
      if (isScanning) {
        stopScan();
      }
    };
  }, [isScanning]);

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

      <div style={{ marginTop: '15px' }}>
        <Button onClick={startScan} disabled={isScanning}>
          {isScanning ? '扫描中...' : '使用摄像头扫描'}
        </Button>
        <Button onClick={validateQRCode} disabled={!qrData}>
          验证二维码
        </Button>
      </div>

      {showCamera && (
        <CameraContainer>
          <VideoElement ref={videoRef} autoPlay playsInline />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <p>{scanResult}</p>
          <Button onClick={stopScan}>
            停止扫描
          </Button>
        </CameraContainer>
      )}

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