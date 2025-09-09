import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LinkedInOrganizationResponse {
  id: number;
  vanityName: string;
  localizedName: string;
  localizedWebsite?: string;
  logoV2?: {
    cropped?: string;
    original?: string;
  };
  website?: {
    localized?: {
      [key: string]: string;
    };
  };
  description?: {
    localized?: {
      [key: string]: string;
    };
  };
  localizedDescription?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: user, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user.user) {
      throw new Error('Unauthorized');
    }

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { vanityName } = await req.json();
    
    if (!vanityName) {
      throw new Error('vanityName is required');
    }

    console.log('Looking up LinkedIn organization:', vanityName);

    // Get LinkedIn Access Token from secrets
    const linkedinToken = Deno.env.get('LINKEDIN_ACCESS_TOKEN');
    
    // If no token, fall back to web scraping method
    if (!linkedinToken || linkedinToken.trim() === '' || linkedinToken === 'your-linkedin-access-token-here') {
      console.log('No valid LinkedIn token found, using web scraping fallback');
      
      // Construct LinkedIn company URL
      let linkedinUrl = vanityName;
      if (!vanityName.startsWith('http')) {
        linkedinUrl = `https://www.linkedin.com/company/${vanityName}`;
      }
      
      console.log('Fetching LinkedIn page:', linkedinUrl);
      
      // Fetch the LinkedIn page
      const response = await fetch(linkedinUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch LinkedIn page: ${response.status}`);
      }

      const html = await response.text();
      console.log('LinkedIn page fetched, length:', html.length);

      // Extract company information using regex patterns
      let name = '';
      let website = '';
      let description = '';
      let logoUrl = '';

      // Extract company name from title or h1
      const namePatterns = [
        /<title>([^|]+)\s*\|\s*LinkedIn<\/title>/i,
        /<h1[^>]*>([^<]+)<\/h1>/i,
        /"name":\s*"([^"]+)"/i
      ];

      for (const pattern of namePatterns) {
        const match = html.match(pattern);
        if (match && match[1] && !match[1].includes('LinkedIn')) {
          name = match[1].trim();
          break;
        }
      }

      // Extract website
      const websitePatterns = [
        /href="([^"]*)"[^>]*data-tracking-control-name="organization_website"/i,
        /"website":\s*"([^"]+)"/i,
        /Website[^>]*href="([^"]+)"/i
      ];

      for (const pattern of websitePatterns) {
        const match = html.match(pattern);
        if (match && match[1] && !match[1].includes('linkedin.com')) {
          website = match[1].trim();
          break;
        }
      }

      // Extract description
      const descriptionPatterns = [
        /"description":\s*"([^"]+)"/i,
        /<meta[^>]*name="description"[^>]*content="([^"]+)"/i,
        /<p[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/p>/i
      ];

      for (const pattern of descriptionPatterns) {
        const match = html.match(pattern);
        if (match && match[1] && !match[1].includes('LinkedIn')) {
          description = match[1].trim();
          break;
        }
      }

      // Extract logo
      const logoPatterns = [
        /img[^>]*src="(https:\/\/media\.licdn\.com\/dms\/image\/[^"]*company[^"]*)"[^>]*/i,
        /"logo":\s*"([^"]+)"/i,
        /img[^>]*class="[^"]*logo[^"]*"[^>]*src="([^"]+)"/i
      ];

      for (const pattern of logoPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          logoUrl = match[1].trim();
          break;
        }
      }

      const result = {
        name: name || 'Unknown',
        website: website || '',
        description: description || '',
        logoUrl: logoUrl || '',
        source: 'web_scraping'
      };

      console.log('Extracted data via web scraping:', result);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: result 
        }),
        {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
        },
      );
    }

    // Extract vanityName from LinkedIn URL if full URL is provided
    let cleanVanityName = vanityName;
    if (vanityName.includes('linkedin.com/company/')) {
      const match = vanityName.match(/linkedin\.com\/company\/([^/?]+)/);
      if (match) {
        cleanVanityName = match[1];
      }
    }

    console.log('Clean vanity name:', cleanVanityName);

    // Call LinkedIn Organization Lookup API
    const linkedinUrl = `https://api.linkedin.com/rest/organizations?q=vanityName&vanityName=${encodeURIComponent(cleanVanityName)}`;
    
    console.log('Calling LinkedIn API:', linkedinUrl);

    const linkedinResponse = await fetch(linkedinUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${linkedinToken}`,
        'LinkedIn-Version': '202408',
        'X-RestLi-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
    });

    if (!linkedinResponse.ok) {
      const errorText = await linkedinResponse.text();
      console.error('LinkedIn API Error:', linkedinResponse.status, errorText);
      
      // If API fails, fall back to web scraping
      console.log('API failed, falling back to web scraping');
      const linkedinPageUrl = `https://www.linkedin.com/company/${cleanVanityName}`;
      
      const response = await fetch(linkedinPageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const html = await response.text();
      
      // Simple extraction (similar to above)
      const nameMatch = html.match(/<title>([^|]+)\s*\|\s*LinkedIn<\/title>/i);
      const websiteMatch = html.match(/href="([^"]*)"[^>]*data-tracking-control-name="organization_website"/i);
      
      const result = {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown',
        website: websiteMatch ? websiteMatch[1] : '',
        description: '',
        logoUrl: '',
        source: 'web_scraping_fallback'
      };
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: result 
        }),
        {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
        },
      );
    }

    const linkedinData = await linkedinResponse.json();
    console.log('LinkedIn API Response:', JSON.stringify(linkedinData, null, 2));

    if (!linkedinData.elements || linkedinData.elements.length === 0) {
      throw new Error('Organization not found');
    }

    const organization: LinkedInOrganizationResponse = linkedinData.elements[0];

    // Extract the information we need
    const result = {
      name: organization.localizedName,
      website: organization.localizedWebsite || 
               organization.website?.localized?.en_US ||
               organization.website?.localized?.[Object.keys(organization.website?.localized || {})[0]],
      description: organization.localizedDescription ||
                  organization.description?.localized?.en_US ||
                  organization.description?.localized?.[Object.keys(organization.description?.localized || {})[0]],
      logoUrl: organization.logoV2?.original || organization.logoV2?.cropped,
      vanityName: organization.vanityName,
      id: organization.id,
      source: 'linkedin_api'
    };

    console.log('Extracted organization data:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result 
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    );

  } catch (error) {
    console.error('Error in LinkedIn organization lookup:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: error.message.includes('Unauthorized') ? 401 : 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    );
  }
});