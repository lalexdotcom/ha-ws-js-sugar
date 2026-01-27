# ha-ws-js-sugar - Home Assistant WebSocket Sugar

A lightweight TypeScript library that provides syntactic sugar and type-safe wrappers around [home-assistant-js-websocket](https://github.com/home-assistant/home-assistant-js-websocket). Simplify Home Assistant automation and integrations with intuitive entity classes and a clean API.

> [!WARNING]  
> This package is a WIP.
> The Readme is AI generated (for now) and not reviewed.
> Please don't use in production.

## Features

- 🎯 **Type-safe** - Full TypeScript support with inferred entity types
- 🧠 **Smart caching** - Automatic entity registry with state synchronization
- 🔌 **Real-time updates** - Reactive state changes through subscriptions
- 🏠 **Domain support** - Pre-built classes for common Home Assistant domains
- ⚡ **Easy setup** - Minimal configuration to get started
- 🎨 **Light control** - Rich parameters for light color and brightness control

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
import { Connection } from "ha-ws-js-sugar";

// Create a connection
const connection = await Connection.create({
  host: "http://192.168.1.100:8123",
  token: "your_long_lived_access_token",
});

// Get an entity and interact with it
const light = await connection.getEntity("light.living_room");
light?.turnOn();
```

## API Reference

### Connection

The main class for interacting with Home Assistant via WebSocket.

#### `Connection.create(options)`

Creates a new connection to Home Assistant.

**Parameters:**
- `options.host` (string) - The URL of your Home Assistant instance
- `options.token` (string) - A long-lived access token

**Returns:** Promise<Connection>

```typescript
const connection = await Connection.create({
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

#### `connection.callAction(domain, service, params, result?)`

Calls a service in Home Assistant.

**Parameters:**
- `domain` (string) - The service domain
- `service` (string) - The service name
- `params` (CallActionParams) - Optional data and target
- `result` (boolean) - Whether to return the result (default: false)

**Returns:** Promise<void | T>

```typescript
await connection.callAction("light", "turn_on", {
  data: { brightness: 255 },
  target: { entity_id: "light.living_room" },
});
```

### Entity Classes

#### BaseEntity

Base class for all entities with common functionality.

**Properties:**
- `id: string` - The entity ID
- `state: StateType` - Current state value
- `attributes: Record<string, any>` - Entity attributes
- `lastChanged: Date` - When the state last changed
- `lastUpdated: Date` - When the entity was last updated

**Methods:**
- `addListener(callback, options?)` - Subscribe to state changes, returns a function to unsubscribe

```typescript
const light = await connection.getEntity("light.living_room");

const unsubscribe = light?.addListener((newState, oldState) => {
  console.log(`Light changed from ${oldState} to ${newState}`);
});

// Call the returned function to unsubscribe
unsubscribe?.();
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
  transition?: number;           // Transition time in seconds
  flash?: "short" | "long";      // Flash effect
  effect?: string;               // Effect name
  brightness?: number;           // Brightness 0-255
  brightnessPercent?: number;    // Brightness 0-100
  hsColor?: [number, number];    // Hue and saturation
  xyColor?: [number, number];    // CIE 1931 color
  rgbColor?: [number, number, number];      // RGB color
  rgbwColor?: [number, number, number, number];      // RGBW color
  rgbwwColor?: [number, number, number, number, number]; // RGBWW color
  colorTempKelvin?: number;      // Color temperature in Kelvin
  colorName?: string;            // Color name (e.g., "red")
  white?: boolean;               // Set to white
}
```

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
```

#### Switch

Toggle-able devices.

**Methods:**
- `turnOn()` - Turn on the switch
- `turnOff()` - Turn off the switch
- `toggle()` - Toggle the switch

```typescript
const outlet = await connection.getEntity("switch.coffee_maker");
outlet?.turnOn();
```

#### BinarySensor

Read-only sensors with on/off state.

**Properties:**
- `state: States.ON | States.OFF` - Current sensor state

```typescript
const motion = await connection.getEntity("binary_sensor.motion");
console.log(motion?.state); // "on" or "off"
```

#### InputBoolean

Toggleable input helpers.

**Methods:**
- `turnOn()` - Set to on
- `turnOff()` - Set to off
- `toggle()` - Toggle the value

```typescript
const flag = await connection.getEntity("input_boolean.away_mode");
flag?.turnOn();
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
- `currentTemperature: number` - Current room temperature
- `targetTemperature: number` - Target setpoint
- `hvacMode: string` - Current mode (heat, cool, off, etc.)

**Methods:**
- `setTemperature(temperature)` - Set target temperature
- `setMode(mode)` - Set HVAC mode

```typescript
const thermostat = await connection.getEntity("climate.living_room");
await thermostat?.setTemperature(72);
```

#### Cover

Blinds, garage doors, and other covers.

**Properties:**
- `isOpen: boolean` - Whether the cover is open
- `isClosed: boolean` - Whether the cover is closed
- `position: number` - Position percentage (0-100)

**Methods:**
- `open()` - Open the cover
- `close()` - Close the cover
- `stop()` - Stop the cover movement
- `setPosition(position)` - Set position percentage

```typescript
const blinds = await connection.getEntity("cover.living_room_blinds");
blinds?.setPosition(50);
```

#### MediaPlayer

Audio/video playback control.

**Properties:**
- `isPlaying: boolean` - Whether playback is active
- `volume: number` - Current volume (0-1)
- `currentTrack: string` - Current media name

**Methods:**
- `play()` - Start playback
- `pause()` - Pause playback
- `stop()` - Stop playback
- `setVolume(level)` - Set volume (0-1)

```typescript
const speaker = await connection.getEntity("media_player.living_room");
speaker?.play();
speaker?.setVolume(0.5);
```

#### DeviceTracker

Track device location.

**Properties:**
- `isHome: boolean` - Whether device is home
- `isNotHome: boolean` - Whether device is away
- `location: string` - Current location name

```typescript
const phone = await connection.getEntity("device_tracker.my_phone");
console.log(phone?.isHome);
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

**Methods:**
- `setValue(value)` - Set the value

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

#### InputDatetime

Date and time input helpers.

**Properties:**
- `state: Date` - Current date/time value

**Methods:**
- `setDateTime(date)` - Set date and time

```typescript
const datetime = await connection.getEntity("input_datetime.alarm_time");
datetime?.setDateTime(new Date("2024-01-27T08:00:00"));
```

#### Alarm

Alarm control panel.

**Properties:**
- `state: string` - Arm status (armed_home, armed_away, disarmed, etc.)

**Methods:**
- `arm(mode?, code?)` - Arm the alarm
- `disarm(code?)` - Disarm the alarm

```typescript
const alarm = await connection.getEntity("alarm_control_panel.home");
alarm?.disarm("1234");
```

#### WaterHeater

Water heater control.

**Properties:**
- `targetTemperature: number` - Target water temperature
- `currentTemperature: number` - Current temperature

**Methods:**
- `setTemperature(temperature)` - Set target temperature

```typescript
const heater = await connection.getEntity("water_heater.bathroom");
heater?.setTemperature(120);
```

### Constants

#### States

Common state values across Home Assistant.

```typescript
import { States } from "hawsjss";

States.ON              // "on"
States.OFF             // "off"
States.HOME            // "home"
States.NOT_HOME        // "not_home"
States.UNKNOWN         // "unknown"
States.OPEN            // "open"
States.OPENING         // "opening"
States.CLOSED          // "closed"
States.CLOSING         // "closing"
States.BUFFERING       // "buffering"
States.PLAYING         // "playing"
States.PAUSED          // "paused"
States.IDLE            // "idle"
States.STANDBY         // "standby"
States.UNAVAILABLE     // "unavailable"
States.OK              // "ok"
States.PROBLEM         // "problem"
```

#### Domains

Supported entity domains.

```typescript
import { Domains } from "hawsjss";

Domains.ALARM               // "alarm_control_panel"
Domains.BINARY_SENSOR       // "binary_sensor"
Domains.BUTTON              // "button"
Domains.CLIMATE             // "climate"
Domains.COVER               // "cover"
Domains.DEVICE_TRACKER      // "device_tracker"
Domains.INPUT_BUTTON        // "input_button"
Domains.INPUT_BOOLEAN       // "input_boolean"
Domains.INPUT_DATETIME      // "input_datetime"
Domains.INPUT_NUMBER        // "input_number"
Domains.INPUT_SELECT        // "input_select"
Domains.LIGHT               // "light"
Domains.MEDIA_PLAYER        // "media_player"
Domains.SENSOR              // "sensor"
Domains.WATER_HEATER        // "water_heater"
```

#### Light Features and Colors

```typescript
import { LightFeatures, LightColorModes, LightColorNames } from "hawsjss";

// Features
LightFeatures.EFFECT       // 4
LightFeatures.FLASH        // 8
LightFeatures.TRANSITION   // 32

// Color modes
LightColorModes.UNKNOWN    // "unknown"
LightColorModes.ONOFF      // "onoff"
LightColorModes.BRIGHTNESS // "brightness"
LightColorModes.COLOR_TEMP // "color_temp"
LightColorModes.HS         // "hs"
LightColorModes.XY         // "xy"
LightColorModes.RGB        // "rgb"
LightColorModes.RGBW       // "rgbw"
LightColorModes.RGBWW      // "rgbww"
LightColorModes.WHITE      // "white"
```

## Examples

### Automating Lights Based on Motion

```typescript
const connection = await Connection.create({
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
