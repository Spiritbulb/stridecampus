import { useApp } from "@/contexts/AppContext";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";

export default function DesktopFooter () {
    const { user: appUser } = useApp();
const { user, loading: userLoading } = useSupabaseUser(appUser?.email || null);

    return (
      <footer className="hidden md:block bg-card/30 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm">
              {user &&  (
                <a 
                href="/library" 
                className="text-black/70 hover:text-black-800 dark:text-black-800 dark:hover:text-black-200 transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 hover:after:w-full"
              >
                Library
              </a>
              )}
              {user && (
                <a 
                href={`/u/${user?.username}`} 
                className="text-black/70 hover:text-black-800 dark:text-black-800 dark:hover:text-black-200 transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 hover:after:w-full"
              >
                Profile
              </a>
              )}
              {user &&(
                <a 
                href="/referrals" 
                className="text-black/70 hover:text-black-800 dark:text-black-800 dark:hover:text-black-200 transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 hover:after:w-full"
              >
                Tell a friend
              </a>
              )}
              <a 
                href="/about" 
                className="text-black/70 hover:text-black-800 dark:text-black-800 dark:hover:text-black-200 transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 hover:after:w-full"
              >
                About
              </a>
              <a 
                href="/legal" 
                className="text-black/80 hover:text-black-800 dark:text-black-800 dark:hover:text-black-200 transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 hover:after:w-full"
              >
                Legal
              </a>
              <a 
                href="/support" 
                className="text-black/80 hover:text-black-800 dark:text-black-800 dark:hover:text-black-200 transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-current after:transition-all after:duration-300 hover:after:w-full"
              >
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    );
}