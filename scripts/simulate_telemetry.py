#!/usr/bin/env python3
"""
Smart Energy Monitor - Telemetry Simulation Script
Generates 24 hours of one-minute interval telemetry for 5 devices.
Usage: python3 scripts/simulate_telemetry.py
"""

import requests, random, time, uuid
from datetime import datetime, timedelta

start_of_today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

BASE = "http://localhost:3002/api/telemetry"

# Use our existing device IDs from the seeded database
# dev001: Living Room AC, dev002: Kitchen Fridge, dev003: Bedroom Heater, 
# dev004: Office Lights, dev005: Washing Machine
devices = ["dev001", "dev002", "dev003", "dev004", "dev005"]

# Realistic energy patterns for different device types
device_patterns = {
    "dev001": {"base": 2000, "variance": 500, "name": "AC"},           # High consumption
    "dev002": {"base": 150, "variance": 25, "name": "Fridge"},        # Steady consumption  
    "dev003": {"base": 1500, "variance": 300, "name": "Heater"},      # High consumption
    "dev004": {"base": 75, "variance": 15, "name": "Lights"},         # Low consumption
    "dev005": {"base": 500, "variance": 400, "name": "Washing Machine"} # Variable consumption
}

print(f"🚀 Starting telemetry simulation for {len(devices)} devices...")
print(f"📊 Generating 24 hours of data (1440 readings per device)")
print(f"🎯 Target endpoint: {BASE}")

successful_requests = 0
total_requests = 24 * 60 * len(devices)  # 24 hours * 60 minutes * 5 devices

for t in range(0, 24*60*60, 60):  # one reading per minute for 24h
    ts = (start_of_today + timedelta(seconds=t)).isoformat() + "Z"
    
    for dev in devices:
        pattern = device_patterns[dev]
        
        # Generate realistic energy consumption based on device type
        base_consumption = pattern["base"]
        variance = pattern["variance"]
        
        # Add some time-based patterns (e.g., AC uses more during day)
        hour = (t // 3600) % 24
        if dev == "dev001":  # AC - more usage during day
            time_factor = 1.2 if 8 <= hour <= 20 else 0.8
        elif dev == "dev004":  # Lights - more usage during evening/night
            time_factor = 1.5 if hour <= 7 or hour >= 18 else 0.3
        elif dev == "dev005":  # Washing machine - sporadic usage
            time_factor = random.choice([0, 0, 0, 1.5])  # Mostly off, sometimes on
        else:
            time_factor = 1.0
        
        energy_watts = max(0, base_consumption * time_factor + random.uniform(-variance, variance))
        
        payload = {
            "deviceId": dev,
            "timestamp": ts,
            "energyWatts": round(energy_watts, 2)
        }
        
        try:
            response = requests.post(BASE, json=payload)
            if response.status_code == 201:
                successful_requests += 1
            else:
                print(f"❌ Error for {pattern['name']}: {response.status_code}")
        except Exception as e:
            print(f"❌ Request failed for {pattern['name']}: {e}")
    
    # Progress indicator
    if t % 3600 == 0:  # Every hour
        hours_completed = t // 3600
        print(f"⏰ Hour {hours_completed}/24 completed...")
    
    time.sleep(0.1)

print(f"✅ Simulation complete!")
print(f"📈 Successfully sent {successful_requests}/{total_requests} telemetry readings")
print(f"🎯 You can now test the AI service with queries like:")
print(f"   • 'Which device used the most energy today?'")
print(f"   • 'What was the total energy consumption in the last hour?'")
print(f"   • 'Show me the energy trends for my AC'")

# Test the AI endpoint with a sample query
print(f"\n🤖 Testing AI endpoint...")
try:
    ai_response = requests.post("http://localhost:3003/api/chat/query", 
                               json={"query": "Which device used the most energy today?"})
    if ai_response.status_code == 200:
        result = ai_response.json()
        print(f"✅ AI Response: {result.get('response', 'No response')}")
    else:
        print(f"❌ AI endpoint error: {ai_response.status_code}")
except Exception as e:
    print(f"❌ Could not reach AI service: {e}")
    print(f"💡 Make sure the AI service is running on port 3003") 