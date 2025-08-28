import { Instagram, Twitter, Youtube } from "lucide-react"
import Link from "next/link"

import { appInfo } from "@/lib/constants"

export function Footer() {
  return (
    <footer className="bg-card border-border mt-8 border-t">
      <div className="container mx-auto px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <h3 className="text-2xl font-bold text-[#009A9C]">
                {appInfo.name}
              </h3>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {appInfo.description}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Follow us</h4>
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/mymoviebox"
                className="hover:text-foreground transition-colors"
              >
                <Instagram />
              </a>
              <a
                href="https://www.twitter.com/mymoviebox"
                className="hover:text-foreground transition-colors"
              >
                <Twitter />
              </a>
              <a
                href="https://www.youtube.com/mymoviebox"
                className="hover:text-foreground transition-colors"
              >
                <Youtube />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Get in touch</h4>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <a
                  href="mailto:hello@moviebox.com"
                  className="hover:text-foreground transition-colors"
                >
                  We would love to hear from you. Send us a message at
                  hello@moviebox.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-border mt-8 border-t pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
