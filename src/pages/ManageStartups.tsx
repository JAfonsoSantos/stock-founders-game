import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Building2, Trash2, Edit, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { LogoUpload } from "@/components/LogoUpload";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Startup {
  id: string;
  slug: string;
  name: string;
  logo_url?: string;
  description?: string;
  website?: string;
  linkedin?: string;
  total_shares: number;
  primary_shares_remaining: number;
  last_vwap_price?: number;
  created_at: string;
}

export default function ManageStartups() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isScrapingLinkedIn, setIsScrapingLinkedIn] = useState(false);
  const [editingStartup, setEditingStartup] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Startup>>({});
  const [startupToDelete, setStartupToDelete] = useState<Startup | null>(null);
  const [newStartup, setNewStartup] = useState({
    slug: "",
    name: "",
    logo_url: "",
    description: "",
    website: "",
    linkedin: "",
    total_shares: 100
  });

  useEffect(() => {
    if (gameId) {
      fetchStartups();
    }
  }, [gameId]);

  const fetchStartups = async () => {
    try {
      const { data, error } = await supabase
        .from("startups")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStartups(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setNewStartup(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const createStartup = async () => {
    if (!newStartup.name.trim() || !newStartup.slug.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Name and slug are required",
      });
      return;
    }

    try {
      setIsCreating(true);

      const { error } = await supabase
        .from("startups")
        .insert({
          game_id: gameId,
          slug: newStartup.slug,
          name: newStartup.name,
          logo_url: newStartup.logo_url || null,
          description: newStartup.description || null,
          website: newStartup.website || null,
          linkedin: newStartup.linkedin || null,
          total_shares: newStartup.total_shares,
          primary_shares_remaining: newStartup.total_shares
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Startup created successfully",
      });

      // Reset form
      setNewStartup({
        slug: "",
        name: "",
        logo_url: "",
        description: "",
        website: "",
        linkedin: "",
        total_shares: 100
      });

      // Refresh list
      fetchStartups();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAutoFillFromLinkedIn = async () => {
    if (!newStartup.linkedin.trim()) {
      toast({
        variant: "destructive",
        title: "No LinkedIn URL",
        description: "Please enter a LinkedIn URL first",
      });
      return;
    }

    console.log('Starting LinkedIn auto-fill with URL:', newStartup.linkedin);
    setIsScrapingLinkedIn(true);
    
    try {
      console.log('Calling fetch-website edge function...');
      // Use Supabase edge function to fetch LinkedIn content including HTML for logo extraction
      const { data, error } = await supabase.functions.invoke('fetch-website', {
        body: {
          url: newStartup.linkedin,
          formats: 'markdown,html'
        }
      });

      console.log('Fetch-website response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message);
      }

      const content = data.markdown || '';
      const htmlContent = data.html || '';
      
      console.log('LinkedIn data received:', {
        markdownLength: content?.length || 0,
        htmlLength: htmlContent?.length || 0,
        hasMarkdown: !!data.markdown,
        hasHtml: !!data.html,
        fullData: data // Add full data for debugging
      });
      
      // Simple extraction logic for LinkedIn content
      const lines = content.split('\n').filter(line => line.trim());
      
      let extractedName = '';
      let extractedDescription = '';
      let extractedLogoUrl = '';
      let extractedWebsite = '';
      
      // Extract logo from HTML - look for company logo patterns in LinkedIn
      if (htmlContent) {
        console.log('HTML content length:', htmlContent.length);
        console.log('HTML snippet (first 500 chars):', htmlContent.substring(0, 500));
        
        // More comprehensive logo extraction patterns based on LinkedIn API structure
        const logoPatterns = [
          // LinkedIn API specific fields (from structured data)
          /"square-logo-url":\s*"([^"]+)"/i,
          /"squareLogoUrl":\s*"([^"]+)"/i,
          /"logo_url":\s*"([^"]+)"/i,
          /"logoUrl":\s*"([^"]+)"/i,
          
          // LinkedIn specific patterns - updated for current structure
          /img[^>]*class="[^"]*EntityPhoto-square-[^"]*"[^>]*src="([^"]+)"/i,
          /img[^>]*class="[^"]*org-top-card-summary-info-list__logo[^"]*"[^>]*src="([^"]+)"/i,
          /img[^>]*class="[^"]*org-top-card-primary-content__logo[^"]*"[^>]*src="([^"]+)"/i,
          /img[^>]*class="[^"]*company-logo[^"]*"[^>]*src="([^"]+)"/i,
          /img[^>]*class="[^"]*profile-photo-edit__preview[^"]*"[^>]*src="([^"]+)"/i,
          /img[^>]*class="[^"]*org-[^"]*logo[^"]*"[^>]*src="([^"]+)"/i,
          
          // Generic patterns for images that might be logos
          /img[^>]*alt="[^"]*logo[^"]*"[^>]*src="([^"]+)"/i,
          /img[^>]*src="([^"]*)"[^>]*alt="[^"]*logo[^"]*"/i,
          /img[^>]*class="[^"]*logo[^"]*"[^>]*src="([^"]+)"/i,
          /img[^>]*src="([^"]*)"[^>]*class="[^"]*logo[^"]*"/i,
          
          // Media.licdn.com patterns (most reliable for LinkedIn)
          /img[^>]*src="(https:\/\/media\.licdn\.com\/dms\/image\/[A-Z0-9-_]+\/company-logo_[^"]*)"[^>]*/i,
          /src="(https:\/\/media\.licdn\.com\/dms\/image\/[^"]*company[^"]*)"[^>]*/i,
          /img[^>]*src="([^"]*media\.licdn\.com[^"]*)"[^>]*>/i,
          
          // Company specific patterns - look for images with company or organization
          /img[^>]*src="([^"]*company[^"]*)"[^>]*>/i,
          /img[^>]*alt="[^"]*company[^"]*"[^>]*src="([^"]+)"/i,
          /img[^>]*alt="[^"]*organization[^"]*"[^>]*src="([^"]+)"/i,
          
          // Kevel specific (for this case)
          /img[^>]*src="([^"]*)"[^>]*alt="[^"]*Kevel[^"]*"/i,
          /img[^>]*alt="[^"]*Kevel[^"]*"[^>]*src="([^"]+)"/i,
          
          // Fallback patterns for any reasonable image
          /src="(https:\/\/[^"]*\.(?:jpg|jpeg|png|gif|webp|svg))"[^>]*>/i,
          /img[^>]*src="(https:\/\/[^"]*\.(?:jpg|jpeg|png|gif|webp|svg))"/i
        ];
        
        let foundLogos = [];
        for (const pattern of logoPatterns) {
          const matches = htmlContent.matchAll(new RegExp(pattern.source, pattern.flags + 'g'));
          for (const match of matches) {
            if (match[1]) {
              foundLogos.push({
                url: match[1],
                pattern: pattern.source.substring(0, 50) + '...'
              });
            }
          }
        }
        
        console.log('Found potential logos:', foundLogos);
        console.log('HTML content sample (chars 1000-2000):', htmlContent.substring(1000, 2000));
        
        // Select the best logo with priority order
        const priorityOrder = [
          (logo) => logo.url.includes('media.licdn.com') && logo.url.includes('company-logo'),
          (logo) => logo.url.includes('media.licdn.com'),
          (logo) => logo.url.includes('kevel') || logo.url.includes('Kevel'),
          (logo) => logo.url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)
        ];
        
        for (const priorityCheck of priorityOrder) {
          const priorityLogo = foundLogos.find(priorityCheck);
          if (priorityLogo) {
            let logoUrl = priorityLogo.url;
            
            // Clean up the URL
            if (logoUrl.startsWith('//')) {
              logoUrl = 'https:' + logoUrl;
            }
            
            // Fix LinkedIn URLs with HTML entities
            logoUrl = logoUrl.replace(/&amp;/g, '&');
            
            // Skip obviously bad URLs
            if (logoUrl.includes('data:') || 
                logoUrl.includes('blob:') || 
                logoUrl.length < 10 ||
                logoUrl.includes('generic') ||
                logoUrl.includes('default') ||
                logoUrl.includes('icon-') ||
                logoUrl.includes('sprite')) {
              continue;
            }
            
            // Test if the URL is accessible (simple validation)
            try {
              new URL(logoUrl);
              extractedLogoUrl = logoUrl;
              console.log('Selected logo with priority:', logoUrl, 'Pattern:', priorityLogo.pattern);
              break;
            } catch (e) {
              console.log('Invalid logo URL:', logoUrl, e);
              continue;
            }
          }
        }

      // Extract website from HTML and markdown based on LinkedIn API structure
      const websitePatterns = [
        // LinkedIn API specific fields (from structured data)
        /"website-url":\s*"([^"]+)"/i,
        /"websiteUrl":\s*"([^"]+)"/i,
        /"website":\s*"([^"]+)"/i,
        /"companyWebsite":\s*"([^"]+)"/i,
        
        // LinkedIn specific website patterns from HTML
        /href="([^"]*)"[^>]*data-tracking-control-name="organization_website"/i,
        /data-tracking-control-name="organization_website"[^>]*href="([^"]+)"/i,
        /class="[^"]*org-about-us-organization-description__website[^"]*"[^>]*href="([^"]+)"/i,
        
        // Generic website patterns from HTML
        /href="(https?:\/\/[^"]*)"[^>]*>Website<\/a>/i,
        /href="(https?:\/\/[^"]*)"[^>]*>\s*Site\s*<\/a>/i,
        /href="(https?:\/\/[^"]*)"[^>]*>\s*Website\s*<\/a>/i,
        /href="(https?:\/\/[^"]*)"[^>]*>\s*www\./i,
        
        // From markdown - look for website mentions
        /Website:\s*(https?:\/\/[^\s\]]+)/i,
        /Site:\s*(https?:\/\/[^\s\]]+)/i,
        /\[Website\]\((https?:\/\/[^)]+)\)/i,
        /\[Site\]\((https?:\/\/[^)]+)\)/i,
        
        // JSON-LD or structured data
        /"url":\s*"(https?:\/\/[^"]*)"/i,
        
        // Meta tags
        /<meta[^>]*property="og:url"[^>]*content="([^"]+)"/i,
        /<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i,
        
        // Look for kevel.co specifically (for this case)
        /(https?:\/\/(?:www\.)?kevel\.co[^\s\]"]*)/i,
        /(https?:\/\/[^.\s"]*\.(?:com|co|net|org|io)[^\s\]"]*)/i
      ];
        
        let foundWebsites = [];
        
        // Search in both HTML and markdown content
        const contentToSearch = [
          { content: htmlContent, type: 'HTML' },
          { content: content, type: 'Markdown' }
        ];
        
        for (const { content: searchContent, type } of contentToSearch) {
          if (!searchContent) continue;
          
          for (const pattern of websitePatterns) {
            const matches = searchContent.matchAll(new RegExp(pattern.source, pattern.flags + 'g'));
            for (const match of matches) {
              if (match[1]) {
                foundWebsites.push({
                  url: match[1],
                  pattern: pattern.source.substring(0, 50) + '...',
                  source: type
                });
              }
            }
          }
        }
        
        console.log('Found potential websites:', foundWebsites);
        console.log('First 1000 chars of markdown content:', content.substring(0, 1000));
        console.log('Searching for LinkedIn API fields in content...');
        
        // Check for JSON-LD or structured data with LinkedIn API fields
        const jsonLdMatches = htmlContent.match(/<script[^>]*type="application\/ld\+json"[^>]*>([^<]*)<\/script>/gi);
        if (jsonLdMatches) {
          console.log('Found JSON-LD scripts:', jsonLdMatches.length);
          for (const match of jsonLdMatches) {
            try {
              const jsonContent = match.replace(/<[^>]*>/g, '');
              console.log('JSON-LD content sample:', jsonContent.substring(0, 200));
              
              const websiteUrlMatch = jsonContent.match(/"website-url":\s*"([^"]+)"/i) || 
                                    jsonContent.match(/"websiteUrl":\s*"([^"]+)"/i) ||
                                    jsonContent.match(/"website":\s*"([^"]+)"/i);
              if (websiteUrlMatch && !extractedWebsite) {
                const url = websiteUrlMatch[1];
                if (!url.includes('linkedin.com')) {
                  extractedWebsite = url;
                  console.log('Found website from JSON-LD:', url);
                }
              }
              
              const logoUrlMatch = jsonContent.match(/"square-logo-url":\s*"([^"]+)"/i) ||
                                 jsonContent.match(/"squareLogoUrl":\s*"([^"]+)"/i) ||
                                 jsonContent.match(/"logo_url":\s*"([^"]+)"/i);
              if (logoUrlMatch && !extractedLogoUrl) {
                extractedLogoUrl = logoUrlMatch[1];
                console.log('Found logo from JSON-LD:', extractedLogoUrl);
              }
            } catch (e) {
              console.log('Error parsing JSON-LD:', e);
            }
          }
        }
        
        for (const websiteInfo of foundWebsites) {
          let websiteUrl = websiteInfo.url;
          
          console.log('Processing website URL:', websiteUrl, 'from', websiteInfo.source);
          
          // Skip LinkedIn URLs
          if (websiteUrl.includes('linkedin.com')) {
            console.log('Skipping LinkedIn URL:', websiteUrl);
            continue;
          }
          
          // Clean LinkedIn redirect URLs
          if (websiteUrl.includes('/redir/redirect')) {
            const urlMatch = websiteUrl.match(/url=([^&]*)/);
            if (urlMatch) {
              websiteUrl = decodeURIComponent(urlMatch[1]);
            }
          }
          
          // Fix HTML entities
          websiteUrl = websiteUrl.replace(/&amp;/g, '&');
          
          // Validate URL format
          try {
            new URL(websiteUrl);
            extractedWebsite = websiteUrl;
            console.log('Selected website:', websiteUrl);
            break;
          } catch (e) {
            console.log('Invalid website URL:', websiteUrl, e);
            continue;
          }
        }
        
        // If no website found from patterns, try to extract from markdown content directly
        if (!extractedWebsite && content) {
          console.log('Trying to extract website from markdown content...');
          
          // Look for common website patterns in the content
          const directWebsiteMatches = content.match(/(https?:\/\/(?:www\.)?[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,})/g);
          if (directWebsiteMatches) {
            console.log('Direct website matches found:', directWebsiteMatches);
            
            for (const url of directWebsiteMatches) {
              if (!url.includes('linkedin.com') && !url.includes('facebook.com') && !url.includes('twitter.com')) {
                try {
                  new URL(url);
                  extractedWebsite = url;
                  console.log('Selected website from direct match:', url);
                  break;
                } catch (e) {
                  continue;
                }
              }
            }
          }
        }
      }
      
      // Find company name (usually in the first few lines or as a heading)
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i].trim();
        if (line.match(/^#+ /)) {
          extractedName = line.replace(/^#+ /, '').trim();
          break;
        }
        if (line && !line.startsWith('[') && !line.startsWith('http') && line.length < 100 && line.length > 3) {
          extractedName = line;
          break;
        }
      }
      
      // Clean up extracted name - remove "| LinkedIn" suffix
      if (extractedName) {
        extractedName = extractedName.replace(/\s*\|\s*LinkedIn\s*$/i, '').trim();
      }
      
      // Find description (look for longer paragraphs)
      for (const line of lines) {
        if (line.length > 50 && line.length < 500 && !line.startsWith('[') && !line.startsWith('http')) {
          extractedDescription = line.trim();
          break;
        }
      }
      
      if (extractedName || extractedDescription || extractedLogoUrl || extractedWebsite) {
        console.log('Final extracted data:', {
          name: extractedName,
          logoUrl: extractedLogoUrl,
          website: extractedWebsite,
          description: extractedDescription?.substring(0, 100) + '...'
        });
        
        setNewStartup(prev => ({
          ...prev,
          name: extractedName || prev.name,
          slug: extractedName ? generateSlug(extractedName) : prev.slug,
          description: extractedDescription || prev.description,
          website: extractedWebsite || prev.website,
          logo_url: extractedLogoUrl || prev.logo_url
        }));
        
        const extractedItems = [];
        if (extractedName) extractedItems.push('nome');
        if (extractedDescription) extractedItems.push('descrição');
        if (extractedWebsite) extractedItems.push('website');
        if (extractedLogoUrl) extractedItems.push('logo');
        
        toast({
          title: "Sucesso",
          description: `Informações extraídas do LinkedIn: ${extractedItems.join(', ')}`,
        });
      } else {
        console.log('No data extracted from LinkedIn');
        toast({
          variant: "destructive",
          title: "Nenhum dado encontrado",
          description: "Não foi possível extrair informações da startup do LinkedIn. Preencha manualmente.",
        });
      }
    } catch (error: any) {
      console.error('Error in LinkedIn auto-fill:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch LinkedIn data: " + error.message,
      });
    } finally {
      setIsScrapingLinkedIn(false);
    }
  };

  const deleteStartup = async (startupId: string) => {
    try {
      const { error } = await supabase
        .from("startups")
        .delete()
        .eq("id", startupId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Startup deleted successfully",
      });

      fetchStartups();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const confirmDeleteStartup = () => {
    if (startupToDelete) {
      deleteStartup(startupToDelete.id);
      setStartupToDelete(null);
    }
  };

  const startEditing = (startup: Startup) => {
    setEditingStartup(startup.id);
    setEditData({
      name: startup.name,
      slug: startup.slug,
      description: startup.description,
      website: startup.website,
      linkedin: startup.linkedin,
      total_shares: startup.total_shares
    });
  };

  const cancelEditing = () => {
    setEditingStartup(null);
    setEditData({});
  };

  const saveEdit = async (startupId: string) => {
    try {
      const { error } = await supabase
        .from("startups")
        .update(editData)
        .eq("id", startupId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Startup updated successfully",
      });

      setEditingStartup(null);
      setEditData({});
      fetchStartups();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/games/${gameId}/organizer`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Game Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Manage Startups</h1>
            <p className="text-muted-foreground">Add and configure startups for the game</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Add New Startup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Startup
              </CardTitle>
            </CardHeader>
            <CardContent>
                  <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Startup Name</Label>
                    <Input
                      id="name"
                      value={newStartup.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Awesome Startup"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug (URL-friendly)</Label>
                    <Input
                      id="slug"
                      value={newStartup.slug}
                      onChange={(e) => setNewStartup(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="awesome-startup"
                    />
                  </div>
                  <div>
                    <LogoUpload
                      startupSlug={newStartup.slug}
                      currentLogoUrl={newStartup.logo_url}
                      onLogoUploaded={(url) => setNewStartup({ ...newStartup, logo_url: url })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newStartup.description}
                    onChange={(e) => setNewStartup(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the startup..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={newStartup.website}
                      onChange={(e) => setNewStartup(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://startup.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <div className="flex gap-2">
                      <Input
                        id="linkedin"
                        value={newStartup.linkedin}
                        onChange={(e) => setNewStartup(prev => ({ ...prev, linkedin: e.target.value }))}
                        placeholder="https://linkedin.com/company/startup"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAutoFillFromLinkedIn}
                        disabled={isScrapingLinkedIn || !newStartup.linkedin.trim()}
                      >
                        {isScrapingLinkedIn ? "Fetching..." : "Auto-fill"}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="shares">Total Shares</Label>
                    <Input
                      id="shares"
                      type="number"
                      min="1"
                      value={newStartup.total_shares}
                      onChange={(e) => setNewStartup(prev => ({ ...prev, total_shares: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Button onClick={createStartup} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Startup"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Startups List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Startups ({startups.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {startups.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Logo</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Website</TableHead>
                        <TableHead>LinkedIn</TableHead>
                        <TableHead>Total Shares</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>VWAP Price</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {startups.map((startup) => (
                        <TableRow key={startup.id}>
                          <TableCell>
                            {startup.logo_url ? (
                              <img 
                                src={startup.logo_url} 
                                alt={`${startup.name} logo`} 
                                className="w-8 h-8 rounded object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {editingStartup === startup.id ? (
                              <Input
                                value={editData.name || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Startup name"
                              />
                            ) : (
                              startup.name
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {editingStartup === startup.id ? (
                              <Input
                                value={editData.slug || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, slug: e.target.value }))}
                                placeholder="startup-slug"
                              />
                            ) : (
                              startup.slug
                            )}
                          </TableCell>
                          <TableCell>
                            {editingStartup === startup.id ? (
                              <Textarea
                                value={editData.description || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Description..."
                                rows={2}
                                className="min-w-[200px]"
                              />
                            ) : (
                              <div className="max-w-[200px] truncate" title={startup.description || ''}>
                                {startup.description || '-'}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingStartup === startup.id ? (
                              <Input
                                value={editData.website || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, website: e.target.value }))}
                                placeholder="https://website.com"
                              />
                            ) : (
                              startup.website ? (
                                <a 
                                  href={startup.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline truncate block max-w-[150px]"
                                  title={startup.website}
                                >
                                  {startup.website.replace(/^https?:\/\//, '')}
                                </a>
                              ) : '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {editingStartup === startup.id ? (
                              <Input
                                value={editData.linkedin || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, linkedin: e.target.value }))}
                                placeholder="https://linkedin.com/company/..."
                              />
                            ) : (
                              startup.linkedin ? (
                                <a 
                                  href={startup.linkedin} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline truncate block max-w-[150px]"
                                  title={startup.linkedin}
                                >
                                  LinkedIn
                                </a>
                              ) : '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {editingStartup === startup.id ? (
                              <Input
                                type="number"
                                min="1"
                                value={editData.total_shares || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, total_shares: Number(e.target.value) }))}
                              />
                            ) : (
                              startup.total_shares
                            )}
                          </TableCell>
                          <TableCell>{startup.primary_shares_remaining}</TableCell>
                          <TableCell>
                            {startup.last_vwap_price ? `$${startup.last_vwap_price.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {editingStartup === startup.id ? (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => saveEdit(startup.id)}
                                  >
                                    Save
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={cancelEditing}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => startEditing(startup)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setStartupToDelete(startup)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No startups yet. Add the first startup above.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={!!startupToDelete}
        onOpenChange={(open) => !open && setStartupToDelete(null)}
        onConfirm={confirmDeleteStartup}
        title="Delete Startup"
        description={
          startupToDelete
            ? `Are you sure you want to delete "${startupToDelete.name}"? This action cannot be undone.`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}