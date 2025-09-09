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
    if (!linkedinToken) {
      throw new Error('LinkedIn access token not configured');
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
      throw new Error(`LinkedIn API error: ${linkedinResponse.status} - ${errorText}`);
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
      id: organization.id
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