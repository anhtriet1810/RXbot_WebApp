"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, Trash2, Download, ArrowLeft, Calendar, Clock, User, Pill, Phone, Mail } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

type StoredDevice = {
  id: string
  timestamp: string
  name: string
  phone: string
  email: string
  medicalInfo: string
  deviceId: number
  alerts: Array<{
    message: string
    type: "Reminder" | "Medicine"
    isEveryday: boolean
    selectedDays: string[]
    hour: string
    minute: string
  }>
  formattedOutput: string
}

export default function DatabasePage() {
  const { toast } = useToast()
  const [devices, setDevices] = useState<StoredDevice[]>([])

  useEffect(() => {
    loadDevices()
  }, [])

  const loadDevices = () => {
    const stored = localStorage.getItem("medicalAlertDevices")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setDevices(parsed)
      } catch (error) {
        console.error("[v0] Error loading devices:", error)
      }
    }
  }

  const deleteDevice = (id: string) => {
    const updated = devices.filter((device) => device.id !== id)
    setDevices(updated)
    localStorage.setItem("medicalAlertDevices", JSON.stringify(updated))
    toast({
      title: "Device Deleted",
      description: "Device configuration has been removed from the database.",
    })
  }

  const downloadDevice = (device: StoredDevice) => {
    const blob = new Blob([device.formattedOutput], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `device-${device.deviceId}-${device.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "File Downloaded",
      description: `Configuration for Device ${device.deviceId} has been downloaded.`,
    })
  }

  const clearAllDevices = () => {
    if (confirm("Are you sure you want to delete all device configurations? This action cannot be undone.")) {
      setDevices([])
      localStorage.removeItem("medicalAlertDevices")
      toast({
        title: "Database Cleared",
        description: "All device configurations have been removed.",
      })
    }
  }

  const getDayLabel = (day: string) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    return days[Number.parseInt(day)] || day
  }

  const getTotalExpandedAlerts = (device: StoredDevice) => {
    let total = 0
    device.alerts.forEach((alert) => {
      if (alert.isEveryday) {
        total += 7
      } else {
        total += alert.selectedDays.length
      }
    })
    return total
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold text-balance">Device Database</h1>
              </div>
              <p className="text-muted-foreground text-pretty">View and manage all stored device configurations</p>
            </div>
            {devices.length > 0 && (
              <Button variant="destructive" onClick={clearAllDevices}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {devices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Database className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Devices Found</h3>
              <p className="text-muted-foreground text-center mb-4">No device configurations have been saved yet.</p>
              <Link href="/">
                <Button>Create First Configuration</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{devices.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {devices.reduce((sum, device) => sum + getTotalExpandedAlerts(device), 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    {devices.length > 0 ? new Date(devices[0].timestamp).toLocaleDateString() : "N/A"}
                  </div>
                </CardContent>
              </Card>
            </div>

            {devices.map((device) => (
              <Card key={device.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Device ID: {device.deviceId}
                        <Badge variant="outline">{getTotalExpandedAlerts(device)} alerts</Badge>
                      </CardTitle>
                      <CardDescription>Created: {new Date(device.timestamp).toLocaleString()}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => downloadDevice(device)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteDevice(device.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Emergency Contact
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span>{device.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{device.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{device.email}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Pill className="h-4 w-4" />
                          Medical Information
                        </h4>
                        <p className="text-sm text-muted-foreground">{device.medicalInfo}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Alerts ({device.alerts.length})
                      </h4>
                      <div className="space-y-3">
                        {device.alerts.map((alert, index) => (
                          <div key={index} className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant={alert.type === "Medicine" ? "default" : "secondary"}>{alert.type}</Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {alert.hour.padStart(2, "0")}:{alert.minute.padStart(2, "0")}
                              </div>
                            </div>
                            <p className="text-sm font-medium">{alert.message}</p>
                            <div className="flex flex-wrap gap-1">
                              {alert.isEveryday ? (
                                <Badge variant="outline" className="text-xs">
                                  Everyday
                                </Badge>
                              ) : (
                                alert.selectedDays.map((day) => (
                                  <Badge key={day} variant="outline" className="text-xs">
                                    {getDayLabel(day)}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Formatted Output</h4>
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all font-mono">
                      {device.formattedOutput}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
