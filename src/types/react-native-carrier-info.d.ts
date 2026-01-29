declare module 'react-native-carrier-info' {
  export function getCarrierName(): Promise<string | null>;
  export function getIsoCountryCode(): Promise<string | null>;
  export function getMobileCountryCode(): Promise<string | null>;
  export function getMobileNetworkCode(): Promise<string | null>;
}
