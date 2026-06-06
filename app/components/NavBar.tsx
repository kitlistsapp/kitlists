import { createClient } from "@/lib/supabase/server"
import NavBarClient from "./NavBarClient"

interface NavBarProps {
  backHref?: string
  backLabel?: string
  rightContent?: React.ReactNode
}

export default async function NavBar({ backHref, backLabel, rightContent }: NavBarProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('full_name, company_logo_url').eq('id', user.id).single()
    : { data: null }

  return (
    <NavBarClient
      backHref={backHref}
      backLabel={backLabel}
      rightContent={rightContent}
      isLoggedIn={!!user}
    />
  )
}
