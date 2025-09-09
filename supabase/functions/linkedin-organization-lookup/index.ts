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
    cropInfo?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
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
  name?: {
    localized?: {
      [key: string]: string;
    };
    preferredLocale?: {
      country: string;
      language: string;
    };
  };
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
    
    if (!linkedinToken || linkedinToken.trim() === '' || linkedinToken === 'your-linkedin-access-token-here') {
      throw new Error('LinkedIn access token not configured. Please add a valid LinkedIn API token.');
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
      
      if (linkedinResponse.status === 401) {
        throw new Error('LinkedIn API authentication failed. Please check your access token.');
      } else if (linkedinResponse.status === 403) {
        throw new Error('LinkedIn API access forbidden. Please check your token permissions.');
      } else if (linkedinResponse.status === 404) {
        throw new Error('Organization not found on LinkedIn.');
      } else {
        throw new Error(`LinkedIn API error: ${linkedinResponse.status} - ${errorText}`);
      }
    }

    const linkedinData = await linkedinResponse.json();
    console.log('LinkedIn API Response:', JSON.stringify(linkedinData, null, 2));

    if (!linkedinData.elements || linkedinData.elements.length === 0) {
      throw new Error('Organization not found on LinkedIn');
    }

    const organization: LinkedInOrganizationResponse = linkedinData.elements[0];

    // Extract the information we need - following the structure from your example
    const name = organization.localizedName || 
                 organization.name?.localized?.en_US ||
                 organization.name?.localized?.[Object.keys(organization.name?.localized || {})[0]];

    const website = organization.localizedWebsite || 
                   organization.website?.localized?.en_US ||
                   organization.website?.localized?.[Object.keys(organization.website?.localized || {})[0]];

    const description = organization.localizedDescription ||
                       organization.description?.localized?.en_US ||
                       organization.description?.localized?.[Object.keys(organization.description?.localized || {})[0]];

    // Handle LinkedIn logoV2 URNs - convert to usable URLs if possible
    let logoUrl = '';
    if (organization.logoV2?.original) {
      const logoUrn = organization.logoV2.original;
      // LinkedIn URNs like "urn:li:digitalmediaAsset:C4D0BAQE6V6rj_w1yVQ" 
      // can be converted to URLs using LinkedIn's image API
      if (logoUrn.startsWith('urn:li:digitalmediaAsset:')) {
        const assetId = logoUrn.replace('urn:li:digitalmediaAsset:', '');
        // LinkedIn public image URL format
        logoUrl = `https://media.licdn.com/dms/image/${assetId}/company-logo_200_200/0/`;
      }
    } else if (organization.logoV2?.cropped) {
      const logoUrn = organization.logoV2.cropped;
      if (logoUrn.startsWith('urn:li:digitalmediaAsset:')) {
        const assetId = logoUrn.replace('urn:li:digitalmediaAsset:', '');
        logoUrl = `https://media.licdn.com/dms/image/${assetId}/company-logo_200_200/0/`;
      }
    }

    const result = {
      name: name || 'Unknown',
      website: website || '',
      description: description || '',
      logoUrl: logoUrl,
      vanityName: organization.vanityName,
      id: organization.id,
      source: 'linkedin_api'
    };

    console.log('Extracted organization data from LinkedIn API:', result);

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