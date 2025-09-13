import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Edit, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageEditor } from "./ImageEditor";

interface GameImageUploadProps {
  type: 'logo' | 'header';
  currentUrl?: string;
  onUpload: (url: string) => void;
  title: string;
  description: string;
  gameId: string;
}

export function GameImageUpload({ 
  type, 
  currentUrl, 
  onUpload, 
  title, 
  description,
  gameId 
}: GameImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxSize = type === 'logo' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${type === 'logo' ? '2MB' : '5MB'}`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Create temporary URL for editor
    const tempUrl = URL.createObjectURL(file);
    setTempImageUrl(tempUrl);
    setShowEditor(true);

    // Reset the input
    event.target.value = '';
  };

  const handleEditExisting = () => {
    if (currentUrl) {
      setTempImageUrl(currentUrl);
      setShowEditor(true);
    }
  };

  const handleSaveFromEditor = async (imageBlob: Blob) => {
    setUploading(true);
    setShowEditor(false);

    try {
      const fileExt = 'png'; // Editor sempre exporta PNG
      const fileName = `${gameId}-${type}-${Date.now()}.${fileExt}`;
      const bucketName = type === 'logo' ? 'logos' : 'headers';

      console.log(`Uploading ${type} to bucket:`, bucketName, 'fileName:', fileName);

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, imageBlob, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      console.log(`${type} uploaded successfully:`, publicUrl);
      
      // Update game record with new image URL
      const updateField = type === 'logo' ? 'logo_url' : 'hero_image_url';
      const { error: updateError } = await supabase
        .from('games')
        .update({ [updateField]: publicUrl })
        .eq('id', gameId);

      if (updateError) throw updateError;

      onUpload(publicUrl);

      toast.success(`${title} uploaded and saved successfully`);
    } catch (error: any) {
      console.error(`${type} upload error:`, error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      // Clean up temp URL
      if (tempImageUrl && tempImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(tempImageUrl);
      }
      setTempImageUrl(undefined);
    }
  };

  const handleRemove = async () => {
    try {
      // Update game record to remove image URL
      const updateField = type === 'logo' ? 'logo_url' : 'hero_image_url';
      const { error: updateError } = await supabase
        .from('games')
        .update({ [updateField]: null })
        .eq('id', gameId);

      if (updateError) throw updateError;

      onUpload('');
      toast.success(`${title} removed successfully`);
    } catch (error: any) {
      console.error(`Error removing ${type}:`, error);
      toast.error(`Failed to remove ${type}: ${error.message}`);
    }
  };

  const handleEditorCancel = () => {
    setShowEditor(false);
    // Clean up temp URL
    if (tempImageUrl && tempImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(tempImageUrl);
    }
    setTempImageUrl(undefined);
  };

  return (
    <>
      <div>
        <Label className="text-gray-700 font-medium flex items-center">
          {title}
          <Upload className="h-4 w-4 ml-2 text-gray-400" />
        </Label>
        
        {currentUrl ? (
          <div className="mt-2 relative">
            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img 
                    src={currentUrl} 
                    alt={title}
                    className={`${type === 'logo' ? 'h-12 w-12' : 'h-20 w-32'} object-cover rounded border`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{title} uploaded</p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleEditExisting}
                    className="h-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemove}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 hover:border-gray-400 cursor-pointer transition-colors">
                {uploading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    <span className="ml-2">Uploading...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>Click to upload or drag and drop</p>
                    <p className="text-xs mt-1">{description}</p>
                  </>
                )}
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Image Editor Modal */}
      {showEditor && (
        <ImageEditor
          imageUrl={tempImageUrl}
          type={type}
          onSave={handleSaveFromEditor}
          onCancel={handleEditorCancel}
        />
      )}
    </>
  );
}