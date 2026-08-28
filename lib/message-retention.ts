export const MESSAGE_RETENTION_DAYS = 14;

export function getMessageRetentionCutoff() {
  const cutoff = new Date();

  cutoff.setDate(
    cutoff.getDate() - MESSAGE_RETENTION_DAYS
  );

  return cutoff;
}
