export enum MascotStyle {
  MINI_REALISTA = "Mini Realista",
  MAGIA_3D = "Magia 3D",
  CARTOON_POP = "Cartoon Pop",
  PINTURA_DOCE = "Pintura Doce"
}

export type UserStatus = 'pending' | 'approved' | 'admin';

export interface User {
  email: string;
  password: string;
  status: UserStatus;
}

export interface MascotState {
  image: string | null;
  style: MascotStyle | null;
  clothingDetails: string;
  partyTheme: string;
  generatedMascot: string | null;
  isLoading: boolean;
  error: string | null;
}