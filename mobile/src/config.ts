export function getApiBase() {
  // For Android emulator, localhost from device is 10.0.2.2
  // return process.env.EXPO_PUBLIC_API_BASE ?? 'http://10.0.2.2:3000' //for android emulator
  return process.env.EXPO_PUBLIC_API_BASE ?? 'http://192.168.122.1:3000' //for mobile usb

}

export function getWsBase() {
  // return process.env.EXPO_PUBLIC_WS_BASE ?? 'ws://10.0.2.2:5000'  //actual
  return process.env.EXPO_PUBLIC_WS_BASE ?? 'ws://192.168.122.1:5000'  //for now

}

