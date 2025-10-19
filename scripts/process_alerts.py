"""
Python backend script to process medical alert data.
This script formats the alert data into the specified string format.
"""

from typing import List, Dict
import json


def format_alert_data(data: Dict) -> str:
    """
    Format alert data into the specified string format.
    Expands alerts based on selected days (everyday or specific days).
    
    Format:
    Line 1: {number of total expanded alerts}
    Lines 2-n: {type},{day},{hour},{minute},{message}
    Second to last: {name},{phone},{email}
    Last: {medical_info}
    Last: {device_id}
    """
    lines = []
    
    # Expand alerts based on selected days
    expanded_alerts = []
    
    for alert in data['alerts']:
        alert_type = 'r' if alert['type'] == 'Reminder' else 'm'
        hour = alert['hour'].zfill(2)  # Pad with zeros
        minute = alert['minute'].zfill(2)  # Pad with zeros
        message = alert['message']
        
        # If everyday, create alert for all 7 days
        if alert.get('isEveryday', False):
            for day in range(7):
                expanded_alerts.append({
                    'type': alert_type,
                    'day': str(day),
                    'hour': hour,
                    'minute': minute,
                    'message': message
                })
        else:
            # Create alert for each selected day
            for day in alert.get('selectedDays', []):
                expanded_alerts.append({
                    'type': alert_type,
                    'day': day,
                    'hour': hour,
                    'minute': minute,
                    'message': message
                })
    
    # Line 1: Total number of expanded alerts
    lines.append(str(len(expanded_alerts)))
    
    # Lines 2-n: Each expanded alert formatted
    for alert in expanded_alerts:
        alert_line = f"{alert['type']},{alert['day']},{alert['hour']},{alert['minute']},{alert['message']}"
        lines.append(alert_line)
    
    # Contact info line
    contact_line = f"{data['name']},{data['phone']},{data['email']}"
    lines.append(contact_line)
    
    # Medical info line
    lines.append(data['medicalInfo'])
    
    # Device ID line
    lines.append(str(data['deviceId']))
    
    return '\n'.join(lines)


def process_alert_file(input_file: str, output_file: str):
    """
    Process alert data from a JSON file and write formatted output.
    
    Args:
        input_file: Path to input JSON file
        output_file: Path to output text file
    """
    try:
        # Read input JSON
        with open(input_file, 'r') as f:
            data = json.load(f)
        
        # Format the data
        formatted_output = format_alert_data(data)
        
        # Write to output file
        with open(output_file, 'w') as f:
            f.write(formatted_output)
        
        print(f"Successfully processed alert data!")
        print(f"Output written to: {output_file}")
        print("\nFormatted Output:")
        print("-" * 50)
        print(formatted_output)
        print("-" * 50)
        
    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found")
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in '{input_file}'")
    except Exception as e:
        print(f"Error processing alert data: {str(e)}")


# Example usage
if __name__ == "__main__":
    # Example data structure with multi-day support
    example_data = {
        "name": "John Doe",
        "phone": "555-123-4567",
        "email": "john@example.com",
        "medicalInfo": "Patient has diabetes, requires insulin monitoring",
        "deviceId": 42,
        "alerts": [
            {
                "message": "Take morning insulin",
                "type": "Medicine",
                "isEveryday": True,
                "selectedDays": [],
                "hour": "8",
                "minute": "0"
            },
            {
                "message": "Check blood sugar",
                "type": "Reminder",
                "isEveryday": False,
                "selectedDays": ["1", "3", "5"],  # Monday, Wednesday, Friday
                "hour": "12",
                "minute": "30"
            },
            {
                "message": "Evening medication",
                "type": "Medicine",
                "isEveryday": False,
                "selectedDays": ["0", "6"],  # Sunday and Saturday
                "hour": "18",
                "minute": "0"
            }
        ]
    }
    
    # Format and print example
    print("Example Output:")
    print("=" * 50)
    formatted = format_alert_data(example_data)
    print(formatted)
    print("=" * 50)
    print(f"\nTotal expanded alerts: {formatted.split(chr(10))[0]}")
    
    # Uncomment to process from file:
    # process_alert_file('input.json', 'output.txt')
