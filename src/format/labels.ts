// Turkish interface words that more than one component needs.
import type { DocumentRecord } from '../schema/index.ts';

export const KIND_LABEL: Record<DocumentRecord['kind'], string> = {
  mektup: 'Mektup',
  telgraf: 'Telgraf',
  konusma: 'Konuşma',
};
