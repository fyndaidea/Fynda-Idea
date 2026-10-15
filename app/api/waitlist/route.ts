import { joinWaitlist } from "@/lib/db/waitlist-db";
import { createClient } from "@/lib/supabase/server";
import { canUseAuthSession } from "@/lib/auth/social-login";
import { createWaitlistHandler } from "@/lib/access/waitlist-signup";
import { allowGuestWaitlist } from "@/lib/auth/captcha-server";

export const dynamic = "force-dynamic";

export const POST = createWaitlistHandler({
  async getAccountEmail() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user || !(await canUseAuthSession(supabase, user))) return null;
    return user.email;
  },
  allowGuest: allowGuestWaitlist,
  joinWaitlist,
});
