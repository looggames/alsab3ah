import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  data: string;
  size?: number;
  label?: string;
  showBorder?: boolean;
  showLabel?: boolean;
  className?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  data,
  size = 140,
  label = 'رمز الاستجابة السريعة (ZATCA QR)',
  showBorder = true,
  showLabel = true,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!data) return;

    QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: Math.max(size * 2, 280), // High-res for easy mobile scanner detection
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setDataUrl(url);
        setError(false);
      })
      .catch((err) => {
        console.error('Error generating ZATCA QR Code', err);
        setError(true);
      });
  }, [data, size]);

  const content = (
    <>
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={label || 'ZATCA QR'}
          width={size}
          height={size}
          className="rounded-md object-contain bg-white"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      ) : error ? (
        <div
          className="bg-rose-50 text-rose-500 rounded-md flex items-center justify-center text-[10px] text-center p-2"
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          تعذر توليد الرمز
        </div>
      ) : (
        <div
          className="animate-pulse bg-slate-100 rounded-md flex items-center justify-center text-[10px] text-slate-400"
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          جاري المعالجة...
        </div>
      )}
      {showLabel && label && (
        <span className="text-[11px] text-slate-500 mt-1.5 font-medium text-center">{label}</span>
      )}
    </>
  );

  if (!showBorder) {
    return <div className={`flex flex-col items-center justify-center ${className}`}>{content}</div>;
  }

  return (
    <div className={`flex flex-col items-center justify-center p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs ${className}`}>
      {content}
    </div>
  );
};

