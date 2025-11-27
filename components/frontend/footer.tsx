import Link from "next/link"
import { prisma } from "@/lib/prisma"

export async function Footer() {
  let settings: any = {
    about_text: "Mədəniyyət portalı - ən son xəbərlər, məqalələr və mədəni tədbirlər haqqında məlumat.",
    email: "info@teatro.az",
    phone: "+994 12 123 45 67",
    address: "",
    copyright: "Teatro"
  }

  try {
    // Check if settings table exists
    const tables = await prisma.$queryRawUnsafe(`
      SHOW TABLES LIKE 'settings'
    `) as any[]

    if (tables.length > 0) {
      // Check if value column exists
      const columns = await prisma.$queryRawUnsafe(`
        SHOW COLUMNS FROM \`settings\` LIKE 'value'
      `) as any[]

      if (columns.length > 0) {
        const settingsData = await prisma.$queryRawUnsafe(`
          SELECT \`settings_key\` as \`key\`, \`value\` FROM \`settings\`
          WHERE \`settings_key\` IN ('about_text', 'email', 'phone', 'address', 'copyright', 'qisa-melumat', 'email-unvan', 'telefon-nomre', 'sirket-unvani')
        `) as any[]

        // Map old keys to new keys
        const keyMap: Record<string, string> = {
          'qisa-melumat': 'about_text',
          'email-unvan': 'email',
          'telefon-nomre': 'phone',
          'sirket-unvani': 'address'
        }

        settingsData.forEach((setting: any) => {
          const key = keyMap[setting.key] || setting.key
          if (setting.value) {
            settings[key] = setting.value
          }
        })
      }
    }
  } catch (error) {
    console.error("Error fetching settings:", error)
  }

  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Teatro</h3>
            <p className="text-sm text-muted-foreground">
              {settings.about_text || "Mədəniyyət portalı - ən son xəbərlər, məqalələr və mədəni tədbirlər haqqında məlumat."}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Sürətli Keçidlər</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary">
                  Ana Səhifə
                </Link>
              </li>
              <li>
                <Link href="/xeberler" className="text-muted-foreground hover:text-primary">
                  Xəbərlər
                </Link>
              </li>
              <li>
                <Link href="/muellifler" className="text-muted-foreground hover:text-primary">
                  Müəlliflər
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4">Kateqoriyalar</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/xeberler?category=1" className="text-muted-foreground hover:text-primary">
                  Mədəniyyət
                </Link>
              </li>
              <li>
                <Link href="/xeberler?category=2" className="text-muted-foreground hover:text-primary">
                  Sənət
                </Link>
              </li>
              <li>
                <Link href="/xeberler?category=3" className="text-muted-foreground hover:text-primary">
                  Tədbirlər
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Əlaqə</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {settings.email && (
                <li>Email: {settings.email}</li>
              )}
              {settings.phone && (
                <li>Telefon: {settings.phone}</li>
              )}
              {settings.address && (
                <li>Ünvan: {settings.address}</li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {settings.copyright || "Teatro"}. Bütün hüquqlar qorunur.</p>
        </div>
      </div>
    </footer>
  )
}

