/**
 * Refleksia City Weather System (Waktu Indonesia Tengah - WITA / Gorontalo)
 *
 * 4 Tipe Cuaca:
 * 1. Berawan: 15.00 - 17.00 WITA
 * 2. Hujan Ringan: 10.00 - 12.00 WITA & 21.00 - 22.30 WITA
 * 3. Salju: 00.00 - 02.30 WITA
 * 4. Cuaca Normal: Selain jam-jam di atas
 *
 * Real-time temperature & weather fetched for Gorontalo (Lat 0.5435, Lon 123.0568)
 */

export type WeatherType = 'normal' | 'berawan' | 'hujan_ringan' | 'salju';

export interface WeatherInfo {
  type: WeatherType;
  name: string;
  icon: string;
  badge: string;
  description: string;
  timeSchedule: string;
  tempCelsius: number;
  humidity?: number;
}

/**
 * Menghitung jam dan menit dalam zona waktu Asia/Makassar (WITA, UTC+8)
 */
export function getWitaTimeParts(date: Date = new Date()): { hours: number; minutes: number; totalMinutes: number } {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Makassar',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    for (const p of parts) {
      if (p.type === 'hour') hours = parseInt(p.value, 10);
      if (p.type === 'minute') minutes = parseInt(p.value, 10);
    }
    return { hours, minutes, totalMinutes: hours * 60 + minutes };
  } catch {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return { hours, minutes, totalMinutes: hours * 60 + minutes };
  }
}

/**
 * Menentukan tipe cuaca aktif berdasarkan waktu WITA:
 * - Berawan: 15.00 - 17.00 WITA
 * - Hujan Ringan: 10.00 - 12.00 WITA dan 21.00 - 22.30 WITA
 * - Salju: 00.00 - 02.30 WITA
 * - Normal: Selain jam di atas
 */
export function getWeatherTypeWita(date: Date = new Date()): WeatherType {
  const { totalMinutes } = getWitaTimeParts(date);

  // 1. Salju: 00.00 - 02.30 WITA (0 s.d. 150 menit)
  if (totalMinutes >= 0 && totalMinutes < 2 * 60 + 30) {
    return 'salju';
  }

  // 2. Hujan Ringan: 10.00 - 12.00 WITA (600 s.d. 720 menit)
  if (totalMinutes >= 10 * 60 && totalMinutes < 12 * 60) {
    return 'hujan_ringan';
  }

  // 2b. Hujan Ringan: 21.00 - 22.30 WITA (1260 s.d. 1350 menit)
  if (totalMinutes >= 21 * 60 && totalMinutes < 22 * 60 + 30) {
    return 'hujan_ringan';
  }

  // 3. Berawan: 15.00 - 17.00 WITA (900 s.d. 1020 menit)
  if (totalMinutes >= 15 * 60 && totalMinutes < 17 * 60) {
    return 'berawan';
  }

  // 4. Cuaca Normal: selain jam di atas
  return 'normal';
}

/**
 * Metadata deskripsi untuk masing-masing cuaca
 */
export function getWeatherMeta(type: WeatherType, liveTemp?: number, liveHumidity?: number): WeatherInfo {
  // Fallback realistis suhu Gorontalo jika API offline/tertunda
  let defaultTemp = 31;
  if (type === 'salju') {
    defaultTemp = 23;
  } else if (type === 'hujan_ringan') {
    defaultTemp = 26;
  } else if (type === 'berawan') {
    defaultTemp = 28;
  } else {
    // Normal: siang 31-32, malam/subuh 25-27
    const { hours } = getWitaTimeParts();
    defaultTemp = hours >= 6 && hours < 18 ? 31 : 25;
  }

  const finalTemp = liveTemp !== undefined && !isNaN(liveTemp) ? Math.round(liveTemp * 10) / 10 : defaultTemp;

  switch (type) {
    case 'berawan':
      return {
        type: 'berawan',
        name: 'Berawan',
        icon: '☁️',
        badge: '15.00 - 17.00',
        description: 'Awan putih bergulung lembut meneduhkan suasana kota',
        timeSchedule: 'Pukul 15.00 - 17.00 WITA',
        tempCelsius: finalTemp,
        humidity: liveHumidity || 72,
      };
    case 'hujan_ringan':
      return {
        type: 'hujan_ringan',
        name: 'Hujan Ringan',
        icon: '🌧️',
        badge: '10.00-12.00 & 21.00-22.30',
        description: 'Rintik hujan lembut membasahi tanah & pepohonan kota',
        timeSchedule: 'Pukul 10.00 - 12.00 & 21.00 - 22.30 WITA',
        tempCelsius: finalTemp,
        humidity: liveHumidity || 85,
      };
    case 'salju':
      return {
        type: 'salju',
        name: 'Salju',
        icon: '❄️',
        badge: '00.00 - 02.30',
        description: 'Serpihan salju putih berkilau melayang di malam hari',
        timeSchedule: 'Pukul 00.00 - 02.30 WITA',
        tempCelsius: finalTemp,
        humidity: liveHumidity || 90,
      };
    case 'normal':
    default:
      return {
        type: 'normal',
        name: 'Cerah Normal',
        icon: '☀️',
        badge: 'Cuaca Normal',
        description: 'Langit cerah alami khas Kota Gorontalo yang hangat',
        timeSchedule: 'Selain jam berawan, hujan, & salju',
        tempCelsius: finalTemp,
        humidity: liveHumidity || 60,
      };
  }
}

/**
 * Mengambil suhu & kelembapan real-time Gorontalo dari Open-Meteo API
 * Koordinat Gorontalo: Lat 0.5435, Lon 123.0568
 */
let cachedGorontaloData: { tempCelsius: number; humidity: number; timestamp: number } | null = null;

export async function fetchGorontaloLiveWeather(): Promise<{ tempCelsius: number; humidity: number } | null> {
  const now = Date.now();
  // Cache selama 5 menit untuk efisiensi
  if (cachedGorontaloData && now - cachedGorontaloData.timestamp < 5 * 60 * 1000) {
    return {
      tempCelsius: cachedGorontaloData.tempCelsius,
      humidity: cachedGorontaloData.humidity,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=0.5435&longitude=123.0568&current=temperature_2m,relative_humidity_2m&timezone=Asia%2FMakassar',
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('Weather API HTTP ' + res.status);
    const data = await res.json();
    const temp = data?.current?.temperature_2m;
    const hum = data?.current?.relative_humidity_2m;

    if (typeof temp === 'number') {
      cachedGorontaloData = {
        tempCelsius: temp,
        humidity: typeof hum === 'number' ? hum : 65,
        timestamp: now,
      };
      return {
        tempCelsius: temp,
        humidity: typeof hum === 'number' ? hum : 65,
      };
    }
    return null;
  } catch (err) {
    // Fallback silent: tetap gunakan cached atau fallback realistis
    if (cachedGorontaloData) {
      return {
        tempCelsius: cachedGorontaloData.tempCelsius,
        humidity: cachedGorontaloData.humidity,
      };
    }
    return null;
  }
}
