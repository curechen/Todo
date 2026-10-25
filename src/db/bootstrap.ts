import { configureDatabase, getSqlite } from './client';
import { runMigrations } from './migrations';
import { seedDatabase } from './seed';

let bootstrapPromise: Promise<void> | null = null;

export function bootstrapDatabase(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const database = getSqlite();
      configureDatabase(database);
      await runMigrations(database);
      await seedDatabase(database);

      if (__DEV__) {
        console.info('[db] bootstrap complete');
      }
    })().catch((error: unknown) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  return bootstrapPromise;
}
