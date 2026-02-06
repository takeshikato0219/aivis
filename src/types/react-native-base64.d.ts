declare module 'react-native-base64' {
  const base64: {
    encode(input: string | ArrayBuffer): string;
    decode(input: string): string;
  };
  export default base64;
}
