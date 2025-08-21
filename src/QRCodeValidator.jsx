import React, { useState, useEffect, useRef } from 'react';
import CryptoJS from 'crypto-js';
import jsQR from 'jsqr';
import styled from 'styled-components';

// 验证密钥常量
const VALIDATION_KEY = 'your-secret-key-here';
const FIXED_ENCRYPTION_KEY = 'jfly3964'; // 固定解密密钥
const IS_ENCRYPTED = true; // 固定加密状态

// 校验码验证函数
function validateChecksum(data, timestamp, checksum) {
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
  margin: 2rem auto;
  padding: 2rem;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);
  }
`;

const InputField = styled.input`
  width: 100%;
  padding: 0.8rem;
  margin: 1rem 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const Button = styled.button`
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  margin: 1rem 0.5rem 1rem 0;
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

  &:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const ResultBox = styled.div`
  margin-top: 1.5rem;
  padding: 1.5rem;
  border-radius: 8px;
  word-break: break-all;
  background-color: ${props => props.$isValid === 'success' ? '#dcfce7' : props.$isValid === 'error' ? '#fee2e2' : '#f1f5f9'};
  border-left: 4px solid ${props => props.$isValid === 'success' ? '#22c55e' : props.$isValid === 'error' ? '#ef4444' : '#94a3b8'};
`;

const CameraContainer = styled.div`
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const VideoElement = styled.video`
  max-width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const QRCodeValidator = () => {
  const [qrData, setQrData] = useState('');
  const [validationResult, setValidationResult] = useState('');
  const [isValid, setIsValid] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // 校验二维码数据
  const validateQRCode = (data) => {
    if (!data) {
      setValidationResult('请输入二维码数据');
      setIsValid(null);
      return;
    }

    try {
      // 解析二维码数据（处理可能的批量前缀）
      let rawData = data;
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

      // 验证时间戳（检查是否在有效期内）
      const currentTime = new Date().getTime();
      const timestampMs = parseInt(timestamp);
      const oneDay = 24 * 60 * 60 * 1000;

      if (currentTime - timestampMs > oneDay) {
        setValidationResult(`警告：二维码已过期（超过24小时）\n数据内容: ${processedData}`);
        setIsValid(true); // 仍标记为有效，但显示警告
      } else {
        // 解密数据（固定密钥和加密状态）
        if (IS_ENCRYPTED && FIXED_ENCRYPTION_KEY) {
          const bytes = CryptoJS.AES.decrypt(processedData, FIXED_ENCRYPTION_KEY);
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
      setScanResult(`扫描成功: ${code.data.substring(0, 30)}...`);
      setQrData(code.data);
      validateQRCode(code.data); // 自动验证
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

  // 监听手动输入的二维码数据变化
  useEffect(() => {
    if (qrData) {
      validateQRCode(qrData);
    }
  }, [qrData]);

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

      <div style={{ marginTop: '1rem' }}>
        <Button onClick={startScan} disabled={isScanning}>
          {isScanning ? '扫描中...' : '使用摄像头扫描'}
        </Button>
      </div>

      {showCamera && (
        <CameraContainer>
          <VideoElement ref={videoRef} autoPlay playsInline />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <p style={{ margin: '1rem 0' }}>{scanResult}</p>
          <Button onClick={stopScan}>
            停止扫描
          </Button>
        </CameraContainer>
      )}

      {validationResult && (
        <ResultBox $isValid={isValid === true ? 'success' : isValid === false ? 'error' : 'default'}>
          <h3>{isValid === true ? '验证成功' : isValid === false ? '验证失败' : '验证结果'}</h3>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.9rem' }}>{validationResult}</pre>
        </ResultBox>
      )}
    </ValidatorContainer>
  );
};

export default QRCodeValidator;