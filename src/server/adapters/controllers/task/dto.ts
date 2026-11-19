export interface TaskDto {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly createdAt: string;
}
