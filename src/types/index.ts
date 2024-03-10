export type Gameplay = {
  _id: number;
  date: string;
  startHour: string;
  finishHour?: string;
  playerCount: number;
  game?: Game | number;
  mentor: User;
  location: number;
};

export type Location = {
  _id: number;
  name: string;
};

export type Table = {
  _id: number;
  name: string;
  date: string;
  playerCount: number;
  location?: number;
  startHour: string;
  finishHour?: string;
  gameplays: Gameplay[];
};

export type Role = {
  _id: number;
  name: string;
  color: string;
  permissions: RolePermissionEnum[];
};

export enum WorkType {
  FULLTIME = "Full Time",
  PARTTIME = "Part Time",
}

export type User = {
  _id: string;
  name: string;
  fullName: string;
  active: boolean;
  role: Role;
  jobStartDate: Date;
  jobEndDate?: Date;
  insuranceStartDate: Date;
  profileImage?: string;
  phone: string;
  address: string;
  iban: string;
  birthDate: Date;
  imageUrl: string;
  workType: WorkType;
  userGames: [
    {
      game: number;
      learnDate: string;
    }
  ];
};

export type Game = {
  _id: number;
  name: string;
  image: string;
  thumbnail: string;
  expansion: boolean;
  locations: number[];
};

export type Visit = {
  _id: number;
  location: number;
  date: string;
  user: User;
  startHour: string;
  finishHour?: string;
};

export type Membership = {
  _id: number;
  name: string;
  startDate: string;
  endDate: string;
};

export type Reward = {
  _id: number;
  name: string;
  startDate: string;
  endDate: string;
  used: boolean;
};

export type MenuCategory = {
  _id: number;
  name: string;
  order: number;
  imageUrl: string;
};

export type MenuItem = {
  _id: number;
  name: string;
  description: string;
  imageUrl: string;
  category: MenuCategory | number;
  priceBahceli: number;
  priceNeorama: number;
  order: number;
};

export enum ReservationStatusEnum {
  WAITING = "Waiting",
  COMING = "Coming",
  NOT_COMING = "Not coming",
  NOT_RESPONDED = "Not responded",
  ALREADY_CAME = "Already came",
}

export type Reservation = {
  _id: number;
  location: number;
  name: string;
  phone: string;
  playerCount: number;
  date: string;
  reservedTable: string;
  reservationHour: string;
  callHour: string;
  approveHour: string;
  callCount: number;
  finishHour: string;
  status: ReservationStatusEnum;
};

export type TagType<T> = {
  _id: string | number;
  name: string;
} & T;

export enum RolePermissionEnum {
  OPERATION = "Operation",
  MANAGEMENT = "Management",
}

export enum UserGameUpdateType {
  ADD = "add",
  REMOVE = "remove",
}

export enum RowPerPageEnum {
  FIRST = 10,
  SECOND = 20,
  THIRD = 50,
}

export enum RoleEnum {
  MANAGER = 1,
  GAMEMASTER = 2,
  GAMEMANAGER = 3,
  CATERINGMANAGER = 4,
  BARISTA = 5,
  KITCHEN = 6,
  SERVICE = 7,
  CLEANING = 8,
}
