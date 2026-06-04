import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auxano_dev_token";

export async function saveDevToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getDevToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearDevToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
