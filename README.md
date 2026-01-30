# ha-ws-js-sugar - Home Assistant WebSocket Sugar

A lightweight TypeScript library that provides syntactic sugar and type-safe wrappers around [home-assistant-js-websocket](https://github.com/home-assistant/home-assistant-js-websocket). Simplify Home Assistant automation and integrations with intuitive entity classes and a clean API.

> [!WARNING]  
> This package is a WIP.
> Please don't use in production yet.

## Features

- 🎯 **Type-safe** - Full TypeScript support with inferred entity types
- 🧠 **Smart caching** - Automatic entity registry with state synchronization
- 🔌 **Real-time updates** - Reactive state changes through subscriptions
- 🏠 **Domain support** - Pre-built classes for 15+ Home Assistant domains
- ⚡ **Easy setup** - Minimal configuration to get started
- 🎨 **Rich controls** - Advanced parameters for lights, climate, covers, and more

## Installation

```bash
npm install ha-ws-js-sugar
# or
pnpm add ha-ws-js-sugar
# or
yarn add ha-ws-js-sugar
```

## Quick Start

```typescript
import { createConnection } from "ha-ws-js-sugar";

// Create a connection
const connection = await createConnection({
  host: "http://192.168.1.100:8123",
  token: "your_long_lived_access_token",
});

// Get an entity and interact with it
const light = await connection.getEntity("light.living_room");
light?.turnOn();

// Subscribe to state changes
light?.addListener((newState, oldState) => {
  console.log(`Light changed from ${oldState} to ${newState}`);
});
```

## API Reference

### Connection

The main interface for interacting with Home Assistant via WebSocket.

#### `createConnection(options)`

Creates a new connection to Home Assistant.

**Parameters:**
- `options.host` (string) - The URL of your Home Assistant instance
- `options.token` (string) - A long-lived access token
- `options.domains?` (DomainEntityClass[]) - Optional custom domain classes

**Returns:** Promise<Connection>

```typescript
const connection = await createConnection({
  host: "http://192.168.1.100:8123",
  token: "your_long_lived_access_token",
});
```

#### `connection.getEntity(entityId)`

Retrieves an entity by its ID. Returns a typed entity instance based on the domain.

**Parameters:**
- `entityId` (string) - The entity ID in format `domain.name`

**Returns:** Promise<Entity | undefined>

```typescript
const light = await connection.getEntity("light.living_room");
const sensor = await connection.getEntity("sensor.temperature");
const binary = await connection.getEntity("binary_sensor.motion");
```

#### `entity.addListener(callback, options?)`

Subscribes to state changes for an entity.

**Parameters:**
- `callback` (Function) - Called with `(newState, oldState)`
- `options?.stateOnly?` (boolean) - Only fire on state changes, not attribute updates

**Returns:** Function - Call to unsubscribe

```typescript
const unsubscribe = entity.addListener((newState, oldState) => {
  console.log(`Changed from ${oldState} to ${newState}`);
});

// Later, unsubscribe
unsubscribe();
```

### Domain-Specific Classes

#### Light

Control lights with advanced options.

**Methods:**
- `turnOn(params?)` - Turn on the light with optional parameters
- `turnOff()` - Turn off the light
- `toggle(params?)` - Toggle the light

**Parameters (turnOn/toggle):**
```typescript
interface LightParams {
  transition?: number;                    // Transition time in seconds
  flash?: "short" | "long";               // Flash effect
  effect?: string;                        // Effect name
  brightness?: number;                    // Brightness 0-255
  brightnessPercent?: number;             // Brightness 0-100
  brightnessStep?: number;                // Step brightness by value
  brightnessStepPercent?: number;         // Step brightness by percentage
  hsColor?: [number, number];             // Hue (0-360) and saturation (0-100)
  xyColor?: [number, number];             // CIE 1931 color coordinates
  rgbColor?: [number, number, number];    // RGB color (0-255)
  rgbwColor?: [number, number, number, number];      // RGBW color
  rgbwwColor?: [number, number, number, number, number]; // RGBWW color
  colorTempKelvin?: number;               // Color temperature in Kelvin
  colorName?: string;                     // Named color
  white?: boolean;                        // Set to white
}
```

**Properties:**
- `state: "on" | "off"` - Current light state
- `brightness?: number` - Current brightness (0-255)
- `colorMode?: string` - Current color mode
- `hsColor?: [number, number]` - Current HS color
- `rgbColor?: [number, number, number]` - Current RGB color

**Example:**
```typescript
const light = await connection.getEntity("light.living_room");

// Simple on/off
light?.turnOn();
light?.turnOff();

// With parameters
light?.turnOn({
  brightness: 128,
  hsColor: [220, 100],
  transition: 2,
});

// Toggle with parameters
light?.toggle({
  brightnessPercent: 50,
  colorTempKelvin: 3000,
});
```

#### Switch

Toggle-able switch devices.

**Methods:**
- `turnOn()` - Turn on the switch
- `turnOff()` - Turn off the switch
- `toggle()` - Toggle the switch

**Properties:**
- `state: "on" | "off"` - Current switch state

```typescript
const outlet = await connection.getEntity("switch.coffee_maker");
outlet?.turnOn();
outlet?.turnOff();
outlet?.toggle();
```

#### BinarySensor

Read-only sensors with on/off state.

**Properties:**
- `state: "on" | "off"` - Current sensor state

```typescript
const motion = await connection.getEntity("binary_sensor.motion");
if (motion?.state === "on") {
  console.log("Motion detected!");
}
```

#### InputBoolean

Toggleable input helpers.

**Methods:**
- `turnOn()` - Set to on
- `turnOff()` - Set to off
- `toggle()` - Toggle the value

**Properties:**
- `state: "on" | "off"` - Current value

```typescript
const flag = await connection.getEntity("input_boolean.away_mode");
flag?.toggle();
```

#### Sensor

Read-only numeric or string sensors.

**Properties:**
- `state: string | number` - Current sensor value

```typescript
const temp = await connection.getEntity("sensor.temperature");
console.log(temp?.state); // Temperature value
```

#### Climate

Thermostat and HVAC control.

**Properties:**
- `state: ClimateHVACState` - Current action (heating, cooling, idle, etc.)
- `currentTemperature: number` - Current room temperature
- `targetTemperature: number` - Target setpoint
- `targetTemperatureHigh?: number` - Target high temperature (heat_cool mode)
- `targetTemperatureLow?: number` - Target low temperature (heat_cool mode)
- `hvacMode: ClimateHVACMode` - Current mode (heat, cool, heat_cool, auto, off, fan_only)
- `hvacModes: ClimateHVACMode[]` - Available modes
- `fanMode?: ClimateFanMode` - Current fan mode
- `fanModes?: ClimateFanMode[]` - Available fan modes
- `presetMode?: string` - Current preset mode
- `swingMode?: string` - Current swing mode

**Methods:**
- `setTemperature(temperature)` - Set target temperature
- `setMode(mode)` - Set HVAC mode
- `setFanMode(mode)` - Set fan mode
- `setPresetMode(mode)` - Set preset mode

**Modes:**
```typescript
export const ClimateHVACModes = {
  OFF: "off",
  HEAT: "heat",
  COOL: "cool",
  HEAT_COOL: "heat_cool",
  AUTO: "auto",
  FAN_ONLY: "fan_only",
} as const;

export const ClimateFanModes = {
  ON: "on",
  OFF: "off",
  AUTO: "auto",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  // ... and more
} as const;
```

```typescript
const thermostat = await connection.getEntity("climate.living_room");
await thermostat?.setTemperature(72);
await thermostat?.setMode("heat");
```

#### Cover

Blinds, garage doors, and other covers.

**Properties:**
- `state: "open" | "opening" | "closed" | "closing"` - Current state
- `isOpen: boolean` - Whether the cover is open
- `isClosed: boolean` - Whether the cover is closed
- `position?: number` - Position percentage (0-100)
- `tiltPosition?: number` - Tilt position (0-100)

**Methods:**
- `open()` - Open the cover
- `close()` - Close the cover
- `stop()` - Stop the cover movement
- `setPosition(position)` - Set position percentage (0-100)
- `setTiltPosition(position)` - Set tilt position (0-100)
- `toggle()` - Toggle open/close

```typescript
const blinds = await connection.getEntity("cover.living_room_blinds");
blinds?.setPosition(50);
blinds?.open();
blinds?.close();
```

#### MediaPlayer

Audio/video playback control.

**Properties:**
- `state: string` - Current state (playing, paused, idle, off, etc.)
- `isPlaying: boolean` - Whether playback is active
- `volume?: number` - Current volume (0-1)
- `isMuted?: boolean` - Whether audio is muted
- `currentTrack?: string` - Current media name
- `mediaTitle?: string` - Media title
- `mediaArtist?: string` - Media artist
- `mediaDuration?: number` - Duration in seconds

**Methods:**
- `play()` - Start playback
- `pause()` - Pause playback
- `stop()` - Stop playback
- `setVolume(level)` - Set volume (0-1)
- `mute()` - Mute audio
- `unmute()` - Unmute audio
- `next()` - Next track
- `previous()` - Previous track

```typescript
const speaker = await connection.getEntity("media_player.living_room");
speaker?.play();
speaker?.setVolume(0.5);
speaker?.pause();
```

#### DeviceTracker

Track device location.

**Properties:**
- `state: "home" | "not_home" | string` - Current location
- `isHome: boolean` - Whether device is home
- `isNotHome: boolean` - Whether device is away
- `sourceType?: string` - Source of tracking data
- `batteryLevel?: number` - Battery percentage
- `isConnected?: boolean` - Whether device is connected

```typescript
const phone = await connection.getEntity("device_tracker.my_phone");
if (phone?.isHome) {
  console.log("Device is home");
}
```

#### Button

Momentary action triggers.

**Methods:**
- `press()` - Press the button

```typescript
const button = await connection.getEntity("button.restart");
button?.press();
```

#### InputNumber

Numeric input helpers.

**Properties:**
- `state: number` - Current value
- `min: number` - Minimum value
- `max: number` - Maximum value
- `step: number` - Step size
- `unit?: string` - Unit of measurement

**Methods:**
- `setValue(value)` - Set the value
- `increment()` - Increment by step
- `decrement()` - Decrement by step

```typescript
const slider = await connection.getEntity("input_number.brightness");
slider?.setValue(75);
```

#### InputSelect

Dropdown/select input helpers.

**Properties:**
- `state: string` - Current selected option
- `options: string[]` - Available options

**Methods:**
- `select(option)` - Select an option

```typescript
const select = await connection.getEntity("input_select.scene");
select?.select("movie");
```

#### InputText

Text input helpers.

**Properties:**
- `state: string` - Current text value

**Methods:**
- `setValue(text)` - Set the text value

```typescript
const input = await connection.getEntity("input_text.custom_text");
input?.setValue("new value");
```

#### InputDateTime

Date and time input helpers.

**Properties:**
- `state: Date | string` - Current date/time value

**Methods:**
- `setDateTime(date)` - Set date and time

```typescript
const datetime = await connection.getEntity("input_datetime.alarm_time");
datetime?.setDateTime(new Date("2024-01-27T08:00:00"));
```

#### InputButton

Button input helper (single press action).

**Methods:**
- `press()` - Press the button

```typescript
const button = await connection.getEntity("input_button.my_button");
button?.press();
```

#### Lock

Door locks and security devices.

**Properties:**
- `state: "locked" | "unlocked"` - Current lock state
- `isLocked: boolean` - Whether the lock is locked

**Methods:**
- `lock(code?)` - Lock the door
- `unlock(code?)` - Unlock the door

```typescript
const lock = await connection.getEntity("lock.front_door");
lock?.unlock("1234");
lock?.lock();
```

#### Alarm

Alarm control panel.

**Properties:**
- `state: string` - Arm status (armed_home, armed_away, disarmed, etc.)
- `codeFmt?: string` - Code format requirements

**Methods:**
- `arm(mode?, code?)` - Arm the alarm
- `disarm(code?)` - Disarm the alarm

```typescript
const alarm = await connection.getEntity("alarm_control_panel.home");
alarm?.arm("armed_away");
alarm?.disarm("1234");
```

#### WaterHeater

Water heater control.

**Properties:**
- `state: string` - Current state
- `targetTemperature: number` - Target water temperature
- `currentTemperature?: number` - Current temperature
- `currentOperation?: string` - Current operation

**Methods:**
- `setTemperature(temperature)` - Set target temperature
- `setOperationMode(mode)` - Set operation mode

```typescript
const heater = await connection.getEntity("water_heater.bathroom");
heater?.setTemperature(120);
```

### Entity Base Class

All entities inherit from the `Entity` base class with these common properties:

**Properties:**
- `id: string` - The entity ID (e.g., "light.living_room")
- `state: StateType | "unknown" | "unavailable"` - Current state
- `lastChanged: Date` - When the state last changed
- `lastUpdated: Date` - When the entity was last updated
- `context: Context` - Home Assistant context information
- `rawEntity: HassEntity` - Raw entity data

**Methods:**
- `addListener(callback, options?)` - Subscribe to state changes
- `removeListener(callback)` - Unsubscribe from state changes

### Constants and Types

#### States

Common state values across Home Assistant:

```typescript
export enum State {
  ON = "on",
  OFF = "off",
  HOME = "home",
  NOT_HOME = "not_home",
  UNKNOWN = "unknown",
  UNAVAILABLE = "unavailable",
  OPEN = "open",
  OPENING = "opening",
  CLOSED = "closed",
  CLOSING = "closing",
  LOCKED = "locked",
  UNLOCKED = "unlocked",
  PLAYING = "playing",
  PAUSED = "paused",
  IDLE = "idle",
  STANDBY = "standby",
}
```

#### Light

```typescript
export const LightFeatures = {
  EFFECT: 4,
  FLASH: 8,
  TRANSITION: 32,
} as const;

export const LightColorModes = {
  UNKNOWN: "unknown",
  ONOFF: "onoff",
  BRIGHTNESS: "brightness",
  COLOR_TEMP: "color_temp",
  HS: "hs",
  XY: "xy",
  RGB: "rgb",
  RGBW: "rgbw",
  RGBWW: "rgbww",
  WHITE: "white",
} as const;
```

#### Climate

```typescript
export const ClimateHVACModes = {
  OFF: "off",
  HEAT: "heat",
  COOL: "cool",
  HEAT_COOL: "heat_cool",
  AUTO: "auto",
  FAN_ONLY: "fan_only",
} as const;

export const ClimateHVACStates = {
  COOLING: "cooling",
  HEATING: "heating",
  IDLE: "idle",
  OFF: "off",
  // ... more states
} as const;

export const ClimateFeatures = {
  TARGET_TEMPERATURE: 1,
  TARGET_TEMPERATURE_RANGE: 2,
  TARGET_HUMIDITY: 4,
  FAN_MODE: 8,
  PRESET_MODE: 16,
  SWING_MODE: 32,
  TURN_OFF: 128,
  TURN_ON: 256,
} as const;
```

## Examples

### Automating Lights Based on Motion

```typescript
import { createConnection } from "ha-ws-js-sugar";

const connection = await createConnection({
  host: "http://192.168.1.100:8123",
  token: "your_token",
});

const motionSensor = await connection.getEntity("binary_sensor.motion");
const light = await connection.getEntity("light.living_room");

const unsubscribe = motionSensor?.addListener((newState) => {
  if (newState === "on") {
    light?.turnOn({ brightness: 200 });
  } else {
    light?.turnOff();
  }
});
```

### Controlling Multiple Lights

```typescript
const lights = await Promise.all([
  connection.getEntity("light.living_room"),
  connection.getEntity("light.bedroom"),
  connection.getEntity("light.kitchen"),
]);

lights.forEach((light) => {
  light?.turnOn({
    brightness: 150,
    hsColor: [220, 100],
    transition: 1,
  });
});
```

### Reactive Temperature Control

```typescript
const thermostat = await connection.getEntity("climate.living_room");
const tempSensor = await connection.getEntity("sensor.indoor_temp");

tempSensor?.addListener((currentTemp) => {
  const target = parseFloat(currentTemp as string);
  if (target < 68) {
    thermostat?.setMode("heat");
  } else if (target > 75) {
    thermostat?.setMode("cool");
  }
});
```

### Smart Home Scene with Blinds and Lighting

```typescript
async function movieTime() {
  const blinds = await connection.getEntity("cover.living_room_blinds");
  const light = await connection.getEntity("light.living_room");
  const speaker = await connection.getEntity("media_player.living_room");

  blinds?.close();
  light?.turnOn({ brightness: 30, colorTempKelvin: 2700 });
  speaker?.setVolume(0.6);
}
```

### Door Lock Control

```typescript
async function lockHouse(code: string) {
  const frontDoor = await connection.getEntity("lock.front_door");
  const backDoor = await connection.getEntity("lock.back_door");
  const garage = await connection.getEntity("lock.garage_door");

  await frontDoor?.lock(code);
  await backDoor?.lock(code);
  await garage?.lock(code);
}
```

## Getting a Long-Lived Access Token

1. Go to your Home Assistant instance
2. Click on your profile icon (bottom left)
3. Scroll down to "Long-Lived Access Tokens"
4. Click "Create Token"
5. Give it a descriptive name
6. Copy the token and use it in your code

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Related

- [home-assistant-js-websocket](https://github.com/home-assistant/home-assistant-js-websocket) - The underlying WebSocket library
- [Home Assistant](https://www.home-assistant.io/) - Open source home automation
