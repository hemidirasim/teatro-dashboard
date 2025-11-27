import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { SettingsForm } from "@/components/settings-form"
import { prisma } from "@/lib/prisma"

export default async function SettingsPage() {
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
        `) as any[]

        settings = settingsData.reduce((acc: any, setting: any) => {
          acc[setting.key] = setting.value
          return acc
        }, settings)
      }
    }
  } catch (error) {
    console.error("Error fetching settings:", error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Parametrlər</h1>
        <p className="text-muted-foreground">Sayt parametrlərini idarə edin</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Əlaqə və Haqqımızda</CardTitle>
          <CardDescription>Footer-də göstəriləcək məlumatları redaktə edin</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm initialData={settings} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Görünüş</CardTitle>
          <CardDescription>Admin panelin görünüşünü fərdiləşdirin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Tema</p>
              <p className="text-sm text-muted-foreground">Açıq və qaranlıq rejim arasında keçid edin</p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verilənlər Bazası</CardTitle>
          <CardDescription>Cari verilənlər bazası parametrləri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Host:</span> 68.183.173.136
            </p>
            <p className="text-sm">
              <span className="font-medium">Port:</span> 3306
            </p>
            <p className="text-sm">
              <span className="font-medium">Verilənlər Bazası:</span> teatrd_db1
            </p>
            <p className="text-sm">
              <span className="font-medium">Status:</span>{" "}
              <span className="text-green-600">Qoşulub</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



