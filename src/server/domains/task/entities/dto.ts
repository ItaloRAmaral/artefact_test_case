export interface TaskSnapshot {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly createdAt: Date;
}

export interface TaskContent {
  readonly title: string;
  readonly description?: string | null;
}
