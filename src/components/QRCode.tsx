import { useEffect, useState } from "react";
import QRCodeLib from "qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, QrCode } from "lucide-react";
import { toast } from "sonner";

interface QRCodeProps {
  url: string;
  title?: string;
  size?: number;
  showActions?: boolean;
  className?: string;
}

export function QRCode({ 
  url, 
  title = "QR Code", 
  size = 200, 
  showActions = true,
  className = ""
}: QRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateQR();
  }, [url, size]);

  const generateQR = async () => {
    try {
      setLoading(true);
      const qrDataUrl = await QRCodeLib.toDataURL(url, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error("Erro ao gerar QR code");
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `qr-code-${title.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("QR code baixado com sucesso");
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copiada para clipboard");
    } catch (error) {
      toast.error("Erro ao copiar URL");
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <img 
            src={qrDataUrl} 
            alt={`QR Code for ${title}`}
            className="border rounded-lg"
          />
        </div>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground break-all">
            {url}
          </p>
        </div>

        {showActions && (
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={copyUrl}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar URL
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadQR}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar QR
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component for generating QR code as base64 for emails
export const generateQRCodeBase64 = async (url: string, size: number = 200): Promise<string> => {
  try {
    return await QRCodeLib.toDataURL(url, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
};