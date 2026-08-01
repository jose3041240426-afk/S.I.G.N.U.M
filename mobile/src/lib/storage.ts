import AsyncStorage from "@react-native-async-storage/async-storage";

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
  async getBool(key: string, fallback = false): Promise<boolean> {
    const v = await this.getItem(key);
    if (v === null) return fallback;
    return v === "true";
  },
  async getNumber(key: string, fallback = 0): Promise<number> {
    const v = await this.getItem(key);
    if (v === null) return fallback;
    const n = parseFloat(v);
    return isNaN(n) ? fallback : n;
  },
};
