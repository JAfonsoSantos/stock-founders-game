import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building, Lightbulb, Rocket } from "lucide-react";
import { toast } from "sonner";
import { LogoUpload } from "@/components/LogoUpload";

export default function CreateVenture() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    website: "",
    linkedin: "",
    logo_url: ""
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (url: string) => {
    setFormData(prev => ({ ...prev, logo_url: url }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name || !formData.type) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const slug = generateSlug(formData.name);
      
      // Create the venture idea record
      const { data: venture, error: ventureError } = await supabase
        .from('venture_ideas')
        .insert({
          name: formData.name,
          slug: slug,
          description: formData.description,
          type: formData.type,
          website: formData.website,
          linkedin: formData.linkedin,
          logo_url: formData.logo_url,
          user_id: user.id
        })
        .select()
        .single();

      if (ventureError) throw ventureError;

      toast.success("Venture created successfully!");
      navigate('/my-ventures');
    } catch (error) {
      console.error('Error creating venture:', error);
      toast.error("Failed to create venture. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const ventureTypes = [
    { value: 'startup', label: 'Startup', icon: Building },
    { value: 'idea', label: 'Idea', icon: Lightbulb },
    { value: 'project', label: 'Project', icon: Rocket }
  ];

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/my-ventures')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Ventures
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Venture</h1>
          <p className="text-muted-foreground">
            Create your startup, idea, or project
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Venture Details</CardTitle>
          <CardDescription>
            Fill in the information about your venture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Venture Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter venture name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select venture type" />
                </SelectTrigger>
                <SelectContent>
                  {ventureTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your venture..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="space-y-4">
                {formData.logo_url && (
                  <div className="w-24 h-24 rounded border overflow-hidden bg-muted">
                    <img 
                      src={formData.logo_url} 
                      alt="Current logo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Simple file upload - for demo purposes
                      // In production, you'd upload to storage and get URL
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        handleLogoUpload(e.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WebP ou SVG. Max 5MB.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/company/..."
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/my-ventures')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.name || !formData.type}
                className="flex-1"
              >
                {loading ? "Creating..." : "Create Venture"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}