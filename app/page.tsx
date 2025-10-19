"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Bell, User, Pill, Calendar, Download, Usb, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

type Alert = {
  id: string
  message: string
  type: "Reminder" | "Medicine"
  isEveryday: boolean
  selectedDays: string[]
  hour: string
  minute: string
}

export default function MedicalAlertDashboard() {
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [medicalInfo, setMedicalInfo] = useState("")
  const [deviceId, setDeviceId] = useState("")
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [formattedOutput, setFormattedOutput] = useState<string>("")
  const [serialPort, setSerialPort] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)


  const addAlert = () => {
    const newAlert: Alert = {
      id: Math.random().toString(36).substr(2, 9),
      message: "",
      type: "Reminder",
      isEveryday: false,
      selectedDays: [],
      hour: "09",
      minute: "00",
    }
    setAlerts([...alerts, newAlert])
  }

  const removeAlert = (id: string) => {
    setAlerts(alerts.filter((alert) => alert.id !== id))
  }

  const updateAlert = (id: string, field: keyof Alert, value: any) => {
    setAlerts(alerts.map((alert) => (alert.id === id ? { ...alert, [field]: value } : alert)))
  }

  const toggleDay = (alertId: string, day: string) => {
    setAlerts(
      alerts.map((alert) => {
        if (alert.id === alertId) {
          const selectedDays = alert.selectedDays.includes(day)
            ? alert.selectedDays.filter((d) => d !== day)
            : [...alert.selectedDays, day]
          return { ...alert, selectedDays }
        }
        return alert
      }),
    )
  }

  const toggleEveryday = (alertId: string, checked: boolean) => {
    setAlerts(
      alerts.map((alert) => {
        if (alert.id === alertId) {
          return {
            ...alert,
            isEveryday: checked,
            selectedDays: checked ? [] : alert.selectedDays,
          }
        }
        return alert
      }),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !phone || !email || !medicalInfo || !deviceId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const deviceIdNum = Number.parseInt(deviceId)
    if (isNaN(deviceIdNum) || deviceIdNum < 1 || deviceIdNum > 100) {
      toast({
        title: "Invalid Device ID",
        description: "Device ID must be between 1 and 100.",
        variant: "destructive",
      })
      return
    }

    if (alerts.length === 0) {
      toast({
        title: "No Alerts",
        description: "Please add at least one alert.",
        variant: "destructive",
      })
      return
    }

    const invalidAlerts = alerts.filter(
      (alert) => !alert.message.trim() || (!alert.isEveryday && alert.selectedDays.length === 0),
    )
    if (invalidAlerts.length > 0) {
      toast({
        title: "Invalid Alerts",
        description: "All alerts must have a message and at least one day selected.",
        variant: "destructive",
      })
      return
    }

    const formData = {
      name,
      phone,
      email,
      medicalInfo,
      deviceId: deviceIdNum,
      alerts,
    }

    try {
      const response = await fetch("/api/process-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setFormattedOutput(data.formattedOutput)

        const deviceConfig = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          name,
          phone,
          email,
          medicalInfo,
          deviceId: deviceIdNum,
          alerts,
          formattedOutput: data.formattedOutput,
        }

        const stored = localStorage.getItem("medicalAlertDevices")
        const devices = stored ? JSON.parse(stored) : []
        devices.unshift(deviceConfig)
        localStorage.setItem("medicalAlertDevices", JSON.stringify(devices))

        toast({
          title: "Success!",
          description: "Alert configuration has been processed and saved.",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to process alert configuration.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to the server.",
        variant: "destructive",
      })
    }
  }

  const saveToFile = () => {
    if (!formattedOutput) {
      toast({
        title: "No Data",
        description: "Please process the alert configuration first.",
        variant: "destructive",
      })
      return
    }

    const blob = new Blob([formattedOutput], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `medical-alert-${deviceId || "config"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "File Saved",
      description: "Alert configuration has been saved to file.",
    })
  }

  const connectToDevice = async () => {
    if (!("serial" in navigator)) {
      toast({
        title: "Not Supported",
        description: "Web Serial API is not supported in this browser. Please use Chrome, Edge, or Opera.",
        variant: "destructive",
      })
      return
    }

    try {
      const port = await (navigator as any).serial.requestPort({
        filters: [
          { usbVendorId: 0x10c4, usbProductId: 0xea60 }, // CP2102 USB to UART Bridge
        ],
      })

      await port.open({ baudRate: 115200 })
      setSerialPort(port)
      setIsConnected(true)

      toast({
        title: "Connected",
        description: "Successfully connected to CP2102 device.",
      })
    } catch (error) {
      console.error("[v0] Error connecting to device:", error)
      toast({
        title: "Connection Failed",
        description: "Failed to connect to CP2102 device. Make sure it's plugged in.",
        variant: "destructive",
      })
    }
  }

  const disconnectFromDevice = async () => {
    if (serialPort) {
      try {
        await serialPort.close()
        setSerialPort(null)
        setIsConnected(false)

        toast({
          title: "Disconnected",
          description: "Disconnected from CP2102 device.",
        })
      } catch (error) {
        console.error("[v0] Error disconnecting:", error)
      }
    }
  }

  const sendToUART = async () => {
    if (!formattedOutput) return console.error("No data to send")
    if (!serialPort || !isConnected) return console.error("Serial not connected")

    try {
      const writer = serialPort.writable?.getWriter()
      if (!writer) throw new Error("Cannot get writer")

      const encoder = new TextEncoder()
      const data = encoder.encode(formattedOutput + "\n")

      console.log("[UART] Sending data...")
      await writer.write(data)
      writer.releaseLock()
      console.log(`[UART] Data written (${data.length} bytes), waiting for ACK...`)
    } catch (err: any) {
      console.error("[UART] Error sending data:", err)
    }
  }


  const daysOfWeek = [
    { value: "0", label: "Sun" },
    { value: "1", label: "Mon" },
    { value: "2", label: "Tue" },
    { value: "3", label: "Wed" },
    { value: "4", label: "Thu" },
    { value: "5", label: "Fri" },
    { value: "6", label: "Sat" },
  ]

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-balance">Medical Alert Dashboard</h1>
          </div>
          <p className="text-muted-foreground text-pretty">Configure patient information and medication reminders</p>
          <div className="mt-4">
            <Link href="/database">
              <Button variant="outline" size="sm">
                <Database className="mr-2 h-4 w-4" />
                View All Devices
              </Button>
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Emergency Contact Details
              </CardTitle>
              <CardDescription>Emergency contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="555-123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Medical Information
              </CardTitle>
              <CardDescription>Patient medical notes and conditions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="medicalInfo">Medical Notes *</Label>
                <Textarea
                  id="medicalInfo"
                  placeholder="Enter medical information, conditions, or special instructions..."
                  value={medicalInfo}
                  onChange={(e) => setMedicalInfo(e.target.value)}
                  rows={4}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Alert Schedule
              </CardTitle>
              <CardDescription>Configure medication and reminder alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {alerts.map((alert, index) => (
                <div key={alert.id} className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Alert {index + 1}</h4>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeAlert(alert.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`message-${alert.id}`}>Message *</Label>
                    <Input
                      id={`message-${alert.id}`}
                      placeholder="Take medication / Reminder message"
                      value={alert.message}
                      onChange={(e) => updateAlert(alert.id, "message", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`type-${alert.id}`}>Alert Type *</Label>
                    <Select value={alert.type} onValueChange={(value) => updateAlert(alert.id, "type", value)}>
                      <SelectTrigger id={`type-${alert.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Reminder">Reminder</SelectItem>
                        <SelectItem value="Medicine">Medicine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Days of Week *</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`everyday-${alert.id}`}
                        checked={alert.isEveryday}
                        onCheckedChange={(checked) => toggleEveryday(alert.id, checked as boolean)}
                      />
                      <label
                        htmlFor={`everyday-${alert.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Everyday
                      </label>
                    </div>

                    {!alert.isEveryday && (
                      <div className="flex flex-wrap gap-2">
                        {daysOfWeek.map((day) => (
                          <div key={day.value} className="flex items-center">
                            <Button
                              type="button"
                              variant={alert.selectedDays.includes(day.value) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleDay(alert.id, day.value)}
                              className="w-14"
                            >
                              {day.label}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {alert.isEveryday && (
                      <p className="text-xs text-muted-foreground">Alert will trigger every day of the week</p>
                    )}
                  </div>

                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`hour-${alert.id}`}>Hour (0-23) *</Label>
                      <Input
                        id={`hour-${alert.id}`}
                        type="number"
                        min="0"
                        max="23"
                        value={alert.hour}
                        onChange={(e) => updateAlert(alert.id, "hour", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`minute-${alert.id}`}>Minute (0-59) *</Label>
                      <Input
                        id={`minute-${alert.id}`}
                        type="number"
                        min="0"
                        max="59"
                        value={alert.minute}
                        onChange={(e) => updateAlert(alert.id, "minute", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addAlert} className="w-full bg-transparent">
                <Plus className="mr-2 h-4 w-4" />
                Add Alert
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Device Configuration</CardTitle>
              <CardDescription>Assign device identifier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="deviceId">Device ID (1-100) *</Label>
                <Input
                  id="deviceId"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="1"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full">
            Process Alert Configuration
          </Button>
        </form>

        {formattedOutput && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Export & Transmit</CardTitle>
              <CardDescription>Save configuration to file or send to device</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <Label className="text-sm font-medium mb-2 block">Formatted Output:</Label>
                <pre className="text-xs whitespace-pre-wrap break-all font-mono">{formattedOutput}</pre>
              </div>

              <div className="flex flex-col gap-3">
                <Button type="button" onClick={saveToFile} variant="outline" className="w-full bg-transparent">
                  <Download className="mr-2 h-4 w-4" />
                  Save to Text File
                </Button>

                <div className="border-t pt-3">
                  <Label className="text-sm font-medium mb-3 block">CP2102 UART Transmission</Label>
                  <div className="flex flex-col gap-2">
                    {!isConnected ? (
                      <Button
                        type="button"
                        onClick={connectToDevice}
                        variant="outline"
                        className="w-full bg-transparent"
                      >
                        <Usb className="mr-2 h-4 w-4" />
                        Detect & Connect to CP2102
                      </Button>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          Connected to CP2102 device
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button type="button" onClick={sendToUART} className="w-full">
                            <Usb className="mr-2 h-4 w-4" />
                            Send to UART
                          </Button>
                          <Button
                            type="button"
                            onClick={disconnectFromDevice}
                            variant="outline"
                            className="w-full bg-transparent"
                          >
                            Disconnect
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
