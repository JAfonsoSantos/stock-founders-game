-- Update the handle_new_user function to better handle Google OAuth data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  -- Extract names from Google OAuth or other providers
  DECLARE
    first_name_val text;
    last_name_val text;
    email_val text;
    avatar_url_val text;
  BEGIN
    -- Try to get first_name from various possible fields
    first_name_val := COALESCE(
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'given_name',
      CASE 
        WHEN NEW.raw_user_meta_data ->> 'full_name' IS NOT NULL THEN
          split_part(NEW.raw_user_meta_data ->> 'full_name', ' ', 1)
        ELSE NULL
      END,
      CASE 
        WHEN NEW.raw_user_meta_data ->> 'name' IS NOT NULL THEN
          split_part(NEW.raw_user_meta_data ->> 'name', ' ', 1)
        ELSE NULL
      END
    );

    -- Try to get last_name from various possible fields
    last_name_val := COALESCE(
      NEW.raw_user_meta_data ->> 'last_name',
      NEW.raw_user_meta_data ->> 'family_name',
      CASE 
        WHEN NEW.raw_user_meta_data ->> 'full_name' IS NOT NULL AND 
             array_length(string_to_array(NEW.raw_user_meta_data ->> 'full_name', ' '), 1) > 1 THEN
          array_to_string(
            (string_to_array(NEW.raw_user_meta_data ->> 'full_name', ' '))[2:], 
            ' '
          )
        ELSE NULL
      END,
      CASE 
        WHEN NEW.raw_user_meta_data ->> 'name' IS NOT NULL AND 
             array_length(string_to_array(NEW.raw_user_meta_data ->> 'name', ' '), 1) > 1 THEN
          array_to_string(
            (string_to_array(NEW.raw_user_meta_data ->> 'name', ' '))[2:], 
            ' '
          )
        ELSE NULL
      END
    );

    -- Get email (prefer verified email)
    email_val := COALESCE(
      NEW.email,
      NEW.raw_user_meta_data ->> 'email'
    );

    -- Get avatar URL
    avatar_url_val := COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.raw_user_meta_data ->> 'picture'
    );

    -- Insert or update user profile
    INSERT INTO public.users (id, first_name, last_name, email, avatar_url)
    VALUES (NEW.id, first_name_val, last_name_val, email_val, avatar_url_val)
    ON CONFLICT (id) 
    DO UPDATE SET
      first_name = COALESCE(EXCLUDED.first_name, users.first_name),
      last_name = COALESCE(EXCLUDED.last_name, users.last_name),
      email = COALESCE(EXCLUDED.email, users.email),
      avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
      updated_at = now();

    RETURN NEW;
  END;
END;
$$;