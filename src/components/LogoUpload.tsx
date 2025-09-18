import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Image } from "lucide-react";

interface LogoUploadProps {
  startupSlug: string;
  currentLogoUrl?: string;
  onLogoUploaded: (url: string) => void;
}

export function LogoUpload({ startupSlug, currentLogoUrl, onLogoUploaded }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${startupSlug}/logo.${fileExt}`;

      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      const { error: uploadError } = await supabase.storage
        .from('startup-logos')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('startup-logos')
        .getPublicUrl(fileName);

      onLogoUploaded(publicUrl);
      
      toast.success("Logo uploaded successfully!");

    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(error.message || "Error uploading logo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="logo-upload">Logo da Startup</Label>
      
      {currentLogoUrl && (
        <div className="w-24 h-24 rounded border overflow-hidden bg-muted">
          <img 
            src={currentLogoUrl} 
            alt="Current logo" 
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Error loading logo image:', currentLogoUrl);
              e.currentTarget.style.display = 'none';
            }}
            onLoad={() => {
              console.log('Logo loaded successfully:', currentLogoUrl);
            }}
          />
        </div>
      )}
      
      <div className="flex gap-2">
        <Input
          id="logo-upload"
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={uploading}
          onClick={() => document.getElementById('logo-upload')?.click()}
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        PNG, JPG, WebP ou SVG. Max 5MB.
      </p>
    </div>
  );
}