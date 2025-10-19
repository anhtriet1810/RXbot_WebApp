import { type NextRequest, NextResponse } from "next/server"

type Alert = {
  message: string
  type: "Reminder" | "Medicine"
  isEveryday: boolean
  selectedDays: string[]
  hour: string
  minute: string
}

type FormData = {
  name: string
  phone: string
  email: string
  medicalInfo: string
  deviceId: number
  alerts: Alert[]
}

export async function POST(request: NextRequest) {
  try {
    const data: FormData = await request.json()

    // Validate data
    if (!data.name || !data.phone || !data.email || !data.medicalInfo || !data.deviceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (data.deviceId < 1 || data.deviceId > 100) {
      return NextResponse.json({ error: "Device ID must be between 1 and 100" }, { status: 400 })
    }

    if (!data.alerts || data.alerts.length === 0) {
      return NextResponse.json({ error: "At least one alert is required" }, { status: 400 })
    }

    // Format the output according to specifications
    const formattedOutput = formatAlertData(data)

    return NextResponse.json({
      success: true,
      formattedOutput,
    })
  } catch (error) {
    console.error("Error processing alert:", error)
    return NextResponse.json({ error: "Failed to process alert data" }, { status: 500 })
  }
}

function formatAlertData(data: FormData): string {
  const lines: string[] = []

  // Expand alerts based on selected days
  const expandedAlerts: Array<{ type: string; day: string; hour: string; minute: string; message: string }> = []

  data.alerts.forEach((alert) => {
    const type = alert.type === "Reminder" ? "r" : "m"
    const hour = alert.hour.padStart(2, "0")
    const minute = alert.minute.padStart(2, "0")
    const message = alert.message

    // If everyday, create alert for all 7 days
    if (alert.isEveryday) {
      for (let day = 0; day <= 6; day++) {
        expandedAlerts.push({
          type,
          day: day.toString(),
          hour,
          minute,
          message,
        })
      }
    } else {
      // Create alert for each selected day
      alert.selectedDays.forEach((day) => {
        expandedAlerts.push({
          type,
          day,
          hour,
          minute,
          message,
        })
      })
    }
  })

  // Line 1: Total number of expanded alerts
  lines.push(expandedAlerts.length.toString())

  // Lines 2-n: Each expanded alert formatted
  expandedAlerts.forEach((alert) => {
    lines.push(`${alert.type},${alert.day},${alert.hour},${alert.minute},${alert.message}`)
  })

  // Contact info line
  lines.push(`${data.name},${data.phone},${data.email}`)

  // Medical info line
  lines.push(data.medicalInfo)

  // Device ID line
  lines.push(data.deviceId.toString())

  return lines.join("\n")
}
