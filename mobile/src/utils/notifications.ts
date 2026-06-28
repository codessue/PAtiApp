import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { authApi } from '../services/api';
import { Medication } from '../types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// EAS projectId must be a valid UUID for getExpoPushTokenAsync. The app.json
// placeholder ("pati-mvp") isn't, so we read + validate before using it.
function getValidProjectId(): string | undefined {
  // easConfig isn't always in the type defs but is present at runtime in some
  // build profiles, so read it through a narrow cast as a fallback.
  const easConfig = (Constants as { easConfig?: { projectId?: string } }).easConfig;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? easConfig?.projectId;
  return typeof projectId === 'string' && UUID_RE.test(projectId) ? projectId : undefined;
}

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
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Not Hatırlatıcıları',
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

    const projectId = getValidProjectId();
    if (!projectId) {
      // No valid EAS projectId yet — skip silently so it never blocks the app.
      console.warn('Push token atlandı: geçerli bir EAS projectId yapılandırılmamış.');
      return;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
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

interface NoteReminderInput {
  id: string;
  title?: string;
  body?: string;
  reminderAt?: string;
}

// Schedules a one-shot local notification for a note's reminder date.
// Returns the scheduled notification id (to store for later cancellation), or
// undefined when there's nothing to schedule (no date, past date, no permission).
export async function scheduleNoteReminder(note: NoteReminderInput): Promise<string | undefined> {
  if (!note.reminderAt) return undefined;

  const when = new Date(note.reminderAt);
  if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) return undefined;

  const granted = await requestNotificationPermission();
  if (!granted) return undefined;

  const title = note.title?.trim();
  const body = note.body?.trim();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: title ? `📝 ${title}` : '📝 Pati Hatırlatıcı',
      body: body || 'Bir notun için hatırlatma zamanı geldi.',
      data: { noteId: note.id, type: 'note' },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      channelId: 'reminders',
    },
  });
}

export async function cancelNoteReminder(notificationId?: string): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // best-effort — already fired or removed
  }
}
