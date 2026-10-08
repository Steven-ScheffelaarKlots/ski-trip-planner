import type { SkiResort } from '@/lib/types';
import { CONNECTICUT_RESORTS } from './connecticut';
import { MAINE_RESORTS } from './maine';
import { MASSACHUSETTS_RESORTS } from './massachusetts';
import { NEW_HAMPSHIRE_RESORTS } from './new-hampshire';
import { VERMONT_RESORTS } from './vermont';

export const RESORTS: SkiResort[] = [
  ...VERMONT_RESORTS,
  ...NEW_HAMPSHIRE_RESORTS,
  ...MAINE_RESORTS,
  ...MASSACHUSETTS_RESORTS,
  ...CONNECTICUT_RESORTS,
];
