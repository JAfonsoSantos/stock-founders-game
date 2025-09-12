import React, { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, FabricImage, Rect } from "fabric";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  Crop, 
  Move, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Save, 
  X,
  Upload
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ImageEditorProps {
  imageUrl?: string;
  type: 'logo' | 'header';
  onSave: (imageBlob: Blob) => void;
  onCancel: () => void;
}

export function ImageEditor({ imageUrl, type, onSave, onCancel }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [currentImage, setCurrentImage] = useState<FabricImage | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [scale, setScale] = useState([1]);

  const canvasWidth = type === 'logo' ? 400 : 800;
  const canvasHeight = type === 'logo' ? 400 : 300;

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: "#f5f5f5",
    });

    setFabricCanvas(canvas);

    // Load initial image if provided
    if (imageUrl) {
      loadImageFromUrl(imageUrl, canvas);
    }

    return () => {
      canvas.dispose();
    };
  }, [imageUrl, canvasWidth, canvasHeight]);

  const loadImageFromUrl = async (url: string, canvas: FabricCanvas) => {
    try {
      const img = await FabricImage.fromURL(url);
      
      // Scale image to fit canvas while maintaining aspect ratio
      const scaleX = canvasWidth / img.width!;
      const scaleY = canvasHeight / img.height!;
      const scale = Math.min(scaleX, scaleY, 1);
      
      img.scale(scale);
      img.set({
        left: canvasWidth / 2 - (img.width! * scale) / 2,
        top: canvasHeight / 2 - (img.height! * scale) / 2,
      });
      
      canvas.add(img);
      setCurrentImage(img);
      canvas.renderAll();
    } catch (error) {
      console.error('Error loading image:', error);
      toast({
        variant: "destructive",
        title: "Error loading image",
        description: "Failed to load the image for editing",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fabricCanvas) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target?.result) {
        const imgUrl = e.target.result as string;
        
        // Clear existing image
        if (currentImage) {
          fabricCanvas.remove(currentImage);
        }
        
        await loadImageFromUrl(imgUrl, fabricCanvas);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMove = () => {
    if (!currentImage) return;
    currentImage.set('lockScalingX', false);
    currentImage.set('lockScalingY', false);
    currentImage.set('lockRotation', false);
    fabricCanvas?.renderAll();
  };

  const handleCrop = () => {
    setCropMode(!cropMode);
    if (!cropMode && fabricCanvas && currentImage) {
      // Add crop rectangle
      const cropRect = new Rect({
        left: currentImage.left! - 50,
        top: currentImage.top! - 50,
        width: 200,
        height: 200,
        fill: 'transparent',
        stroke: '#ff6b35',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: true,
      });
      
      fabricCanvas.add(cropRect);
      fabricCanvas.setActiveObject(cropRect);
    }
  };

  const applyCrop = () => {
    if (!fabricCanvas || !currentImage) return;

    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject && activeObject.type === 'rect') {
      // Create cropped image
      const cropRect = activeObject as Rect;
      const cropX = cropRect.left! - currentImage.left!;
      const cropY = cropRect.top! - currentImage.top!;
      const cropWidth = cropRect.width! * cropRect.scaleX!;
      const cropHeight = cropRect.height! * cropRect.scaleY!;

      // Remove crop rectangle
      fabricCanvas.remove(activeObject);
      setCropMode(false);
      
      toast({
        title: "Crop applied",
        description: "Image has been cropped successfully",
      });
    }
  };

  const handleRotate = () => {
    if (!currentImage) return;
    const currentAngle = currentImage.angle || 0;
    currentImage.rotate(currentAngle + 90);
    fabricCanvas?.renderAll();
  };

  const handleScaleChange = (value: number[]) => {
    if (!currentImage) return;
    const newScale = value[0];
    currentImage.scale(newScale);
    setScale(value);
    fabricCanvas?.renderAll();
  };

  const handleZoomIn = () => {
    const newScale = Math.min(scale[0] * 1.1, 3);
    handleScaleChange([newScale]);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale[0] * 0.9, 0.1);
    handleScaleChange([newScale]);
  };

  const handleSave = () => {
    if (!fabricCanvas) return;

    // Convert canvas to data URL first, then to blob
    const dataURL = fabricCanvas.toDataURL({
      multiplier: 1,
      format: 'png',
      quality: 1.0
    });
    
    // Convert data URL to blob
    fetch(dataURL)
      .then(res => res.blob())
      .then(blob => {
        onSave(blob);
        toast({
          title: "Image saved",
          description: `${type === 'logo' ? 'Logo' : 'Header image'} has been saved successfully`,
        });
      })
      .catch(error => {
        console.error('Error converting canvas to blob:', error);
        toast({
          variant: "destructive",
          title: "Save failed",
          description: "Failed to save the edited image",
        });
      });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Edit {type === 'logo' ? 'Logo' : 'Header Image'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload New
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button
              variant={cropMode ? "default" : "outline"}
              size="sm"
              onClick={handleCrop}
              disabled={!currentImage}
            >
              <Crop className="h-4 w-4 mr-2" />
              Crop
            </Button>
            
            {cropMode && (
              <Button
                variant="default"
                size="sm"
                onClick={applyCrop}
              >
                Apply Crop
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleMove}
              disabled={!currentImage}
            >
              <Move className="h-4 w-4 mr-2" />
              Move
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
              disabled={!currentImage}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Rotate
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={!currentImage}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={!currentImage}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button
              onClick={handleSave}
              disabled={!currentImage}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>

          {/* Scale Controls */}
          {currentImage && (
            <div className="flex items-center gap-4">
              <Label className="text-sm min-w-[60px]">Scale:</Label>
              <Slider
                value={scale}
                onValueChange={handleScaleChange}
                min={0.1}
                max={3}
                step={0.1}
                className="flex-1 max-w-xs"
              />
              <span className="text-sm text-gray-600 min-w-[60px]">
                {Math.round(scale[0] * 100)}%
              </span>
            </div>
          )}

          {/* Canvas */}
          <div className="flex justify-center">
            <div className="border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              <canvas ref={canvasRef} className="max-w-full" />
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {!currentImage && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No image loaded</p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}