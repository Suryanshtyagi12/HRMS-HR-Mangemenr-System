import { supabase } from './supabase-client';

export { supabase };

export function subscribeToChannel(channelName: string, event: string, callback: (payload: any) => void) {
  const channel = supabase.channel(channelName)
    .on('broadcast', { event: event }, (payload) => {
      callback(payload);
    })
    .subscribe();
  return channel;
}

export function subscribeToNotifications(userId: string, callback: () => void) {
  // Listen to postgres changes on notifications table for specific user
  const channel = supabase.channel(`notifications:user_${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => {
        callback();
      }
    )
    .subscribe();
  return channel;
}

export function unsubscribeFromNotifications(channel: any) {
  if (channel) {
    supabase.removeChannel(channel);
  }
}
