export function getApiBase() {
  // For Android emulator, localhost from device is 10.0.2.2
  // return process.env.EXPO_PUBLIC_API_BASE ?? 'http://10.0.2.2:3000' //for android emulator
  // return process.env.EXPO_PUBLIC_API_BASE ?? 'http://192.168.122.1:3000' //for mobile usb
  // For Android emulator, localhost from device is 10.0.2.2.
  // For Expo Go on phone, use your laptop LAN IP (same Wi-Fi).
  // For deployed backend, use your server's backend port (express default in this repo is 3000).
  return process.env.EXPO_PUBLIC_API_BASE ?? 'http://44.196.170.102:3000'

}

export function getWsBase() {
  // return process.env.EXPO_PUBLIC_WS_BASE ?? 'ws://10.0.2.2:5000'  //actual
  // return process.env.EXPO_PUBLIC_WS_BASE ?? 'ws://192.168.122.1:5000'  //for now
  // Notifications socket is served by backend on port 3000 in this project.
  return process.env.EXPO_PUBLIC_WS_BASE ?? 'ws://44.196.170.102:3000'

}

