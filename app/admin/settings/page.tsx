import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the appearance of the admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database Connection</CardTitle>
          <CardDescription>Current database connection settings</CardDescription>
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
              <span className="font-medium">Database:</span> teatrd_db1
            </p>
            <p className="text-sm">
              <span className="font-medium">Status:</span>{" "}
              <span className="text-green-600">Connected</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



