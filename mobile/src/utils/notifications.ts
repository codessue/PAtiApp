import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { authApi } from '../services/api';
import { Medication } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medications', {
      name: 'İlaç Hatırlatmaları',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('vaccines', {
      name: 'Aşı Hatırlatmaları',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function registerPushToken(): Promise<void> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    const token = await Notifications.getExpoPushTokenAsync();
    await authApi.updatePushToken(token.data);
  } catch (error) {
    console.warn('Push token alınamadı:', error);
  }
}

export async function scheduleMedicationNotifications(medication: Medication): Promise<void> {
  await cancelMedicationNotifications(medication.id);

  if (!medication.isActive) return;

  for (const timeStr of medication.reminderTimes) {
    const [hours, minutes] = timeStr.split(':').map(Number);

    await Notifications.scheduleNotificationAsync({
      identifier: `med_${medication.id}_${timeStr}`,
      content: {
        title: 'İlaç Zamanı 💊',
        body: `${medication.catName ?? 'Kediniz'} için ${medication.name} zamanı!`,
        data: { medicationId: medication.id, type: 'medication' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
    });
  }
}

export async function cancelMedicationNotifications(medicationId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter((n) => n.identifier.startsWith(`med_${medicationId}`));
  await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}
